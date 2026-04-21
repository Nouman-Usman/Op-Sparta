import { NextResponse } from "next/server";
import { generateSocialContent } from "@/lib/ai/supervision";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    if (!supabase) return NextResponse.json({ error: "Auth failed" }, { status: 401 });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, industry, description, tone, targetAudience } = body;

    if (!name || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const content = await generateSocialContent(user.id, {
      name,
      industry,
      description,
      tone: tone || "professional",
      targetAudience: targetAudience || "general audience",
    });

    return NextResponse.json(content);
  } catch (error: any) {
    console.error("Generation Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate content" }, 
      { status: 500 }
    );
  }
}
