"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Search,
  Grid3X3,
  List,
  Play,
  Image as ImageIcon,
  Download,
  Trash2,
  Expand,
  Sparkles,
  Upload,
  Package,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Asset, deleteAsset } from "@/app/actions/assets";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
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

interface AssetsClientProps {
  initialAssets: Asset[];
}

export function AssetsClient({ initialAssets }: AssetsClientProps) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const filteredAssets = initialAssets.filter((asset) => {
    const matchesFilter = 
      filter === "all" || 
      (filter === "post" && asset.source === "post") ||
      (filter === "upload" && asset.source === "upload") ||
      (filter === "project" && asset.source === "project");
    
    const matchesSearch = 
      search === "" || 
      asset.metadata?.caption?.toLowerCase().includes(search.toLowerCase()) ||
      asset.metadata?.projectName?.toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const openLightbox = useCallback((index: number) => setLightboxIndex(index), []);
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const lightboxPrev = useCallback(() =>
    setLightboxIndex((i) => (i !== null ? (i - 1 + filteredAssets.length) % filteredAssets.length : null)), [filteredAssets.length]);
  const lightboxNext = useCallback(() =>
    setLightboxIndex((i) => (i !== null ? (i + 1) % filteredAssets.length : null)), [filteredAssets.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") lightboxPrev();
      if (e.key === "ArrowRight") lightboxNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex, closeLightbox, lightboxPrev, lightboxNext]);

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'post': return <Sparkles size={12} className="text-accent" />;
      case 'upload': return <Upload size={12} className="text-blue-400" />;
      case 'project': return <Package size={12} className="text-orange-400" />;
      default: return null;
    }
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      toast.loading("Preparing download...", { id: "download" });
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success("Download started", { id: "download" });
    } catch (error) {
      console.error("Download failed", error);
      toast.error("Download failed. Opening in new tab...", { id: "download" });
      window.open(url, '_blank');
    }
  };

  const handleDelete = () => {
    if (!assetToDelete) return;
    
    startTransition(async () => {
      const result = await deleteAsset(assetToDelete.id, assetToDelete.source, assetToDelete.url);
      if (result.success) {
        toast.success("Asset deleted successfully");
      } else {
        toast.error(result.error || "Failed to delete asset");
      }
      setAssetToDelete(null);
      setDeleteConfirmOpen(false);
    });
  };

  return (
    <div className="flex flex-col gap-6 pb-24 md:pb-8">
      {/* Header Area */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white font-display italic uppercase">
          Asset Library
        </h1>
        <p className="text-zinc-500 text-sm md:text-base">
          Manage and view all your generated and uploaded media.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card/50 backdrop-blur-xl p-4 rounded-2xl border border-white/5">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input
            type="text"
            placeholder="Search assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-hidden focus:ring-2 focus:ring-accent/50 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
          {["all", "post", "upload", "project"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-tighter transition-all whitespace-nowrap",
                filter === f 
                  ? "bg-accent text-accent-foreground shadow-lg shadow-accent/20" 
                  : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
              )}
            >
              {f}
            </button>
          ))}
          <div className="h-8 w-[1px] bg-white/10 mx-2 hidden md:block" />
          <div className="flex items-center bg-black/20 rounded-xl p-1">
            <button
              onClick={() => setView("grid")}
              className={cn(
                "p-1.5 rounded-lg transition-all",
                view === "grid" ? "bg-accent text-accent-foreground" : "text-zinc-500 hover:text-white"
              )}
            >
              <Grid3X3 size={18} />
            </button>
            <button
              onClick={() => setView("list")}
              className={cn(
                "p-1.5 rounded-lg transition-all",
                view === "list" ? "bg-accent text-accent-foreground" : "text-zinc-500 hover:text-white"
              )}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Assets Grid/List */}
      {filteredAssets.length > 0 ? (
        <div className={cn(
          view === "grid" 
            ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4" 
            : "flex flex-col gap-2"
        )}>
          {filteredAssets.map((asset, index) => (
            <div
              key={`${asset.id}-${asset.source}`}
              className={cn(
                "group relative bg-card border border-white/5 rounded-2xl overflow-hidden hover:border-accent/50 transition-all duration-300",
                view === "list" && "flex items-center p-3 gap-4"
              )}
              onDoubleClick={() => openLightbox(index)}
            >
              {/* Media Preview */}
              <div className={cn(
                "relative bg-zinc-900 overflow-hidden",
                view === "grid" ? "aspect-square" : "h-16 w-16 rounded-xl shrink-0"
              )}>
                {asset.type === 'video' ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <video src={asset.url} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Play size={view === "grid" ? 24 : 16} fill="white" className="text-white" />
                    </div>
                  </div>
                ) : (
                  <Image
                    src={asset.url}
                    alt="Asset"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority={index < 10}
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                )}
                
                {/* Source Badge */}
                <div className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-1.5">
                  {getSourceIcon(asset.source)}
                  <span className="text-[10px] font-bold uppercase tracking-tighter text-white">
                    {asset.source}
                  </span>
                </div>
              </div>

              {/* Info & Actions */}
              <div className={cn(
                "flex-1 flex flex-col min-w-0",
                view === "grid" ? "p-3" : "justify-center"
              )}>
                <div className="flex flex-col min-w-0">
                  <p className="text-[10px] text-zinc-500 font-medium mb-0.5">
                    {format(asset.createdAt, 'MMM d, yyyy')}
                  </p>
                  <p className="text-sm font-bold text-white truncate">
                    {asset.metadata?.caption || asset.metadata?.projectName || "Untitled Asset"}
                  </p>
                </div>

                {/* Grid Hover Actions */}
                {view === "grid" && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      onClick={() => openLightbox(index)}
                      className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-accent transition-colors"
                      title="View"
                    >
                      <Expand size={18} />
                    </button>
                    <button
                      onClick={() => handleDownload(asset.url, `asset-${asset.id}.${asset.type === 'video' ? 'mp4' : 'jpg'}`)}
                      className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-accent transition-colors"
                      title="Download"
                    >
                      <Download size={18} />
                    </button>
                    <button
                      onClick={() => {
                        setAssetToDelete(asset);
                        setDeleteConfirmOpen(true);
                      }}
                      className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-red-500 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}

                {/* List row actions */}
                {view === "list" && (
                  <div className="flex items-center gap-2 shrink-0 ml-auto">
                    <button
                      onClick={() => openLightbox(index)}
                      className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
                      title="View"
                    >
                      <Expand size={15} />
                    </button>
                    <button
                      onClick={() => handleDownload(asset.url, `asset-${asset.id}.${asset.type === 'video' ? 'mp4' : 'jpg'}`)}
                      className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
                      title="Download"
                    >
                      <Download size={15} />
                    </button>
                    <button
                      onClick={() => { setAssetToDelete(asset); setDeleteConfirmOpen(true); }}
                      className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-card/30 rounded-3xl border border-dashed border-white/10">
          <div className="h-16 w-16 rounded-2xl bg-zinc-800/50 flex items-center justify-center mb-4">
            <ImageIcon size={32} className="text-zinc-600" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">No assets found</h3>
          <p className="text-zinc-500 max-w-xs text-sm">
            We couldn&apos;t find any assets matching your search or filters. Try adjusting them.
          </p>
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (() => {
        const asset = filteredAssets[lightboxIndex];
        return (
          <div
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col"
            onClick={closeLightbox}
          >
            {/* Top bar */}
            <div
              className="flex items-center justify-between px-5 py-4 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  {lightboxIndex + 1} / {filteredAssets.length}
                </span>
                <span className="text-sm font-semibold text-white truncate max-w-xs">
                  {asset.metadata?.caption || asset.metadata?.projectName || "Untitled Asset"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload(asset.url, `asset-${asset.id}.${asset.type === 'video' ? 'mp4' : 'jpg'}`)}
                  className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Download"
                >
                  <Download size={18} />
                </button>
                <button
                  onClick={closeLightbox}
                  className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Close"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Media */}
            <div className="flex-1 flex items-center justify-center px-16 min-h-0" onClick={(e) => e.stopPropagation()}>
              {asset.type === 'video' ? (
                <video
                  src={asset.url}
                  controls
                  autoPlay
                  className="max-h-full max-w-full rounded-xl object-contain"
                />
              ) : (
                <div className="relative w-full h-full">
                  <Image
                    src={asset.url}
                    alt={asset.metadata?.caption ?? "Asset"}
                    fill
                    className="object-contain"
                    sizes="100vw"
                    priority
                  />
                </div>
              )}
            </div>

            {/* Nav arrows */}
            {filteredAssets.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); lightboxPrev(); }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); lightboxNext(); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                >
                  <ChevronRight size={22} />
                </button>
              </>
            )}

            {/* Bottom meta */}
            <div className="shrink-0 px-5 py-4 flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg bg-white/10 text-zinc-300">
                {asset.source}
              </span>
              <span className="text-xs text-zinc-500">{format(asset.createdAt, 'MMM d, yyyy')}</span>
            </div>
          </div>
        );
      })()}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="bg-zinc-900 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Asset?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              This action cannot be undone. This will permanently delete the asset from your library and storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="bg-zinc-800 border-white/5 text-zinc-300 hover:bg-zinc-700 hover:text-white"
              disabled={isPending}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              className="bg-red-500 text-white hover:bg-red-600 font-bold"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

