"use client";

import { useState } from "react";
import { 
  Sparkles, 
  CheckCircle2, 
  RefreshCcw, 
  Edit3, 
  Trash2, 
  Calendar,
  Instagram,
  Info,
  ChevronRight,
  Zap,
  Loader2
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

const mockPosts = [
  {
    id: 1,
    type: "Educational",
    caption: "Did you know that consistent skincare routines can improve skin barrier function by 40%? 🧴✨ Our Aura Serum is designed to strengthen and glow. #SkincareTips #AuraGlow",
    image: "https://images.unsplash.com/photo-1594125354979-0842429f3477?auto=format&fit=crop&q=80&w=600&h=600",
    status: "pending",
    score: 92,
  },
  {
    id: 2,
    type: "Promotional",
    caption: "Unlock your best skin yet. 🌟 For a limited time, get 20% off our bestsellers. Use code GLOW20 at checkout. Link in bio! #SkinCareSale #LimitedOffer",
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=600&h=600",
    status: "approved",
    score: 88,
  },
  {
    id: 3,
    type: "Lifestyle",
    caption: "Morning routines made simple. ☕️🪞 Start your day with Aura and feel the difference. #MorningVibes #BrandRoutine",
    image: "https://images.unsplash.com/photo-1512413316925-fd25091c895c?auto=format&fit=crop&q=80&w=600&h=600",
    status: "pending",
    score: 95,
  }
];

export default function StudioPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [posts, setPosts] = useState(mockPosts);
  const [activeTab, setActiveTab] = useState("all");

  const generateNewBatch = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
    }, 3000);
  };

  const handleApprove = (id: number) => {
    setPosts(posts.map(p => p.id === id ? { ...p, status: 'approved' } : p));
  };

  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[10px] font-bold uppercase tracking-wider border border-accent/20">
              Aura Skincare
            </span>
            <span className="text-muted-foreground text-sm">•</span>
            <span className="text-muted-foreground text-sm">March Batch</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white">Content Studio</h1>
        </div>

        <button 
          onClick={generateNewBatch}
          disabled={isGenerating}
          className="flex items-center gap-2 bg-gradient-to-r from-accent to-indigo-600 hover:opacity-90 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-xl shadow-accent/20 active:scale-[0.98] disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              AI Generating...
            </>
          ) : (
            <>
              <Sparkles size={20} />
              Regenerate Batch
            </>
          )}
        </button>
      </header>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: "AI Quality Score", value: "92/100", icon: Zap, color: "text-amber-500" },
          { label: "Posts Generated", value: "12", icon: Sparkles, color: "text-accent" },
          { label: "Approved", value: "8", icon: CheckCircle2, color: "text-emerald-500" },
          { label: "Scheduled", value: "5", icon: Calendar, color: "text-blue-500" },
        ].map((stat, i) => (
          <div key={i} className="glass-dark p-4 rounded-2xl border border-border flex flex-col gap-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</span>
              <stat.icon size={14} className={stat.color} />
            </div>
            <span className="text-xl font-bold text-white">{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Tabs & Filters */}
      <div className="flex items-center justify-between gap-4 mb-8 border-b border-border">
        <div className="flex gap-8">
          {["All", "Pending", "Approved"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={cn(
                "pb-4 text-sm font-medium transition-all relative",
                activeTab === tab.toLowerCase() ? "text-accent" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab}
              {activeTab === tab.toLowerCase() && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-accent rounded-full shadow-[0_0_10px_rgba(var(--accent),0.5)]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {posts
          .filter(p => activeTab === 'all' || p.status === activeTab)
          .map((post) => (
          <div key={post.id} className="group glass-dark rounded-3xl border border-border overflow-hidden flex flex-col md:flex-row shadow-2xl transition-all hover:border-accent/20">
            {/* Visual Section */}
            <div className="md:w-2/5 relative aspect-square md:aspect-auto">
              <Image 
                src={post.image} 
                alt="Generated Visual" 
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                <button className="w-full bg-white/10 backdrop-blur-md border border-white/20 text-white py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 hover:bg-white/20 transition-all">
                  <Edit3 size={14} />
                  Change Visual
                </button>
              </div>
              <div className="absolute top-3 left-3">
                <div className="px-2 py-1 rounded-lg bg-black/50 backdrop-blur-md border border-white/10 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-tight">AI Scored: {post.score}%</span>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="md:w-3/5 p-6 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-accent uppercase tracking-widest">{post.type}</span>
                <div className="flex items-center gap-1 text-muted-foreground">
                   <Instagram size={14} />
                   <span className="text-[10px] font-medium">Reels/Post</span>
                </div>
              </div>

              <div className="flex-1 mb-6">
                <p className="text-white/90 leading-relaxed text-sm italic">
                  &quot;{post.caption}&quot;
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-3 pt-6 border-t border-border">
                <div className="flex items-center gap-2">
                  <button className="p-2 text-muted-foreground hover:text-white transition-colors" title="Edit Caption">
                    <Edit3 size={18} />
                  </button>
                   <button className="p-2 text-muted-foreground hover:text-red-500 transition-colors" title="Delete">
                    <Trash2 size={18} />
                  </button>
                   <button className="p-2 text-muted-foreground hover:text-accent transition-colors" title="Regenerate">
                    <RefreshCcw size={18} />
                  </button>
                </div>

                {post.status === 'approved' ? (
                   <div className="flex items-center gap-2 text-emerald-500 bg-emerald-500/10 px-4 py-2 rounded-xl text-sm font-bold border border-emerald-500/20">
                     <CheckCircle2 size={16} />
                     Approved
                   </div>
                ) : (
                  <button 
                    onClick={() => handleApprove(post.id)}
                    className="bg-white text-black px-5 py-2 rounded-xl text-sm font-bold hover:bg-zinc-200 transition-all flex items-center gap-2 shadow-lg"
                  >
                    Approve Post
                    <ChevronRight size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info helper */}
      <div className="mt-16 p-8 rounded-3xl bg-muted/20 border border-border/50 flex flex-col md:flex-row items-center gap-6">
        <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
          <Info className="text-accent" size={28} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Supervision Layer Active</h3>
          <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
            Our AI has automatically discarded 4 low-quality variants of these posts before showing them to you. 
            The current selection meets your brand&apos;s tone of voice and visual standards.
          </p>
        </div>
        <button className="ml-auto flex items-center gap-2 text-accent font-semibold hover:underline">
          View Logs <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
