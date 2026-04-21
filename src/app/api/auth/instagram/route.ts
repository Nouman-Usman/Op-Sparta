import { NextResponse } from "next/server";

export async function GET() {
  const appId = process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID;
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;
  
  const configId = process.env.INSTAGRAM_CONFIG_ID;
  const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&config_id=${configId}&response_type=code`;

  return NextResponse.redirect(authUrl);
}
