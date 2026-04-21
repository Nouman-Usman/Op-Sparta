"use server";

import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { aiKeys } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { eq, and, ne } from "drizzle-orm";

export async function deleteAiKey(id: string) {
  try {
    const supabase = await createClient();
    if (!supabase) throw new Error("Auth failed");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    await db.delete(aiKeys).where(
      and(
        eq(aiKeys.id, id),
        eq(aiKeys.userId, user.id)
      )
    );

    revalidatePath("/settings");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleAiKey(id: string, active: boolean) {
  try {
    const supabase = await createClient();
    if (!supabase) throw new Error("Auth failed");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    if (active) {
      // Deactivate all other keys if this one is being activated
      // (Enforce only one active key if desired)
      await db.update(aiKeys)
        .set({ isActive: false })
        .where(
          and(
            eq(aiKeys.userId, user.id),
            ne(aiKeys.id, id)
          )
        );
    }

    await db.update(aiKeys)
      .set({ isActive: active })
      .where(
        and(
          eq(aiKeys.id, id),
          eq(aiKeys.userId, user.id)
        )
      );

    revalidatePath("/settings");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateAiModel(id: string, model: string) {
  try {
    const supabase = await createClient();
    if (!supabase) throw new Error("Auth failed");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Fetch current key
    const [key] = await db.select().from(aiKeys).where(eq(aiKeys.id, id)).limit(1);
    
    if (!key) throw new Error("Key not found");

    const newConfig = {
      ...key.config,
      defaultModel: model,
    };

    await db.update(aiKeys)
      .set({ config: newConfig as any })
      .where(
        and(
          eq(aiKeys.id, id),
          eq(aiKeys.userId, user.id)
        )
      );

    revalidatePath("/settings");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
