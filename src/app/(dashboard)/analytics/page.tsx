"use client";

import { 
  TrendingUp, 
  Users, 
  Eye, 
  MessageCircle,
  Download,
  Calendar,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";

const stats = [
  { name: "Total Reach", value: "124.5k", change: "+12.5%", icon: Eye },
  { name: "Engagement Rate", value: "4.8%", change: "+0.3%", icon: TrendingUp },
  { name: "Followers", value: "24,802", change: "+42", icon: Users },
  { name: "Comments", value: "1,240", change: "+5.1%", icon: MessageCircle },
];

export default function AnalyticsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <header className="mb-8 flex flex-col justify-between gap-4 md:mb-12 md:flex-row md:items-center md:gap-6">
        <div>
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">Analytics</h1>
          <p className="text-muted-foreground">Performance insights for your AI-generated content.</p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <button className="flex items-center justify-center gap-2 rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-sm font-medium transition-all hover:bg-muted">
            <Calendar size={18} />
            Last 30 Days
            <ChevronDown size={14} />
          </button>
          <button className="flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-2.5 text-sm font-bold text-accent-foreground shadow-lg shadow-accent/20 transition-all hover:bg-accent/90">
            <Download size={18} />
            Export Report
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:mb-12 lg:grid-cols-4 lg:gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="glass-dark flex flex-col gap-4 rounded-2xl border border-border p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <stat.icon className="text-accent" size={20} />
              </div>
              <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                {stat.change}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">{stat.name}</p>
              <h3 className="text-2xl font-bold text-white sm:text-3xl">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Mockup */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="glass-dark flex min-h-80 flex-col rounded-3xl border border-border p-4 sm:p-6 lg:col-span-2 lg:min-h-100 lg:p-8">
          <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-xl font-bold text-white">Engagement Over Time</h3>
            <div className="flex flex-wrap gap-3 sm:gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-accent" />
                <span className="text-xs text-muted-foreground">This Period</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-muted" />
                <span className="text-xs text-muted-foreground">Previous</span>
              </div>
            </div>
          </div>
          
          {/* Mock Chart Visualization */}
          <div className="flex flex-1 items-end justify-between gap-1 px-1 sm:gap-2 sm:px-2">
            {[40, 70, 45, 90, 65, 85, 55, 95, 60, 80, 50, 75].map((height, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full relative">
                   <div 
                    className="w-full bg-accent/20 rounded-t-lg transition-all duration-1000 group-hover:bg-accent/40" 
                    style={{ height: `${height * 0.8}%` }} 
                  />
                  <div 
                    className="w-full bg-accent absolute bottom-0 left-0 rounded-t-lg shadow-[0_0_15px_rgba(var(--accent),0.3)] transition-all duration-1000" 
                    style={{ height: `${height}%` }} 
                  />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground/50">M{i+1}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-dark flex flex-col rounded-3xl border border-border p-5 sm:p-8">
          <h3 className="mb-6 text-xl font-bold text-white sm:mb-8">Top Content Types</h3>
          <div className="space-y-6">
            {[
              { name: "Promotional", value: 85, color: "bg-accent" },
              { name: "Educational", value: 62, color: "bg-emerald-500" },
              { name: "Lifestyle", value: 48, color: "bg-amber-500" },
              { name: "User Content", value: 35, color: "bg-indigo-500" },
            ].map((type, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-white">{type.name}</span>
                  <span className="text-muted-foreground">{type.value}%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn("h-full rounded-full", type.color)} 
                    style={{ width: `${type.value}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 border-t border-border pt-6 text-center sm:mt-12 sm:pt-8">
            <p className="text-sm text-muted-foreground mb-4">AI suggests focusing more on <span className="text-white font-bold">Educational</span> content next week.</p>
            <button className="text-accent text-sm font-bold hover:underline flex items-center justify-center gap-1 mx-auto">
              Read Insight <ChevronDown size={14} className="-rotate-90" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
