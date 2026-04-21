"use client";

import { useState, useTransition } from "react";
import { 
  Key, 
  ArrowRight,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Zap,
  Sparkles,
  Trash2,
  Power,
  Instagram
} from "lucide-react";
import { saveAiKey } from "@/app/actions/save-ai-keys";
import { deleteAiKey, toggleAiKey, updateAiModel } from "@/app/actions/manage-ai-keys";
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
  const [showKey, setShowKey] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [aiFeedback, setAiFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const isInstagramConnected = !!integrationData?.instagramAccessToken;

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

  return (
    <div className="space-y-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Social Destination Section (Seamless Auth) */}
        <div className={cn(
          "glass-dark border rounded-[2.5rem] p-10 relative overflow-hidden transition-all duration-500",
          isInstagramConnected ? "border-emerald-500/20" : "border-white/5"
        )}>
          <div className="absolute top-0 right-0 p-8 opacity-5">
             <Instagram size={140} className="text-pink-500" />
          </div>

          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-pink-500/10 flex items-center justify-center border border-pink-500/20">
                <Instagram className="text-pink-400" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Social Destination</h2>
                <p className="text-sm text-zinc-500">Instagram Graph API</p>
              </div>
            </div>

            {isInstagramConnected && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Connected
              </div>
            )}
          </div>
          
          <div className="space-y-8 relative z-10">
            <div className="p-8 rounded-3xl bg-white/5 border border-white/5 space-y-6">
               <div className="space-y-2">
                  <h3 className="text-sm font-bold text-white">Managed Integration</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed max-w-xs">
                     {isInstagramConnected 
                        ? "Your account is linked. We are automatically discovering your Business ID and managing your permanent tokens."
                        : "Click below to link your Instagram Business account via our secure managed gateway."}
                  </p>
               </div>

               <a 
                href="/api/auth/instagram"
                className={cn(
                  "w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-xl",
                  isInstagramConnected 
                    ? "bg-white/5 border border-white/10 text-white hover:bg-white/10" 
                    : "bg-gradient-to-r from-pink-600 to-rose-600 text-white hover:opacity-90 shadow-pink-600/20"
                )}
              >
                <Instagram size={20} />
                {isInstagramConnected ? "Reconnect Account" : "Authenticate Instagram"}
              </a>
            </div>

            {isInstagramConnected && (
               <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Business ID</span>
                    <span className="text-[10px] font-mono text-zinc-400">{integrationData.instagramPageId}</span>
                  </div>
               </div>
            )}
          </div>
        </div>

        {/* Global Key Entry Section - Existing */}
        <div className="lg:col-span-2">
          <div className="glass-dark border border-white/5 rounded-[2.5rem] p-10 relative overflow-hidden">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Key size={24} className="text-accent" />
              Provider Credentials
            </h2>
            <p className="text-zinc-400 text-sm mb-8">Manage the master API keys used for AI Supervision and deep reasoning.</p>
            
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
                <input type={showKey ? "text" : "password"} value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Enter API Key" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all font-mono" required />
                <button type="button" onClick={() => setShowKey(!showKey)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">{showKey ? <EyeOff size={20} /> : <Eye size={20} />}</button>
              </div>
              {aiFeedback && <div className={cn("p-4 rounded-2xl text-sm font-medium border", aiFeedback.type === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-red-500/10 border-red-500/20 text-red-500")}>{aiFeedback.message}</div>}
              <button type="submit" disabled={isPending || !apiKey} className="w-full bg-white text-black py-4 rounded-2xl font-bold hover:bg-zinc-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {isPending ? <Loader2 className="animate-spin" /> : <><span>Activate Global Key</span><ArrowRight size={18} /></>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
