"use client";

import { useState, useTransition } from "react";
import { 
  Instagram, 
  CheckCircle2, 
  Clock, 
  Zap, 
  Sparkles,
  ArrowLeft,
  Loader2,
  Trash2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Send
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { approveAndPost } from "@/app/actions/publish";
import { triggerN8nGeneration } from "@/app/actions/projects";
import { cn } from "@/lib/utils";

export default function StudioClient({ 
  project, 
  initialPosts 
}: { 
  project: any, 
  initialPosts: any[] 
}) {
  const [isPending, startTransition] = useTransition();
  const [selectedPost, setSelectedPost] = useState<any>(initialPosts[0] || null);

  const handlePost = async (postId: string) => {
    if (!confirm("Approve and publish this post to Instagram?")) return;
    
    startTransition(async () => {
      const result = await approveAndPost(postId);
      if (result.success) {
        alert("Published successfully!");
      } else {
        alert(result.error);
      }
    });
  };

  const handleTrigger = async () => {
    startTransition(async () => {
      const result = await triggerN8nGeneration(project.id);
      if (result.success) {
        alert("Generation engine started! Assets will appear shortly.");
      } else {
        alert(result.error);
      }
    });
  };

  return (
    <div className="p-8 space-y-10">
      {/* Studio Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <Link href="/overview" className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 hover:bg-white/10 transition-all">
            <ArrowLeft size={20} className="text-zinc-400" />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">SaaS Content Studio</span>
              <span className="text-[10px] text-zinc-600">ID: {project.id.slice(0, 8)}</span>
            </div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
              {project.name}
              <div className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-bold text-zinc-500 uppercase">
                {project.industry}
              </div>
            </h1>
          </div>
        </div>

        <button 
          onClick={handleTrigger}
          disabled={isPending}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-600/20 active:scale-[0.98] disabled:opacity-50"
        >
          {isPending ? <Loader2 className="animate-spin" /> : <><Zap size={20} fill="white" /> Trigger n8n Engine</>}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* Post Gallery */}
        <div className="lg:col-span-3 space-y-8">
           {initialPosts.length === 0 ? (
             <div className="glass-dark border border-dashed border-white/10 rounded-[3rem] p-20 text-center">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-zinc-700">
                    <Sparkles size={40} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No generations yet</h3>
                <p className="text-zinc-500 max-w-sm mx-auto">Trigger the engine above to start generating high-engagement assets for your project.</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {initialPosts.map((post) => (
                   <div 
                     key={post.id} 
                     onClick={() => setSelectedPost(post)}
                     className={cn(
                       "group relative aspect-square rounded-[2.5rem] overflow-hidden border-2 transition-all cursor-pointer",
                       selectedPost?.id === post.id ? "border-accent shadow-2xl shadow-accent/20" : "border-white/5 hover:border-white/20"
                     )}
                   >
                     <Image 
                       src={post.imageUrl} 
                       alt="Post preview" 
                       fill 
                       className="object-cover group-hover:scale-105 transition-transform duration-700"
                     />
                     <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className={cn("w-2 h-2 rounded-full", post.status === 'published' ? "bg-emerald-500" : "bg-amber-500 animate-pulse")} />
                                <span className="text-[10px] font-bold text-white uppercase tracking-widest">{post.status}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] font-black text-white/50">
                                <ShieldCheck size={12} className="text-accent" />
                                {post.supervisionScore}%
                            </div>
                        </div>
                     </div>
                     
                     {post.status === 'published' && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                            <CheckCircle2 size={48} className="text-emerald-500" />
                        </div>
                     )}
                   </div>
                ))}
             </div>
           )}
        </div>

        {/* Supervision Sidebar (Selected Post Detail) */}
        <div className="space-y-6">
          {selectedPost ? (
            <div className="glass-dark border border-white/5 p-8 rounded-[2.5rem] space-y-8 sticky top-8">
                <div>
                   <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <ShieldCheck size={14} className="text-accent" />
                      AI Inspection Layer
                   </h3>
                   <div className="flex items-center gap-3">
                      <div className="text-4xl font-black text-white">{selectedPost.supervisionScore}</div>
                      <div className="text-[10px] text-zinc-500 uppercase tracking-tighter leading-none font-bold">
                         AI Approval<br/>Score Verified
                      </div>
                   </div>
                </div>

                <div className="space-y-4">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Optimized Caption</label>
                    <div className="text-sm text-zinc-400 bg-white/5 border border-white/5 rounded-2xl p-4 italic font-medium leading-relaxed">
                        &quot;{selectedPost.caption}&quot;
                    </div>
                </div>

                <div className="space-y-3">
                   <button 
                     onClick={() => handlePost(selectedPost.id)}
                     disabled={isPending || selectedPost.status === 'published'}
                     className={cn(
                       "w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50",
                       selectedPost.status === 'published' 
                         ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                         : "bg-white text-black hover:bg-zinc-200"
                     )}
                   >
                     {isPending ? <Loader2 className="animate-spin" /> : (
                       <>
                         {selectedPost.status === 'published' ? <><CheckCircle2 size={18}/> Live on Instagram</> : <><Send size={18} /> Approve & Post</>}
                       </>
                     )}
                   </button>
                   
                   {selectedPost.status === 'published' && selectedPost.instagramPostId && (
                     <a 
                       href={`#`} 
                       className="w-full py-3 rounded-2xl border border-white/5 text-[10px] font-bold text-zinc-500 uppercase flex items-center justify-center gap-2 hover:bg-white/5 transition-all"
                     >
                        View External Post <ExternalLink size={12} />
                     </a>
                   )}
                </div>
            </div>
          ) : (
            <div className="glass-dark border border-white/5 p-8 rounded-[2.5rem] text-center py-20">
                <ShieldCheck size={32} className="text-zinc-800 mx-auto mb-4" />
                <p className="text-xs text-zinc-600 italic">Select an asset to view supervision analysis.</p>
            </div>
          )}

          <div className="p-8 rounded-[2.5rem] bg-pink-600/5 border border-pink-600/10">
             <h4 className="text-white font-bold text-sm mb-2 flex items-center gap-2">
                <Instagram size={16} className="text-pink-500" />
                Auto-Publish Status
             </h4>
             <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Connected to backend</p>
          </div>
        </div>
      </div>
    </div>
  );
}
