// app/api/linkedin/publish/route.js
// POST /api/linkedin/publish
// Publica um post no LinkedIn (página Virtus Mirai) com TÍTULO e perspectiva
import { publishToLinkedIn, refreshAccessToken } from "@/lib/linkedin-service";
import { createClient } from 'redis';
import { NextResponse } from "next/server";
 
// Criar cliente Redis
const redis = createClient({
  url: process.env.KV_REDIS_URL
});
 
async function getValidAccessToken() {
  try {
    await redis.connect();
    
    let accessToken = await redis.get("linkedin_access_token");
    
    if (!accessToken) {
      throw new Error("No LinkedIn access token found. Please authenticate first.");
    }
    
    // Verificar se token está próximo de expirar (refresh 1 dia antes)
    const tokenAge = parseInt(await redis.get("linkedin_token_age") || "0");
    const oneDay = 86400; // segundos
    
    if (tokenAge > oneDay) {
      console.log("🔄 Token próximo de expirar, renovando...");
      const refreshToken = await redis.get("linkedin_refresh_token");
      
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }
      
      const newTokenData = await refreshAccessToken(refreshToken);
      accessToken = newTokenData.access_token;
      
      await redis.setEx("linkedin_access_token", newTokenData.expires_in, accessToken);
      await redis.del("linkedin_token_age");
      
      console.log("✅ Token renovado");
    }
    
    await redis.disconnect();
    return accessToken;
  } catch (error) {
    console.error("Erro ao obter token:", error);
    await redis.disconnect();
    throw error;
  }
}
 
export async function POST(request) {
  try {
    const body = await request.json();
    const { postContent } = body;
    
    // Validar campos obrigatórios (agora com TÍTULO)
    if (!postContent) {
      return NextResponse.json(
        { 
          error: "postContent é obrigatório",
          example: {
            postContent: {
              title: "O custo oculto de governança de dados",
              summary: "Resumo do artigo em 2-3 linhas",
              comment: "Perspectiva Virtus Mirai em 150-200 palavras",
              question: "Sua pergunta provocadora?",
              articleUrl: "https://example.com/article"
            }
          }
        },
        { status: 400 }
      );
    }
    
    if (!postContent.title || !postContent.comment || !postContent.articleUrl) {
      return NextResponse.json(
        { 
          error: "postContent deve incluir: title, summary, comment, question, articleUrl",
          received: postContent
        },
        { status: 400 }
      );
    }
    
    const accessToken = await getValidAccessToken();
    
    console.log("📤 Publicando no LinkedIn (página Virtus Mirai)...");
    
    // Construir texto do post com TÍTULO
    const linkedinText = `${postContent.title}
${postContent.comment}
${postContent.question}
📖 Leia o artigo original: ${postContent.articleUrl}
---
Virtus Mirai Consultoria
Estratégia • Governança • Transformação Digital`;
    
    const result = await publishToLinkedIn(accessToken, {
      comment: linkedinText,
      summary: postContent.summary,
      articleUrl: postContent.articleUrl,
      title: postContent.title
    });
    
    console.log("✅ Post publicado no LinkedIn");
    
    return NextResponse.json({
      success: true,
      message: "Post publicado no LinkedIn com sucesso!",
      linkedinPostId: result.id,
      timestamp: new Date().toISOString(),
      postData: {
        title: postContent.title,
        summary: postContent.summary,
        comment: postContent.comment,
        question: postContent.question,
        articleUrl: postContent.articleUrl
      }
    });
  } catch (error) {
    console.error("❌ Erro ao publicar:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
