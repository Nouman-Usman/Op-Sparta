import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { 
  Plus, 
  BarChart3, 
  Layers, 
  ArrowUpRight, 
  Clock,
  Sparkles,
  Zap,
  MoreVertical
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default async function OverviewPage() {
  const supabase = await createClient();
  if (!supabase) return redirect("/login");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  // Mock projects data (In a real app, this would come from the database)
  const projects = [
    {
      id: "1",
      name: "Tesla Brand Campaign",
      industry: "Automotive",
      status: "Active",
      postsCount: 12,
      engagement: "+24%",
      image: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&q=80&w=800",
      lastActive: "2h ago"
    },
    {
      id: "2",
      name: "Apple One Vision",
      industry: "Tech",
      status: "Processing",
      postsCount: 8,
      engagement: "+15%",
      image: "https://images.unsplash.com/photo-1491933382434-500287f9b54b?auto=format&fit=crop&q=80&w=800",
      lastActive: "Just now"
    },
    {
      id: "3",
      name: "Nike Run Club",
      industry: "Fitness",
      status: "Active",
      postsCount: 45,
      engagement: "+32%",
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800",
      lastActive: "5h ago"
    }
  ];

  return (
    <div className="p-8 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500">Live Dashboard</span>
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">
            Welcome back, <span className="text-accent">{user.email?.split('@')[0]}</span>
          </h1>
          <p className="text-zinc-400 mt-2">Here&apos;s what&apos;s happening with your content engines today.</p>
        </div>

        <Link 
          href="/projects/new"
          className="bg-accent text-accent-foreground px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-all shadow-xl shadow-accent/20 border border-white/10"
        >
          <Plus size={20} />
          Launch New Project
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Assets", value: "256", icon: Layers, trend: "+12%" },
          { label: "Avg Engagement", value: "4.8%", icon: BarChart3, trend: "+2.4%" },
          { label: "AI Operations", value: "1,204", icon: Sparkles, trend: "+85" },
          { label: "Content Velocity", value: "12/day", icon: Zap, trend: "+4%" },
        ].map((stat, i) => (
          <div key={i} className="glass-dark border border-white/5 p-6 rounded-3xl group hover:border-accent/30 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-accent group-hover:text-black transition-all">
                <stat.icon size={20} />
              </div>
              <span className="text-xs font-bold text-accent bg-accent/10 px-2 py-1 rounded-lg">
                {stat.trend}
              </span>
            </div>
            <p className="text-sm font-medium text-zinc-500 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-white tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Projects Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Active Projects 
            <span className="text-xs font-medium bg-white/5 px-2 py-1 rounded-full text-zinc-500">
              {projects.length}
            </span>
          </h2>
          <button className="text-sm text-zinc-400 hover:text-white transition-colors">View all projects</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project) => (
            <div key={project.id} className="group glass-dark rounded-[2.5rem] overflow-hidden border border-white/5 hover:border-accent/20 transition-all">
              <div className="relative h-48 w-full overflow-hidden">
                <Image 
                  src={project.image} 
                  alt={project.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[10px] font-bold text-white uppercase tracking-widest">
                  {project.industry}
                </div>
              </div>
              
              <div className="p-8">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-accent transition-colors leading-tight">
                      {project.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${project.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                      <span className="text-xs text-zinc-500 font-medium">{project.status}</span>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-white/5 rounded-lg transition-colors text-zinc-500">
                    <MoreVertical size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/5 my-4">
                  <div>
                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Assets</p>
                    <p className="text-white font-bold">{project.postsCount}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Growth</p>
                    <p className="text-emerald-500 font-bold">{project.engagement}</p>
                  </div>
                </div>

                <Link 
                  href={`/projects/${project.id}`}
                  className="w-full flex items-center justify-between group/btn text-sm font-bold text-zinc-400 hover:text-white transition-colors pt-2"
                >
                  <span className="flex items-center gap-2 text-xs">
                    <Clock size={14} />
                    Last update {project.lastActive}
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
            className="group border-2 border-dashed border-white/10 rounded-[2.5rem] p-8 flex flex-col items-center justify-center gap-4 hover:border-accent/40 hover:bg-accent/5 transition-all text-center min-h-[400px]"
          >
            <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center group-hover:scale-110 group-hover:bg-accent group-hover:text-black transition-all">
              <Plus size={32} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-2">New Brand Engine</h3>
              <p className="text-sm text-zinc-500 max-w-[200px]">Scale your social presence with a new AI-powered project.</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
