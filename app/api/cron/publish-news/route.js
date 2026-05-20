// app/api/cron/publish-news/route.js
import { getPostsByStatus } from "@/lib/post-storage";
import { NextResponse } from "next/server";

const dayMap = {
  1: 'segunda',
  2: 'terca',
  3: 'quarta',
  4: 'quinta',
  5: 'sexta'
};

function getDayOfWeek() {
  return dayMap[new Date().getDay()] || 'outro-dia';
}

function isPublishDay() {
  const day = new Date().getDay();
  return day >= 2 && day <= 5;
}

function getYesterdayDay() {
  const days = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return days[yesterday.getDay()];
}

export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = getDayOfWeek();
  const yesterday = getYesterdayDay();

  if (!isPublishDay()) {
    return NextResponse.json({
      success: false,
      message: `Hoje é ${today}. Publicacao so roda terca-sexta.`,
      timestamp: new Date().toISOString()
    });
  }

  try {
    const approvedPosts = getPostsByStatus('approved').filter(
      post => post.daySearched === yesterday
    );

    const published = [];
    for (const post of approvedPosts) {
      published.push({
        postId: post.postId,
        title: post.article.title,
        publishedAt: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: true,
      message: `Publicacao de ${yesterday} concluida`,
      yesterday,
      published: published.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}