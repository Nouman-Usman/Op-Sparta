import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/settings?error=no_code`);
  }

  try {
    const appId = process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID;
    const appSecret = process.env.INSTAGRAM_CLIENT_SECRET;
    const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;

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
    
    if (!accountsData.data || accountsData.data.length === 0) {
      throw new Error("No Facebook Pages were found linked to this account. Ensure you selected your Page in the login popup.");
    }

    const pageWithIg = accountsData.data.find((page: any) => page.instagram_business_account);
    
    if (!pageWithIg) {
      const pageNames = accountsData.data.map((p: any) => p.name).join(", ");
      throw new Error(`Found Pages (${pageNames}), but none are linked to an Instagram Professional account. Go to Facebook Page Settings > Linked Accounts to fix this.`);
    }

    const instagramBusinessId = pageWithIg.instagram_business_account.id;

    // 4. Save to Database
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("User not found");

    await db.update(users)
      .set({
        instagramAccessToken: longLivedToken,
        instagramPageId: instagramBusinessId,
      })
      .where(eq(users.id, user.id));

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/settings?success=instagram_connected`);
  } catch (error: any) {
    console.error("Instagram OAuth Error:", error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/settings?error=${encodeURIComponent(error.message)}`);
  }
}
