"use client";

import { useState, useTransition } from "react";
import { 
  ArrowLeft, 
  Plus,
  Loader2,
  CheckCircle2,
  Sparkles,
  Zap,
  Globe,
  MessageSquare,
  Users,
  Palette,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createProject } from "@/app/actions/projects";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "brand", name: "Brand Info", icon: Globe, description: "Your product or service" },
  { id: "context", name: "Strategy", icon: TargetIcon, description: "Audience & Tone" },
  { id: "visual", name: "Visuals", icon: Palette, description: "Colors & Style" },
];

function TargetIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
  );
}

export default function NewProjectPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    targetAudience: "",
    brandVoice: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    startTransition(async () => {
      const result = await createProject({
        name: formData.name,
        industry: formData.industry,
        targetAudience: formData.targetAudience,
        brandVoice: formData.brandVoice,
      });

      if (result.success) {
        router.push(`/studio?projectId=${result.projectId}`);
      } else {
        alert(result.error || "Failed to create project");
      }
    });
  };

  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      <Link 
        href="/overview"
        className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-8 group w-fit"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        Back to Dashboard
      </Link>

      <div className="mb-12">
        <h1 className="text-5xl font-extrabold tracking-tight text-white mb-4 bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
          New Brand Engine
        </h1>
        <p className="text-zinc-400 text-lg">Define your brand identity to power our AI supervision layer.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-8 glass-dark p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Brand Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Tesla Cybergear"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Industry</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Personal Audio"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Brand Voice</label>
                    <select 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-accent transition-all appearance-none"
                      value={formData.brandVoice}
                      onChange={(e) => setFormData({ ...formData, brandVoice: e.target.value })}
                    >
                      <option value="minimalist">Minimalist</option>
                      <option value="aggressive">Aggressive & Bold</option>
                      <option value="luxury">Luxury & Elegant</option>
                      <option value="funny">Entertaining & Viral</option>
                    </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Target Audience</label>
                <textarea 
                  placeholder="e.g. Tech enthusiasts aged 18-35 who value performance over price..."
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-accent transition-all resize-none"
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isPending || !formData.name}
              className="w-full bg-white text-black py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isPending ? <Loader2 className="animate-spin" /> : <>Initialize Project <ArrowRight size={18} /></>}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="glass-dark border border-white/5 p-8 rounded-[2.5rem]">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <Sparkles size={18} className="text-accent" />
              SaaS Engine Pro
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              When you initialize a project, our AI 10.0 supervisor creates a brand kit specifically for this niche. Every n8n generation will follow these rules.
            </p>
            <div className="mt-6 space-y-3">
              {[
                "Global n8n Workflow sync",
                "Automated Instagram Discovery",
                "Brand voice enforcement",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  <CheckCircle2 size={12} className="text-accent" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="p-8 rounded-[2.5rem] bg-indigo-600/10 border border-indigo-600/20">
             <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center mb-4 text-white">
                <Zap size={20} fill="currentColor" />
             </div>
             <h4 className="text-white font-bold mb-1">Instant Generation</h4>
             <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Post-setup trigger</p>
          </div>
        </div>
      </div>
    </div>
  );
}
