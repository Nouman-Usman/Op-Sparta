import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { aiKeys, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import SettingsClient from "@/components/settings/SettingsClient";
import { Shield } from "lucide-react";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const supabase = await createClient();
  if (!supabase) return redirect("/login");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  let userKeys: any[] = [];
  let rawIntegrationData: {
    n8nGenerationWebhook?: string | null;
    instagramAccessToken?: string | null;
    instagramPageId?: string | null;
    instagramUsername?: string | null;
    instagramProfilePic?: string | null;
    timezone?: string | null;
    scheduleSlots?: { days: number[]; times: { hour: number; minute: number }[] } | null;
  } | undefined;

  // Keep settings page available even if DB schema or connection is temporarily unhealthy.
  try {
    const [keysResult, integrationResult] = await Promise.all([
      db
        .select()
        .from(aiKeys)
        .where(eq(aiKeys.userId, user.id)),
      db
        .select({
          n8nGenerationWebhook: users.n8nGenerationWebhook,
          instagramAccessToken: users.instagramAccessToken,
          instagramPageId: users.instagramPageId,
          timezone: users.timezone,
          scheduleSlots: users.scheduleSlots,
        })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1),
    ]);

    userKeys = keysResult;
    rawIntegrationData = integrationResult[0] as any;
  } catch (error) {
    console.error("SettingsPage: failed to load DB settings data", error);
  }

  let integrationData = Object.assign({}, rawIntegrationData);

  // Fetch live Instagram profile details if connected
  if (integrationData?.instagramAccessToken && integrationData?.instagramPageId) {
    try {
      const res = await fetch(
        `https://graph.facebook.com/v19.0/${integrationData.instagramPageId}?fields=username,profile_picture_url&access_token=${integrationData.instagramAccessToken}`
      );
      if (res.ok) {
        const data = await res.json();
        integrationData = {
          ...integrationData,
          instagramUsername: data.username,
          instagramProfilePic: data.profile_picture_url,
        };
      }
    } catch (e) {
      console.error("Failed to fetch Instagram profile details");
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700 sm:px-6 lg:px-8 lg:py-12">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl sm:rounded-4xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6 sm:p-10 backdrop-blur-xl">
        <div className="relative z-10">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 border border-white/10">
            <Shield className="text-cyan-400" size={14} />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-300">Workspace Settings</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl mb-4">
            Configuration
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
            Configure social destinations, automated schedules, and AI providers for your workspace.
            We follow a <span className="font-semibold text-white">Bring Your Own Key</span> model to keep full control in your hands.
          </p>
        </div>
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-[80px] pointer-events-none" />
      </div>

      <SettingsClient
        initialKeys={userKeys as any}
        integrationData={integrationData || {}}
        userTimezone={rawIntegrationData?.timezone ?? null}
        userScheduleSlots={rawIntegrationData?.scheduleSlots ?? null}
      />
    </div>
  );
}
