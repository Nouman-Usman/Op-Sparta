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
  },
  {
    id: "higgsfield",
    name: "Higgsfield API",
    description: "Connect to the Higgsfield Engine for generative video components.",
    url: "https://higgsfield.ai",
    models: ["higgsfield-video-v1"],
  }
];

export default function SettingsClient({ 
  initialKeys, 
  integrationData 
}: { 
  initialKeys: any[], 
  integrationData: any 
}) {
  const [selectedProvider, setSelectedProvider] = useState<"openai" | "google" | "higgsfield">("openai");
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

  const [disconnecting, setDisconnecting] = useState(false);

  const DisconnectButton = () => (
    <button
      onClick={async () => {
        if (!confirm("Disconnect your Instagram account? You can reconnect at any time.")) return;
        setDisconnecting(true);
        await fetch("/api/auth/instagram/disconnect", { method: "POST" });
        window.location.reload();
      }}
      disabled={disconnecting}
      className="py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-sm disabled:opacity-50"
    >
      {disconnecting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
      {disconnecting ? "Disconnecting..." : "Disconnect"}
    </button>
  );

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

              {isInstagramConnected ? (
                <>
                  {/* Connected Account Details */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-white">Connected Page</h3>

                    <div className="flex items-center gap-4 px-5 py-4 rounded-xl bg-black/40 border border-white/5">
                      {integrationData.instagramProfilePic ? (
                        <img 
                          src={integrationData.instagramProfilePic} 
                          alt="Instagram Profile" 
                          className="w-12 h-12 rounded-full border border-white/10"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                          <Instagram size={20} className="text-zinc-500" />
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-bold text-white">
                          {integrationData.instagramUsername ? `@${integrationData.instagramUsername}` : "Instagram Page"}
                        </div>
                        <div className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold mt-1">
                          Connected
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <a
                      href="/api/auth/instagram"
                      className="py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] bg-white/5 border border-white/10 text-white hover:bg-white/10 text-sm"
                    >
                      <Instagram size={16} />
                      Reconnect
                    </a>
                    <DisconnectButton />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-white">Managed Integration</h3>
                    <p className="text-xs text-zinc-500 leading-relaxed max-w-xs">
                      Click below to link your Instagram Business account via our secure managed gateway.
                    </p>
                  </div>
                  <a
                    href="/api/auth/instagram"
                    className="w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white hover:opacity-90 shadow-pink-600/20"
                  >
                    <Instagram size={20} />
                    Authenticate Instagram
                  </a>
                </>
              )}
            </div>
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
            
            <div className="grid grid-cols-3 gap-4 mb-8">
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

            {/* Render Saved Keys */}
            {initialKeys && initialKeys.length > 0 && (
              <div className="mt-12 pt-12 border-t border-white/5 space-y-6">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                  <Lock size={18} className="text-accent" />
                  Active Connections
                </h3>
                <div className="space-y-4">
                  {initialKeys.map((key) => {
                    const providerDef = PROVIDERS.find(p => p.id === key.provider);
                    return (
                      <div key={key.id} className="p-6 rounded-2xl bg-white/5 border border-white/5 transition-all hover:bg-white/10 group">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={cn("w-2 h-2 rounded-full", key.isActive ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" : "bg-zinc-600")} />
                            <h4 className="text-white font-bold text-sm tracking-wide">{providerDef?.name || key.provider}</h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleToggle(key.id, !key.isActive)}
                              className="text-xs px-3 py-1.5 rounded-full bg-black/40 text-zinc-400 font-bold hover:text-white border border-white/5 transition-colors"
                            >
                              {key.isActive ? "Pause" : "Activate"}
                            </button>
                            <button 
                              onClick={() => handleDelete(key.id)}
                              className="p-1.5 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all opacity-0 group-hover:opacity-100"
                              title="Revoke Key"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        
                        {key.config?.enabledModels && key.config.enabledModels.length > 0 && (
                          <div className="space-y-2 mt-4 pt-4 border-t border-white/5">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Default Model</label>
                            <select 
                              className="w-full bg-black/40 border border-white/5 rounded-xl py-3 px-4 text-xs text-white focus:outline-none focus:border-accent/50 appearance-none transition-all cursor-pointer hover:bg-black/60"
                              value={key.config.defaultModel}
                              onChange={(e) => handleModelChange(key.id, e.target.value)}
                            >
                              {key.config.enabledModels.map((model: string) => (
                                <option key={model} value={model} className="bg-zinc-900 text-white">{model}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
