"use client";

import { useState, useTransition, useRef } from "react";
import {
  Upload,
  Loader2,
  CheckCircle2,
  X,
  CalendarClock,
  Instagram,
  ImageIcon,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { analyzeImageAndGenerate } from "@/app/actions/analyze-image";
import { autoSchedulePost } from "@/app/actions/schedule";
import { TimezoneSetupModal } from "@/components/TimezoneSetupModal";

function formatScheduled(iso: string, timezone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(iso));
}

type Step = "upload" | "done";

export function UploadClient({
  userId,
  userTimezone,
}: {
  userId: string;
  userTimezone: string | null;
}) {
  const [step, setStep] = useState<Step>("upload");
  const [localTimezone, setLocalTimezone] = useState(userTimezone);
  const [timezoneModalOpen, setTimezoneModalOpen] = useState(!userTimezone);

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Processing / done state
  const [isProcessing, startProcessing] = useTransition();
  const [scheduledFor, setScheduledFor] = useState<string | null>(null);
  const [scheduledTimezone, setScheduledTimezone] = useState<string>("");
  const [resultCaption, setResultCaption] = useState("");
  const [resultHashtags, setResultHashtags] = useState<string[]>([]);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);

  // ─── File Handling ────────────────────────────────────────────────────────────

  const handleFileSelect = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File too large. Maximum size is 10 MB.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setUploadError("Only image files are supported.");
      return;
    }
    setUploadError(null);
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  // ─── Main pipeline: upload → analyze → auto-schedule ─────────────────────────

  const handleUploadAndSchedule = () => {
    if (!selectedFile) return;

    if (!localTimezone) {
      setTimezoneModalOpen(true);
      return;
    }

    setUploadError(null);
    startProcessing(async () => {
      try {
        // 1. Upload to Supabase Storage
        const supabase = createClient();
        const ext = selectedFile.name.split(".").pop();
        const fileName = `${crypto.randomUUID()}_${Date.now()}.${ext}`;
        const filePath = `uploads/${userId}/${fileName}`;

        const { error: uploadErr } = await supabase.storage
          .from("project-assets")
          .upload(filePath, selectedFile);
        if (uploadErr) throw new Error(uploadErr.message);

        const { data: { publicUrl } } = supabase.storage
          .from("project-assets")
          .getPublicUrl(filePath);

        // 2. AI analysis — generates caption, hashtags, creates post record
        const analyzeResult = await analyzeImageAndGenerate(publicUrl);
        if (!analyzeResult.success) throw new Error(analyzeResult.error);

        // 3. Auto-schedule the post
        const scheduleResult = await autoSchedulePost(analyzeResult.postId);
        if (!scheduleResult.success) {
          if (scheduleResult.error === "NO_TIMEZONE") {
            setTimezoneModalOpen(true);
            return;
          }
          throw new Error(scheduleResult.error);
        }

        // 4. Show done screen
        setResultCaption(analyzeResult.analysis.caption);
        setResultHashtags(analyzeResult.analysis.hashtags);
        setResultImageUrl(publicUrl);
        setScheduledFor(scheduleResult.scheduledFor);
        setScheduledTimezone(scheduleResult.timezone);
        setStep("done");
      } catch (err: unknown) {
        setUploadError(err instanceof Error ? err.message : "Processing failed. Please try again.");
      }
    });
  };

  const resetForm = () => {
    setStep("upload");
    setSelectedFile(null);
    setPreview(null);
    setUploadError(null);
    setResultCaption("");
    setResultHashtags([]);
    setResultImageUrl(null);
    setScheduledFor(null);
    setScheduledTimezone("");
  };

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-accent/20 flex items-center justify-center">
              <Upload size={18} className="text-accent" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Upload & Auto-Schedule</h1>
          </div>
          <p className="text-muted-foreground text-sm ml-12">
            Drop an image — AI will generate a caption and schedule it at the next optimal time.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {(["upload", "done"] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all",
                  step === s
                    ? "border-accent bg-accent text-accent-foreground"
                    : step === "done" && s === "upload"
                    ? "border-accent/50 bg-accent/20 text-accent"
                    : "border-border text-muted-foreground"
                )}
              >
                {step === "done" && s === "upload" ? <CheckCircle2 size={14} /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-xs font-medium capitalize hidden sm:block",
                  step === s ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {s === "upload" ? "Upload" : "Scheduled"}
              </span>
              {i < 1 && <div className="w-8 h-px bg-border" />}
            </div>
          ))}
        </div>

        {/* ── Step 1: Upload ── */}
        {step === "upload" && (
          <div className="bg-card border border-border rounded-xl p-6 mb-4">
            <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <ImageIcon size={16} className="text-accent" /> Image
            </h2>

            {!preview ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all",
                  isDragging
                    ? "border-accent bg-accent/10"
                    : "border-border hover:border-accent/50 hover:bg-muted/30"
                )}
              >
                <Upload size={32} className="text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">Drop image here or click to browse</p>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP — max 10 MB</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden border border-border aspect-square max-h-64 w-full">
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  {!isProcessing && (
                    <button
                      onClick={() => { setSelectedFile(null); setPreview(null); setUploadError(null); }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
                    >
                      <X size={14} className="text-white" />
                    </button>
                  )}
                </div>

                {uploadError && (
                  <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 rounded-lg px-3 py-2">
                    <AlertTriangle size={14} /> {uploadError}
                  </div>
                )}

                {isProcessing ? (
                  <div className="w-full py-3 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center gap-3 text-sm text-accent font-medium">
                    <Loader2 size={16} className="animate-spin" />
                    Analyzing & scheduling...
                  </div>
                ) : (
                  <button
                    onClick={handleUploadAndSchedule}
                    className="w-full py-3 rounded-lg bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-accent/20"
                  >
                    <CalendarClock size={16} />
                    Upload & Auto-Schedule
                  </button>
                )}

                {localTimezone && (
                  <p className="text-xs text-center text-muted-foreground">
                    Will schedule at the next available slot in <span className="text-foreground font-medium">{localTimezone.replace("_", " ")}</span>
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Done ── */}
        {step === "done" && scheduledFor && (
          <div className="space-y-4">
            {/* Success banner */}
            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={28} className="text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-1">Auto-Scheduled!</h2>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <CalendarClock size={14} className="text-accent" />
                <span>{formatScheduled(scheduledFor, scheduledTimezone)}</span>
              </div>
            </div>

            {/* Content preview */}
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex gap-4">
                {resultImageUrl && (
                  <img
                    src={resultImageUrl}
                    alt="Scheduled"
                    className="w-20 h-20 rounded-lg object-cover border border-border flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground font-medium mb-1.5">Generated Caption</p>
                  <p className="text-sm text-foreground leading-relaxed line-clamp-4">{resultCaption}</p>
                </div>
              </div>

              {resultHashtags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
                  {resultHashtags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-full bg-accent/15 text-accent text-xs font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Boost tip */}
            <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                  <Instagram size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">Boost Your Reach</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    When your post goes live: <strong className="text-foreground">share it to your Story</strong> and toggle{" "}
                    <strong className="text-foreground">Share to Facebook</strong> to maximize reach.
                  </p>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex gap-3">
              <a
                href="/planner"
                className="flex-1 py-2.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted transition-all flex items-center justify-center gap-2"
              >
                <CalendarClock size={14} /> View in Planner
              </a>
              <button
                onClick={resetForm}
                className="flex-1 py-2.5 rounded-lg bg-accent hover:bg-accent/90 text-accent-foreground text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent/20"
              >
                <Upload size={14} /> Upload Another
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Timezone Setup Modal (one-time) */}
      {timezoneModalOpen && (
        <TimezoneSetupModal
          onComplete={(tz) => {
            setLocalTimezone(tz);
            setTimezoneModalOpen(false);
            // If a file was already selected, auto-trigger the pipeline
            if (selectedFile) handleUploadAndSchedule();
          }}
        />
      )}
    </div>
  );
}
