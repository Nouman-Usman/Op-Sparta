"use server";

import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";

export async function createProject(data: {
  name: string;
  industry?: string;
  targetAudience?: string;
  brandVoice?: string;
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
        targetAudience: data.targetAudience,
        brandVoice: data.brandVoice,
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

export async function triggerN8nGeneration(projectId: string) {
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

    const webhookUrl = process.env.n8nWebhook;
    if (!webhookUrl) throw new Error("n8n Webhook not configured in backend .env");

    // Ping n8n
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: project.id,
        userId: user.id,
        brandName: project.name,
        brandVoice: project.brandVoice,
        targetAudience: project.targetAudience
      })
    });

    if (!response.ok) throw new Error(`n8n error: ${response.statusText}`);

    return { success: true };
  } catch (error: any) {
    console.error("n8n Trigger Error:", error.message);
    return { success: false, error: error.message };
  }
}
