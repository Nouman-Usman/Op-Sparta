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

  // Fetch all keys and user integration data
  const userKeys = await db
    .select()
    .from(aiKeys)
    .where(eq(aiKeys.userId, user.id));

  const [integrationData] = await db
    .select({ 
      n8nGenerationWebhook: users.n8nGenerationWebhook,
      instagramAccessToken: users.instagramAccessToken, 
      instagramPageId: users.instagramPageId 
    })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  return (
    <div className="p-8 max-w-5xl mx-auto w-full space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Shield className="text-accent" size={16} />
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500">Security & Integration</span>
        </div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight">
          System Configuration
        </h1>
        <p className="text-zinc-400 mt-2 max-w-2xl">
          Configure your AI generation engine and social publishing destinations.
          We follow a <span className="text-white font-medium">Bring Your Own Key</span> and <span className="text-white font-medium">Engine</span> model for maximum privacy.
        </p>
      </div>

      <SettingsClient 
        initialKeys={userKeys as any} 
        integrationData={integrationData || {}} 
      />
    </div>
  );
}
