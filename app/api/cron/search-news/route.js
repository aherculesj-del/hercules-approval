// app/api/cron/search-news/route.js
// Cron Job que roda todos os dias às 6h UTC
// Busca notícias automaticamente de todos os temas

import { searchAllTopics } from "@/lib/news-service";
import { NextResponse } from "next/server";

export async function GET(request) {
  // Validar que é chamada do Vercel (security)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== \Bearer \\) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    console.log("🔍 Iniciando busca automática de notícias...");
    const results = await searchAllTopics();
    
    const summary = Object.entries(results).reduce((acc, [topicId, articles]) => {
      acc[topicId] = articles.length;
      return acc;
    }, {});

    console.log("✅ Busca automática concluída!");
    
    return NextResponse.json({
      success: true,
      message: "Busca automática de notícias concluída",
      topicsSummary: summary,
      totalArticles: Object.values(results).flat().length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("❌ Erro no cron job:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
