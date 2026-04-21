import { db } from "@/db";
import { posts, projects } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import StudioClient from "@/components/studio/StudioClient";

export default async function StudioPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const { projectId } = await searchParams;
  
  const supabase = await createClient();
  if (!supabase) return redirect("/login");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  if (!projectId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <h1 className="text-3xl font-bold text-white mb-4">No Project Selected</h1>
        <p className="text-zinc-500 mb-8 max-w-sm">Please select a brand engine from the overview to enter the Content Studio.</p>
        <a href="/overview" className="bg-white text-black px-8 py-3 rounded-2xl font-bold">Back to Dashboard</a>
      </div>
    );
  }

  // Fetch Project Details
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, user.id)));

  if (!project) return redirect("/overview");

  // Fetch Posts for this project
  const projectPosts = await db
    .select()
    .from(posts)
    .where(eq(posts.projectId, projectId))
    .orderBy(desc(posts.createdAt));

  return (
    <StudioClient 
      project={project} 
      initialPosts={projectPosts} 
    />
  );
}
