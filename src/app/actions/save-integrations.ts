"use server";

import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

export async function saveN8nWebhook(url: string) {
  try {
    const supabase = await createClient();
    if (!supabase) throw new Error("Auth failed");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      throw new Error("Please provide a valid URL.");
    }

    await db.update(users)
      .set({ n8nGenerationWebhook: url })
      .where(eq(users.id, user.id));

    revalidatePath("/settings");
    return { success: true };
  } catch (error: any) {
    console.error("Save Webhook Error:", error);
    return { success: false, error: error.message };
  }
}

export async function saveInstagramCredentials(accessToken: string, pageId: string) {
  try {
    const supabase = await createClient();
    if (!supabase) throw new Error("Auth failed");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    await db.update(users)
      .set({ 
        instagramAccessToken: accessToken,
        instagramPageId: pageId
      })
      .where(eq(users.id, user.id));

    revalidatePath("/settings");
    return { success: true };
  } catch (error: any) {
    console.error("Save Instagram Error:", error);
    return { success: false, error: error.message };
  }
}

export async function getIntegrations() {
  try {
    const supabase = await createClient();
    if (!supabase) return null;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const [userData] = await db.select({
      n8nGenerationWebhook: users.n8nGenerationWebhook,
      instagramAccessToken: users.instagramAccessToken,
      instagramPageId: users.instagramPageId
    })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

    return userData || null;
  } catch {
    return null;
  }
}
