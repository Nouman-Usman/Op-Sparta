import { NextResponse } from "next/server";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Destructure without supervisionScore to ensure it's not "shared" or processed
    const { postId, projectId, imageUrl, videoUrl, caption } = body;
    
    console.log(`📥 [N8N Webhook Receiver] Payload received for Project: ${projectId}`);

    let targetPostId = postId;

    // Smart Fallback: If N8N didn't send a postId, find the most recent 'generating' placeholder for the project
    if (!targetPostId && projectId) {
       console.log(`🔍 [N8N Webhook Receiver] No postId found. Searching for latest 'generating' asset for Project: ${projectId}`);
       const [latestPending] = await db
         .select()
         .from(posts)
         .where(and(eq(posts.projectId, projectId), eq(posts.status, 'generating')))
         .orderBy(desc(posts.createdAt))
         .limit(1);
       
       if (latestPending) {
         targetPostId = latestPending.id;
         console.log(`🎯 [N8N Webhook Receiver] Smart-matched to Post: ${targetPostId}`);
       }
    }

    if (!targetPostId) {
      console.warn("⚠️ [N8N Webhook Receiver] Could not resolve a target Post to update.");
      return NextResponse.json({ success: false, error: "Cloud not resolve target asset" }, { status: 400 });
    }

    // Overwrite the placeholder post with the final high-computation generation assets
    // supervisionScore is intentionally omitted as per user request to not "share" it
    const result = await db.update(posts)
      .set({
        imageUrl: imageUrl || "",
        videoUrl: videoUrl || "",
        caption: caption || "",
        status: 'ready', // Elevate securely to ready state
        lastSyncedAt: new Date(),
      })
      .where(eq(posts.id, targetPostId))
      .returning();

    if (result.length === 0) {
       console.error(`❌ [N8N Webhook Receiver] No post found with ID: ${targetPostId}. Update failed.`);
       return NextResponse.json({ success: false, error: "Post ID not found" }, { status: 404 });
    }

    console.log(`✅ [N8N Webhook Receiver] Successfully updated post: ${targetPostId}`);

    // Force revalidation of the Studio and Overview pages to purge cached query results
    revalidatePath("/studio");
    revalidatePath("/overview");

    return NextResponse.json({ success: true, message: "Asset beautifully ingested into the SaaS engine" });
  } catch (error: any) {
    console.error("N8N Callback Webhook Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
