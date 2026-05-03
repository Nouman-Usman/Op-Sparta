"use client";

import { useState, useTransition } from "react";
import { Globe, Loader2 } from "lucide-react";
import { saveUserTimezone } from "@/app/actions/schedule";

export const TIMEZONES = [
  { label: "US Eastern (ET)", value: "America/New_York" },
  { label: "US Central (CT)", value: "America/Chicago" },
  { label: "US Mountain (MT)", value: "America/Denver" },
  { label: "US Pacific (PT)", value: "America/Los_Angeles" },
  { label: "London (GMT/BST)", value: "Europe/London" },
  { label: "Paris / Berlin (CET)", value: "Europe/Paris" },
  { label: "Dubai (GST)", value: "Asia/Dubai" },
  { label: "Mumbai (IST)", value: "Asia/Kolkata" },
  { label: "Singapore (SGT)", value: "Asia/Singapore" },
  { label: "Tokyo (JST)", value: "Asia/Tokyo" },
  { label: "Sydney (AEDT)", value: "Australia/Sydney" },
];

interface Props {
  onComplete: (timezone: string) => void;
}

export function TimezoneSetupModal({ onComplete }: Props) {
  const [selected, setSelected] = useState("America/New_York");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const result = await saveUserTimezone(selected);
      if (result.success) {
        onComplete(selected);
      } else {
        setError(result.error ?? "Failed to save timezone.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-background/90 backdrop-blur-3xl" />
      <div className="relative bg-card border border-white/5 rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-2xl bg-accent/10 flex items-center justify-center">
            <Globe size={18} className="text-accent" />
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">Set Your Timezone</h2>
        </div>
        <p className="text-sm text-zinc-400 mb-6">
          Choose your target audience&apos;s timezone. Posts will be scheduled at
          optimal hours (10:30 AM, 2:00 PM, 7:00 PM) in this timezone. You can
          change it anytime in Settings.
        </p>

        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="w-full bg-muted border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent/40 mb-4 appearance-none"
        >
          {TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value} className="bg-zinc-900">
              {tz.label}
            </option>
          ))}
        </select>

        {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

        <button
          onClick={handleSave}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3.5 text-sm font-black uppercase tracking-widest text-accent-foreground transition-all hover:opacity-90 disabled:opacity-50"
        >
          {isPending && <Loader2 size={16} className="animate-spin" />}
          Save & Continue
        </button>
      </div>
    </div>
  );
}
