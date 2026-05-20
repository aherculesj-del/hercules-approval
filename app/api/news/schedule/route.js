import { SEARCH_SCHEDULE, PUBLISH_SCHEDULE, NEWS_TOPICS } from "@/config/news-topics-config";
import { NextResponse } from "next/server";

export async function GET(request) {
  const schedule = {
    searchSchedule: SEARCH_SCHEDULE,
    publishSchedule: PUBLISH_SCHEDULE,
    topics: NEWS_TOPICS.map(t => ({
      id: t.id,
      name: t.name,
      keywords: t.keywords
    }))
  };

  return NextResponse.json({
    success: true,
    schedule,
    timestamp: new Date().toISOString()
  });
}