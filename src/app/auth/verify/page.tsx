"use client";

import { Zap, Mail, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function VerifyPage() {
  const [resending, setResending] = useState(false);

  const handleResend = async () => {
    setResending(true);
    // Add resend logic here if needed
    setTimeout(() => setResending(false), 2000);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_#1e3a8a_0%,_transparent_70%)] opacity-20 pointer-events-none" />
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-accent/5 rounded-full blur-[120px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-600/5 rounded-full blur-[120px] animate-pulse pointer-events-none" />

      <div className="w-full max-w-md z-10 text-center">
        <div className="flex justify-center mb-10">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-indigo-600 flex items-center justify-center shadow-lg shadow-accent/20 group-hover:scale-110 transition-all duration-300">
              <Zap className="text-black fill-black" size={32} />
            </div>
          </Link>
        </div>

        <div className="glass-dark border border-white/10 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
          {/* Subtle decorative edge glow */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

          <div className="bg-accent/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 border border-accent/20 group hover:scale-105 transition-transform duration-500">
            <Mail className="text-accent group-hover:animate-bounce" size={48} />
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">
            Check your email
          </h2>
          <p className="text-zinc-400 text-lg mb-10 leading-relaxed">
            We&apos;ve sent a verification link to your email address. Please click it to confirm your account and get started.
          </p>

          <div className="space-y-6">
            <button 
              onClick={handleResend}
              disabled={resending}
              className="w-full bg-white/5 border border-white/10 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <RefreshCw size={18} className={resending ? "animate-spin" : ""} />
              {resending ? "Sending..." : "Resend Link"}
            </button>

            <div className="pt-4 border-t border-white/5">
              <Link 
                href="/login"
                className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors"
              >
                <ArrowLeft size={16} />
                Back to login
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-8 text-zinc-500 text-sm">
          Didn&apos;t receive an email? Check your spam folder or try a different address.
        </p>
      </div>
    </div>
  );
}
