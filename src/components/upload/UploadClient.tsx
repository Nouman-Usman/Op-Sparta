"use client";

import { useState, useTransition, useRef } from "react";
import {
  Upload,
  Loader2,
  CheckCircle2,
  Sparkles,
  Clock,
  X,
  Plus,
  AlertTriangle,
  CalendarClock,
  Instagram,
  Share2,
  ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { analyzeImageAndGenerate, scheduleUploadPost, checkOneHourRule } from "@/app/actions/analyze-image";
import type { ImageCaption } from "@/app/actions/analyze-image";

const TIMEZONES = [
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

const TIME_WINDOWS = [
  { label: "Morning", time: "10:30", hour: 10, minute: 30, description: "10:30 AM – High engagement" },
  { label: "Afternoon", time: "14:00", hour: 14, minute: 0, description: "2:00 PM – Effective slot" },
  { label: "Evening", time: "19:00", hour: 19, minute: 0, description: "7:00 PM – Best for virality" },
];

function getNextSevenDays(): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

function formatDayLabel(date: Date): string {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function buildScheduledDate(day: Date, window: typeof TIME_WINDOWS[0]): Date {
  const d = new Date(day);
  d.setHours(window.hour, window.minute, 0, 0);
  return d;
}

type Step = "upload" | "analyze" | "schedule" | "done";

export function UploadClient({ userId }: { userId: string }) {
  const [step, setStep] = useState<Step>("upload");

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, startUpload] = useTransition();

  // Analysis state
  const [postId, setPostId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ImageCaption | null>(null);
  const [editedCaption, setEditedCaption] = useState("");
  const [editedHashtags, setEditedHashtags] = useState<string[]>([]);
  const [newHashtag, setNewHashtag] = useState("");
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [isAnalyzing, startAnalysis] = useTransition();

  // Schedule state
  const [timezone, setTimezone] = useState("America/New_York");
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedWindow, setSelectedWindow] = useState<typeof TIME_WINDOWS[0] | null>(null);
  const [oneHourWarning, setOneHourWarning] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [isScheduling, startSchedule] = useTransition();

  const days = getNextSevenDays();

  // ─── File Handling ───────────────────────────────────────────────────────────

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

  const handleUpload = () => {
    if (!selectedFile) return;
    startUpload(async () => {
      try {
        const supabase = createClient();
        const ext = selectedFile.name.split(".").pop();
        const fileName = `${crypto.randomUUID()}_${Date.now()}.${ext}`;
        const filePath = `uploads/${userId}/${fileName}`;

        const { error } = await supabase.storage
          .from("project-assets")
          .upload(filePath, selectedFile);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from("project-assets")
          .getPublicUrl(filePath);

        setUploadedUrl(publicUrl);
        setStep("analyze");
      } catch (err: any) {
        setUploadError(err.message ?? "Upload failed. Check your Supabase Storage bucket policy.");
      }
    });
  };

  // ─── Analysis ────────────────────────────────────────────────────────────────

  const handleAnalyze = () => {
    if (!uploadedUrl) return;
    setAnalyzeError(null);
    startAnalysis(async () => {
      const result = await analyzeImageAndGenerate(uploadedUrl);
      if (!result.success) {
        setAnalyzeError(result.error);
        return;
      }
      setPostId(result.postId);
      setAnalysis(result.analysis);
      setEditedCaption(result.analysis.caption);
      setEditedHashtags(result.analysis.hashtags);
      setStep("schedule");
    });
  };

  const removeHashtag = (tag: string) => {
    setEditedHashtags((h) => h.filter((t) => t !== tag));
  };

  const addHashtag = () => {
    const tag = newHashtag.trim().replace(/^#/, "");
    if (!tag) return;
    if (editedHashtags.length >= 3) {
      alert("Instagram recommends exactly 3 hashtags. Remove one first.");
      return;
    }
    setEditedHashtags((h) => [...h, tag]);
    setNewHashtag("");
  };

  // ─── Scheduling ──────────────────────────────────────────────────────────────

  const handleSelectSlot = async (day: Date, window: typeof TIME_WINDOWS[0]) => {
    setSelectedDay(day);
    setSelectedWindow(window);
    setOneHourWarning(null);

    const oneHourCheck = await checkOneHourRule(userId);
    if (!oneHourCheck.canPost && oneHourCheck.nextAvailable) {
      const slotTime = buildScheduledDate(day, window);
      if (slotTime < oneHourCheck.nextAvailable) {
        const t = oneHourCheck.nextAvailable.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
        setOneHourWarning(`Your last post needs more time to gain reach. Next safe slot: ${t}`);
      }
    }
  };

  const isSlotInPast = (day: Date, window: typeof TIME_WINDOWS[0]) => {
    const slot = buildScheduledDate(day, window);
    return slot <= new Date();
  };

  const handleSchedule = () => {
    if (!postId || !selectedDay || !selectedWindow) return;
    setScheduleError(null);
    const scheduledFor = buildScheduledDate(selectedDay, selectedWindow);
    startSchedule(async () => {
      const result = await scheduleUploadPost(postId, scheduledFor, timezone);
      if (!result.success) {
        setScheduleError(result.error);
        return;
      }
      setStep("done");
    });
  };

  const handlePostNow = () => {
    if (!postId) return;
    setScheduleError(null);
    startSchedule(async () => {
      const result = await scheduleUploadPost(postId, new Date(), timezone);
      if (!result.success) {
        setScheduleError(result.error);
        return;
      }
      setStep("done");
    });
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-accent/20 flex items-center justify-center">
              <Upload size={18} className="text-accent" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Upload & Schedule</h1>
          </div>
          <p className="text-muted-foreground text-sm ml-12">
            Upload an image, get AI-generated captions & hashtags, then schedule at optimal times.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {(["upload", "analyze", "schedule"] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all",
                step === s ? "border-accent bg-accent text-accent-foreground" :
                (["upload", "analyze", "schedule", "done"].indexOf(step) > i)
                  ? "border-accent/50 bg-accent/20 text-accent"
                  : "border-border text-muted-foreground"
              )}>
                {["upload", "analyze", "schedule", "done"].indexOf(step) > i
                  ? <CheckCircle2 size={14} />
                  : i + 1}
              </div>
              <span className={cn(
                "text-xs font-medium capitalize hidden sm:block",
                step === s ? "text-foreground" : "text-muted-foreground"
              )}>
                {s === "upload" ? "Upload" : s === "analyze" ? "Analyze" : "Schedule"}
              </span>
              {i < 2 && <div className="w-8 h-px bg-border" />}
            </div>
          ))}
        </div>

        {/* ── Step 1: Upload ── */}
        {(step === "upload" || step === "analyze") && (
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
                  isDragging ? "border-accent bg-accent/10" : "border-border hover:border-accent/50 hover:bg-muted/30"
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
                  {step === "upload" && (
                    <button
                      onClick={() => { setSelectedFile(null); setPreview(null); setUploadedUrl(null); }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
                    >
                      <X size={14} className="text-white" />
                    </button>
                  )}
                  {uploadedUrl && (
                    <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/60 rounded-full px-3 py-1">
                      <CheckCircle2 size={12} className="text-green-400" />
                      <span className="text-xs text-white font-medium">Uploaded</span>
                    </div>
                  )}
                </div>

                {uploadError && (
                  <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 rounded-lg px-3 py-2">
                    <AlertTriangle size={14} /> {uploadError}
                  </div>
                )}

                {step === "upload" && !uploadedUrl && (
                  <button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="w-full py-2.5 rounded-lg bg-accent hover:bg-accent/90 text-accent-foreground font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
                  >
                    {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                    {isUploading ? "Uploading..." : "Upload Image"}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Step 2: Analyze ── */}
        {step === "analyze" && (
          <div className="bg-card border border-border rounded-xl p-6 mb-4">
            <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Sparkles size={16} className="text-accent" /> AI Analysis
            </h2>

            {analyzeError && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 rounded-lg px-3 py-2 mb-4">
                <AlertTriangle size={14} /> {analyzeError}
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full py-3 rounded-lg bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition-all shadow-lg shadow-accent/20"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Analyzing image...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Generate Caption & Hashtags
                </>
              )}
            </button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Uses your active AI provider (OpenAI or Gemini)
            </p>
          </div>
        )}

        {/* ── Step 3: Schedule (shown after analysis result) ── */}
        {step === "schedule" && analysis && (
          <>
            {/* Caption result */}
            <div className="bg-card border border-border rounded-xl p-6 mb-4">
              <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Sparkles size={16} className="text-accent" /> Generated Content
              </h2>

              {/* Preview image thumbnail */}
              {preview && (
                <div className="flex gap-4 mb-4">
                  <img src={preview} alt="Uploaded" className="w-20 h-20 rounded-lg object-cover border border-border flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground font-medium mb-1">
                      Suggested platform: <span className="text-accent">{analysis.suggestedPlatform}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{analysis.altText}</p>
                  </div>
                </div>
              )}

              {/* Caption */}
              <div className="mb-4">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Caption</label>
                <textarea
                  value={editedCaption}
                  onChange={(e) => setEditedCaption(e.target.value)}
                  rows={5}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              {/* Hashtags */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Hashtags (max 3)</label>
                  <span className={cn(
                    "text-xs font-semibold",
                    editedHashtags.length > 3 ? "text-red-400" : "text-muted-foreground"
                  )}>
                    {editedHashtags.length}/3
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {editedHashtags.map((tag) => (
                    <span key={tag} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent/15 text-accent text-xs font-medium">
                      #{tag}
                      <button onClick={() => removeHashtag(tag)} className="hover:text-red-400 transition-colors ml-0.5">
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                  {editedHashtags.length < 3 && (
                    <div className="flex items-center gap-1">
                      <input
                        value={newHashtag}
                        onChange={(e) => setNewHashtag(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addHashtag()}
                        placeholder="add tag"
                        className="bg-background border border-border rounded-full px-2.5 py-1 text-xs text-foreground w-20 focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                      <button onClick={addHashtag} className="text-accent hover:text-accent/80">
                        <Plus size={14} />
                      </button>
                    </div>
                  )}
                </div>
                {editedHashtags.length > 3 && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <AlertTriangle size={11} /> Instagram penalizes more than 3 hashtags
                  </p>
                )}
              </div>

              {/* Comment keywords */}
              {analysis.commentKeywords.length > 0 && (
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">
                    First Comment Keywords (SEO boost)
                  </p>
                  <p className="text-xs text-foreground">{analysis.commentKeywords.join(", ")}</p>
                </div>
              )}
            </div>

            {/* Schedule picker */}
            <div className="bg-card border border-border rounded-xl p-6 mb-4">
              <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <CalendarClock size={16} className="text-accent" /> Schedule
              </h2>

              {/* Timezone */}
              <div className="mb-5">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Target Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                  ))}
                </select>
              </div>

              {/* Optimal time windows */}
              <div className="mb-4">
                <p className="text-xs font-medium text-muted-foreground mb-3">Optimal Time Windows</p>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {TIME_WINDOWS.map((window) => (
                    <button
                      key={window.label}
                      onClick={() => selectedDay && handleSelectSlot(selectedDay, window)}
                      disabled={!selectedDay}
                      className={cn(
                        "flex flex-col items-center gap-1 p-3 rounded-lg border text-center transition-all text-xs disabled:opacity-40",
                        selectedWindow?.label === window.label
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border text-muted-foreground hover:border-accent/50 hover:text-foreground"
                      )}
                    >
                      <Clock size={14} />
                      <span className="font-semibold">{window.label}</span>
                      <span className="text-[10px] leading-tight">{window.description}</span>
                    </button>
                  ))}
                </div>

                {/* Day selector */}
                <p className="text-xs font-medium text-muted-foreground mb-2">Select a Day</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {days.map((day) => (
                    <button
                      key={day.toDateString()}
                      onClick={() => { setSelectedDay(day); if (selectedWindow) handleSelectSlot(day, selectedWindow); }}
                      className={cn(
                        "flex-shrink-0 flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-lg border text-xs transition-all",
                        selectedDay?.toDateString() === day.toDateString()
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border text-muted-foreground hover:border-accent/50"
                      )}
                    >
                      <span className="font-semibold">{formatDayLabel(day)}</span>
                      <span className="text-[10px]">{day.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 1-hour rule warning */}
              {oneHourWarning && (
                <div className="flex items-start gap-2 text-amber-400 text-xs bg-amber-500/10 rounded-lg px-3 py-2.5 mb-4">
                  <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                  <span>{oneHourWarning}</span>
                </div>
              )}

              {scheduleError && (
                <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 rounded-lg px-3 py-2 mb-4">
                  <AlertTriangle size={14} /> {scheduleError}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handlePostNow}
                  disabled={isScheduling}
                  className="flex-1 py-2.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isScheduling ? <Loader2 size={14} className="animate-spin" /> : <Share2 size={14} />}
                  Post Now
                </button>
                <button
                  onClick={handleSchedule}
                  disabled={isScheduling || !selectedDay || !selectedWindow}
                  className="flex-1 py-2.5 rounded-lg bg-accent hover:bg-accent/90 text-accent-foreground text-sm font-semibold disabled:opacity-60 transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent/20"
                >
                  {isScheduling ? <Loader2 size={14} className="animate-spin" /> : <CalendarClock size={14} />}
                  Schedule
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── Done ── */}
        {step === "done" && (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Post Scheduled!</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Your post will be published at the selected time.
            </p>

            {/* Story reminder */}
            <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 rounded-xl p-4 text-left mb-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                  <Instagram size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">Boost Your Reach</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    When your post goes live: <strong className="text-foreground">share it to your Story</strong> and toggle <strong className="text-foreground">Share to Facebook</strong> to maximize reach and potentially earn algorithm bonuses.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setStep("upload");
                setSelectedFile(null);
                setPreview(null);
                setUploadedUrl(null);
                setPostId(null);
                setAnalysis(null);
                setEditedCaption("");
                setEditedHashtags([]);
                setSelectedDay(null);
                setSelectedWindow(null);
                setOneHourWarning(null);
              }}
              className="w-full py-2.5 rounded-lg bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-sm transition-all"
            >
              Upload Another
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
