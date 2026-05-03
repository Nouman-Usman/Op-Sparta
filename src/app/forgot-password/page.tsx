"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Zap, Loader2, Mail, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { getURL } from "@/lib/utils";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    setLoading(true);
    setError(null);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getURL()}auth/reset-password`,
    });

    if (resetError) {
      setError(resetError.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_#1e3a8a_0%,_transparent_70%)] opacity-20 pointer-events-none" />

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-3 mb-6 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-indigo-600 flex items-center justify-center shadow-lg shadow-accent/20 group-hover:scale-110 transition-all duration-300">
              <Zap className="text-black fill-black" size={24} />
            </div>
            <span className="text-3xl font-extrabold tracking-tighter text-white">SPARTA</span>
          </Link>
          <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
            Reset Password
          </h2>
          <p className="text-zinc-400">
            Enter your email to receive a password reset link
          </p>
        </div>

        <div className="glass-dark border border-white/10 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
          {success ? (
            <div className="text-center space-y-6 py-4 animate-in fade-in zoom-in-95">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <CheckCircle2 className="text-emerald-500" size={40} />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Check your inbox</h3>
                <p className="text-zinc-400">If an account exists for {email}, you will receive a password reset link shortly.</p>
              </div>
              <Link 
                href="/login" 
                className="inline-flex items-center gap-2 text-sm text-accent hover:text-accent/80 font-medium transition-colors"
              >
                <ArrowLeft size={16} />
                Return to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-6">
              {error && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                  <AlertCircle size={18} className="shrink-0" />
                  <p>{error}</p>
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-accent transition-colors" size={20} />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="animate-spin" /> : "Send Reset Link"}
              </button>

              <div className="text-center">
                <Link 
                  href="/login" 
                  className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors"
                >
                  <ArrowLeft size={16} />
                  Back to login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
