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
          .filter((id: string) => id.startsWith("gpt-4") || id.startsWith("gpt-3.5")); 
      }
    } else if (provider === "google") {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      );
      if (res.ok) {
        const data = await res.json();
        const models = data.models || [];
        
        // 1. Identify Image/Video Synthesis Models
        const imageModels = models.filter((m: any) => 
          m.name.includes("image") || m.name.includes("video") || m.name.includes("flash")
        );

        availableModels = imageModels.map((m: any) => m.name.replace("models/", ""));
        console.log("Generative Assets Probe:", availableModels);

        // 2. Strict Paid-Tier Synthesis Verification
        // In AI Studio, paid accounts get access to the '002' and 'non-preview' stable production endpoints.
        const hasHighFidelityImage = imageModels.some((m: any) => 
          (m.name.includes("2.5-flash-image") && !m.name.includes("preview")) || 
          m.name.includes("1.5-pro-002")
        );

        // If the only image models are 'preview' or 'experimental', we flag it.
        const onlyPreviews = imageModels.every((m: any) => m.name.includes("preview") || m.name.includes("exp"));

        if (onlyPreviews || !hasHighFidelityImage) {
           // We allow it but with a MAJOR warning if it's borderline, 
           // but the user wants to ENSURE it's paid, so we reject 'preview-only' keys.
           if (onlyPreviews) {
             throw new Error("Synthesis Lockdown: Your key only has 'Preview' access to generative models. Op-Sparta requires a Production/Paid tier for stable image & video synthesis.");
           }
        }
        
        isValid = true;
      } else {
        throw new Error("Invalid Google API Key.");
      }
    } else if (provider === "higgsfield") {
      if (!higgsfieldAccessKey) {
        throw new Error("Higgsfield Access Key is required.");
      }

      isValid = true;
      availableModels = ["higgsfield-video-v2-hq"];
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
