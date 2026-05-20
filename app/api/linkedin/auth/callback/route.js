// app/api/linkedin/auth/callback/route.js
// GET /api/linkedin/auth/callback
// Callback após aprovação do LinkedIn

import { exchangeCodeForToken } from "@/lib/linkedin-service";
import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.json(
        { error: `LinkedIn authorization failed: ${error}` },
        { status: 400 }
      );
    }

    if (!code) {
      return NextResponse.json(
        { error: "No authorization code provided" },
        { status: 400 }
      );
    }

    console.log("🔄 Trocando código por token...");
    const tokenData = await exchangeCodeForToken(code);

    // Salvar tokens no Vercel KV
    await kv.set("linkedin_access_token", tokenData.access_token, {
      ex: tokenData.expires_in
    });
    
    if (tokenData.refresh_token) {
      await kv.set("linkedin_refresh_token", tokenData.refresh_token);
    }

    console.log("✅ Tokens salvos no Vercel KV");

    return NextResponse.json({
      success: true,
      message: "LinkedIn OAuth autorizado com sucesso!",
      expiresIn: tokenData.expires_in
    });
  } catch (error) {
    console.error("❌ Erro no callback:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}