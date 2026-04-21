import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { NextResponse } from "next/server";

/**
 * Called immediately after a successful signup on the client side.
 * Upserts the authenticated user into our public `users` table with their
 * chosen username (passed from the signup form), not an auto-generated one.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    if (!supabase) return NextResponse.json({ error: "Auth config error" }, { status: 500 });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await request.json();
    const { username } = body;

    if (!username || username.trim().length < 3) {
      return NextResponse.json({ error: "Invalid username" }, { status: 400 });
    }

    await db.insert(users)
      .values({
        id: user.id,
        fullName: username.trim(),
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          fullName: username.trim(),
        }
      });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Signup complete error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
