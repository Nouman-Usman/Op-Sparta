"use client";

import { useState, useEffect, useTransition } from "react";
import { 
  TrendingUp, 
  Users, 
  Eye, 
  MessageCircle,
  Download,
  Calendar,
  ChevronDown,
  Loader2,
  Heart,
  BarChart3,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getDetailedAnalytics } from "@/app/actions/analytics";

export default function AnalyticsPage() {
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    startTransition(async () => {
      const result = await getDetailedAnalytics();
      if (result.success) {
        setData(result);
      }
    });
  };

  if (!data && isPending) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-accent" />
      </div>
    );
  }

  const stats = [
    { name: "Total Reach", value: data?.stats.totalReach || "0", change: "+0.0%", icon: Eye, color: "text-accent" },
    { name: "Engagement Rate", value: data?.stats.engagementRate || "0.0%", change: "+0.0%", icon: TrendingUp, color: "text-emerald-500" },
    { name: "Total Likes", value: data?.stats.totalLikes || "0", change: "+0.0%", icon: Heart, color: "text-rose-500" },
    { name: "Comments", value: data?.stats.totalComments || "0", change: "+0.0%", icon: MessageCircle, color: "text-sky-500" },
  ];

  const maxEngagement = Math.max(...(data?.timeSeries.map((d: any) => d.engagement) || [1]));

  const handleExport = () => {
    if (!data) return;
    
    const headers = ["Date", "Reach", "Engagement"];
    const rows = data.timeSeries.map((d: any) => [d.date, d.reach, d.engagement]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map((r: any) => r.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `op_sparta_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8 animate-in fade-in duration-700">
      <header className="mb-8 flex flex-col justify-between gap-4 md:mb-12 md:flex-row md:items-center md:gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent font-display">Intelligence Core</span>
             <span className="h-1 w-1 rounded-full bg-zinc-800" />
             <span className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest">Real-time Performance</span>
          </div>
          <h1 className="text-4xl font-display font-black tracking-tighter text-white sm:text-6xl uppercase italic">Analytics</h1>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <button 
            onClick={loadData}
            className="flex items-center justify-center gap-2 rounded-2xl border border-white/5 bg-muted/50 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-zinc-800 active:scale-95"
          >
            <Calendar size={18} />
            Last 30 Days
            <ChevronDown size={14} />
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center justify-center gap-2 rounded-2xl bg-white px-8 py-3 text-sm font-black uppercase tracking-widest text-black shadow-xl shadow-white/5 transition-all hover:bg-accent hover:text-accent-foreground active:scale-95"
          >
            <Download size={18} />
            Export Report
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:mb-12 lg:grid-cols-4 lg:gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="glass-dark group flex flex-col gap-6 rounded-[2.5rem] border border-white/5 p-8 hover:bg-zinc-900/50 transition-all">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center group-hover:scale-110 transition-transform">
                <stat.icon className={stat.color} size={24} />
              </div>
              <div className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 uppercase tracking-widest">
                {stat.change}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2">{stat.name}</p>
              <h3 className="text-3xl font-display font-black text-white tracking-tighter">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="glass-dark flex min-h-[450px] flex-col rounded-[3rem] border border-white/5 p-8 lg:col-span-2 lg:p-12">
          <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-2xl font-display font-bold text-white uppercase italic tracking-tighter">Engagement Pulse</h3>
              <p className="text-xs text-zinc-600 uppercase tracking-widest font-black mt-1">Daily signal interaction volume</p>
            </div>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-accent" />
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">This Period</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-zinc-800" />
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Baseline</span>
              </div>
            </div>
          </div>
          
          {/* Dynamic Chart Visualization */}
          <div className="flex flex-1 items-end justify-between gap-1.5 px-2">
            {data?.timeSeries.map((d: any, i: number) => {
              const height = maxEngagement > 0 ? (d.engagement / maxEngagement) * 100 : 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-4 group h-full justify-end">
                  <div className="w-full relative h-full flex flex-col justify-end">
                     <div 
                      className="w-full bg-accent/10 rounded-t-xl transition-all duration-1000 group-hover:bg-accent/20" 
                      style={{ height: `${Math.max(height, 5)}%` }} 
                    />
                    <div 
                      className="w-full bg-accent absolute bottom-0 left-0 rounded-t-xl shadow-[0_0_20px_rgba(var(--accent),0.2)] transition-all duration-700 group-hover:brightness-125" 
                      style={{ height: `${height}%` }} 
                    />
                    
                    {/* Tooltip on hover */}
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white text-black text-[8px] font-black py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      {d.engagement} ENGAGEMENT
                    </div>
                  </div>
                  <span className="text-[8px] font-black text-zinc-700 uppercase tracking-tighter hidden sm:block">
                    {new Date(d.date).getDate()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-dark flex flex-col rounded-[3rem] border border-white/5 p-10 lg:p-12">
          <div className="mb-10">
            <h3 className="text-2xl font-display font-bold text-white uppercase italic tracking-tighter">Neural Insights</h3>
            <p className="text-xs text-zinc-600 uppercase tracking-widest font-black mt-1">Engine intelligence</p>
          </div>
          
          <div className="space-y-8">
            {[
              { name: "Visual Engagement", value: data?.insights?.visualEngagement || 0, color: "bg-accent" },
              { name: "Narrative Depth", value: data?.insights?.narrativeDepth || 0, color: "bg-emerald-500" },
              { name: "Brand Alignment", value: data?.insights?.brandAlignment || 0, color: "bg-amber-500" },
              { name: "Audience Growth", value: data?.insights?.audienceGrowth || 0, color: "bg-sky-500" },
            ].map((type, i) => (
              <div key={i} className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">{type.name}</span>
                  <span className="text-[10px] font-black text-zinc-500 tracking-widest">{type.value}%</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                  <div 
                    className={cn("h-full rounded-full transition-all duration-1000", type.color)} 
                    style={{ width: `${type.value}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-auto pt-12 text-center">
            <div className="bg-muted/50 rounded-3xl p-6 border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-150 transition-transform duration-1000">
                <Sparkles size={100} />
              </div>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest leading-relaxed mb-6">
                AI detects a <span className="text-white">94% match</span> with core product values. Recommended action: Increase video signal density.
              </p>
              <button className="w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white hover:text-black transition-all">
                Execute Optimization
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
