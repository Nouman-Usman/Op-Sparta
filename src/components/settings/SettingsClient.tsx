"use client";

import { useState, useTransition } from "react";
import {
  Key,
  ArrowRight,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Trash2,
  Instagram,
  CheckCircle2,
  Link2,
  Shield,
  Globe,
} from "lucide-react";
import { saveAiKey } from "@/app/actions/save-ai-keys";
import { deleteAiKey, toggleAiKey, updateAiModel } from "@/app/actions/manage-ai-keys";
import { saveUserTimezone, saveUserSchedule } from "@/app/actions/schedule";
import { TIMEZONES } from "@/components/TimezoneSetupModal";
import { cn } from "@/lib/utils";
import { CalendarDays, Clock } from "lucide-react";

const PROVIDERS = [
  {
    id: "openai",
    name: "OpenAI",
    description: "Access GPT-4o and GPT-4o-mini for high-fidelity content and reasoning.",
    url: "https://platform.openai.com/api-keys",
    models: ["gpt-4o", "gpt-4o-mini"],
  },
  {
    id: "google",
    name: "Google Gemini",
    description: "Harness Gemini 3.0's massive context and next-gen reasoning.",
    url: "https://aistudio.google.com/app/apikey",
    models: ["gemini-3-pro-preview", "gemini-3-flash-preview"],
  },
  {
    id: "higgsfield",
    name: "Higgsfield API",
    description: "Connect to the Higgsfield Engine for generative video components.",
    url: "https://higgsfield.ai",
    models: ["higgsfield-video-v1"],
  }
];

export default function SettingsClient({
  initialKeys,
  integrationData,
  userTimezone,
  userScheduleSlots,
}: {
  initialKeys: any[];
  integrationData: any;
  userTimezone: string | null;
  userScheduleSlots?: { days: number[]; times: { hour: number; minute: number }[] } | null;
}) {
  const [selectedProvider, setSelectedProvider] = useState<"openai" | "google" | "higgsfield">("openai");
  const [apiKey, setApiKey] = useState("");
  const [higgsfieldAccessKey, setHiggsfieldAccessKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [aiFeedback, setAiFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const isInstagramConnected = !!integrationData?.instagramAccessToken;
  const activeKeyCount = initialKeys?.filter((k) => k.isActive)?.length || 0;

  const handleSaveAiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setAiFeedback(null);
    if (!apiKey) return;
    if (selectedProvider === "higgsfield" && !higgsfieldAccessKey) {
      setAiFeedback({ type: "error", message: "Higgsfield Access Key is required." });
      return;
    }

    startTransition(async () => {
      const result = await saveAiKey(selectedProvider, apiKey, higgsfieldAccessKey);
      if (result.success) {
        setAiFeedback({ type: 'success', message: `${PROVIDERS.find(p => p.id === selectedProvider)?.name} key saved.` });
        setApiKey("");
        setHiggsfieldAccessKey("");
      } else {
        setAiFeedback({ type: 'error', message: result.error || "Failed to save key." });
      }
    });
  };

  const handleToggle = async (id: string, active: boolean) => {
    startTransition(async () => {
      await toggleAiKey(id, active);
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    startTransition(async () => {
      await deleteAiKey(id);
    });
  };

  const handleModelChange = async (id: string, model: string) => {
    startTransition(async () => {
      await updateAiModel(id, model);
    });
  };

  const [savedTimezone, setSavedTimezone] = useState(userTimezone ?? "");
  const [tzFeedback, setTzFeedback] = useState<"saved" | null>(null);

  const handleTimezoneChange = (tz: string) => {
    setSavedTimezone(tz);
    setTzFeedback(null);
    startTransition(async () => {
      await saveUserTimezone(tz);
      setTzFeedback("saved");
      setTimeout(() => setTzFeedback(null), 2000);
    });
  };

  // Custom Schedule State
  const defaultDays = [1, 2, 3, 4, 5]; // Mon-Fri
  const defaultTimes = [{ hour: 10, minute: 30 }, { hour: 14, minute: 0 }, { hour: 19, minute: 0 }];
  
  const [scheduleDays, setScheduleDays] = useState<number[]>(userScheduleSlots?.days ?? defaultDays);
  const [scheduleTimes, setScheduleTimes] = useState<{ hour: number; minute: number }[]>(userScheduleSlots?.times ?? defaultTimes);
  const [scheduleFeedback, setScheduleFeedback] = useState<"saved" | null>(null);

  const toggleDay = (dayIndex: number) => {
    setScheduleDays(prev => 
      prev.includes(dayIndex) ? prev.filter(d => d !== dayIndex) : [...prev, dayIndex]
    );
  };

  const addTime = (timeString: string) => {
    if (!timeString) return;
    const [hour, minute] = timeString.split(':').map(Number);
    setScheduleTimes(prev => [...prev, { hour, minute }]);
  };

  const removeTime = (index: number) => {
    setScheduleTimes(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveSchedule = () => {
    setScheduleFeedback(null);
    startTransition(async () => {
      await saveUserSchedule(scheduleDays, scheduleTimes);
      setScheduleFeedback("saved");
      setTimeout(() => setScheduleFeedback(null), 2000);
    });
  };

  const formatTimeSlot = (hour: number, minute: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const h = hour % 12 || 12;
    const m = minute.toString().padStart(2, '0');
    return `${h}:${m} ${period}`;
  };

  const [disconnecting, setDisconnecting] = useState(false);

  const DisconnectButton = () => (
    <button
      onClick={async () => {
        if (!confirm("Disconnect your Instagram account? You can reconnect at any time.")) return;
        setDisconnecting(true);
        await fetch("/api/auth/instagram/disconnect", { method: "POST" });
        window.location.reload();
      }}
      disabled={disconnecting}
      className="py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-sm disabled:opacity-50"
    >
      {disconnecting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
      {disconnecting ? "Disconnecting..." : "Disconnect"}
    </button>
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="relative overflow-hidden rounded-3xl sm:rounded-4xl bg-zinc-900/70 border border-white/5 p-6 sm:p-8 backdrop-blur-md">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-cyan-400 border border-cyan-500/20">
              <Shield size={12} />
              Control Center
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Integrations & Security</h2>
            <p className="max-w-xl text-sm leading-relaxed text-zinc-400">
              Manage your social connections and AI provider credentials. Keys are encrypted and securely stored.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full sm:w-auto">
            <div className="rounded-2xl bg-black/40 border border-white/5 px-5 py-4 text-center flex flex-col justify-center shadow-inner">
              <div className="text-2xl font-bold text-white mb-1">{activeKeyCount}</div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Active Keys</div>
            </div>
            <div className="rounded-2xl bg-black/40 border border-white/5 px-5 py-4 text-center flex flex-col justify-center shadow-inner">
              <div className={cn("text-2xl font-bold", isInstagramConnected ? "text-cyan-400" : "text-zinc-500")}>
                {isInstagramConnected ? "Live" : "Off"}
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Instagram</div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-5 xl:col-span-4">
          <section className={cn(
            "rounded-4xl bg-zinc-900/70 p-5 sm:p-6",
            isInstagramConnected ? "shadow-[0_0_0_1px_rgba(34,211,238,0.25)]" : ""
          )}>
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-pink-500/15">
                  <Instagram className="text-pink-400" size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Instagram</h3>
                  <p className="text-xs text-zinc-500">Publishing destination</p>
                </div>
              </div>

              <div className={cn(
                "rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest",
                isInstagramConnected ? "bg-cyan-300/10 text-cyan-300" : "bg-zinc-800 text-zinc-500"
              )}>
                {isInstagramConnected ? "Connected" : "Not Connected"}
              </div>
            </div>

            {isInstagramConnected ? (
              <div className="space-y-4">
                <div className="rounded-2xl bg-black/30 p-4">
                  <div className="flex items-center gap-3">
                    {integrationData.instagramProfilePic ? (
                      <img
                        src={integrationData.instagramProfilePic}
                        alt="Instagram Profile"
                        className="h-12 w-12 rounded-full"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
                        <Instagram size={18} className="text-zinc-500" />
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-bold text-white">
                        {integrationData.instagramUsername ? `@${integrationData.instagramUsername}` : "Instagram Page"}
                      </div>
                      <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-cyan-300">
                        <CheckCircle2 size={12} />
                        Authenticated
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <a
                    href="/api/auth/instagram"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-800 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-zinc-700"
                  >
                    <Link2 size={16} />
                    Reconnect
                  </a>
                  <DisconnectButton />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm leading-relaxed text-zinc-500">
                  Link your Instagram Business account to enable one-click publish from studio.
                </p>
                <a
                  href="/api/auth/instagram"
                  className="inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-linear-to-r from-cyan-300 to-cyan-500 px-4 py-3.5 text-sm font-bold text-black shadow-[0_0_30px_rgba(34,211,238,0.2)] transition-all hover:opacity-90"
                >
                  <Instagram size={18} />
                  Authenticate Instagram
                </a>
              </div>
            )}
          </section>

          {/* Posting Timezone */}
          <section className="rounded-4xl bg-zinc-900/70 p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10">
                <Globe className="text-accent" size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Posting Timezone</h3>
                <p className="text-xs text-zinc-500">Optimal slots are calculated in this timezone</p>
              </div>
            </div>

            <select
              value={savedTimezone}
              onChange={(e) => handleTimezoneChange(e.target.value)}
              disabled={isPending}
              className="w-full appearance-none bg-black/30 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-50 mb-2"
            >
              <option value="" disabled className="bg-zinc-900">Select timezone…</option>
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value} className="bg-zinc-900">
                  {tz.label}
                </option>
              ))}
            </select>

            {tzFeedback === "saved" && (
              <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 size={12} /> Timezone saved
              </p>
            )}
          </section>

          {/* Auto-Schedule Timelines */}
          <section className="rounded-4xl bg-zinc-900/70 p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-300/10">
                <CalendarDays className="text-cyan-300" size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Auto-Schedule Timelines</h3>
                <p className="text-xs text-zinc-500">Set your preferred posting days and times</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Days Selector */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-2">Active Days</label>
                <div className="flex flex-wrap gap-2">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, idx) => (
                    <button
                      key={day}
                      onClick={() => toggleDay(idx)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                        scheduleDays.includes(idx) 
                          ? "bg-cyan-300/20 text-cyan-300 border border-cyan-300/30" 
                          : "bg-zinc-800 text-zinc-500 border border-transparent hover:bg-zinc-700"
                      )}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {/* Times List */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-2">Time Slots</label>
                <div className="space-y-2 mb-3">
                  {scheduleTimes.map((time, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-black/30 border border-white/5 rounded-xl px-3 py-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-white">
                        <Clock size={14} className="text-zinc-500" />
                        {formatTimeSlot(time.hour, time.minute)}
                      </div>
                      <button 
                        onClick={() => removeTime(idx)}
                        className="text-zinc-500 hover:text-red-400 p-1 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {scheduleTimes.length === 0 && (
                    <p className="text-xs text-zinc-500 italic">No time slots defined.</p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <input 
                    type="time" 
                    id="new-time-input"
                    className="flex-1 bg-zinc-800 border border-white/5 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-300/40"
                  />
                  <button 
                    onClick={() => {
                      const input = document.getElementById("new-time-input") as HTMLInputElement;
                      if (input.value) {
                        addTime(input.value);
                        input.value = "";
                      }
                    }}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-bold text-white transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              <button
                onClick={handleSaveSchedule}
                disabled={isPending || scheduleDays.length === 0 || scheduleTimes.length === 0}
                className="w-full mt-2 py-3 rounded-xl bg-cyan-300/10 text-cyan-300 border border-cyan-300/20 font-bold text-sm hover:bg-cyan-300/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {isPending ? <Loader2 size={16} className="animate-spin" /> : "Save Schedule"}
              </button>
              
              {scheduleFeedback === "saved" && (
                <p className="text-xs text-emerald-400 flex items-center justify-center gap-1.5 mt-2">
                  <CheckCircle2 size={12} /> Schedule saved successfully
                </p>
              )}
            </div>
          </section>

        </div>

        <section className="rounded-3xl sm:rounded-4xl bg-zinc-900/70 border border-white/5 p-6 sm:p-8 lg:col-span-7 xl:col-span-8 shadow-2xl backdrop-blur-md">
          <div className="mb-6 sm:mb-8 flex flex-col gap-2">
            <h3 className="flex items-center gap-2 text-2xl font-bold text-white tracking-tight">
              <Key size={24} className="text-cyan-400" />
              Provider Credentials
            </h3>
            <p className="text-sm leading-relaxed text-zinc-400">Select a provider, securely store a key, then activate connections for the engine to use.</p>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {PROVIDERS.map((provider) => (
              <button
                key={provider.id}
                onClick={() => setSelectedProvider(provider.id as any)}
                className={cn(
                  "rounded-xl px-3 py-3 text-left transition-all",
                  selectedProvider === provider.id
                    ? "bg-cyan-300/10 shadow-[0_0_0_1px_rgba(34,211,238,0.3)]"
                    : "bg-zinc-800/60 hover:bg-zinc-800"
                )}
              >
                <div className={cn("text-xs font-black uppercase tracking-widest", selectedProvider === provider.id ? "text-cyan-300" : "text-zinc-300")}>
                  {provider.name}
                </div>
                <div className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-zinc-500">{provider.description}</div>
              </button>
            ))}
          </div>

          <form onSubmit={handleSaveAiKey} className="space-y-4 rounded-2xl bg-black/30 p-4">
            {selectedProvider === "higgsfield" && (
              <div className="relative group">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-cyan-300" size={18} />
                <input
                  type={showKey ? "text" : "password"}
                  value={higgsfieldAccessKey}
                  onChange={(e) => setHiggsfieldAccessKey(e.target.value)}
                  placeholder="Paste Higgsfield access key"
                  className="w-full rounded-xl bg-zinc-800 py-3 pl-11 pr-11 font-mono text-sm text-white transition-all focus:outline-none focus:ring-2 focus:ring-cyan-300/40"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            )}

            <div className="relative group">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-cyan-300" size={18} />
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={selectedProvider === "higgsfield" ? "Paste Higgsfield API key" : "Paste API key"}
                className="w-full rounded-xl bg-zinc-800 py-3 pl-11 pr-11 font-mono text-sm text-white transition-all focus:outline-none focus:ring-2 focus:ring-cyan-300/40"
                required
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {aiFeedback && (
              <div className={cn(
                "rounded-xl border p-3 text-sm font-medium",
                aiFeedback.type === "success"
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                  : "border-red-500/20 bg-red-500/10 text-red-400"
              )}>
                {aiFeedback.message}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending || !apiKey || (selectedProvider === "higgsfield" && !higgsfieldAccessKey)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-cyan-300 to-cyan-500 px-4 py-3 text-sm font-bold text-black shadow-[0_0_30px_rgba(34,211,238,0.2)] transition-all hover:opacity-90 disabled:opacity-50"
            >
              {isPending ? <Loader2 className="animate-spin" size={16} /> : <><span>Save Provider Key</span><ArrowRight size={16} /></>}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-white/5">
            <h4 className="mb-5 flex items-center gap-2 text-xs font-black uppercase tracking-[0.15em] text-zinc-400">
              <Lock size={14} />
              Active Connections
            </h4>

            {initialKeys?.length ? (
              <div className="space-y-4">
                {initialKeys.map((key) => {
                  const providerDef = PROVIDERS.find((p) => p.id === key.provider);

                  return (
                    <div key={key.id} className="rounded-2xl bg-black/40 border border-white/5 p-5 shadow-inner transition-all hover:bg-black/50">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn("h-2 w-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]", key.isActive ? "bg-emerald-400 shadow-emerald-400/50" : "bg-zinc-600")} />
                          <div>
                            <p className="text-base font-bold text-white tracking-tight">{providerDef?.name || key.provider}</p>
                            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mt-0.5">{key.isActive ? "Active" : "Paused"}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleToggle(key.id, !key.isActive)}
                            className="rounded-xl bg-white/5 px-4 py-2 text-xs font-bold text-zinc-300 transition-colors hover:text-white hover:bg-white/10"
                          >
                            {key.isActive ? "Pause" : "Activate"}
                          </button>
                          <button
                            onClick={() => handleDelete(key.id)}
                            className="rounded-xl bg-red-500/10 p-2.5 text-red-400 transition-all hover:bg-red-500/20 hover:text-red-300"
                            title="Revoke Key"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl bg-black/20 p-6 text-center">
                <p className="text-sm text-zinc-500">No provider keys saved yet.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
