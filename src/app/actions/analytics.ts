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

/**
 * Get detailed analytics for the dedicated Analytics Page
 */
export async function getDetailedAnalytics() {
  try {
    const allPosts = await db.select().from(posts).where(eq(posts.status, 'published'));
    
    let totalLikes = 0;
    let totalComments = 0;
    let totalReach = 0;
    let totalEngagement = 0;

    // Time-series data (last 30 days)
    const timeData: Record<string, { engagement: number; reach: number }> = {};
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const key = d.toISOString().split('T')[0];
      timeData[key] = { engagement: 0, reach: 0 };
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    allPosts.forEach(post => {
      const createdAt = post.createdAt || new Date();
      if (createdAt < thirtyDaysAgo) return; // Skip older posts

      const m = post.metrics as any;
      if (m) {
        totalLikes += m.likes || 0;
        totalComments += m.comments || 0;
        totalReach += m.reach || 0;
        totalEngagement += (m.likes || 0) + (m.comments || 0);

        // Map to time series
        const dateKey = createdAt.toISOString().split('T')[0];
        if (dateKey && timeData[dateKey]) {
          timeData[dateKey].engagement += (m.likes || 0) + (m.comments || 0);
          timeData[dateKey].reach += m.reach || 0;
        }
      }
    });

    const engagementRateVal = totalReach > 0 ? (totalEngagement / totalReach) : 0;
    
    // Heuristic-based Neural Insights
    const avgCaptionLength = allPosts.reduce((acc, p) => acc + (p.caption?.length || 0), 0) / (allPosts.length || 1);
    const publishedRatio = allPosts.length > 0 ? (allPosts.filter(p => p.status === 'published').length / allPosts.length) : 0;
    
    const visualEngagement = Math.min(Math.round(engagementRateVal * 5000), 100);
    const narrativeDepth = Math.min(Math.round(avgCaptionLength / 3), 100);
    const brandAlignment = Math.min(Math.round(publishedRatio * 100), 100);
    const audienceGrowth = Math.min(Math.round(totalReach / 1000), 100);

    return {
      success: true,
      stats: {
        totalReach: totalReach.toLocaleString(),
        engagementRate: `${(engagementRateVal * 100).toFixed(1)}%`,
        totalLikes: totalLikes.toLocaleString(),
        totalComments: totalComments.toLocaleString(),
      },
      insights: {
        visualEngagement,
        narrativeDepth,
        brandAlignment,
        audienceGrowth
      },
      timeSeries: Object.entries(timeData).map(([date, vals]) => ({
        date,
        ...vals
      }))
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
