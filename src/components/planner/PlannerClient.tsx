"use client";

import { useState, useMemo, useEffect, useCallback, useTransition } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Instagram,
  Sparkles,
  CalendarDays,
  Upload,
  X,
  ExternalLink,
  Clock,
  Tag,
  Loader2,
  RefreshCw,
  Send,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { approveAndPost } from "@/app/actions/publish";
import { deletePost } from "@/app/actions/projects";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────

type Post = {
  id: string;
  caption: string | null;
  imageUrl: string | null;
  status: string;
  source: string;
  scheduledFor: string; // ISO — always present (API only returns posts with scheduledFor)
  createdAt: string;
  instagramPostId: string | null;
  instagramPermalink: string | null;
  projectId: string | null;
  projectName: string | null;
  hashtags: string[];
};

type ViewMode = "week" | "month";

// ── Constants ─────────────────────────────────────────────────────────────────

const DAY_LABELS_LONG  = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const DAY_LABELS_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

// ── Date helpers ──────────────────────────────────────────────────────────────

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function getWeekDays(anchor: Date): Date[] {
  const d = new Date(anchor);
  d.setDate(d.getDate() - d.getDay()); // rewind to Sunday
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(d);
    dd.setDate(d.getDate() + i);
    return dd;
  });
}

function getMonthGrid(year: number, month: number): Date[] {
  const firstDow = new Date(year, month, 1).getDay();
  return Array.from({ length: 42 }, (_, i) => new Date(year, month, 1 - firstDow + i));
}

/** Inclusive range covering all days visible in the current view */
function getVisibleRange(view: ViewMode, anchor: Date): { start: Date; end: Date } {
  if (view === "week") {
    const days = getWeekDays(anchor);
    const start = new Date(days[0]); start.setHours(0, 0, 0, 0);
    const end   = new Date(days[6]); end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  const grid = getMonthGrid(anchor.getFullYear(), anchor.getMonth());
  const start = new Date(grid[0]); start.setHours(0, 0, 0, 0);
  const end   = new Date(grid[41]); end.setHours(23, 59, 59, 999);
  return { start, end };
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function formatFullDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    published: "bg-green-500/20 text-green-400 border-green-500/30",
    pending:   "bg-amber-500/20 text-amber-400 border-amber-500/30",
    ready:     "bg-blue-500/20 text-blue-400 border-blue-500/30",
    generating:"bg-purple-500/20 text-purple-400 border-purple-500/30",
  };
  return (
    <span className={cn("text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border", map[status] ?? "bg-muted text-muted-foreground border-border")}>
      {status}
    </span>
  );
}

function PostChip({ post, compact, onClick }: { post: Post; compact?: boolean; onClick: () => void }) {
  const isInstagram = !!post.instagramPostId || post.source === "upload";
  const chipColor = isInstagram
    ? "bg-orange-500/20 border-orange-500/30 text-orange-300 hover:bg-orange-500/30"
    : "bg-teal-500/20 border-teal-500/30 text-teal-300 hover:bg-teal-500/30";
  const Icon = isInstagram ? Instagram : Sparkles;
  const statusDot =
    post.status === "published" ? "bg-green-400"
    : post.status === "pending" ? "bg-amber-400"
    : "bg-blue-400";

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={cn("w-full text-left flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border truncate transition-colors cursor-pointer", chipColor)}
      >
        <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", statusDot)} />
        <span className="truncate">{formatTime(post.scheduledFor)}</span>
        <Icon size={9} className="flex-shrink-0 ml-auto" />
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn("w-full text-left flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold border transition-colors cursor-pointer", chipColor)}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", statusDot)} />
      <span className="truncate">{formatTime(post.scheduledFor)}</span>
      <Icon size={10} className="flex-shrink-0 ml-auto" />
    </button>
  );
}

function DayCell({
  date, dayPosts, isCurrentMonth, isToday, view, onPostClick,
}: {
  date: Date; dayPosts: Post[]; isCurrentMonth: boolean; isToday: boolean;
  view: ViewMode; onPostClick: (p: Post) => void;
}) {
  const maxVisible = view === "week" ? 8 : 2;
  const overflow = dayPosts.length - maxVisible;

  return (
    <div className={cn(
      "flex flex-col border-r border-b border-border",
      view === "week" ? "p-2 min-h-[140px]" : "p-1.5 min-h-[88px]",
      !isCurrentMonth && "bg-muted/10",
    )}>
      <span className={cn(
        "text-xs font-bold mb-1 self-start flex items-center justify-center",
        isToday
          ? "w-5 h-5 rounded-full bg-accent text-accent-foreground text-[10px]"
          : isCurrentMonth ? "text-foreground" : "text-muted-foreground/50"
      )}>
        {date.getDate()}
      </span>

      <div className="flex flex-col gap-0.5 overflow-hidden">
        {dayPosts.slice(0, maxVisible).map((post) => (
          <PostChip
            key={post.id}
            post={post}
            compact={view === "month"}
            onClick={() => onPostClick(post)}
          />
        ))}
      </div>

      {overflow > 0 && (
        <span className="text-[10px] text-muted-foreground font-medium mt-0.5 pl-0.5">
          +{overflow} more
        </span>
      )}
    </div>
  );
}

function PostDrawer({ post, onClose, onRefresh }: { post: Post; onClose: () => void; onRefresh: () => void }) {
  const isInstagram = !!post.instagramPostId || post.source === "upload";
  const [isPending, startTransition] = useTransition();

  const handlePostNow = () => {
    if (!confirm("Are you sure you want to publish this to Instagram immediately?")) return;
    
    startTransition(async () => {
      const result = await approveAndPost(post.id);
      if (result.success) {
        toast.success("Post published successfully!");
        onRefresh();
        onClose();
      } else {
        toast.error("Failed to publish", { description: result.error });
      }
    });
  };

  const handleDiscard = () => {
    if (!confirm("Are you sure you want to discard this post? This action cannot be undone.")) return;

    startTransition(async () => {
      const result = await deletePost(post.id);
      if (result.success) {
        toast.success("Post discarded.");
        onRefresh();
        onClose();
      } else {
        toast.error("Failed to discard post", { description: result.error });
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div
        className="relative w-full max-w-sm h-full bg-card border-l border-border flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            {isInstagram
              ? <Instagram size={16} className="text-orange-400" />
              : <Sparkles size={16} className="text-teal-400" />
            }
            <span className="text-sm font-bold text-foreground">
              {isInstagram ? "Instagram Post" : "Studio Post"}
            </span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Image */}
          {post.imageUrl && (
            <div className="rounded-xl overflow-hidden border border-border aspect-square w-full">
              <img src={post.imageUrl} alt="Post" className="w-full h-full object-cover" />
            </div>
          )}

          {/* Status + time */}
          <div className="flex items-center justify-between">
            <StatusBadge status={post.status} />
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock size={11} />
              {formatTime(post.scheduledFor)}
            </span>
          </div>

          {/* Scheduled date */}
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">Scheduled For</p>
            <p className="text-sm text-foreground">{formatFullDate(post.scheduledFor)}</p>
          </div>

          {/* Project */}
          {post.projectName && (
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">Project</p>
              <p className="text-sm text-foreground">{post.projectName}</p>
            </div>
          )}

          {/* Caption */}
          {post.caption && (
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">Caption</p>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{post.caption}</p>
            </div>
          )}

          {/* Hashtags */}
          {post.hashtags.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                <Tag size={10} /> Hashtags
              </p>
              <div className="flex flex-wrap gap-1.5">
                {post.hashtags.map((tag) => (
                  <span key={tag} className="text-[11px] px-2 py-0.5 rounded-full bg-accent/15 text-accent font-medium">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Instagram permalink */}
          {post.instagramPermalink && (
            <a
              href={post.instagramPermalink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-accent hover:underline"
            >
              <ExternalLink size={12} /> View on Instagram
            </a>
          )}
        </div>

        {/* Actions Footer */}
        {post.status !== "published" && (
          <div className="p-5 border-t border-border bg-muted/20 space-y-3">
            <button
              onClick={handlePostNow}
              disabled={isPending}
              className="w-full py-3 rounded-xl bg-accent text-accent-foreground font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-accent/20 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Post Now
            </button>
            <button
              onClick={handleDiscard}
              disabled={isPending}
              className="w-full py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] hover:bg-red-500/20 disabled:opacity-50"
            >
              {isPending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              Discard Post
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function PlannerClient() {
  const today = new Date();
  const [view, setView] = useState<ViewMode>("month");
  const [anchor, setAnchor] = useState(new Date(today));
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // ── Fetch posts for the visible range ────────────────────────────────────────

  const fetchPosts = useCallback(async (v: ViewMode, a: Date) => {
    setLoading(true);
    setError(null);
    try {
      const { start, end } = getVisibleRange(v, a);
      const res = await fetch(
        `/api/planner/posts?start=${start.toISOString()}&end=${end.toISOString()}`
      );
      if (!res.ok) throw new Error("Failed to load posts");
      const data = await res.json();
      setPosts(data.posts as Post[]);
    } catch (e: any) {
      setError(e.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts(view, anchor);
  }, [view, anchor, fetchPosts]);

  // ── Navigation ────────────────────────────────────────────────────────────────

  const navigate = (dir: -1 | 1) => {
    setAnchor((prev) => {
      const d = new Date(prev);
      if (view === "month") {
        d.setMonth(d.getMonth() + dir);
        d.setDate(1);
      } else {
        d.setDate(d.getDate() + dir * 7);
      }
      return d;
    });
  };

  const goToday = () => setAnchor(new Date());

  // ── Derived data ──────────────────────────────────────────────────────────────

  const days = useMemo(() =>
    view === "month"
      ? getMonthGrid(anchor.getFullYear(), anchor.getMonth())
      : getWeekDays(anchor),
    [view, anchor]
  );

  const currentLabel = useMemo(() => {
    if (view === "month") return `${MONTH_NAMES[anchor.getMonth()]} ${anchor.getFullYear()}`;
    const week = getWeekDays(anchor);
    const s = week[0], e = week[6];
    return s.getMonth() === e.getMonth()
      ? `${MONTH_NAMES[s.getMonth()]} ${s.getFullYear()}`
      : `${MONTH_NAMES[s.getMonth()]} – ${MONTH_NAMES[e.getMonth()]} ${e.getFullYear()}`;
  }, [view, anchor]);

  // Map ISO scheduledFor → day key (local date string)
  const postsByDay = useMemo(() => {
    const map = new Map<string, Post[]>();
    for (const post of posts) {
      const key = new Date(post.scheduledFor).toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(post);
    }
    for (const dayPosts of map.values()) {
      dayPosts.sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime());
    }
    return map;
  }, [posts]);

  const scheduled  = posts.filter((p) => p.status === "pending").length;
  const published  = posts.filter((p) => p.status === "published").length;

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="flex flex-col h-full min-h-screen bg-background">

        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Planner</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Plan your marketing calendar by creating, scheduling, and managing your content.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/upload" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 hover:bg-accent/20 text-accent text-xs font-semibold border border-accent/20 transition-all">
              <Upload size={13} /> Upload & Schedule
            </Link>
            <Link href="/projects/new" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent hover:bg-accent/90 text-accent-foreground text-xs font-semibold shadow-lg shadow-accent/20 transition-all">
              <Plus size={13} /> Create Project
            </Link>
          </div>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-3 border-b border-border flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            {/* Week / Month */}
            <div className="flex rounded-lg border border-border overflow-hidden text-xs font-semibold">
              {(["week", "month"] as ViewMode[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn(
                    "px-3 py-1.5 capitalize transition-colors",
                    view === v ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {v}
                </button>
              ))}
            </div>

            <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <ChevronLeft size={15} />
            </button>
            <button onClick={goToday} className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              Today
            </button>
            <button onClick={() => navigate(1)} className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <ChevronRight size={15} />
            </button>

            <span className="text-sm font-bold text-foreground ml-1">{currentLabel}</span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {loading
              ? <Loader2 size={13} className="animate-spin text-muted-foreground" />
              : (
                <button onClick={() => fetchPosts(view, anchor)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <RefreshCw size={13} />
                </button>
              )
            }
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-amber-400" />{scheduled} scheduled
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-green-400" />{published} published
            </span>
            <span className="px-2 py-1 rounded-lg bg-muted text-muted-foreground font-semibold">Content</span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-3 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <span>{error}</span>
            <button onClick={() => fetchPosts(view, anchor)} className="underline ml-auto">Retry</button>
          </div>
        )}

        {/* Calendar */}
        <div className="flex-1 overflow-auto">
          {/* Day label row */}
          <div className="grid grid-cols-7 border-b border-border bg-muted/20 sticky top-0 z-10">
            {(view === "week" ? DAY_LABELS_LONG : DAY_LABELS_SHORT).map((label, i) => (
              <div
                key={label}
                className={cn(
                  "py-2 text-center text-xs font-semibold border-r border-border last:border-r-0",
                  i === 0 || i === 6 ? "text-muted-foreground/60" : "text-muted-foreground"
                )}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className={cn("grid grid-cols-7", loading && "opacity-50 pointer-events-none")}>
            {days.map((day, idx) => (
              <DayCell
                key={idx}
                date={day}
                dayPosts={postsByDay.get(day.toDateString()) ?? []}
                isCurrentMonth={view === "week" ? true : day.getMonth() === anchor.getMonth()}
                isToday={isSameDay(day, today)}
                view={view}
                onPostClick={setSelectedPost}
              />
            ))}
          </div>
        </div>

        {/* Empty state (only when not loading and no posts) */}
        {!loading && posts.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center gap-4 py-16 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
              <CalendarDays size={24} className="text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">No posts scheduled this period</p>
              <p className="text-sm text-muted-foreground">Upload an image and schedule it, or create a project.</p>
            </div>
            <Link href="/upload" className="px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-semibold hover:bg-accent/90 transition-all">
              Schedule your first post
            </Link>
          </div>
        )}

        {/* Legend */}
        <div className="px-6 py-2.5 border-t border-border flex items-center gap-4 text-[10px] text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-2.5 rounded bg-orange-500/20 border border-orange-500/30" /> Instagram / Upload
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-2.5 rounded bg-teal-500/20 border border-teal-500/30" /> Studio Content
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> Pending
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400" /> Published
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400" /> Ready
          </span>
        </div>
      </div>

      {/* Post detail drawer */}
      {selectedPost && (
        <PostDrawer 
          post={selectedPost} 
          onClose={() => setSelectedPost(null)} 
          onRefresh={() => fetchPosts(view, anchor)}
        />
      )}
    </>
  );
}
