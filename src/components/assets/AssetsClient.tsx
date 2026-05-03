"use client";

import { useState } from "react";
import Image from "next/image";
import { 
  Search, 
  Grid3X3, 
  List, 
  Play, 
  Image as ImageIcon, 
  MoreVertical,
  Download,
  Trash2,
  ExternalLink,
  Sparkles,
  Upload,
  Package
} from "lucide-react";
import { Asset } from "@/app/actions/assets";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface AssetsClientProps {
  initialAssets: Asset[];
}

export function AssetsClient({ initialAssets }: AssetsClientProps) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filteredAssets = initialAssets.filter((asset) => {
    const matchesFilter = 
      filter === "all" || 
      (filter === "post" && asset.source === "post") ||
      (filter === "upload" && asset.source === "upload") ||
      (filter === "project" && asset.source === "project") 
      // (filter === "video" && asset.type === "video");
    
    const matchesSearch = 
      search === "" || 
      asset.metadata?.caption?.toLowerCase().includes(search.toLowerCase()) ||
      asset.metadata?.projectName?.toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'post': return <Sparkles size={12} className="text-accent" />;
      case 'upload': return <Upload size={12} className="text-blue-400" />;
      case 'project': return <Package size={12} className="text-orange-400" />;
      default: return null;
    }
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
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className={cn(
                "group relative bg-card border border-white/5 rounded-2xl overflow-hidden hover:border-accent/50 transition-all duration-300",
                view === "list" && "flex items-center p-3 gap-4"
              )}
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
                "flex-1 flex flex-col",
                view === "grid" ? "p-3" : "justify-center"
              )}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-zinc-500 font-medium mb-0.5">
                      {format(asset.createdAt, 'MMM d, yyyy')}
                    </p>
                    <p className="text-sm font-bold text-white truncate">
                      {asset.metadata?.caption || asset.metadata?.projectName || "Untitled Asset"}
                    </p>
                  </div>
                  <button className="text-zinc-500 hover:text-white transition-colors">
                    <MoreVertical size={16} />
                  </button>
                </div>

                {/* Grid Hover Actions */}
                {view === "grid" && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <a 
                      href={asset.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-accent transition-colors"
                    >
                      <ExternalLink size={18} />
                    </a>
                    <button className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-accent transition-colors">
                      <Download size={18} />
                    </button>
                    <button className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-red-500 transition-colors">
                      <Trash2 size={18} />
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
    </div>
  );
}
