"use server";

import { generateObject } from "ai";
import { z } from "zod";
import { db } from "@/db";
import { posts, aiKeys } from "@/db/schema";
import { eq, and, desc, gte } from "drizzle-orm";
import { decrypt } from "@/lib/encryption";
import { getVisionModel } from "@/lib/ai/providers";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

const ImageCaptionSchema = z.object({
  hook: z.string().describe("Opening line (first 125 chars) — must grab attention before the 'more' cutoff."),
  caption: z.string().describe("Full caption: hook + body. Hashtags placed at END. 150-300 chars total."),
  hashtags: z.array(z.string()).describe("Highly relevant hashtags without the # symbol."),
  commentKeywords: z.array(z.string()).max(5).describe("Keywords to post in first comment for SEO — must match the hook/caption topic cluster exactly."),
  altText: z.string().describe("Accessible image description, 1-2 sentences."),
  suggestedPlatform: z.enum(["Instagram", "LinkedIn", "TikTok", "Twitter"]),
});

export type ImageCaption = z.infer<typeof ImageCaptionSchema>;

export async function analyzeImageAndGenerate(
  imageUrl: string,
  tone: string = "viral",
  hashtagCount: number = 3
): Promise<
  { success: true; postId: string; analysis: ImageCaption } |
  { success: false; error: string }
> {
  try {
    const supabase = await createClient();
    if (!supabase) return { success: false, error: "Auth failed" };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const [aiKey] = await db
      .select()
      .from(aiKeys)
      .where(and(eq(aiKeys.userId, user.id), eq(aiKeys.isActive, true)))
      .limit(1);

    if (!aiKey) return { success: false, error: "No active AI API key. Add one in Settings." };

    const apiKey = decrypt(aiKey.encryptedKey, aiKey.iv);
    const model = getVisionModel(aiKey.provider as any, apiKey);

    // Fetch the image as a buffer to pass directly to the AI model.
    // This bypasses potential public access issues with the URL.
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) {
      throw new Error(`Failed to fetch image for analysis: ${imageRes.statusText}`);
    }
    const imageBuffer = await imageRes.arrayBuffer();

    const result = await generateObject({
      model,
      schema: ImageCaptionSchema,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", image: imageBuffer },
            {
              type: "text",
              text: `You are an expert Instagram growth strategist. Analyze this image and generate viral-ready content.

TONE: Use a ${tone} tone.
HASHTAGS: Provide exactly ${hashtagCount} hashtags.

CRITICAL Instagram 2026 rules you MUST follow:
- Place hashtags at the very end of the caption
- The hook, caption body, hashtags, and comment keywords MUST share the same topic cluster for SEO alignment
- Hook must be the first sentence — make it stop-the-scroll worthy
- Sound human and relatable, never corporate

Generate the caption, hashtags, comment keywords, and alt text now.`,
            },
          ],
        },
      ],
    });

    const [newPost] = await db.insert(posts).values({
      userId: user.id,
      projectId: null,
      source: "upload",
      imageUrl,
      caption: result.object.caption,
      hashtags: result.object.hashtags,
      status: "ready",
    }).returning({ id: posts.id });

    revalidatePath("/upload");
    return { success: true, postId: newPost.id, analysis: result.object };
  } catch (error: any) {
    console.error("Analysis Error:", error);
    return { success: false, error: error.message || "Failed to analyze image" };
  }
}

export async function scheduleUploadPost(
  postId: string,
  scheduledFor: Date,
  timezone: string
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createClient();
  if (!supabase) return { success: false, error: "Auth failed" };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  await db.update(posts)
    .set({ scheduledFor, status: "pending", targetTimezone: timezone })
    .where(and(eq(posts.id, postId), eq(posts.userId, user.id)));

  revalidatePath("/upload");
  return { success: true };
}

export async function checkOneHourRule(userId: string): Promise<{
  canPost: boolean;
  nextAvailable: Date | null;
  lastPostAt: Date | null;
}> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const [lastPost] = await db
    .select({ createdAt: posts.createdAt })
    .from(posts)
    .where(and(
      eq(posts.userId, userId),
      gte(posts.createdAt, oneHourAgo),
      eq(posts.status, "published"),
    ))
    .orderBy(desc(posts.createdAt))
    .limit(1);

  if (!lastPost) return { canPost: true, nextAvailable: null, lastPostAt: null };

  const nextAvailable = new Date(lastPost.createdAt.getTime() + 60 * 60 * 1000);
  return { canPost: false, nextAvailable, lastPostAt: lastPost.createdAt };
}
