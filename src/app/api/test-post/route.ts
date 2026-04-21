import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Auth configuration error" }, { status: 500 });

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  // Get the user's specific Instagram records
  let dbUser = (await db.select().from(users).where(eq(users.id, user.id)).limit(1))[0];

  if (!dbUser?.instagramAccessToken || !dbUser?.instagramPageId) {
    // Fallback to global credentials for quick testing
    const globalToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const globalPageId = process.env.INSTAGRAM_ACCESS_ID;
    if (globalToken && globalPageId) {
      dbUser = { instagramAccessToken: globalToken, instagramPageId: globalPageId } as any;
    } else {
      return NextResponse.json({ error: "Instagram not connected for this user." }, { status: 400 });
    }
  }

  const igId = dbUser.instagramPageId;
  const token = dbUser.instagramAccessToken;

  try {
    // 1. Create Media Container
    // This uploads the image to Meta's servers waiting to be published
    const imageUrl = "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1080&auto=format&fit=crop"; // High-res placeholder
    const caption = "Testing Operation Sparta Auto-Publisher! 🚀 The system is fully operational. #Automation #SaaS #AI";

    const containerResponse = await fetch(`https://graph.facebook.com/v19.0/${igId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: imageUrl,
        caption: caption,
        access_token: token
      })
    });

    const containerData = await containerResponse.json();
    
    if (containerData.error) {
      throw new Error(`Media Container Error: ${containerData.error.message}`);
    }

    const creationId = containerData.id;

    // 2. Publish Container
    // This takes the uploaded container and actually posts it to the feed
    const publishResponse = await fetch(`https://graph.facebook.com/v19.0/${igId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: creationId,
        access_token: token
      })
    });

    const publishData = await publishResponse.json();

    if (publishData.error) {
       throw new Error(`Publish Error: ${publishData.error.message}`);
    }

    return NextResponse.json({ 
      success: true, 
      message: "Post successfully published to Instagram!",
      postId: publishData.id 
    });

  } catch (err: any) {
    console.error("Test Post Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
