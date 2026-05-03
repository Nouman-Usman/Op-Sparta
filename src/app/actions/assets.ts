"use server";

import { db } from "@/db";
import { posts, projects } from "@/db/schema";
import { eq, and, or, isNotNull, desc } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";

export type Asset = {
  id: string;
  url: string;
  type: 'image' | 'video';
  source: 'post' | 'project' | 'upload';
  createdAt: Date;
  metadata?: {
    caption?: string | null;
    status?: string | null;
    projectName?: string | null;
  };
};

export async function getAssets(): Promise<Asset[]> {
  const supabase = await createClient();

  if (!supabase) {
    throw new Error("Supabase client not initialized");
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // 1. Fetch assets from posts (generated and uploaded)
  const postsData = await db
    .select()
    .from(posts)
    .where(
      and(
        eq(posts.userId, user.id),
        or(isNotNull(posts.imageUrl), isNotNull(posts.videoUrl))
      )
    )
    .orderBy(desc(posts.createdAt));

  const postAssets: Asset[] = postsData.map((post) => {
    const isVideo = !!post.videoUrl;
    return {
      id: post.id,
      url: (post.videoUrl || post.imageUrl)!,
      type: isVideo ? 'video' : 'image',
      source: post.source === 'upload' ? 'upload' : 'post',
      createdAt: post.createdAt,
      metadata: {
        caption: post.caption,
        status: post.status,
      }
    };
  });

  // 2. Fetch assets from projects (product images)
  const projectsData = await db
    .select()
    .from(projects)
    .where(
      and(
        eq(projects.userId, user.id),
        isNotNull(projects.productImage)
      )
    )
    .orderBy(desc(projects.createdAt));

  const projectAssets: Asset[] = projectsData.map((project) => ({
    id: project.id,
    url: project.productImage!,
    type: 'image',
    source: 'project',
    createdAt: project.createdAt,
    metadata: {
      projectName: project.name,
    }
  }));

  // Combine and sort by date
  return [...postAssets, ...projectAssets].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
}
