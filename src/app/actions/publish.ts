"use server";

import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { InstagramService } from "@/lib/social/instagram";
import { revalidatePath } from "next/cache";

export async function approveAndPost(postId: string) {
  try {
    // 1. Fetch the post data
    const [post] = await db.select().from(posts).where(eq(posts.id, postId));

    if (!post || !post.imageUrl) {
      throw new Error("Post asset not found or missing image");
    }

    if (post.status === 'published') {
      throw new Error("This post has already been published.");
    }

    // 2. Clear for Instagram Publishing
    const result = await InstagramService.publishPhoto({
      imageUrl: post.imageUrl,
      caption: post.caption || ""
    });

    if (result.success) {
      // 3. Update status in database
      await db.update(posts)
        .set({ 
          status: 'published',
          instagramPostId: result.postId 
        })
        .where(eq(posts.id, postId));

      revalidatePath("/studio");
      return { success: true, postId: result.postId };
    } else {
      throw new Error(result.error || "Failed to publish to Instagram");
    }
  } catch (error: any) {
    console.error("Approve/Post Error:", error.message);
    return { success: false, error: error.message };
  }
}
