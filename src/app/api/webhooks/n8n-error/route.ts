import { NextResponse } from "next/server";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * Sanitize an error string coming from n8n.
 * n8n sometimes forwards raw HTTP response bodies (HTML 400/500 pages).
 * This strips HTML, extracts a useful status line, and caps length.
 */
function sanitizeError(raw: string): string {
  const s = String(raw).trim();

  // Detect HTML pages (e.g. Google/Cloudflare error pages)
  if (/^<!doctype|^<html/i.test(s)) {
    // Try to pull the <title> text as a short summary
    const titleMatch = s.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) return `Upstream error: ${titleMatch[1].trim()}`;
    return "Upstream service returned an HTML error page.";
  }

  // Strip any residual HTML tags from mixed content
  const stripped = s.replace(/<[^>]+>/g, " ").replace(/\s{2,}/g, " ").trim();

  // Truncate to 300 chars so the UI card doesn't overflow
  return stripped.length > 300 ? stripped.slice(0, 297) + "…" : stripped;
}

// Called by n8n when a generation workflow fails.
// Expected payload:
//   { postId?: string, projectId?: string, error: string, stage?: string }
//
// postId    — preferred; directly targets the failing post.
// projectId — fallback; smart-matches the latest 'generating' post for the project.
// error     — human-readable error message shown in the Studio UI.
// stage     — optional label of the n8n node/stage that failed (e.g. "image_synthesis").
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { postId, projectId, error, stage } = body;

    if (!error) {
      return NextResponse.json(
        { success: false, error: "Missing required field: error" },
        { status: 400 }
      );
    }

    const cleanError = sanitizeError(error);
    console.log(`📥 [N8N Error Webhook] stage: ${stage ?? "unknown"} | raw: ${String(error).slice(0, 120)} | clean: ${cleanError}`);

    let targetPostId = postId;

    // Smart fallback: find the latest generating post for this project
    if (!targetPostId && projectId) {
      console.log(`🔍 [N8N Error Webhook] No postId — searching latest 'generating' post for project: ${projectId}`);
      const [latest] = await db
        .select()
        .from(posts)
        .where(and(eq(posts.projectId, projectId), eq(posts.status, "generating")))
        .orderBy(desc(posts.createdAt))
        .limit(1);

      if (latest) {
        targetPostId = latest.id;
        console.log(`🎯 [N8N Error Webhook] Smart-matched to post: ${targetPostId}`);
      }
    }

    if (!targetPostId) {
      console.warn("⚠️ [N8N Error Webhook] Could not resolve a target post.");
      return NextResponse.json(
        { success: false, error: "Could not resolve target post" },
        { status: 400 }
      );
    }

    const errorPayload = stage ? `[${stage}] ${cleanError}` : cleanError;

    const result = await db
      .update(posts)
      .set({
        status: "failed",
        errorMessage: errorPayload,
        lastSyncedAt: new Date(),
      })
      .where(eq(posts.id, targetPostId))
      .returning();

    if (result.length === 0) {
      console.error(`❌ [N8N Error Webhook] No post found with ID: ${targetPostId}`);
      return NextResponse.json(
        { success: false, error: "Post not found" },
        { status: 404 }
      );
    }

    console.log(`✅ [N8N Error Webhook] Post ${targetPostId} marked as failed — ${errorPayload}`);

    revalidatePath("/studio");
    revalidatePath("/overview");

    return NextResponse.json({ success: true, message: "Error recorded on post" });
  } catch (err: any) {
    console.error("❌ [N8N Error Webhook] Unhandled exception:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
