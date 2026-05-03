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
        })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1),
    ]);

    userKeys = keysResult;
    rawIntegrationData = integrationResult[0];
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
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-5 animate-in fade-in slide-in-from-bottom-4 duration-700 sm:space-y-8 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      {/* Header */}
      <div className="rounded-4xl border border-white/5 bg-linear-to-br from-white/4 to-white/1 p-5 sm:p-7">
        <div className="mb-2 flex items-center gap-2">
          <Shield className="text-accent" size={16} />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Security and Integration</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Settings
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-400 sm:text-base">
          Configure social destinations and AI providers for your workspace.
          Operation Sparta follows a <span className="font-medium text-white">Bring Your Own Key</span> model to keep full control in your hands.
        </p>
      </div>

      <SettingsClient
        initialKeys={userKeys as any}
        integrationData={integrationData || {}}
        userTimezone={rawIntegrationData?.timezone ?? null}
      />
    </div>
  );
}
