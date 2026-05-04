import { NextResponse } from "next/server";
import { db } from "@/db";
import { posts, users } from "@/db/schema";
import { eq, and, lte, isNotNull, or } from "drizzle-orm";
import { InstagramService } from "@/lib/social/instagram";

// Vercel cron jobs invoke routes with GET
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const duePosts = await db
    .select()
    .from(posts)
    .where(
      and(
        or(eq(posts.status, "pending"), eq(posts.status, "ready")),
        isNotNull(posts.scheduledFor),
        lte(posts.scheduledFor, now)
      )
    );

  if (duePosts.length === 0) {
    return NextResponse.json({ processed: 0, message: "No posts due" });
  }

  const results = await Promise.allSettled(
    duePosts.map(async (post) => {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, post.userId));

      if (!user?.instagramAccessToken || !user?.instagramPageId) {
        return { postId: post.id, published: false, reason: "no_instagram_credentials" };
      }

      const creds = {
        accessToken: user.instagramAccessToken,
        businessId: user.instagramPageId,
      };

      let igResult;
      if (post.videoUrl) {
        igResult = await InstagramService.publishVideo(
          { videoUrl: post.videoUrl, caption: post.caption ?? "" },
          creds
        );
      } else if (post.imageUrl) {
        igResult = await InstagramService.publishPhoto(
          { imageUrl: post.imageUrl, caption: post.caption ?? "" },
          creds
        );
      } else {
        return { postId: post.id, published: false, reason: "no_media_url" };
      }

      if (igResult.success) {
        await db
          .update(posts)
          .set({
            status: "published",
            instagramPostId: igResult.postId,
            instagramPermalink: igResult.permalink,
          })
          .where(eq(posts.id, post.id));
        return { postId: post.id, published: true };
      }

      // Keep as pending so the next cron invocation retries
      console.error(`[cron] Failed to publish post ${post.id}:`, igResult.error);
      return { postId: post.id, published: false, reason: igResult.error };
    })
  );

  const summary = results.map((r) =>
    r.status === "fulfilled" ? r.value : { published: false, reason: r.reason?.message }
  );

  const publishedCount = summary.filter((r) => r.published).length;
  console.log(`[cron] Processed ${duePosts.length} due posts, published ${publishedCount}`);

  return NextResponse.json({ processed: duePosts.length, published: publishedCount, results: summary });
}
