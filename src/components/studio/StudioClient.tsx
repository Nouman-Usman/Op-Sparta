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
  ChevronLeft,
  ShieldCheck,
  Send,
  Play,
  BarChart3,
  RefreshCw,
  Heart,
  MessageCircle,
  Eye,
  RefreshCcw,
  MoreVertical,
  Copy,
  Edit3,
  Check,
  X
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { approveAndPost } from "@/app/actions/publish";
import { triggerN8nGeneration, deletePost, regeneratePost, updatePostCaption } from "@/app/actions/projects";
import { syncPostMetrics } from "@/app/actions/analytics";
import { cn } from "@/lib/utils";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
  ContextMenuLabel,
} from "@/components/ui/context-menu";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [isEditing, setIsEditing] = useState(false);
  const [editedCaption, setEditedCaption] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [refinementPrompt, setRefinementPrompt] = useState("");
  const [confirmConfig, setConfirmConfig] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({ open: false, title: "", description: "", onConfirm: () => {} });
  const router = useRouter();

  const handleRegenerate = async (postId: string) => {
    setIsRefining(true);
  };

  const handleConfirmRegenerate = async () => {
    if (!selectedPost) return;
    setIsRefining(false);
    const prompt = refinementPrompt;
    setRefinementPrompt(""); 
    
    startTransition(async () => {
      const result = await regeneratePost(selectedPost.id, project.id, prompt);
      if (result.success) {
        toast.success("New variant initiated.");
        // The result now returns newPostId, but since initialPosts won't have it 
        // until the next poll/refresh, we'll let the polling handle the auto-focus
        // if we want, OR we can optimismically set it if we had the full object.
        // For now, let's just let the gallery update.
      } else {
        toast.error(result.error);
      }
    });
  };

  const navigatePost = (direction: 'prev' | 'next') => {
    const currentIndex = initialPosts.findIndex(p => p.id === selectedPost?.id);
    if (currentIndex === -1) return;
    
    let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex < 0) nextIndex = initialPosts.length - 1;
    if (nextIndex >= initialPosts.length) nextIndex = 0;
    
    setSelectedPost(initialPosts[nextIndex]);
  };

  const openConfirm = (title: string, description: string, onConfirm: () => void) => {
    setConfirmConfig({ open: true, title, description, onConfirm });
  };

  // Polling for highly-asynchronous N8N Webhooks
  useEffect(() => {
    const hasGeneratingPost = initialPosts.some(p => p.status === 'generating');
    if (hasGeneratingPost) {
      const interval = setInterval(() => {
        router.refresh();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [initialPosts, router]);

  useEffect(() => {
    if (selectedPost) {
      const freshPost = initialPosts.find(p => p.id === selectedPost.id);
      if (freshPost && freshPost.status !== selectedPost.status) {
         setSelectedPost(freshPost);
      }
      setEditedCaption(freshPost?.caption || selectedPost.caption || "");
    } else if (initialPosts.length > 0) {
      setSelectedPost(initialPosts[0]);
      setEditedCaption(initialPosts[0].caption || "");
    }
  }, [initialPosts, selectedPost?.id]);

  const handlePost = async (postId: string) => {
    openConfirm(
      "Approve & Publish",
      "Are you sure you want to approve this asset and publish it to Instagram? This action cannot be undone.",
      async () => {
        startTransition(async () => {
          const result = await approveAndPost(postId);
          if (result.success) toast.success("Signal published successfully!");
          else toast.error(result.error);
        });
      }
    );
  };

  const handleSaveCaption = async () => {
    if (!selectedPost) return;
    startTransition(async () => {
      const result = await updatePostCaption(selectedPost.id, editedCaption);
      if (result.success) {
        setIsEditing(false);
        toast.success("Caption updated.");
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleDelete = async (postId: string) => {
    openConfirm(
      "Delete Asset",
      "This will permanently remove the asset from your project. This action is irreversible.",
      async () => {
        startTransition(async () => {
          const result = await deletePost(postId);
          if (result.success) {
            if (selectedPost?.id === postId) setSelectedPost(null);
            toast.success("Asset deleted.");
          } else {
            toast.error(result.error);
          }
        });
      }
    );
  };

  const handleTriggerClick = () => {
    if (activeProviders.length > 1) setShowProviderSelect(true);
    else executeTrigger(activeProviders[0] || 'auto');
  };

  const handleSync = async (postId: string) => {
    startTransition(async () => {
      const result = await syncPostMetrics(postId);
      if (result.success) toast.success("Metrics synchronized.");
      else toast.error(result.error);
    });
  };

  const executeTrigger = async (provider: string) => {
    setShowProviderSelect(false);
    startTransition(async () => {
      const result = await triggerN8nGeneration(project.id, provider);
      if (result.success) {
        toast.success("Engine triggered successfully.");
      } else if (result.error === "MISSING_AI_KEY") {
        openConfirm(
          "Missing AI Key",
          "You need an active AI Provider Key to trigger generations. Go to Settings now?",
          () => { window.location.href = "/settings"; }
        );
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-accent selection:text-accent-foreground">
      {/* Studio Header: Mobile First */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl pt-6 pb-4 px-6 lg:pt-10 lg:pb-8 lg:px-12 transition-all">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4 lg:gap-8">
            <Link 
              href="/overview" 
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-muted hover:bg-zinc-800 transition-colors group"
            >
              <ArrowLeft size={20} className="text-zinc-500 group-hover:text-white transition-colors" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent font-display">Command Center</span>
                <span className="h-1 w-1 rounded-full bg-zinc-800" />
                <span className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest">{project.industry}</span>
              </div>
              <h1 className="text-3xl font-display font-extrabold tracking-tighter text-white sm:text-5xl lg:text-6xl truncate">
                {project.name}
              </h1>
            </div>
          </div>

          <button 
            onClick={handleTriggerClick}
            disabled={isPending}
            className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-accent px-8 py-4 font-black uppercase tracking-widest text-accent-foreground transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 lg:w-auto lg:py-5"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            {isPending ? <Loader2 className="animate-spin" /> : (
              <span className="relative z-10 flex items-center gap-3">
                <Zap size={18} fill="currentColor" /> Generate Assets
              </span>
            )}
          </button>
        </div>
        
        {initialPosts.some(p => p.status === 'generating') && (
          <div className="mt-6 flex items-center gap-3 bg-accent/5 border border-accent/10 px-4 py-2 rounded-xl w-fit animate-pulse">
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
            <span className="text-[9px] font-black text-accent uppercase tracking-[0.2em]">Neural Pipeline Active — Streaming Updates</span>
          </div>
        )}
      </header>

      <main className="px-6 pb-20 lg:px-12 lg:pb-32">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-4 lg:gap-16">
          {/* Post Gallery: 3 Columns on Desktop */}
          <div className="lg:col-span-3 space-y-12">
            {initialPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 lg:py-40 text-center bg-muted/30 rounded-[3rem] p-12">
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-accent/20 blur-3xl rounded-full" />
                  <div className="relative h-24 w-24 bg-card rounded-full flex items-center justify-center text-zinc-700">
                    <Sparkles size={48} />
                  </div>
                </div>
                <h3 className="text-2xl font-display font-bold text-white mb-3">Void Detected</h3>
                <p className="text-zinc-500 max-w-sm mx-auto text-sm leading-relaxed font-medium">
                  The content engine is idle. Trigger the Spartan Protocol to generate premium assets.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                {initialPosts.map((post) => (
                  <ContextMenu key={post.id}>
                    <ContextMenuTrigger>
                      <div 
                        onClick={() => setSelectedPost(post)}
                        className={cn(
                          "group relative aspect-[4/5] overflow-hidden rounded-[2.5rem] bg-card transition-all cursor-pointer",
                          selectedPost?.id === post.id 
                            ? "ring-4 ring-accent ring-offset-8 ring-offset-background" 
                            : "hover:bg-muted transition-colors"
                        )}
                      >
                        {post.status === 'generating' ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-card">
                            <div className="h-12 w-12 rounded-2xl bg-accent/10 flex items-center justify-center mb-6">
                              <Loader2 size={24} className="text-accent animate-spin" />
                            </div>
                            <div className="text-lg font-display font-bold text-white mb-1.5 uppercase tracking-tighter italic">Synthesizing...</div>
                            <div className="text-[10px] text-zinc-600 uppercase tracking-widest font-black">Neural Core Process</div>
                          </div>
                        ) : post.videoUrl ? (
                          <div className="absolute inset-0">
                            <video 
                              src={post.videoUrl} 
                              autoPlay 
                              muted 
                              loop 
                              playsInline
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                            />
                            <div className="absolute top-6 right-6 w-10 h-10 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center border border-white/10">
                              <Play size={14} fill="white" className="text-white ml-0.5" />
                            </div>
                          </div>
                        ) : post.imageUrl ? (
                          <Image 
                            src={post.imageUrl} 
                            alt="Post preview" 
                            fill 
                            className="object-cover group-hover:scale-110 transition-transform duration-1000"
                          />
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-card">
                            <div className="h-12 w-12 rounded-2xl bg-zinc-800 flex items-center justify-center mb-6">
                              <Sparkles size={24} className="text-zinc-600" />
                            </div>
                            <div className="text-sm font-display font-bold text-zinc-500 mb-1.5 uppercase tracking-tighter italic">No Asset Data</div>
                            <div className="text-[10px] text-zinc-700 uppercase tracking-widest font-black">Waiting for Synthesis</div>
                          </div>
                        )}
                        
                        {/* Minimal Status Overlay */}
                        <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-background via-background/20 to-transparent">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "h-2 w-2 rounded-full",
                              post.status === 'published' ? "bg-emerald-500" : 
                              post.status === 'generating' ? "bg-accent animate-ping" : "bg-amber-500"
                            )} />
                            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{post.status}</span>
                          </div>
                        </div>
                      </div>
                    </ContextMenuTrigger>
                    
                    <ContextMenuContent className="w-64">
                      <ContextMenuLabel>Signal Actions</ContextMenuLabel>
                      <ContextMenuItem onClick={() => setSelectedPost(post)}>
                        Select Asset
                      </ContextMenuItem>
                      
                      {post.status === 'published' && post.instagramPermalink && (
                        <ContextMenuItem onClick={() => window.open(post.instagramPermalink!, '_blank')}>
                          <Instagram size={14} className="mr-2" /> View Live
                        </ContextMenuItem>
                      )}

                      {post.status !== 'published' && post.status !== 'generating' && (
                        <ContextMenuItem onClick={() => handlePost(post.id)}>
                          <Send size={14} className="mr-2" /> Approve & Post
                        </ContextMenuItem>
                      )}

                      {post.status === 'published' && (
                        <ContextMenuItem onClick={() => handleSync(post.id)}>
                          <RefreshCw size={14} className="mr-2" /> Sync Metrics
                        </ContextMenuItem>
                      )}

                      <ContextMenuItem onClick={() => {
                        setSelectedPost(post);
                        setIsEditing(true);
                      }}>
                        <Edit3 size={14} className="mr-2" /> Edit Caption
                      </ContextMenuItem>

                      <ContextMenuItem onClick={() => {
                        navigator.clipboard.writeText(post.caption || "");
                        toast.success("Caption copied to clipboard.");
                      }}>
                        <Copy size={14} className="mr-2" /> Copy Caption
                      </ContextMenuItem>

                      <ContextMenuSeparator />
                      
                      <ContextMenuItem onClick={() => handleRegenerate(post.id)}>
                        <RefreshCcw size={14} className="mr-2 text-amber-500" /> 
                        <span className="text-amber-500">Regenerate Asset</span>
                      </ContextMenuItem>

                      <ContextMenuItem 
                        onClick={() => handleDelete(post.id)}
                        className="text-rose-500 focus:bg-rose-500/10 focus:text-rose-500"
                      >
                        <Trash2 size={14} className="mr-2" /> Delete Asset
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                ))}
              </div>
            )}
          </div>

          {/* Asset Details Sidebar: 1 Column on Desktop */}
          <aside className="space-y-8">
            {selectedPost ? (
              <div className="lg:sticky lg:top-48 space-y-8">
                <div className="bg-card rounded-[2.5rem] p-8 lg:p-10 space-y-10">
                  {/* Asset Swipe Preview */}
                  <div className="relative aspect-square w-full overflow-hidden rounded-[2.5rem] bg-muted group">
                    {selectedPost.status === 'generating' ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center bg-zinc-900/50 backdrop-blur-sm">
                        <div className="h-16 w-16 rounded-3xl bg-accent/10 flex items-center justify-center mb-8">
                          <Loader2 size={32} className="text-accent animate-spin" />
                        </div>
                        <h3 className="text-2xl font-display font-bold text-white mb-2 uppercase tracking-tighter italic">Neural Synthesis</h3>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-[0.3em] font-black">Refining Signal Parameters</p>
                      </div>
                    ) : selectedPost.videoUrl ? (
                      <video 
                        key={selectedPost.videoUrl}
                        src={selectedPost.videoUrl} 
                        autoPlay 
                        muted 
                        loop 
                        playsInline
                        className="h-full w-full object-cover transition-all duration-700" 
                      />
                    ) : selectedPost.imageUrl ? (
                      <Image 
                        key={selectedPost.imageUrl}
                        src={selectedPost.imageUrl} 
                        alt="Preview" 
                        fill 
                        className="object-cover transition-all duration-700" 
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
                         <Sparkles size={48} className="text-zinc-800 mb-6" />
                         <p className="text-sm text-zinc-500 font-medium">Awaiting primary asset data...</p>
                      </div>
                    )}

                    {/* Desktop Navigation Chevrons */}
                    <div className="absolute inset-y-0 left-4 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); navigatePost('prev'); }}
                        className="h-10 w-10 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-accent hover:text-accent-foreground transition-all"
                      >
                        <ChevronLeft size={18} />
                      </button>
                    </div>
                    <div className="absolute inset-y-0 right-4 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); navigatePost('next'); }}
                        className="h-10 w-10 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-accent hover:text-accent-foreground transition-all"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>

                    {/* Pagination Indicators */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/20 backdrop-blur-md border border-white/5">
                      {initialPosts.map((p, i) => (
                        <div 
                          key={p.id}
                          className={cn(
                            "h-1 rounded-full transition-all duration-500",
                            p.id === selectedPost.id ? "w-4 bg-accent" : "w-1 bg-white/20"
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Master Caption</label>
                      <div className="flex items-center gap-3">
                        {isEditing ? (
                          <>
                            <button 
                              onClick={handleSaveCaption}
                              disabled={isPending}
                              className="text-[10px] font-black text-accent uppercase tracking-widest hover:opacity-70 transition-opacity flex items-center gap-1"
                            >
                              <Check size={12} /> Save
                            </button>
                            <button 
                              onClick={() => {
                                setIsEditing(false);
                                setEditedCaption(selectedPost.caption || "");
                              }}
                              className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:opacity-70 transition-opacity flex items-center gap-1"
                            >
                              <X size={12} /> Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              onClick={() => setIsEditing(true)}
                              className="text-[10px] font-black text-accent uppercase tracking-widest hover:opacity-70 transition-opacity flex items-center gap-1"
                            >
                              <Edit3 size={12} /> Edit
                            </button>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(selectedPost.caption || "");
                                alert("Caption copied!");
                              }}
                              className="text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:opacity-70 transition-opacity"
                            >
                              Copy
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-base text-zinc-300 font-medium leading-relaxed selection:bg-accent/30">
                      {selectedPost.status === 'generating' ? (
                        <div className="space-y-2 animate-pulse">
                          <div className="h-4 bg-zinc-800 rounded w-full" />
                          <div className="h-4 bg-zinc-800 rounded w-3/4" />
                        </div>
                      ) : isEditing ? (
                        <textarea 
                          value={editedCaption}
                          onChange={(e) => setEditedCaption(e.target.value)}
                          className="w-full bg-muted/50 border border-white/5 rounded-2xl p-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent/50 min-h-[120px] resize-none"
                          placeholder="Refine your narrative..."
                        />
                      ) : (
                        <p className="italic">&quot;{selectedPost.caption}&quot;</p>
                      )}
                    </div>
                  </div>

                  {selectedPost.status === 'published' && (
                    <div className="space-y-6 pt-6 border-t border-white/5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Core Metrics</h4>
                        <button onClick={() => handleSync(selectedPost.id)} className="text-zinc-500 hover:text-white transition-colors">
                          <RefreshCw size={14} className={isPending ? "animate-spin" : ""} />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { icon: Heart, value: selectedPost.metrics?.likes || 0, label: "Likes", color: "text-rose-500" },
                          { icon: MessageCircle, value: selectedPost.metrics?.comments || 0, label: "Chatter", color: "text-sky-500" },
                          { icon: Eye, value: selectedPost.metrics?.reach || 0, label: "Reach", color: "text-emerald-500" },
                          { icon: BarChart3, value: selectedPost.metrics?.engagement || 0, label: "Engagement", color: "text-accent" },
                        ].map((m, i) => (
                          <div key={i} className="bg-muted p-5 rounded-3xl group hover:bg-zinc-800 transition-colors">
                            <m.icon size={16} className={cn(m.color, "mb-3 group-hover:scale-110 transition-transform")} />
                            <div className="text-xl font-display font-black text-white">{m.value.toLocaleString()}</div>
                            <div className="text-[8px] text-zinc-600 uppercase font-black tracking-widest">{m.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 space-y-3">
                    <button 
                      onClick={() => handlePost(selectedPost.id)}
                      disabled={isPending || selectedPost.status === 'published' || selectedPost.status === 'generating'}
                      className={cn(
                        "w-full flex items-center justify-center gap-3 rounded-2xl py-5 text-sm font-black uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-50",
                        selectedPost.status === 'published' 
                          ? "bg-emerald-500/10 text-emerald-500" 
                          : "bg-white text-black hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      {isPending ? <Loader2 className="animate-spin" /> : (
                        <span className="flex items-center gap-3">
                          {selectedPost.status === 'published' ? <CheckCircle2 size={18}/> : <Send size={18} />}
                          {selectedPost.status === 'published' ? "Published" : "Approve & Post"}
                        </span>
                      )}
                    </button>

                    {selectedPost.status === 'published' && selectedPost.instagramPermalink && (
                      <a 
                        href={selectedPost.instagramPermalink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-3 rounded-2xl py-4 text-[10px] font-black uppercase tracking-widest border border-white/5 hover:bg-white/5 transition-all"
                      >
                        <Instagram size={14} /> View Signal Live
                      </a>
                    )}
                  </div>
                </div>

                {/* Meta Badge */}
                <div className="bg-muted rounded-[2rem] p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-card rounded-full flex items-center justify-center border border-white/5">
                      <Instagram size={20} className="text-zinc-400" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-white uppercase tracking-widest">Instagram API</div>
                      <div className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest">Operational</div>
                    </div>
                  </div>
                  <ShieldCheck size={20} className="text-zinc-800" />
                </div>
              </div>
            ) : (
              <div className="bg-card rounded-[2.5rem] p-12 text-center border border-dashed border-white/5">
                <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                  <ShieldCheck size={24} className="text-zinc-700" />
                </div>
                <p className="text-xs text-zinc-600 font-bold uppercase tracking-widest leading-loose">Select a signal to<br/>view its composition</p>
              </div>
            )}
          </aside>
        </div>
      </main>

      {/* Engine Selection Modal */}
      {showProviderSelect && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 lg:p-12">
          <div className="absolute inset-0 bg-background/90 backdrop-blur-3xl" onClick={() => setShowProviderSelect(false)} />
          <div className="relative bg-card border border-white/5 rounded-[3rem] w-full max-w-xl p-10 lg:p-16 shadow-2xl animate-in zoom-in-95 duration-500 overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
              <Zap size={300} fill="white" />
            </div>
            
            <div className="relative z-10">
              <h2 className="text-3xl font-display font-black text-white mb-3 tracking-tighter uppercase italic">Select Engine</h2>
              <p className="text-zinc-500 text-sm font-medium mb-12 max-w-xs leading-relaxed">
                Multiple neural pathways are active. Route this generation to your preferred core.
              </p>
              
              <div className="space-y-4">
                {activeProviders?.map(provider => (
                  <button 
                    key={provider}
                    onClick={() => executeTrigger(provider)}
                    className="w-full flex items-center justify-between p-6 rounded-3xl bg-muted hover:bg-accent group transition-all"
                  >
                    <div className="flex items-center gap-5">
                      <div className="h-12 w-12 rounded-2xl bg-card flex items-center justify-center group-hover:scale-90 transition-transform">
                        <Sparkles size={20} className="text-accent group-hover:text-accent-foreground" />
                      </div>
                      <div className="text-left">
                        <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] group-hover:text-accent-foreground/60 transition-colors">Neural Core</div>
                        <div className="text-lg font-display font-black text-white uppercase tracking-tighter group-hover:text-accent-foreground transition-colors">
                          {provider === 'google' ? 'Google Gemini' : provider === 'openai' ? 'OpenAI GPT' : provider}
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={24} className="text-zinc-700 group-hover:text-accent-foreground group-hover:translate-x-2 transition-all" />
                  </button>
                ))}
              </div>
              
              <button 
                onClick={() => setShowProviderSelect(false)}
                className="w-full mt-10 text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] hover:text-white transition-colors"
              >
                Decline Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refinement Dialog */}
      <AlertDialog open={isRefining} onOpenChange={setIsRefining}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Refine Signal</AlertDialogTitle>
            <AlertDialogDescription>
              What changes do you want to see in this asset? Your refinement prompt will be sent to the synthesis engine.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <textarea
              value={refinementPrompt}
              onChange={(e) => setRefinementPrompt(e.target.value)}
              className="w-full bg-muted/50 border border-white/5 rounded-2xl p-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent/50 min-h-[120px] resize-none"
              placeholder="e.g. Make it more vibrant, add a neon glow, or change the background to a futuristic city..."
              autoFocus
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRefinementPrompt("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRegenerate}>
              Trigger Regeneration
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation Dialog */}
      <AlertDialog 
        open={confirmConfig.open} 
        onOpenChange={(open) => setConfirmConfig(prev => ({ ...prev, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmConfig.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmConfig.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              confirmConfig.onConfirm();
              setConfirmConfig(prev => ({ ...prev, open: false }));
            }}>
              Confirm Action
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
