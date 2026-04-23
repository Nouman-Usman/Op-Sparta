"use server";

import { db } from "@/db";
import { posts, projects, users } from "@/db/schema";
import { eq, sum } from "drizzle-orm";
import { InstagramService } from "@/lib/social/instagram";
import { revalidatePath } from "next/cache";

/**
 * Sync metrics for a specific post from the Instagram API
 */
export async function syncPostMetrics(postId: string) {
  try {
    const [post] = await db.select().from(posts).where(eq(posts.id, postId));
    
    if (!post || !post.instagramPostId) {
      return { success: false, error: "Post has not been published to Instagram yet." };
    }

    // Fetch user credentials from DB
    const [user] = await db.select().from(users).where(eq(users.id, post.userId));
    if (!user || !user.instagramAccessToken) {
       throw new Error("Instagram access token not found for this operator.");
    }

    const result = await InstagramService.getMediaInsights(
      post.instagramPostId,
      { accessToken: user.instagramAccessToken }
    );

    if (result.success) {
      await db.update(posts)
        .set({
          metrics: result.data,
          lastSyncedAt: new Date()
        })
        .where(eq(posts.id, postId));

      revalidatePath("/studio");
      return { success: true, metrics: result.data };
    } else {
      throw new Error(result.error);
    }
  } catch (error: any) {
    console.error("Metric Sync Error:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Get highly-aggregated global stats for the Overview Dashboard
 */
export async function getGlobalMetrics() {
  try {
     const allPosts = await db.select().from(posts);
     
     let totalLikes = 0;
     let totalComments = 0;
     let totalReach = 0;

     allPosts.forEach(post => {
       if (post.metrics) {
         totalLikes += post.metrics.likes || 0;
         totalComments += post.metrics.comments || 0;
         totalReach += post.metrics.reach || 0;
       }
     });

     return {
       totalReach,
       totalEngagement: totalLikes + totalComments,
       postCount: allPosts.length,
       publishedCount: allPosts.filter(p => p.status === 'published').length
     };
  } catch (error) {
    return { totalReach: 0, totalEngagement: 0, postCount: 0, publishedCount: 0 };
  }
}
