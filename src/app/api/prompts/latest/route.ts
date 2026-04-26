import { NextResponse } from "next/server";
import { db } from "@/db";
import { prompts, posts } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    // Extract postId from query parameters
    const url = new URL(req.url);
    const postId = url.searchParams.get("postId");

    console.log(`📤 [Prompts Latest] Fetching latest prompt for postId: ${postId}`);

    // Validate postId is provided
    if (!postId) {
      console.warn("⚠️ [Prompts Latest] Missing postId query parameter");
      return NextResponse.json(
        { success: false, error: "postId query parameter is required" },
        { status: 400 }
      );
    }

    // Verify post exists
    const [post] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (!post) {
      console.error(`❌ [Prompts Latest] Post not found with ID: ${postId}`);
      return NextResponse.json(
        { success: false, error: "Post not found" },
        { status: 404 }
      );
    }

    // Query prompts table for the latest prompt
    const [latestPrompt] = await db
      .select()
      .from(prompts)
      .where(eq(prompts.postId, postId))
      .orderBy(desc(prompts.createdAt))
      .limit(1);

    if (!latestPrompt) {
      console.warn(`⚠️ [Prompts Latest] No prompts found for post: ${postId}`);
      return NextResponse.json(
        { success: false, error: "No prompts found for this post" },
        { status: 404 }
      );
    }

    console.log(`✅ [Prompts Latest] Successfully retrieved prompt version ${latestPrompt.version} for post: ${postId}`);

    return NextResponse.json(
      {
        success: true,
        data: {
          prompt: latestPrompt.prompt,
          version: parseInt(latestPrompt.version, 10),
          createdAt: latestPrompt.createdAt,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("❌ [Prompts Latest] Error fetching latest prompt:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
