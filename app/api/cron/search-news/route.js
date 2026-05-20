// app/api/cron/search-news/route.js
import { searchAllTopics } from "@/lib/news-service";
import { processArticleComplete } from "@/lib/claude-service";
import { sendApprovalEmail } from "@/lib/email-service";
import { savePost } from "@/lib/post-storage";
import feedbackSystem from "@/lib/learning-feedback-system";
import { NextResponse } from "next/server";

function getDayOfWeek() {
  const days = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
  return days[new Date().getDay()];
}

function isSearchDay() {
  const day = new Date().getDay();
  return day >= 1 && day <= 4;
}

export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = getDayOfWeek();
  
  if (!isSearchDay()) {
    return NextResponse.json({
      success: false,
      message: `Hoje é ${today}. Busca so roda segunda-quinta.`,
      timestamp: new Date().toISOString()
    });
  }

  try {
    console.log(`Buscando noticias de ${today}...`);
    const allArticles = await searchAllTopics();

    const emailsSent = [];
    const errors = [];

    for (const [topicId, articles] of Object.entries(allArticles)) {
      for (const article of articles) {
        try {
          const generatedContent = await processArticleComplete(article);
          if (generatedContent) {
            const postId = article.id || `post-${Date.now()}`;
            const emailResult = await sendApprovalEmail(article, generatedContent);

            const post = {
              postId,
              daySearched: today,
              article: {
                title: article.title,
                url: article.url,
                source: article.source
              },
              generatedContent,
              status: "pending_approval",
              createdAt: new Date().toISOString()
            };

            savePost(post);
            emailsSent.push(postId);
            feedbackSystem.updateMetrics(true);
          }
        } catch (err) {
          errors.push(err.message);
          feedbackSystem.updateMetrics(false);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Busca de ${today} concluida`,
      emailsSent: emailsSent.length,
      errors: errors.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}