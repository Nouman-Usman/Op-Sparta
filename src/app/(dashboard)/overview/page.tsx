import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';
import { 
  Plus, 
  BarChart3, 
  Layers, 
  ArrowUpRight, 
  Clock,
  Sparkles,
  Zap,
  MoreVertical,
  Users,
  TrendingUp
} from "lucide-react";
import Link from "next/link";
import { db } from "@/db";
import { projects as projectsTable, posts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getGlobalMetrics } from "@/app/actions/analytics";
import { cn } from "@/lib/utils";

export default async function OverviewPage() {
  const supabase = await createClient();
  if (!supabase) return redirect("/login");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  // Fetch real projects for this user
  const userProjects = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.userId, user.id));

  // Pre-fetch generation status for all projects; keep UI alive even if individual queries fail.
  const projectsWithStatus = await Promise.all(userProjects.map(async (project) => {
    try {
      const projectPosts = await db.select().from(posts).where(eq(posts.projectId, project.id));
      return {
        ...project,
        isGenerating: projectPosts.some((p) => p.status === "generating"),
      };
    } catch (error) {
      console.error(`OverviewPage: failed to load posts for project ${project.id}`, error);
      return {
        ...project,
        isGenerating: false,
      };
    }
  }));

  const stats = await getGlobalMetrics();

  return (
    <div className="space-y-8 px-4 py-5 sm:space-y-10 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500">Live Dashboard</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            Welcome back, <span className="text-accent">{user.email?.split('@')[0]}</span>
          </h1>
          <p className="mt-2 text-sm text-zinc-400 sm:text-base">Here&apos;s what&apos;s happening with your content engines today.</p>
        </div>

        <Link 
          href="/projects/new"
          className="w-full rounded-2xl border border-white/10 bg-accent px-6 py-3.5 font-bold text-accent-foreground shadow-xl shadow-accent/20 transition-all hover:scale-[1.02] sm:w-auto sm:py-4"
        >
          <Plus size={20} />
          Launch New Project
        </Link>
      </div>

      {/* High-Level Command Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {[
          { label: "Fleet Reach", value: stats.totalReach.toLocaleString(), icon: Users, color: "text-blue-400", bg: "bg-blue-400/10" },
          { label: "Net Engagement", value: stats.totalEngagement.toLocaleString(), icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-400/10" },
          { label: "Active Pipelines", value: userProjects.length, icon: Zap, color: "text-amber-400", bg: "bg-amber-400/10" },
          { label: "Total Assets", value: stats.postCount, icon: BarChart3, color: "text-indigo-400", bg: "bg-indigo-400/10" },
        ].map((stat, i) => (
          <div key={i} className="glass-dark flex items-center gap-4 rounded-3xl border border-white/5 p-5 sm:gap-5 sm:p-6">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", stat.bg)}>
              <stat.icon size={20} className={stat.color} />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-0.5">{stat.label}</div>
              <div className="text-xl font-black text-white sm:text-2xl">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Projects Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <Zap className="text-amber-400" size={24} />
            Active Operations
            <span className="text-xs font-medium bg-white/5 px-2 py-1 rounded-full text-zinc-500">
              {userProjects.length}
            </span>
          </h2>
          <button className="text-sm text-zinc-400 hover:text-white transition-colors">View all projects</button>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {projectsWithStatus.map((project) => (
            <div key={project.id} className="group glass-dark overflow-hidden rounded-4xl border border-white/5 transition-all hover:border-accent/20 sm:rounded-[2.5rem]">
              <div className="relative flex h-44 w-full items-center justify-center overflow-hidden bg-white/5 sm:h-48">
                {project.productImage ? (
                  <img src={project.productImage} alt={project.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                  <div className="text-zinc-700 relative z-0">
                    <Sparkles size={48} />
                  </div>
                )}
                <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent pointer-events-none z-10" />
                <div className="absolute top-4 right-4 flex flex-col items-end gap-2 z-20">
                  <div className="bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[10px] font-bold text-white uppercase tracking-widest">
                    {project.industry || 'General'}
                  </div>
                  
                  {/* Async Status Badge */}
                  {project.isGenerating && (
                    <div className="bg-accent/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-accent/30 text-[10px] font-bold text-accent uppercase tracking-widest animate-pulse flex items-center gap-2">
                       <div className="w-1 h-1 rounded-full bg-accent animate-ping" />
                       Generating
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-6 sm:p-8">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold leading-tight text-white transition-colors group-hover:text-accent sm:text-xl">
                      {project.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-xs text-zinc-500 font-medium">Active</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 py-4 border-y border-white/5 my-4">
                  <div>
                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Brand Voice</p>
                    <p className="text-white font-bold capitalize">{project.brandVoice || 'Minimalist'}</p>
                  </div>
                </div>

                <Link 
                   href={`/studio?projectId=${project.id}`}
                   className="w-full flex items-center justify-between group/btn text-sm font-bold text-zinc-400 hover:text-white transition-colors pt-2"
                >
                  <span className="flex items-center gap-2 text-xs">
                    <Zap size={14} />
                    Open Content Studio
                  </span>
                  <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center group-hover/btn:bg-accent group-hover/btn:text-black transition-all">
                    <ArrowUpRight size={16} />
                  </div>
                </Link>
              </div>
            </div>
          ))}

          {/* Empty State / Add New Card */}
          <Link 
            href="/projects/new"
            className="group flex min-h-70 flex-col items-center justify-center gap-4 rounded-4xl border-2 border-dashed border-white/10 p-8 text-center transition-all hover:border-accent/40 hover:bg-accent/5 sm:min-h-90 sm:rounded-[2.5rem] lg:min-h-100"
          >
            <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center group-hover:scale-110 group-hover:bg-accent group-hover:text-black transition-all">
              <Plus size={32} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-2">New Brand Engine</h3>
              <p className="max-w-50 text-sm text-zinc-500">Scale your social presence with a new AI-powered project.</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
