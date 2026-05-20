// app/api/linkedin/publish/route.js
// POST /api/linkedin/publish
// Publica um post no LinkedIn

import { publishToLinkedIn, refreshAccessToken } from "@/lib/linkedin-service";
import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

async function getValidAccessToken() {
  let accessToken = await kv.get("linkedin_access_token");
  
  if (!accessToken) {
    throw new Error("No LinkedIn access token found. Please authenticate first.");
  }

  // Verificar se token está próximo de expirar (refresh 1 dia antes)
  const tokenAge = await kv.get("linkedin_token_age") || 0;
  const oneDay = 86400; // segundos

  if (tokenAge > oneDay) {
    console.log("🔄 Token próximo de expirar, renovando...");
    const refreshToken = await kv.get("linkedin_refresh_token");
    
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const newTokenData = await refreshAccessToken(refreshToken);
    accessToken = newTokenData.access_token;
    
    await kv.set("linkedin_access_token", accessToken, {
      ex: newTokenData.expires_in
    });
    await kv.del("linkedin_token_age");
    
    console.log("✅ Token renovado");
  }

  return accessToken;
}

export async function POST(request) {
  try {
    const { postContent } = await request.json();

    if (!postContent || !postContent.comment || !postContent.articleUrl) {
      return NextResponse.json(
        { 
          error: "postContent com comment, summary e articleUrl são obrigatórios",
          example: {
            postContent: {
              comment: "Seu comentário aqui",
              summary: "Resumo do artigo",
              articleUrl: "https://example.com/article"
            }
          }
        },
        { status: 400 }
      );
    }

    const accessToken = await getValidAccessToken();
    
    console.log("📤 Publicando no LinkedIn...");
    const result = await publishToLinkedIn(accessToken, postContent);

    return NextResponse.json({
      success: true,
      message: "Post publicado no LinkedIn com sucesso!",
      linkedinPostId: result.id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("❌ Erro ao publicar:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}