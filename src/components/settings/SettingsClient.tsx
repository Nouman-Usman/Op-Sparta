"use client";

import { useState, useTransition } from "react";
import { 
  Key, 
  ArrowRight,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Trash2,
  Instagram,
  CheckCircle2,
  Link2,
  Shield,
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
  const [higgsfieldAccessKey, setHiggsfieldAccessKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [aiFeedback, setAiFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const isInstagramConnected = !!integrationData?.instagramAccessToken;
  const activeKeyCount = initialKeys?.filter((k) => k.isActive)?.length || 0;

  const handleSaveAiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setAiFeedback(null);
    if (!apiKey) return;
    if (selectedProvider === "higgsfield" && !higgsfieldAccessKey) {
      setAiFeedback({ type: "error", message: "Higgsfield Access Key is required." });
      return;
    }

    startTransition(async () => {
      const result = await saveAiKey(selectedProvider, apiKey, higgsfieldAccessKey);
      if (result.success) {
        setAiFeedback({ type: 'success', message: `${PROVIDERS.find(p => p.id === selectedProvider)?.name} key saved.` });
        setApiKey("");
        setHiggsfieldAccessKey("");
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
    <div className="space-y-6 sm:space-y-8">
      <section className="overflow-hidden rounded-4xl bg-zinc-900/70 p-5 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-cyan-300">
              <Shield size={12} />
              Control Center
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Integrations and Provider Vault</h2>
            <p className="max-w-2xl text-sm text-zinc-400 sm:text-base">
              Manage your social connection and AI credentials from one panel. Keys are encrypted and can be activated or paused at any time.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:w-auto">
            <div className="rounded-2xl bg-zinc-800/60 px-4 py-3 text-center">
              <div className="text-xl font-black text-white">{activeKeyCount}</div>
              <div className="text-[10px] uppercase tracking-widest text-zinc-500">Active Keys</div>
            </div>
            <div className="rounded-2xl bg-zinc-800/60 px-4 py-3 text-center">
              <div className={cn("text-xl font-black", isInstagramConnected ? "text-cyan-300" : "text-zinc-500")}>
                {isInstagramConnected ? "Live" : "Off"}
              </div>
              <div className="text-[10px] uppercase tracking-widest text-zinc-500">Instagram</div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-1">
          <section className={cn(
            "rounded-4xl bg-zinc-900/70 p-5 sm:p-6",
            isInstagramConnected ? "shadow-[0_0_0_1px_rgba(34,211,238,0.25)]" : ""
          )}>
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-pink-500/15">
                  <Instagram className="text-pink-400" size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Instagram</h3>
                  <p className="text-xs text-zinc-500">Publishing destination</p>
                </div>
              </div>

              <div className={cn(
                "rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest",
                isInstagramConnected ? "bg-cyan-300/10 text-cyan-300" : "bg-zinc-800 text-zinc-500"
              )}>
                {isInstagramConnected ? "Connected" : "Not Connected"}
              </div>
            </div>

            {isInstagramConnected ? (
              <div className="space-y-4">
                <div className="rounded-2xl bg-black/30 p-4">
                  <div className="flex items-center gap-3">
                    {integrationData.instagramProfilePic ? (
                      <img
                        src={integrationData.instagramProfilePic}
                        alt="Instagram Profile"
                        className="h-12 w-12 rounded-full"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
                        <Instagram size={18} className="text-zinc-500" />
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-bold text-white">
                        {integrationData.instagramUsername ? `@${integrationData.instagramUsername}` : "Instagram Page"}
                      </div>
                      <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-cyan-300">
                        <CheckCircle2 size={12} />
                        Authenticated
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <a
                    href="/api/auth/instagram"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-800 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-zinc-700"
                  >
                    <Link2 size={16} />
                    Reconnect
                  </a>
                  <DisconnectButton />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm leading-relaxed text-zinc-500">
                  Link your Instagram Business account to enable one-click publish from studio.
                </p>
                <a
                  href="/api/auth/instagram"
                  className="inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-linear-to-r from-cyan-300 to-cyan-500 px-4 py-3.5 text-sm font-bold text-black shadow-[0_0_30px_rgba(34,211,238,0.2)] transition-all hover:opacity-90"
                >
                  <Instagram size={18} />
                  Authenticate Instagram
                </a>
              </div>
            )}
          </section>

        </div>

        <section className="rounded-4xl bg-zinc-900/70 p-5 sm:p-6 xl:col-span-2">
          <div className="mb-6 flex flex-col gap-2">
            <h3 className="flex items-center gap-2 text-xl font-bold text-white">
              <Key size={20} className="text-cyan-300" />
              Provider Credentials
            </h3>
            <p className="text-sm text-zinc-500">Select a provider, save a key, then activate and choose default models below.</p>
          </div>

          <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {PROVIDERS.map((provider) => (
              <button
                key={provider.id}
                onClick={() => setSelectedProvider(provider.id as any)}
                className={cn(
                  "rounded-xl px-3 py-3 text-left transition-all",
                  selectedProvider === provider.id
                    ? "bg-cyan-300/10 shadow-[0_0_0_1px_rgba(34,211,238,0.3)]"
                    : "bg-zinc-800/60 hover:bg-zinc-800"
                )}
              >
                <div className={cn("text-xs font-black uppercase tracking-widest", selectedProvider === provider.id ? "text-cyan-300" : "text-zinc-300")}>
                  {provider.name}
                </div>
                <div className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-zinc-500">{provider.description}</div>
              </button>
            ))}
          </div>

          <form onSubmit={handleSaveAiKey} className="space-y-4 rounded-2xl bg-black/30 p-4">
            {selectedProvider === "higgsfield" && (
              <div className="relative group">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-cyan-300" size={18} />
                <input
                  type={showKey ? "text" : "password"}
                  value={higgsfieldAccessKey}
                  onChange={(e) => setHiggsfieldAccessKey(e.target.value)}
                  placeholder="Paste Higgsfield access key"
                  className="w-full rounded-xl bg-zinc-800 py-3 pl-11 pr-11 font-mono text-sm text-white transition-all focus:outline-none focus:ring-2 focus:ring-cyan-300/40"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            )}

            <div className="relative group">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-cyan-300" size={18} />
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={selectedProvider === "higgsfield" ? "Paste Higgsfield API key" : "Paste API key"}
                className="w-full rounded-xl bg-zinc-800 py-3 pl-11 pr-11 font-mono text-sm text-white transition-all focus:outline-none focus:ring-2 focus:ring-cyan-300/40"
                required
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {aiFeedback && (
              <div className={cn(
                "rounded-xl border p-3 text-sm font-medium",
                aiFeedback.type === "success"
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                  : "border-red-500/20 bg-red-500/10 text-red-400"
              )}>
                {aiFeedback.message}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending || !apiKey || (selectedProvider === "higgsfield" && !higgsfieldAccessKey)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-cyan-300 to-cyan-500 px-4 py-3 text-sm font-bold text-black shadow-[0_0_30px_rgba(34,211,238,0.2)] transition-all hover:opacity-90 disabled:opacity-50"
            >
              {isPending ? <Loader2 className="animate-spin" size={16} /> : <><span>Save Provider Key</span><ArrowRight size={16} /></>}
            </button>
          </form>

          <div className="mt-8 pt-2">
            <h4 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-zinc-400">
              <Lock size={14} />
              Active Connections
            </h4>

            {initialKeys?.length ? (
              <div className="space-y-3">
                {initialKeys.map((key) => {
                  const providerDef = PROVIDERS.find((p) => p.id === key.provider);

                  return (
                    <div key={key.id} className="rounded-2xl bg-zinc-800/60 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={cn("h-2 w-2 rounded-full", key.isActive ? "bg-emerald-500" : "bg-zinc-600")} />
                          <div>
                            <p className="text-sm font-bold text-white">{providerDef?.name || key.provider}</p>
                            <p className="text-[11px] text-zinc-500">{key.isActive ? "Active" : "Paused"}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggle(key.id, !key.isActive)}
                            className="rounded-lg bg-black/40 px-3 py-1.5 text-xs font-bold text-zinc-300 transition-colors hover:text-white"
                          >
                            {key.isActive ? "Pause" : "Activate"}
                          </button>
                          <button
                            onClick={() => handleDelete(key.id)}
                            className="rounded-lg bg-red-500/10 p-1.5 text-red-400 transition-all hover:bg-red-500/20"
                            title="Revoke Key"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {key.config?.enabledModels && key.config.enabledModels.length > 0 && (
                        <div className="mt-4 pt-4">
                          <label className="mb-2 block pl-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                            Default Model
                          </label>
                          <select
                            className="w-full cursor-pointer appearance-none rounded-xl bg-black/40 px-3 py-2.5 text-xs text-white transition-all hover:bg-black/60 focus:outline-none focus:ring-2 focus:ring-cyan-300/40"
                            value={key.config.defaultModel}
                            onChange={(e) => handleModelChange(key.id, e.target.value)}
                          >
                            {key.config.enabledModels.map((model: string) => (
                              <option key={model} value={model} className="bg-zinc-900 text-white">
                                {model}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl bg-black/20 p-6 text-center">
                <p className="text-sm text-zinc-500">No provider keys saved yet.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
