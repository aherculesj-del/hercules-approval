import { processArticleComplete } from "@/lib/claude-service";
import feedbackSystem from "@/lib/learning-feedback-system";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { articles, topicId } = await request.json();

    if (!articles || !Array.isArray(articles)) {
      return NextResponse.json(
        { error: "Array articles obrigatorio" },
        { status: 400 }
      );
    }

    const results = [];
    for (const article of articles) {
      try {
        const processed = await processArticleComplete(article);
        if (processed) {
          results.push(processed);
          feedbackSystem.updateMetrics(true);
        } else {
          feedbackSystem.updateMetrics(false);
        }
      } catch (error) {
        feedbackSystem.updateMetrics(false);
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      total: articles.length,
      results,
      metrics: feedbackSystem.exportMetrics(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}