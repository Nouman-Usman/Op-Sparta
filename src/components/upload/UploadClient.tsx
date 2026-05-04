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
import { toast } from "sonner";

// Compress and resize an image to a JPEG ≤ 5 MB so it always meets Instagram's
// 8 MB limit. Resizes to 1080px max width (Instagram's recommended resolution).
async function compressForInstagram(file: File): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      const MAX = 1080;
      const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      const ctx = canvas.getContext("2d");
      if (!ctx) { URL.revokeObjectURL(objectUrl); return resolve(file); }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl);
          if (!blob) return resolve(file);
          const name = file.name.replace(/\.[^.]+$/, ".jpg");
          resolve(new File([blob], name, { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.88
      );
    };

    img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file); };
    img.src = objectUrl;
  });
}

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

  const handleFileSelect = async (file: File) => {
    // Instagram-supported formats that Canvas can convert to JPEG
    const supported = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!supported.includes(file.type)) {
      const ext = file.name.split(".").pop()?.toUpperCase() ?? file.type;
      const msg = `${ext} files aren't supported. Please upload a JPEG, PNG, or WEBP image.`;
      setUploadError(msg);
      toast.error("Unsupported file type", { description: msg });
      return;
    }

    // Dimension + aspect-ratio check (requires loading the image)
    const dimCheck = await new Promise<{ ok: boolean; title?: string; description?: string }>((res) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const { width, height } = img;
        if (width < 320 || height < 320) {
          res({
            ok: false,
            title: "Image too small",
            description: `${width}×${height}px — Instagram requires at least 320×320px.`,
          });
          return;
        }
        const ratio = width / height;
        if (ratio < 0.8 - 0.01 || ratio > 1.91 + 0.01) {
          const dir = ratio < 0.8 ? "Portrait is too tall" : "Landscape is too wide";
          res({
            ok: false,
            title: "Invalid aspect ratio",
            description: `${dir} (${ratio.toFixed(2)}:1). Instagram accepts 4:5 portrait to 1.91:1 landscape.`,
          });
          return;
        }
        res({ ok: true });
      };
      img.onerror = () => { URL.revokeObjectURL(url); res({ ok: true }); };
      img.src = url;
    });

    if (!dimCheck.ok) {
      const msg = dimCheck.description!;
      setUploadError(msg);
      toast.error(dimCheck.title!, { description: msg });
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
    if (file) void handleFileSelect(file);
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
        // 1. Compress to JPEG ≤ 5 MB before uploading
        const fileToUpload = await compressForInstagram(selectedFile);

        // 2. Upload to Supabase Storage
        const supabase = createClient();
        const fileName = `${crypto.randomUUID()}_${Date.now()}.jpg`;
        const filePath = `uploads/${userId}/${fileName}`;

        const { error: uploadErr } = await supabase.storage
          .from("project-assets")
          .upload(filePath, fileToUpload);
        if (uploadErr) throw new Error(uploadErr.message);

        const { data: { publicUrl } } = supabase.storage
          .from("project-assets")
          .getPublicUrl(filePath);

        // 3. AI analysis — generates caption, hashtags, creates post record
        const analyzeResult = await analyzeImageAndGenerate(publicUrl);
        if (!analyzeResult.success) throw new Error(analyzeResult.error);

        // 4. Auto-schedule the post
        const scheduleResult = await autoSchedulePost(analyzeResult.postId);
        if (!scheduleResult.success) {
          if (scheduleResult.error === "NO_TIMEZONE") {
            setTimezoneModalOpen(true);
            return;
          }
          throw new Error(scheduleResult.error);
        }

        // 5. Show done screen
        setResultCaption(analyzeResult.analysis.caption);
        setResultHashtags(analyzeResult.analysis.hashtags);
        setResultImageUrl(publicUrl);
        setScheduledFor(scheduleResult.scheduledFor);
        setScheduledTimezone(scheduleResult.timezone);
        setStep("done");
        toast.success("Post scheduled!", { description: "Your image has been analyzed and auto-scheduled." });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Processing failed. Please try again.";
        setUploadError(msg);
        toast.error("Upload failed", { description: msg });
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
              <div className="space-y-3">
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all",
                    isDragging
                      ? "border-accent bg-accent/10"
                      : uploadError
                      ? "border-red-500/50 bg-red-500/5"
                      : "border-border hover:border-accent/50 hover:bg-muted/30"
                  )}
                >
                  {uploadError
                    ? <AlertTriangle size={32} className="text-red-400" />
                    : <Upload size={32} className="text-muted-foreground" />
                  }
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">Drop image here or click to browse</p>
                    <p className="text-xs text-muted-foreground mt-1">JPEG, PNG, WEBP · min 320×320px · aspect ratio 4:5 to 1.91:1</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => { if (e.target.files?.[0]) void handleFileSelect(e.target.files[0]); }}
                  />
                </div>
                {uploadError && (
                  <div className="flex items-start gap-2 text-red-400 text-xs bg-red-500/10 rounded-lg px-3 py-2.5">
                    <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}
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
