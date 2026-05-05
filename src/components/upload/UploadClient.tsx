"use client";

import { useState, useTransition, useRef } from "react";
import {
  Upload,
  Loader2,
  CheckCircle2,
  X,
  CalendarClock,
  ImageIcon,
  AlertTriangle,
  Type,
  Hash,
  Send,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { analyzeImageAndGenerate } from "@/app/actions/analyze-image";
import { autoSchedulePost } from "@/app/actions/schedule";
import { updatePost } from "@/app/actions/projects";
import { TimezoneSetupModal } from "@/components/TimezoneSetupModal";
import { toast } from "sonner";
import { Edit3, Check, Copy } from "lucide-react";

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

type Step = "upload" | "review" | "done";

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
  const [captionTone, setCaptionTone] = useState("viral");
  const [hashtagCount, setHashtagCount] = useState(3);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Processing / done state
  const [isProcessing, startProcessing] = useTransition();
  const [isScheduling, startScheduling] = useTransition();
  const [isPending, startTransition] = useTransition();
  const [scheduledFor, setScheduledFor] = useState<string | null>(null);
  const [scheduledTimezone, setScheduledTimezone] = useState<string>("");
  const [resultCaption, setResultCaption] = useState("");
  const [resultHashtags, setResultHashtags] = useState<string[]>([]);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  const [resultPostId, setResultPostId] = useState<string | null>(null);

  // Edit Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [tempCaption, setTempCaption] = useState("");
  const [tempHashtags, setTempHashtags] = useState("");

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
        // Instagram 2026: 3:4 (0.75) portrait → 1.91:1 landscape, plus 1:1 and 9:16
        if (ratio < 0.75 - 0.01 || ratio > 1.91 + 0.01) {
          const dir = ratio < 0.75 ? "Portrait is too tall" : "Landscape is too wide";
          res({
            ok: false,
            title: "Invalid aspect ratio",
            description: `${dir} (${ratio.toFixed(2)}:1). Instagram accepts 3:4, 4:5, 1:1, or up to 1.91:1 landscape.`,
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

  // ─── Phase 1: Upload & Analyze ──────────────────────────────────────────

  const handleAnalysis = () => {
    if (!selectedFile) return;

    setUploadError(null);
    startProcessing(async () => {
      try {
        const fileToUpload = await compressForInstagram(selectedFile);
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

        const analyzeResult = await analyzeImageAndGenerate(publicUrl, captionTone, hashtagCount);
        if (!analyzeResult.success) throw new Error(analyzeResult.error);

        setResultCaption(analyzeResult.analysis.caption);
        setResultHashtags(analyzeResult.analysis.hashtags);
        setResultImageUrl(publicUrl);
        setResultPostId(analyzeResult.postId);
        setStep("review");
        toast.success("Analysis complete!", { description: "Review and approve your content." });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Analysis failed. Please try again.";
        setUploadError(msg);
        toast.error("Upload failed", { description: msg });
      }
    });
  };

  const handleSaveEdits = async () => {
    if (!resultPostId) return;
    
    startTransition(async () => {
      try {
        const hashtagsArray = tempHashtags
          .split(/[,|\s]+/)
          .map(tag => tag.replace(/^#/, "").trim())
          .filter(tag => tag.length > 0);

        const result = await updatePost(resultPostId, {
          caption: tempCaption,
          hashtags: hashtagsArray
        });

        if (result.success) {
          setResultCaption(tempCaption);
          setResultHashtags(hashtagsArray);
          setIsEditModalOpen(false);
          toast.success("Content updated successfully.");
        } else {
          throw new Error(result.error);
        }
      } catch (err: unknown) {
        toast.error("Failed to update content", { 
          description: err instanceof Error ? err.message : "Unknown error" 
        });
      }
    });
  };

  // ─── Phase 2: Approve & Auto-Schedule ──────────────────────────────────────

  const handleApproveAndSchedule = () => {
    if (!resultPostId) return;

    if (!localTimezone) {
      setTimezoneModalOpen(true);
      return;
    }

    startScheduling(async () => {
      try {
        const scheduleResult = await autoSchedulePost(resultPostId);
        if (!scheduleResult.success) {
          if (scheduleResult.error === "NO_TIMEZONE") {
            setTimezoneModalOpen(true);
            return;
          }
          throw new Error(scheduleResult.error);
        }

        setScheduledFor(scheduleResult.scheduledFor);
        setScheduledTimezone(scheduleResult.timezone);
        setStep("done");
        toast.success("Post scheduled!", { description: "Your post is now in the queue." });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Scheduling failed.";
        toast.error("Scheduling failed", { description: msg });
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
    setResultPostId(null);
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
            AI-powered Instagram automation. Upload, refine, and schedule in seconds.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {(["upload", "review", "done"] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all",
                  step === s
                    ? "border-accent bg-accent text-accent-foreground"
                    : (step === "review" && s === "upload") || (step === "done" && s !== "done")
                    ? "border-accent/50 bg-accent/20 text-accent"
                    : "border-border text-muted-foreground"
                )}
              >
                {((step === "review" && s === "upload") || (step === "done" && s !== "done")) ? <CheckCircle2 size={14} /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-xs font-medium capitalize hidden sm:block",
                  step === s ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {s}
              </span>
              {i < 2 && <div className="w-8 h-px bg-border" />}
            </div>
          ))}
        </div>

        {/* ── Step 1: Upload ── */}
        {step === "upload" && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <ImageIcon size={16} className="text-accent" /> Image Selection
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
                      <p className="text-xs text-muted-foreground mt-1">JPEG, PNG, WEBP · 3:4, 4:5, 1:1, or up to 1.91:1</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => { if (e.target.files?.[0]) void handleFileSelect(e.target.files[0]); }}
                    />
                  </div>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-border aspect-square max-h-64 w-full mx-auto">
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
              )}
            </div>

            {/* AI Configuration */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <RefreshCw size={16} className="text-accent" /> AI Generation Rules
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                    <Type size={12} /> Caption Tone
                  </label>
                  <select
                    value={captionTone}
                    onChange={(e) => setCaptionTone(e.target.value)}
                    className="w-full bg-muted/50 border border-border rounded-lg py-2.5 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent appearance-none"
                  >
                    <option value="viral">Viral & Punchy</option>
                    <option value="educational">Educational & Deep</option>
                    <option value="aggressive">Aggressive & Bold</option>
                    <option value="minimalist">Clean & Minimalist</option>
                    <option value="funny">Humorous & Relatable</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                    <Hash size={12} /> Hashtag Count
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    value={hashtagCount}
                    onChange={(e) => setHashtagCount(parseInt(e.target.value) || 0)}
                    className="w-full bg-muted/50 border border-border rounded-lg py-2.5 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>

              {uploadError && (
                <div className="mt-4 flex items-start gap-2 text-red-400 text-xs bg-red-500/10 rounded-lg px-3 py-2.5">
                  <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              <button
                onClick={handleAnalysis}
                disabled={!selectedFile || isProcessing}
                className="w-full mt-6 py-3 rounded-lg bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-accent/20 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Analyzing Image...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Analyze & Generate
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Review ── */}
        {step === "review" && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex gap-6">
                <div className="w-32 h-32 rounded-lg overflow-hidden border border-border shrink-0">
                  <img src={resultImageUrl!} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Generated Caption</label>
                    <button 
                      onClick={() => {
                        setTempCaption(resultCaption);
                        setTempHashtags(resultHashtags.join(", "));
                        setIsEditModalOpen(true);
                      }}
                      className="text-[10px] font-bold text-accent uppercase tracking-widest flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                    >
                      <Edit3 size={12} /> Edit Narrative
                    </button>
                  </div>
                  <div 
                    onClick={() => {
                      setTempCaption(resultCaption);
                      setTempHashtags(resultHashtags.join(", "));
                      setIsEditModalOpen(true);
                    }}
                    className="w-full bg-muted/30 border border-border rounded-xl p-4 text-sm text-foreground leading-relaxed cursor-pointer hover:bg-muted/50 transition-colors min-h-[120px]"
                  >
                    {resultCaption}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Target Hashtags</label>
                  <button 
                    onClick={() => {
                      setTempCaption(resultCaption);
                      setTempHashtags(resultHashtags.join(", "));
                      setIsEditModalOpen(true);
                    }}
                    className="text-[10px] font-bold text-accent uppercase tracking-widest flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                  >
                    <Edit3 size={12} /> Edit Tags
                  </button>
                </div>
                <div 
                  onClick={() => {
                    setTempCaption(resultCaption);
                    setTempHashtags(resultHashtags.join(", "));
                    setIsEditModalOpen(true);
                  }}
                  className="flex flex-wrap gap-2 p-4 bg-muted/30 border border-border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  {resultHashtags.map((tag, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold border border-accent/20">
                      #{tag}
                    </span>
                  ))}
                  {resultHashtags.length === 0 && <span className="text-xs text-muted-foreground italic">No hashtags generated.</span>}
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  onClick={resetForm}
                  className="flex-1 py-3 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted transition-all"
                >
                  Discard
                </button>
                <button
                  onClick={handleApproveAndSchedule}
                  disabled={isScheduling}
                  className="flex-[2] py-3 rounded-lg bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-accent/20"
                >
                  {isScheduling ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <Send size={16} /> Approve & Auto-Schedule
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: Done ── */}
        {step === "done" && scheduledFor && (
          <div className="space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-1">Post Scheduled!</h2>
              <p className="text-sm text-muted-foreground mb-4">Your content has been approved and queued.</p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/10 text-accent text-sm font-bold border border-accent/20">
                <CalendarClock size={16} />
                <span>{formatScheduled(scheduledFor, scheduledTimezone)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <a
                href="/planner"
                className="flex-1 py-3 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted transition-all flex items-center justify-center gap-2"
              >
                View in Planner
              </a>
              <button
                onClick={resetForm}
                className="flex-1 py-3 rounded-lg bg-accent hover:bg-accent/90 text-accent-foreground text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent/20"
              >
                Upload New
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal (High-Fidelity) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 sm:p-6 lg:p-12">
          <div className="absolute inset-0 bg-background/95 backdrop-blur-3xl" onClick={() => setIsEditModalOpen(false)} />
          <div className="relative bg-card border border-border rounded-[2.5rem] w-full max-w-2xl p-6 sm:p-10 shadow-2xl animate-in zoom-in-95 duration-500 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-accent/10 flex items-center justify-center">
                  <Edit3 size={20} className="text-accent" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Narrative Core</h2>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-0.5">Refinement & Review</p>
                </div>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-6 scrollbar-hide">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block ml-2">Caption</label>
                <textarea
                  value={tempCaption}
                  onChange={(e) => setTempCaption(e.target.value)}
                  className="w-full bg-muted/30 border border-border rounded-2xl p-5 sm:p-6 text-base sm:text-lg text-foreground leading-relaxed focus:outline-none focus:ring-1 focus:ring-accent min-h-[200px] sm:min-h-[250px] transition-all resize-none"
                  placeholder="Refine the story..."
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block ml-2">Hashtags (comma separated)</label>
                <textarea
                  value={tempHashtags}
                  onChange={(e) => setTempHashtags(e.target.value)}
                  className="w-full bg-muted/30 border border-border rounded-2xl p-5 sm:p-6 text-sm text-foreground leading-relaxed focus:outline-none focus:ring-1 focus:ring-accent min-h-[100px] transition-all resize-none"
                  placeholder="growth, design, tech..."
                />
              </div>
              
              <div className="flex flex-wrap items-center justify-between gap-4 px-2">
                 <div className="flex gap-6 sm:gap-8">
                   <div className="flex flex-col">
                     <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Characters</span>
                     <span className={cn("text-xs sm:text-sm font-bold", tempCaption.length > 2200 ? "text-red-500" : "text-foreground")}>
                       {tempCaption.length} <span className="text-muted-foreground font-medium">/ 2200</span>
                     </span>
                   </div>
                   <div className="flex flex-col">
                     <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Words</span>
                     <span className="text-xs sm:text-sm font-bold text-foreground">
                       {tempCaption.trim() ? tempCaption.trim().split(/\s+/).length : 0}
                     </span>
                   </div>
                 </div>
                 
                 <button 
                   onClick={() => {
                      navigator.clipboard.writeText(`${tempCaption}\n\n${tempHashtags.split(/[,|\s]+/).map(t => `#${t.replace(/^#/, "").trim()}`).join(" ")}`);
                      toast.success("Signal copied to clipboard!");
                   }}
                   className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all group"
                 >
                   <Copy size={12} className="group-hover:scale-110 transition-transform" /> Copy Signal
                 </button>
              </div>
            </div>

            <div className="mt-8 sm:mt-10 flex gap-3 sm:gap-4">
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setTempCaption(resultCaption);
                  setTempHashtags(resultHashtags.join(", "));
                }}
                className="flex-1 py-4 sm:py-5 rounded-2xl border border-border text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:bg-muted transition-all"
              >
                Discard
              </button>
              <button
                onClick={handleSaveEdits}
                disabled={isPending}
                className="flex-[2] py-4 sm:py-5 rounded-2xl bg-accent text-accent-foreground text-[10px] font-bold uppercase tracking-widest hover:bg-accent/90 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-accent/20"
              >
                {isPending ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <>
                    <Check size={16} /> Update Narrative
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Timezone Setup Modal (one-time) */}
      {timezoneModalOpen && (
        <TimezoneSetupModal
          onComplete={(tz) => {
            setLocalTimezone(tz);
            setTimezoneModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
