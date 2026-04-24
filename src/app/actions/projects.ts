"use server";

import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { aiKeys, posts } from "@/db/schema";
import { decrypt } from "@/lib/encryption";

export async function createProject(data: {
  name: string;
  industry?: string;
  productDesc?: string;
  brandVoice?: string;
  brandColor?: string;
  productUrl?: string;
  productImage?: string;
}) {
  try {
    const supabase = await createClient();
    if (!supabase) throw new Error("Supabase auth configuration failed");

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const [newProject] = await db
      .insert(projects)
      .values({
        userId: user.id,
        name: data.name,
        industry: data.industry,
        productDesc: data.productDesc,
        brandVoice: data.brandVoice,
        brandColor: data.brandColor,
        productUrl: data.productUrl,
        productImage: data.productImage,
      })
      .returning();

    revalidatePath("/overview");
    return { success: true, projectId: newProject.id };
  } catch (error: any) {
    console.error("Create Project Error:", error.message);
    return { success: false, error: error.message };
  }
}

export async function getProjects() {
  try {
    const supabase = await createClient();
    if (!supabase) return [];

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    return await db.select().from(projects).where(eq(projects.userId, user.id)).orderBy(projects.createdAt);
  } catch (error) {
    return [];
  }
}

export async function triggerN8nGeneration(projectId: string, selectedProvider?: string) {
  try {
    const supabase = await createClient();
    if (!supabase) throw new Error("Supabase auth configuration failed");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Fetch project details to send to n8n
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, user.id)));

    if (!project) throw new Error("Project not found");

    // 1. Fetch AI Keys (all active keys for this user)
    const userKeys = await db
      .select()
      .from(aiKeys)
      .where(and(eq(aiKeys.userId, user.id), eq(aiKeys.isActive, true)));

    if (userKeys.length === 0) {
      return { success: false, error: "MISSING_AI_KEY" };
    }

    // Decrypt keys
    let gemini_api_key = "";
    let openai_api_key = "";
    let higgsfield_api_key = "";
    let higgsfield_access_key = "";

    for (const key of userKeys) {
      if (key.provider === "google") {
        gemini_api_key = decrypt(key.encryptedKey, key.iv);
      } else if (key.provider === "openai") {
        openai_api_key = decrypt(key.encryptedKey, key.iv);
      } else if (key.provider === "higgsfield") {
        const decrypted = decrypt(key.encryptedKey, key.iv);
        try {
          const parsed = JSON.parse(decrypted);
          if (parsed?.apiKey) higgsfield_api_key = parsed.apiKey;
          if (parsed?.accessKey) higgsfield_access_key = parsed.accessKey;
        } catch {
          // Backward compatibility with previously stored single-key records.
          higgsfield_api_key = decrypted;
        }
      }
    }

    // 2. Create the exact placeholder record mathematically in the DB
    const [newPost] = await db
      .insert(posts)
      .values({
        projectId: project.id,
        userId: user.id,
        status: 'generating',
      })
      .returning();

    // 3. Fetch Webhook URL
    const webhookUrl = process.env.n8nWebhook;
    if (!webhookUrl) throw new Error("n8n Webhook not configured in backend .env");

    // Ping n8n
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postId: newPost.id,
        projectId: project.id,
        userId: user.id,
        product_url: project.productImage || project.productUrl || "",
        product_image: project.productImage || "",
        product_desc: project.productDesc || "",
        brand_color: project.brandColor || "",
        brand_tone: project.brandVoice || "",
        selected_provider: selectedProvider || "auto",
        gemini_api_key,
        openai_api_key,
        higgsfield_api_key,
        higgsfield_access_key,
      })
    });

    if (!response.ok) {
       // If trigger completely fails, cleanly delete placeholder via background task
       await db.delete(posts).where(eq(posts.id, newPost.id));
       throw new Error(`n8n error: ${response.statusText}`);
    }

    revalidatePath(`/studio`);
    revalidatePath(`/overview`);

    return { success: true };
  } catch (error: any) {
    console.error("n8n Trigger Error:", error.message);
    return { success: false, error: error.message };
  }
}

export async function deletePost(postId: string) {
  try {
    const supabase = await createClient();
    if (!supabase) throw new Error("Unauthorized");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    await db.delete(posts).where(and(eq(posts.id, postId), eq(posts.userId, user.id)));
    revalidatePath("/studio");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function regeneratePost(postId: string, projectId: string, refinementPrompt?: string) {
  try {
    const supabase = await createClient();
    if (!supabase) throw new Error("Unauthorized");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // 1. Fetch current post data context
    const [currentPost] = await db.select().from(posts).where(eq(posts.id, postId));
    if (!currentPost) throw new Error("Post not found");

    // 2. Trigger specialized Regeneration Webhook
    const webhookUrl = process.env.n8n_Regenerate_Webhook;
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          postId,
          refinementPrompt: refinementPrompt || "Default Regeneration",
          currentImageUrl: currentPost.imageUrl,
          currentVideoUrl: currentPost.videoUrl,
          currentCaption: currentPost.caption
        })
      });
    }

    // 3. Reset status to 'generating'
    await db.update(posts)
      .set({ 
        status: 'generating', 
        imageUrl: null, 
        videoUrl: null 
      })
      .where(and(eq(posts.id, postId), eq(posts.userId, user.id)));

    revalidatePath("/studio");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updatePostCaption(postId: string, newCaption: string) {
  try {
    const supabase = await createClient();
    if (!supabase) throw new Error("Unauthorized");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    await db.update(posts)
      .set({ caption: newCaption })
      .where(and(eq(posts.id, postId), eq(posts.userId, user.id)));

    revalidatePath("/studio");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
