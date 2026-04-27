"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Zap, Loader2, Mail, Lock, ArrowRight, AlertCircle, User, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // Clear errors/success when toggling mode
  useEffect(() => {
    setError(null);
    setSuccess(null);
    setEmail("");
    setPassword("");
    setUsername("");
  }, [isLogin]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError("Supabase is not configured. Please check your .env variables.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    if (isLogin) {
      // --- SIGN IN FLOW ---
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
      } else {
        router.push("/overview");
        router.refresh();
      }
    } else {
      // --- SIGN UP FLOW ---
      if (username.trim().length < 3) {
        setError("Username must be at least 3 characters long.");
        setLoading(false);
        return;
      }

      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}auth/callback`,
          data: {
            full_name: username.trim(),
            username: username.trim().toLowerCase().replace(/\s+/g, '_'),
          },
        },
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
      } else if (data?.user && !data.session) {
        // Email confirmation required — save the username to localStorage
        // so the callback can use it, or we handle it after email click
        localStorage.setItem("pending_username", username.trim());
        setSuccess(`Verification email sent to ${email}. Please check your inbox to activate your account.`);
        setLoading(false);
      } else if (data?.user && data.session) {
        // Auto-confirmed — immediately save the user-chosen username to the DB
        await fetch("/api/auth/signup-complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: username.trim() }),
        });
        router.push("/overview");
        router.refresh();
      }
    }
  };

  const inputClass = "w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all text-sm";

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated ambient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,_rgba(99,102,241,0.15)_0%,_transparent_60%)] pointer-events-none" />
      <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[140px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-[140px] animate-pulse pointer-events-none" style={{ animationDelay: '1.5s' }} />

      <div className="w-full max-w-md z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-3 mb-6 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-all duration-300">
              <Zap className="text-white fill-white" size={22} />
            </div>
            <span className="text-3xl font-extrabold tracking-tighter text-white">SPARTA</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
            {isLogin ? "Welcome back, Operator" : "Join Operation Sparta"}
          </h1>
          <p className="text-zinc-400 text-sm">
            {isLogin
              ? "Enter your credentials to access your command center."
              : "Create your account and supercharge your content engine."}
          </p>
        </div>

        {/* Card */}
        <div className="glass-dark border border-white/10 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
          {/* Edge glow */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

          {/* Toggle */}
          <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 mb-8">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 ${
                isLogin
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 ${
                !isLogin
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            {/* Error Banner */}
            {error && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={17} className="shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {/* Success Banner */}
            {success && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm animate-in fade-in slide-in-from-top-2">
                <CheckCircle size={17} className="shrink-0 mt-0.5" />
                <p>{success}</p>
              </div>
            )}

            {/* Username — only shown on Sign Up */}
            {!isLogin && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">Username</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="yourhandle"
                    className={inputClass}
                    required={!isLogin}
                    minLength={3}
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className={inputClass}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Password</label>
                {isLogin && (
                  <Link href="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
                    Forgot Password?
                  </Link>
                )}
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputClass}
                  required
                  minLength={6}
                />
              </div>
              {!isLogin && (
                <p className="text-[11px] text-zinc-600 pl-1">Minimum 6 characters.</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !!success}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group mt-2 shadow-lg shadow-indigo-600/20"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <span>{isLogin ? "Access Command Center" : "Create My Account"}</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-8 text-zinc-500 text-sm">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors"
          >
            {isLogin ? "Sign up for free" : "Sign in instead"}
          </button>
        </p>
      </div>
    </div>
  );
}
