import { generateObject } from "ai";
import { z } from "zod";
import { getModel } from "./providers";
import { db } from "@/db";
import { aiKeys } from "@/db/schema";
import { decrypt } from "@/lib/encryption";
import { eq, and } from "drizzle-orm";

// The schema for our AI-generated social content
export const SocialPostSchema = z.object({
  caption: z.string().describe("The social media caption, including emojis if appropriate."),
  headline: z.string().describe("A catchy headline or hook for the post."),
  imagePrompt: z.string().describe("Highly detailed description for an AI image generator to create the visual for this post."),
  hashtags: z.array(z.string()).describe("A list of relevant hashtags."),
  targetPlatform: z.enum(["Instagram", "LinkedIn", "TikTok", "Twitter"]).describe("The best platform for this specific content."),
  supervisionScore: z.number().min(1).max(10).describe("Quality score from 1-10 based on brand alignment and viral potential."),
  supervisionFeedback: z.string().describe("Brief internal feedback on why this score was given."),
});

export type SocialPost = z.infer<typeof SocialPostSchema>;

export async function generateSocialContent(
  userId: string,
  projectData: {
    name: string;
    industry: string;
    description: string;
    tone: string;
    targetAudience: string;
  }
) {
  // 1. Fetch the user's ACTIVE API key from the database using Drizzle
  const [aiKey] = await db
    .select()
    .from(aiKeys)
    .where(
      and(
        eq(aiKeys.userId, userId),
        eq(aiKeys.isActive, true)
      )
    )
    .limit(1);

  if (!aiKey) {
    throw new Error("No active AI API key found. Please activate one in settings.");
  }

  // 2. Decrypt the key securely on the server
  const apiKey = decrypt(aiKey.encryptedKey, aiKey.iv);

  // 3. Initialize the model using the user's provider and preferred model
  const modelId = aiKey.config?.defaultModel || (aiKey.provider === 'openai' ? 'gpt-4o' : 'gemini-1.5-pro-latest');
  const model = getModel(aiKey.provider as any, modelId as any, apiKey);

  const result = await generateObject({
    model,
    schema: SocialPostSchema,
    system: `You are the Operation Sparta AI Content Architect. 
    Your mission is to convert product data into high-performing social media content.
    
    CRITICAL QUALITY STANDARDS:
    1. Authenticity: Avoid "corporate speak". Sound human and engaging.
    2. Visual Hook: The imagePrompt must be cinematic and visually stunning.
    3. Performance: Every post must have a clear value proposition or emotional hook.
    4. Supervision: You must honestly score your own creation from 1-10. If it's below 8, explain why in feedback.`,
    prompt: `Generate a premium social media post for the following project:
    Project Name: ${projectData.name}
    Industry: ${projectData.industry}
    Description: ${projectData.description}
    Brand Tone: ${projectData.tone}
    Target Audience: ${projectData.targetAudience}
    
    Ensure the content is tailored to the specific platform you choose as the best fit.`,
  });

  return result.object;
}
