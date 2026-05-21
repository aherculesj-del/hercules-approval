import { NextResponse } from "next/server";

export async function GET(request) {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = "https://hercules-approval.vercel.app/api/linkedin/auth/callback";
  const scope = "w_member_social";
  const state = Math.random().toString(36).substring(7);

  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;

  return NextResponse.redirect(authUrl);
}