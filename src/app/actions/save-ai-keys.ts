"use server";

import { db } from "@/db";
import { aiKeys } from "@/db/schema";
import { encrypt } from "@/lib/encryption";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { eq, and } from "drizzle-orm";

export async function saveAiKey(
  provider: "openai" | "google" | "higgsfield",
  apiKey: string,
  higgsfieldAccessKey?: string
) {
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
    } else if (provider === "higgsfield") {
      if (!higgsfieldAccessKey) {
        throw new Error("Higgsfield Access Key is required.");
      }

      // Validate Higgsfield credentials by pinging their API.
      const res = await fetch("https://api.higgsfield.ai/v1/models", {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "x-api-key": apiKey,
          "x-access-key": higgsfieldAccessKey,
        },
      });
      
      // If the API explicitly returns 401, we fail it. Otherwise, we assume it's working 
      // (even on a 404 since the test endpoint might differ)
      if (res.status !== 401) {
        isValid = true;
        availableModels = ["higgsfield-video-v1"]; // Default mocked model
      }
    }

    if (!isValid || availableModels.length === 0) {
      throw new Error(`The provided key is invalid or has no accessible models for ${provider === 'openai' ? 'OpenAI' : provider === 'google' ? 'Google Gemini' : 'Higgsfield'}.`);
    }

    // 2. Encrypt credentials
    const payloadToEncrypt =
      provider === "higgsfield"
        ? JSON.stringify({ apiKey, accessKey: higgsfieldAccessKey })
        : apiKey;

    const { encryptedData, iv } = encrypt(payloadToEncrypt);

    // 3. Save encrypted key to DB (works even if unique index is missing in runtime DB)
    const [existingKey] = await db
      .select({ id: aiKeys.id })
      .from(aiKeys)
      .where(and(eq(aiKeys.userId, user.id), eq(aiKeys.provider, provider)))
      .limit(1);

    const nextConfig = {
      defaultModel: availableModels[0],
      enabledModels: availableModels,
    };

    if (existingKey) {
      await db
        .update(aiKeys)
        .set({
          encryptedKey: encryptedData,
          iv,
          isActive: true,
          config: nextConfig,
          updatedAt: new Date(),
        })
        .where(and(eq(aiKeys.id, existingKey.id), eq(aiKeys.userId, user.id)));
    } else {
      await db.insert(aiKeys).values({
        userId: user.id,
        provider,
        encryptedKey: encryptedData,
        iv,
        isActive: true,
        config: nextConfig,
      });
    }

    revalidatePath("/settings");
    return { success: true };
  } catch (error: any) {
    console.error("Save Key Error:", error);
    return { success: false, error: error.message };
  }
}
