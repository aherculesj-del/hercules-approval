// app/api/linkedin/auth/route.js
// GET /api/linkedin/auth
// Inicia o fluxo OAuth2

import { getAuthorizationUrl } from "@/lib/linkedin-service";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const authUrl = getAuthorizationUrl();
    
    console.log("🔗 Redirecionando para LinkedIn OAuth...");
    
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Erro:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}