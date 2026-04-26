import { NextResponse } from "next/server";
import { db } from "@/db";
import { posts, prompts } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { projectId, postId, userId, prompt } = body;

    console.log(`📥 [N8N Prompt Webhook] Payload received for Project: ${projectId}`);

    // Validate all 4 required fields
    if (!projectId || !postId || !userId || !prompt) {
      console.warn("⚠️ [N8N Prompt Webhook] Missing required fields");
      return NextResponse.json(
        { success: false, error: "Missing required fields: projectId, postId, userId, prompt" },
        { status: 400 }
      );
    }

    // Verify postId exists in posts table
    const [existingPost] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (!existingPost) {
      console.error(`❌ [N8N Prompt Webhook] Post not found with ID: ${postId}`);
      return NextResponse.json(
        { success: false, error: "Post ID not found" },
        { status: 404 }
      );
    }

    // Get max version for this postId and calculate next version
    const [latestPrompt] = await db
      .select()
      .from(prompts)
      .where(eq(prompts.postId, postId))
      .orderBy(desc(prompts.version))
      .limit(1);

    const nextVersion = latestPrompt
      ? String(parseInt(latestPrompt.version, 10) + 1)
      : "1";

    // Insert new prompt row
    const result = await db
      .insert(prompts)
      .values({
        id: crypto.randomUUID(),
        postId,
        projectId,
        userId,
        prompt,
        version: nextVersion,
      })
      .returning();

    if (result.length === 0) {
      console.error(`❌ [N8N Prompt Webhook] Failed to insert prompt for post: ${postId}`);
      return NextResponse.json(
        { success: false, error: "Failed to store prompt" },
        { status: 500 }
      );
    }

    console.log(`✅ [N8N Prompt Webhook] Successfully stored prompt v${nextVersion} for post: ${postId}`);

    return NextResponse.json({
      success: true,
      version: parseInt(nextVersion, 10),
      message: "Prompt successfully stored",
    });
  } catch (error: any) {
    console.error("❌ [N8N Prompt Webhook] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
