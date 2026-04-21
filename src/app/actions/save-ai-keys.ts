"use server";

import { db } from "@/db";
import { aiKeys } from "@/db/schema";
import { encrypt } from "@/lib/encryption";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { eq, and } from "drizzle-orm";

export async function saveAiKey(provider: "openai" | "google", apiKey: string) {
  try {
    const supabase = await createClient();
    if (!supabase) throw new Error("Auth failed");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // 1. Validate the API key and fetch available models
    let isValid = false;
    let availableModels: string[] = [];

    if (provider === "openai") {
      const res = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (res.ok) {
        isValid = true;
        const data = await res.json();
        availableModels = data.data
          .map((m: any) => m.id)
          .filter((id: string) => id.startsWith("gpt-4") || id.startsWith("gpt-3.5")); // Filter for useful models
      }
    } else if (provider === "google") {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      );
      if (res.ok) {
        isValid = true;
        const data = await res.json();
        availableModels = data.models
          .map((m: any) => m.name.replace("models/", ""))
          .filter((id: string) => id.includes("gemini"));
      }
    }

    if (!isValid || availableModels.length === 0) {
      throw new Error(`The provided key is invalid or has no accessible models for ${provider === 'openai' ? 'OpenAI' : 'Google Gemini'}.`);
    }

    // 2. Encrypt the key
    const { encryptedData, iv } = encrypt(apiKey);

    // 3. Save encrypted key to DB using Drizzle
    await db.insert(aiKeys)
      .values({
        userId: user.id,
        provider,
        encryptedKey: encryptedData,
        iv,
        isActive: true, // Auto-activate new keys
        config: {
          defaultModel: availableModels[0], // Set first available as default
          enabledModels: availableModels,
        }
      })
      .onConflictDoUpdate({
        target: [aiKeys.userId, aiKeys.provider],
        set: {
          encryptedKey: encryptedData,
          iv,
          config: {
            defaultModel: availableModels[0],
            enabledModels: availableModels,
          },
          updatedAt: new Date(),
        },
      });

    revalidatePath("/settings");
    return { success: true };
  } catch (error: any) {
    console.error("Save Key Error:", error);
    return { success: false, error: error.message };
  }
}
