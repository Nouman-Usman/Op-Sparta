"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Hero3D } from "@/components/Hero3D";
import { 
  Plus, 
  ArrowRight, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  BarChart4, 
  Instagram 
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
  const router = useRouter();
  const heroTextRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const textElements = heroTextRef.current?.querySelectorAll(".animate-text");
    if (textElements) {
      gsap.fromTo(
        textElements,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, stagger: 0.2, ease: "power4.out", delay: 0.8 }
      );
    }

    const cards = featuresRef.current?.querySelectorAll(".feature-card");
    if (cards) {
      gsap.fromTo(
        cards,
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: featuresRef.current,
            start: "top 80%",
          },
        }
      );
    }
  }, []);

  // Persistent session check – redirect logged‑in users to dashboard
  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace("/overview");
      }
    };
    checkSession();
  }, [router]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white" suppressHydrationWarning>
      {/* Background Gradient */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,#1e3a8a_0%,transparent_50%)] opacity-30 pointer-events-none" />

      {/* Nav */}
      <nav className="fixed top-0 z-50 flex w-full items-center justify-between border-b border-white/5 px-4 py-4 glass sm:px-6 sm:py-5 lg:px-8 lg:py-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <Zap className="text-black fill-black" size={18} />
          </div>
          <span className="text-xl font-bold tracking-tight">Sparta</span>
        </div>
        <Link 
          href="/overview" 
          className="rounded-full bg-white px-4 py-2 text-xs font-bold text-black transition-all hover:scale-105 sm:px-6 sm:text-sm"
        >
          Go to App
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="relative flex min-h-[92vh] flex-col items-center justify-center px-4 pb-16 pt-28 text-center sm:px-6 sm:pt-32 lg:px-8 lg:pb-20">
        <div className="absolute inset-0 z-0 opacity-40">
           <Hero3D />
        </div>
        
        <div ref={heroTextRef} className="relative z-10 max-w-4xl">
          <div className="animate-text inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-bold uppercase tracking-widest mb-6">
            <Sparkles size={14} />
            The Future of Social is Here
          </div>
          <h1 className="animate-text mb-6 bg-linear-to-br from-white via-white to-zinc-500 bg-clip-text text-4xl font-bold leading-tight tracking-tight text-transparent sm:mb-8 sm:text-6xl md:text-8xl">
            Design Social <br /> 
            <span className="italic font-light">at the speed of AI.</span>
          </h1>
          <p className="animate-text mx-auto mb-10 max-w-2xl text-base leading-relaxed text-zinc-400 sm:mb-12 sm:text-lg md:text-xl">
            Operation Sparta converts your product data into approved, scheduled, and high-engagement social content in seconds.
          </p>
          <div className="animate-text flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/projects/new" 
              className="w-full sm:w-auto bg-accent text-accent-foreground px-8 py-4 rounded-2xl text-lg font-bold shadow-2xl shadow-accent/20 flex items-center justify-center gap-2 group hover:scale-[1.02] transition-all"
            >
              Start Generating
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="w-full sm:w-auto bg-white/5 border border-white/10 hover:bg-white/10 px-8 py-4 rounded-2xl text-lg font-bold transition-all">
              Watch Demo
            </button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 opacity-50 sm:bottom-10">
          <span className="text-[10px] font-bold uppercase tracking-widest">Scroll</span>
          <div className="h-12 w-px bg-linear-to-b from-white to-transparent" />
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-32" ref={featuresRef}>
        <div className="mb-12 text-center sm:mb-20">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">Precision Engineering for Content</h2>
          <p className="text-zinc-500 max-w-xl mx-auto">Focus on your business while our AI-supervision layer handles the creative quality control.</p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {[
            { title: "AI Supervision", desc: "Our 10.0 Supervision Service scores every post before you see it.", icon: ShieldCheck },
            { title: "Direct Posting", desc: "One-click publishing to Instagram, TikTok, and LinkedIn.", icon: Instagram },
            { title: "Viral Analytics", desc: "Closed-loop feedback system that learns what your audience loves.", icon: BarChart4 },
            { title: "Brand Intelligence", desc: "Built-in brand kit memory ensures 100% visual consistency.", icon: Zap },
            { title: "Project Isolation", desc: "Manage multiple brands with distinct strategies in one workspace.", icon: Plus },
            { title: "Advanced Flows", desc: "Custom n8n-powered workflows for complex publishing needs.", icon: Sparkles },
          ].map((feature, i) => (
            <div key={i} className="feature-card glass-dark group rounded-3xl border border-white/5 p-6 transition-all hover:border-accent/30 sm:p-8">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:bg-accent group-hover:text-black transition-all">
                <feature.icon size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-zinc-500 leading-relaxed text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-zinc-950 px-4 py-14 text-center sm:px-8 sm:py-20">
        <div className="mb-8 flex justify-center gap-6 text-zinc-500">
           <Twitter size={20} className="hover:text-white transition-colors cursor-pointer" />
           <Github size={20} className="hover:text-white transition-colors cursor-pointer" />
        </div>
        <p className="text-zinc-600 text-sm italic">Designed for the future of marketing. Built by the Sparta Team.</p>
      </footer>
    </div>
  );
}

function Twitter({ size, className }: { size: number; className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      className={className}
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function Github({ size, className }: { size: number; className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      className={className}
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}
