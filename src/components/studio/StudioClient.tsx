"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  Send,
  Play,
  BarChart3,
  RefreshCw,
  Heart,
  MessageCircle,
  Eye
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { approveAndPost } from "@/app/actions/publish";
import { triggerN8nGeneration } from "@/app/actions/projects";
import { syncPostMetrics } from "@/app/actions/analytics";
import { cn } from "@/lib/utils";

export default function StudioClient({ 
  project, 
  initialPosts,
  activeProviders = []
}: { 
  project: any, 
  initialPosts: any[],
  activeProviders?: string[]
}) {
  const [showProviderSelect, setShowProviderSelect] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [selectedPost, setSelectedPost] = useState<any>(initialPosts[0] || null);
  const router = useRouter();

  // Polling architecture for highly-asynchronous N8N Webhooks
  useEffect(() => {
    const hasGeneratingPost = initialPosts.some(p => p.status === 'generating');
    
    if (hasGeneratingPost) {
      const interval = setInterval(() => {
        router.refresh();
      }, 3000); // Check database strictly every 3 seconds
      
      return () => clearInterval(interval);
    }
  }, [initialPosts, router]);

  // Sync selectedPost gracefully when data fundamentally mutates
  useEffect(() => {
    if (selectedPost) {
      const freshPost = initialPosts.find(p => p.id === selectedPost.id);
      if (freshPost && freshPost.status !== selectedPost.status) {
         setSelectedPost(freshPost);
      }
    } else if (initialPosts.length > 0) {
      setSelectedPost(initialPosts[0]);
    }
  }, [initialPosts]);

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

  const handleTriggerClick = () => {
    if (activeProviders.length > 1) {
      setShowProviderSelect(true);
    } else {
      executeTrigger(activeProviders[0] || 'auto');
    }
  };

  const handleSync = async (postId: string) => {
    startTransition(async () => {
      const result = await syncPostMetrics(postId);
      if (result.success) {
        // router.refresh() is already handled by our polling and revalidatePath logic
      } else {
        alert(result.error);
      }
    });
  };

  const executeTrigger = async (provider: string) => {
    setShowProviderSelect(false);
    startTransition(async () => {
      const result = await triggerN8nGeneration(project.id, provider);
      if (result.success) {
        alert("Generation engine started! Assets will appear shortly.");
      } else if (result.error === "MISSING_AI_KEY") {
        if (confirm("You need an active AI Provider Key to trigger generations. Go to Settings now?")) {
          window.location.href = "/settings";
        }
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
          onClick={handleTriggerClick}
          disabled={isPending}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-600/20 active:scale-[0.98] disabled:opacity-50"
        >
          {isPending ? <Loader2 className="animate-spin" /> : <><Zap size={20} fill="white" /> Trigger n8n Engine</>}
        </button>
      </div>

      {initialPosts.some(p => p.status === 'generating') && (
        <div className="flex items-center gap-3 bg-accent/10 border border-accent/20 px-4 py-2 rounded-xl w-fit animate-pulse">
          <div className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
          <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Live: Generation in Progress — Studio Auto-Syncing</span>
        </div>
      )}

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
                     {post.status === 'generating' ? (
                       <div className="absolute inset-0 bg-white/5 flex flex-col items-center justify-center p-6 text-center">
                          <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-accent/10 to-transparent pointer-events-none" />
                          <Loader2 size={32} className="text-accent animate-spin mb-4" />
                          <div className="text-sm font-bold text-white mb-1">Synthesizing...</div>
                          <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">AI Pipeline Processing</div>
                       </div>
                     ) : post.videoUrl ? (
                        <div className="absolute inset-0 bg-black">
                            <video 
                              src={post.videoUrl} 
                              autoPlay 
                              muted 
                              loop 
                              playsInline
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                            />
                            <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/10">
                                <Play size={12} fill="white" className="text-white ml-0.5" />
                            </div>
                        </div>
                     ) : (
                       <Image 
                         src={post.imageUrl || ""} 
                         alt="Post preview" 
                         fill 
                         className="object-cover group-hover:scale-105 transition-transform duration-700"
                       />
                     )}
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
                        {selectedPost.status === 'generating' ? (
                           <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin text-accent"/> Parsing creative intent...</span>
                        ) : (
                           <>&quot;{selectedPost.caption}&quot;</>
                        )}
                    </div>
                </div>

                {selectedPost.status === 'published' && (
                   <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
                      <div className="flex items-center justify-between">
                         <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Real-time Performance</h4>
                         <button 
                           onClick={() => handleSync(selectedPost.id)}
                           disabled={isPending}
                           className="text-accent hover:text-accent/80 transition-colors"
                         >
                            {isPending ? <RefreshCw size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                         </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                         {[
                           { icon: Heart, value: selectedPost.metrics?.likes || 0, label: "Likes", color: "text-pink-500" },
                           { icon: MessageCircle, value: selectedPost.metrics?.comments || 0, label: "Comments", color: "text-blue-500" },
                           { icon: Eye, value: selectedPost.metrics?.reach || 0, label: "Reach", color: "text-emerald-500" },
                           { icon: BarChart3, value: selectedPost.metrics?.engagement || 0, label: "Engagement", color: "text-indigo-500" },
                         ].map((m, i) => (
                           <div key={i} className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                              <div className="flex items-center gap-2 mb-1">
                                 <m.icon size={12} className={m.color} />
                                 <span className="text-[10px] font-bold text-white">{m.value.toLocaleString()}</span>
                              </div>
                              <div className="text-[8px] text-zinc-600 uppercase font-black tracking-widest">{m.label}</div>
                           </div>
                         ))}
                      </div>
                   </div>
                )}

                <div className="space-y-3">
                   <button 
                     onClick={() => handlePost(selectedPost.id)}
                     disabled={isPending || selectedPost.status === 'published' || selectedPost.status === 'generating'}
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

      {/* Provider Routing Selection Modal */}
      {showProviderSelect && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-dark border border-white/10 p-10 rounded-[2.5rem] w-full max-w-md space-y-6 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
              <Zap size={180} />
            </div>
            
            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-white mb-2">Select Engine</h2>
              <p className="text-sm text-zinc-400 mb-8 max-w-[260px]">Multiple providers are currently active. Which pipeline should drive this generation?</p>
              
              <div className="space-y-3">
                {activeProviders?.map(provider => (
                  <button 
                    key={provider}
                    onClick={() => executeTrigger(provider)}
                    className="w-full flex items-center justify-between p-5 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-accent hover:shadow-[0_0_20px_rgba(var(--accent),0.1)] transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center border border-white/10 group-hover:border-accent/30 transition-colors">
                        <Sparkles size={14} className="text-zinc-400 group-hover:text-accent transition-colors" />
                      </div>
                      <span className="font-bold text-white uppercase tracking-widest text-xs">
                        {provider === 'google' ? 'Google Gemini' : provider}
                      </span>
                    </div>
                    <ChevronRight size={16} className="text-zinc-500 group-hover:text-accent group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
              
              <button 
                onClick={() => setShowProviderSelect(false)}
                className="w-full mt-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
