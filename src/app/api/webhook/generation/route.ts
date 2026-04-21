import { db } from "@/db";
import { posts } from "@/db/schema";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectId, userId, imageUrl, caption, supervisionScore } = body;

    if (!projectId || !userId || !imageUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Insert the generated asset into the database for user approval
    const [newPost] = await db.insert(posts).values({
      projectId,
      userId,
      imageUrl,
      caption,
      supervisionScore: supervisionScore?.toString() || "0",
      status: "pending", // Wait for user approval
    }).returning();

    return NextResponse.json({ 
      success: true, 
      message: "Post asset received and pending approval",
      postId: newPost.id 
    });
  } catch (error: any) {
    console.error("Webhook Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
