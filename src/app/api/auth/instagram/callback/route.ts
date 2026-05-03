import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getURL } from "@/lib/utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${getURL()}settings?error=no_code`);
  }

  try {
    const appId = process.env.INSTAGRAM_APP_ID;
    const appSecret = process.env.INSTAGRAM_APP_SECRET;
    const redirectUri = process.env.INSTAGRAM_REDIRECT_URI || `${getURL()}api/auth/instagram/callback`;

    // 1. Exchange code for short-lived token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${appId}&redirect_uri=${redirectUri}&client_secret=${appSecret}&code=${code}`
    );
    const tokenData = await tokenResponse.json();

    if (tokenData.error) throw new Error(tokenData.error.message);

    const shortLivedToken = tokenData.access_token;

    // 2. Exchange for long-lived token (60 days)
    const longLivedResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`
    );
    const longLivedData = await longLivedResponse.json();
    const longLivedToken = longLivedData.access_token;

    // 3. Find the Instagram Business Account ID
    // We fetch all pages and their linked IG accounts
    const accountsResponse = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?fields=name,instagram_business_account&access_token=${longLivedToken}`
    );
    const accountsData = await accountsResponse.json();
    
    // Check if Meta explicitly returned an error (e.g., missing permissions, token invalid)
    if (accountsData.error) {
      console.error("Meta API Accounts Error:", accountsData.error);
      throw new Error(`Meta API Error: ${accountsData.error.message}`);
    }

    if (!accountsData.data || accountsData.data.length === 0) {
      console.error("Empty accounts data:", accountsData);
      throw new Error("No Facebook Pages were found linked to this account. Ensure you explicitly selected the Page during the permission checklist.");
    }

    const pageWithIg = accountsData.data.find((page: any) => page.instagram_business_account);
    
    if (!pageWithIg) {
      const pageNames = accountsData.data.map((p: any) => p.name).join(", ");
      throw new Error(`Found Pages (${pageNames}), but none are linked to an Instagram Professional account. Go to Facebook Page Settings > Linked Accounts to fix this.`);
    }

    const instagramBusinessId = pageWithIg.instagram_business_account.id;

    // 4. Save to Database
    const supabase = await createClient();
    if (!supabase) throw new Error("Supabase auth configuration failed");

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("User not found");

    // Ensure user exists in public table via upsert
    await db.insert(users)
      .values({
        id: user.id,
        instagramAccessToken: longLivedToken,
        instagramPageId: instagramBusinessId,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          instagramAccessToken: longLivedToken,
          instagramPageId: instagramBusinessId,
        }
      });

    return NextResponse.redirect(`${getURL()}settings?success=instagram_connected`);
  } catch (error: any) {
    console.error("Instagram OAuth Error:", error);
    return NextResponse.redirect(`${getURL()}settings?error=${encodeURIComponent(error.message)}`);
  }
}
