import { searchNewsByTopic } from "@/lib/news-service";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const topicId = searchParams.get("topic");

  if (!topicId) {
    return NextResponse.json(
      { error: "Parametro topic obrigatorio" },
      { status: 400 }
    );
  }

  try {
    const articles = await searchNewsByTopic(topicId);
    return NextResponse.json({
      success: true,
      topicId,
      count: articles.length,
      articles,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}