"use server";

import { db } from "@/db";
import { posts, projects } from "@/db/schema";
import { eq, and, or, isNotNull, desc } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

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

export async function deleteAsset(assetId: string, source: Asset['source'], url: string) {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase client not initialized");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  try {
    // 1. Delete from Storage if it's a Supabase URL
    if (url.includes(".supabase.co/storage/v1/object/public/")) {
      const path = url.split("/project-assets/")[1];
      if (path) {
        await supabase.storage.from("project-assets").remove([path]);
      }
    }

    // 2. Delete from Database
    if (source === 'post' || source === 'upload') {
      await db.delete(posts).where(
        and(
          eq(posts.id, assetId),
          eq(posts.userId, user.id)
        )
      );
    } else if (source === 'project') {
      await db.update(projects)
        .set({ productImage: null })
        .where(
          and(
            eq(projects.id, assetId),
            eq(projects.userId, user.id)
          )
        );
    }

    revalidatePath("/assets");
    return { success: true };
  } catch (error) {
    console.error("Error deleting asset:", error);
    return { success: false, error: "Failed to delete asset" };
  }
}

