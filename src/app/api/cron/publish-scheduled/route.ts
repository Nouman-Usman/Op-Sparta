import { NextResponse } from "next/server";
import { db } from "@/db";
import { posts, users } from "@/db/schema";
import { eq, and, lte, isNotNull } from "drizzle-orm";
import { InstagramService } from "@/lib/social/instagram";

export async function POST(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const duePosts = await db
    .select()
    .from(posts)
    .where(
      and(
        eq(posts.status, "pending"),
        isNotNull(posts.scheduledFor),
        lte(posts.scheduledFor, now)
      )
    );

  if (duePosts.length === 0) {
    return NextResponse.json({ processed: 0 });
  }

  const results = await Promise.allSettled(
    duePosts.map(async (post) => {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, post.userId));

      if (user?.instagramAccessToken && user?.instagramPageId && post.imageUrl) {
        const igResult = await InstagramService.publishPhoto(
          { imageUrl: post.imageUrl, caption: post.caption ?? "" },
          { accessToken: user.instagramAccessToken, businessId: user.instagramPageId }
        );

        if (igResult.success) {
          await db
            .update(posts)
            .set({
              status: "published",
              instagramPostId: igResult.postId,
              instagramPermalink: igResult.permalink,
            })
            .where(eq(posts.id, post.id));
          return { postId: post.id, published: true, platform: "instagram" };
        }
      }

      await db.update(posts).set({ status: "published" }).where(eq(posts.id, post.id));
      return { postId: post.id, published: true, platform: "local" };
    })
  );

  return NextResponse.json({
    processed: duePosts.length,
    results: results.map((r) => (r.status === "fulfilled" ? r.value : { error: r.reason?.message })),
  });
}
