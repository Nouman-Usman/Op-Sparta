"use server";

import { db } from "@/db";
import { posts, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { InstagramService } from "@/lib/social/instagram";
import { revalidatePath } from "next/cache";

export async function approveAndPost(postId: string) {
  try {
    // 1. Fetch the post data
    const [post] = await db.select().from(posts).where(eq(posts.id, postId));

    if (!post) throw new Error("Post not found");

    // 2. Fetch User Credentials from the DB (not .env)
    const [user] = await db.select().from(users).where(eq(users.id, post.userId));
    
    if (!user || !user.instagramAccessToken || !user.instagramPageId) {
      throw new Error("Instagram credentials not configured in your settings. Please go to Settings and connect your account.");
    }

    const creds = {
      accessToken: user.instagramAccessToken,
      businessId: user.instagramPageId
    };

    // 3. Clear for Instagram Publishing (Image or Video)
    let result;
    if (post.videoUrl) {
      result = await InstagramService.publishVideo({
        videoUrl: post.videoUrl,
        caption: post.caption || ""
      }, creds);
    } else {
      result = await InstagramService.publishPhoto({
        imageUrl: post.imageUrl || "",
        caption: post.caption || ""
      }, creds);
    }

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
