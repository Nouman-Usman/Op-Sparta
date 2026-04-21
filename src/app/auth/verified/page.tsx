"use client";

import { Zap, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function VerifiedPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_#1e3a8a_0%,_transparent_70%)] opacity-20 pointer-events-none" />

      <div className="w-full max-w-md z-10 text-center">
        <div className="flex justify-center mb-10">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-indigo-600 flex items-center justify-center shadow-lg shadow-accent/20 group-hover:scale-110 transition-all duration-300">
              <Zap className="text-black fill-black" size={32} />
            </div>
          </Link>
        </div>

        <div className="glass-dark border border-white/10 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
          <div className="bg-emerald-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 border border-emerald-500/20">
            <CheckCircle2 className="text-emerald-500" size={40} />
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">
            Email Verified!
          </h2>
          <p className="text-zinc-400 text-lg mb-10 leading-relaxed">
            Your profile has been successfully verified. You can now access all the features of Operation Sparta.
          </p>

          <Link 
            href="/overview"
            className="w-full bg-accent text-black py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-accent/90 transition-all active:scale-[0.98]"
          >
            Go to Dashboard
            <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    </div>
  );
}
