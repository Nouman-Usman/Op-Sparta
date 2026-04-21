"use client";

import { useState, useTransition } from "react";
import { 
  Key, 
  CheckCircle2, 
  ArrowRight,
  ExternalLink,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Zap,
  Sparkles,
  Trash2,
  Power,
  Instagram,
  Link2,
  Fingerprint,
  Cpu
} from "lucide-react";
import { saveAiKey } from "@/app/actions/save-ai-keys";
import { deleteAiKey, toggleAiKey, updateAiModel } from "@/app/actions/manage-ai-keys";
import { saveN8nWebhook, saveInstagramCredentials } from "@/app/actions/save-integrations";
import { cn } from "@/lib/utils";

const PROVIDERS = [
  {
    id: "openai",
    name: "OpenAI",
    description: "Access GPT-4o and GPT-4o-mini for high-fidelity content and reasoning.",
    url: "https://platform.openai.com/api-keys",
    models: ["gpt-4o", "gpt-4o-mini"],
  },
  {
    id: "google",
    name: "Google Gemini",
    description: "Harness Gemini 1.5 Pro's massive context and multimodal capabilities.",
    url: "https://aistudio.google.com/app/apikey",
    models: ["gemini-1.5-pro-latest", "gemini-1.5-flash-latest"],
  }
];

export default function SettingsClient({ 
  initialKeys, 
  integrationData 
}: { 
  initialKeys: any[], 
  integrationData: any 
}) {
  const [selectedProvider, setSelectedProvider] = useState<"openai" | "google">("openai");
  const [apiKey, setApiKey] = useState("");
  const [n8nWebhook, setN8nWebhook] = useState(integrationData.n8nGenerationWebhook || "");
  const [instaToken, setInstaToken] = useState(integrationData.instagramAccessToken || "");
  const [instaPageId, setInstaPageId] = useState(integrationData.instagramPageId || "");
  
  const [showKey, setShowKey] = useState(false);
  const [showInstaKey, setShowInstaKey] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [aiFeedback, setAiFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [n8nFeedback, setN8nFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [instaFeedback, setInstaFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleSaveAiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setAiFeedback(null);
    if (!apiKey) return;

    startTransition(async () => {
      const result = await saveAiKey(selectedProvider, apiKey);
      if (result.success) {
        setAiFeedback({ type: 'success', message: `${PROVIDERS.find(p => p.id === selectedProvider)?.name} key saved.` });
        setApiKey("");
      } else {
        setAiFeedback({ type: 'error', message: result.error || "Failed to save key." });
      }
    });
  };

  const handleSaveN8n = async (e: React.FormEvent) => {
    e.preventDefault();
    setN8nFeedback(null);
    startTransition(async () => {
      const result = await saveN8nWebhook(n8nWebhook);
      if (result.success) setN8nFeedback({ type: 'success', message: "Engine webhook updated." });
      else setN8nFeedback({ type: 'error', message: result.error });
    });
  };

  const handleSaveInsta = async (e: React.FormEvent) => {
    e.preventDefault();
    setInstaFeedback(null);
    startTransition(async () => {
      const result = await saveInstagramCredentials(instaToken, instaPageId);
      if (result.success) setInstaFeedback({ type: 'success', message: "Instagram credentials linked." });
      else setInstaFeedback({ type: 'error', message: result.error });
    });
  };

  const handleToggle = async (id: string, active: boolean) => {
    startTransition(async () => {
      await toggleAiKey(id, active);
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    startTransition(async () => {
      await deleteAiKey(id);
    });
  };

  const handleModelChange = async (id: string, model: string) => {
    startTransition(async () => {
      await updateAiModel(id, model);
    });
  };

  const isInstagramConnected = !!integrationData.instagramAccessToken && !!integrationData.instagramPageId;

  return (
    <div className="space-y-16">
      {/* AI Providers Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="space-y-8">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">AI Providers</label>
          <div className="space-y-3">
            {initialKeys.map((key) => (
              <div key={key.id} className={cn("p-4 rounded-2xl border transition-all", key.isActive ? "bg-accent/5 border-accent/50" : "bg-white/5 border-white/5 opacity-60")}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {key.provider === 'openai' ? <Zap size={14} className="text-accent" /> : <Sparkles size={14} className="text-blue-400" />}
                    <span className="text-xs font-bold text-white uppercase">{key.provider}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleToggle(key.id, !key.isActive)} className={cn("p-1.5 rounded-lg", key.isActive ? "text-accent bg-accent/10" : "text-zinc-500 hover:text-white")}><Power size={14} /></button>
                    <button onClick={() => handleDelete(key.id)} className="p-1.5 rounded-lg text-zinc-500 hover:text-red-500"><Trash2 size={14} /></button>
                  </div>
                </div>
                {key.isActive && (
                  <select value={key.config?.defaultModel} onChange={(e) => handleModelChange(key.id, e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg py-1.5 px-3 text-[11px] text-white focus:outline-none">
                    {key.config?.enabledModels?.map((m: string) => <option key={m} value={m}>{m}</option>)}
                  </select>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="glass-dark border border-white/5 rounded-[2.5rem] p-10 relative overflow-hidden">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Key size={24} className="text-accent" />
              Provider Credentials
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-8">
                {PROVIDERS.map((p) => (
                  <button key={p.id} onClick={() => setSelectedProvider(p.id as any)} className={cn("p-4 rounded-xl border text-center transition-all", selectedProvider === p.id ? "bg-accent/10 border-accent text-accent" : "bg-white/5 border-white/5 text-zinc-500 hover:border-white/10")}>
                    <span className="text-[10px] font-bold uppercase">{p.name}</span>
                  </button>
                ))}
            </div>
            <form onSubmit={handleSaveAiKey} className="space-y-6">
              <div className="relative group">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-accent" size={20} />
                <input type={showKey ? "text" : "password"} value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Enter API Key" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all" required />
                <button type="button" onClick={() => setShowKey(!showKey)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">{showKey ? <EyeOff size={20} /> : <Eye size={20} />}</button>
              </div>
              {aiFeedback && <div className={cn("p-4 rounded-2xl text-sm font-medium border", aiFeedback.type === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-red-500/10 border-red-500/20 text-red-500")}>{aiFeedback.message}</div>}
              <button type="submit" disabled={isPending || !apiKey} className="w-full bg-white text-black py-4 rounded-2xl font-bold hover:bg-zinc-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {isPending ? <Loader2 className="animate-spin" /> : <><span>Activate Key</span><ArrowRight size={18} /></>}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Generation Engine Section */}
        <div className="glass-dark border border-white/5 rounded-[2.5rem] p-10 relative">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
              <Cpu className="text-indigo-400" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Generation Engine</h2>
              <p className="text-sm text-zinc-500">n8n Workflow Integration</p>
            </div>
          </div>
          <form onSubmit={handleSaveN8n} className="space-y-6">
            <div className="relative group">
              <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-indigo-400" size={20} />
              <input type="url" value={n8nWebhook} onChange={(e) => setN8nWebhook(e.target.value)} placeholder="https://n8n.your-host.com/webhook/..." className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono text-xs" required />
            </div>
            {n8nFeedback && <div className={cn("p-4 rounded-2xl text-sm border", n8nFeedback.type === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-red-500/10 border-red-500/20 text-red-500")}>{n8nFeedback.message}</div>}
            <button type="submit" disabled={isPending || !n8nWebhook} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-500 transition-all active:scale-[0.98] disabled:opacity-50">
              Link Engine
            </button>
          </form>
        </div>

        {/* Instagram Destination Section (OAuth Flow) */}
        <div className="glass-dark border border-white/5 rounded-[2.5rem] p-10 relative overflow-hidden">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-pink-500/10 flex items-center justify-center border border-pink-500/20">
              <Instagram className="text-pink-400" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Direct Posting</h2>
              <p className="text-sm text-zinc-500">Instagram Graph API</p>
            </div>
          </div>
          
          <div className="space-y-8 relative z-10">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 transition-all">
              <div className="flex items-center gap-3">
                <div className={cn("w-2 h-2 rounded-full", isInstagramConnected ? "bg-emerald-500 animate-pulse" : "bg-red-500")} />
                <span className="text-sm font-bold text-white uppercase tracking-wider">
                  {isInstagramConnected ? "Account Linked" : "No Account Connected"}
                </span>
              </div>
              {isInstagramConnected && (
                <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase">
                  Verified
                </div>
              )}
            </div>

            <div className="space-y-4">
              <p className="text-xs text-zinc-500 leading-relaxed">
                Connect your Instagram Business account via Meta OAuth.
              </p>

              <a 
                href="/api/auth/instagram"
                className={cn(
                  "w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold transition-all shadow-lg active:scale-[0.98]",
                  isInstagramConnected 
                    ? "bg-white/5 border border-white/10 text-white hover:bg-white/10" 
                    : "bg-gradient-to-r from-pink-600 to-rose-600 text-white hover:opacity-90 shadow-pink-600/20"
                )}
              >
                <Instagram size={20} />
                <span>{isInstagramConnected ? "Reconnect Account" : "Connect Instagram Account"}</span>
              </a>
            </div>

            <div className="pt-6 border-t border-white/5 space-y-4">
               <form onSubmit={handleSaveInsta} className="space-y-4">
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-800" size={14} />
                  <input type={showInstaKey ? "text" : "password"} value={instaToken} onChange={(e) => setInstaToken(e.target.value)} placeholder="Manual Access Token" className="w-full bg-black/20 border border-white/5 rounded-xl py-3 pl-10 pr-10 text-[10px] text-zinc-500 focus:outline-none focus:border-pink-500/30 font-mono" />
                </div>
                <div className="relative group">
                  <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-800" size={14} />
                  <input type="text" value={instaPageId} onChange={(e) => setInstaPageId(e.target.value)} placeholder="Manual Page ID" className="w-full bg-black/20 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-[10px] text-zinc-500 focus:outline-none focus:border-pink-500/30 font-mono" />
                </div>
                <button type="submit" className="text-[10px] font-bold text-zinc-500 hover:text-white transition-colors underline decoration-zinc-800 underline-offset-4">Save Manual Update</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
