import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { posts, projects } from "@/db/schema";
import { eq, and, gte, lte, isNotNull } from "drizzle-orm";

export async function GET(req: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const startParam = searchParams.get("start");
  const endParam = searchParams.get("end");

  if (!startParam || !endParam) {
    return NextResponse.json({ error: "start and end query params required" }, { status: 400 });
  }

  const start = new Date(startParam);
  const end = new Date(endParam);

  // Only fetch posts that have a scheduledFor date within the visible range
  // (pending, published, ready — anything with a scheduled date)
  const userPosts = await db
    .select({
      id: posts.id,
      caption: posts.caption,
      imageUrl: posts.imageUrl,
      status: posts.status,
      source: posts.source,
      scheduledFor: posts.scheduledFor,
      createdAt: posts.createdAt,
      instagramPostId: posts.instagramPostId,
      instagramPermalink: posts.instagramPermalink,
      projectId: posts.projectId,
      hashtags: posts.hashtags,
    })
    .from(posts)
    .where(
      and(
        eq(posts.userId, user.id),
        isNotNull(posts.scheduledFor),
        gte(posts.scheduledFor, start),
        lte(posts.scheduledFor, end)
      )
    );

  // Fetch project names for labelling
  const userProjects = await db
    .select({ id: projects.id, name: projects.name })
    .from(projects)
    .where(eq(projects.userId, user.id));

  const projectMap: Record<string, string> = {};
  for (const p of userProjects) projectMap[p.id] = p.name;

  const serialized = userPosts.map((p) => ({
    ...p,
    projectName: p.projectId ? (projectMap[p.projectId] ?? null) : null,
    scheduledFor: p.scheduledFor!.toISOString(),
    createdAt: p.createdAt.toISOString(),
    hashtags: p.hashtags ?? [],
  }));

  return NextResponse.json({ posts: serialized });
}
