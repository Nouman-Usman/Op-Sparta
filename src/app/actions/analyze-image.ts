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
  hook: z.string().describe("Opening line, max 125 chars. Appears before Instagram's 'more' fold. Must stop the scroll — use a bold claim, question, or tension that makes the reader NEED to tap 'more'."),
  caption: z.string().describe("Full marketing caption: Hook → 1-3 sentence value/story body → clear CTA. No hashtags here — placed separately at end. 80-220 words. Line breaks every 2-3 sentences for mobile readability. Strategic emojis allowed."),
  hashtags: z.array(z.string()).describe("Hashtags without # symbol. Mix: 40% niche (10k-100k posts), 40% mid-tier (100k-1M), 20% broad (1M+). All must match the image topic cluster."),
  commentKeywords: z.array(z.string()).max(5).describe("3-5 keywords for first comment SEO boost — tightly aligned with caption topic."),
  altText: z.string().describe("Accessibility alt text, 1-2 sentences describing image content and mood."),
  suggestedPlatform: z.enum(["Instagram", "LinkedIn", "TikTok", "Twitter"]),
});

export type ImageCaption = z.infer<typeof ImageCaptionSchema>;

const TONE_GUIDE: Record<string, string> = {
  viral:       "Viral & Punchy — short sentences, bold claims, high-energy. Every word earns its place. Optimised for saves and shares.",
  educational: "Educational & Deep — teach one specific insight clearly. Use analogies. End with a thought-provoking question that drives comments.",
  aggressive:  "Aggressive & Bold — confident, direct, zero hedging. Challenge the reader's current thinking. Strong polarising CTA.",
  minimalist:  "Clean & Minimalist — quiet confidence. Say more with less. One idea, perfectly expressed. No fluff, no emojis.",
  funny:       "Humorous & Relatable — self-aware, witty, human. Use irony or observation humour. CTA should be playful (e.g. 'Tag your bestie').",
};

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
              text: `You are a senior Instagram marketing strategist with a track record of 10M+ reach campaigns. Analyze this image and produce conversion-focused content following 2026 best practices.

TONE: ${TONE_GUIDE[tone] ?? TONE_GUIDE.viral}

HASHTAG RULES:
- Provide exactly ${hashtagCount} hashtags (no # symbol)
- Mix: ~40% niche (10k-100k posts), ~40% mid (100k-1M), ~20% broad (1M+)
- Every hashtag must directly relate to the image subject — no vanity tags (#love, #instagood, #photooftheday)

CAPTION STRUCTURE (mandatory):
1. HOOK (first line, ≤125 chars): Bold statement, provocative question, or surprising fact. This is what users see before tapping "more" — make it impossible to ignore.
2. BODY (2-4 sentences): Deliver value, tell a micro-story, or highlight a specific benefit. Use line breaks every 2-3 sentences. One strategic emoji per paragraph max.
3. CTA (final line): One clear, specific call-to-action. Match CTA to tone — e.g. "Drop a 🔥 if you agree", "Link in bio →", "Tag someone who needs this", "Save this for later".

MARKETING PRINCIPLES:
- Lead with the benefit, not the feature
- Use "you" language to speak directly to the audience
- Create FOMO, aspiration, or relatability — pick one and commit
- Never sound corporate or AI-generated
- Sentence variety: mix short punchy lines with one longer elaboration

OUTPUT: caption field must contain ONLY hook + body + CTA (no hashtags). Hashtags go in the hashtags array only.`,
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
