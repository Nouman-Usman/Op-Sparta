import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  const appId = process.env.INSTAGRAM_APP_ID;
  const redirectUri = `${origin}/api/auth/instagram/callback`;
  const configId = process.env.INSTAGRAM_CONFIG_ID;
  
  if (!appId || !configId) {
    return NextResponse.json({ error: "Meta App ID or Config ID missing in backend" }, { status: 500 });
  }

  const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&config_id=${configId}&response_type=code`;

  return NextResponse.redirect(authUrl);
}
