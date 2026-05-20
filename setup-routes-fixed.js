#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const files = {
  'config/news-topics-config.js': `// config/news-topics-config.js
export const NEWS_TOPICS = [
  {
    id: "business-management",
    name: "Gestão Empresarial",
    keywords: ["gestão empresarial", "estratégia", "liderança"],
    language: "pt"
  },
  {
    id: "artificial-intelligence",
    name: "Inteligência Artificial",
    keywords: ["inteligência artificial", "IA", "machine learning"],
    language: "pt"
  },
  {
    id: "digital-transformation",
    name: "Transformação Digital",
    keywords: ["transformação digital", "tecnologia", "inovação"],
    language: "pt"
  },
  {
    id: "turnarounds",
    name: "Turnarounds",
    keywords: ["turnaround", "reestruturação", "crise"],
    language: "pt"
  },
  {
    id: "zero-based-budgeting",
    name: "OBZ (Orçamento Base Zero)",
    keywords: ["orçamento base zero", "OBZ", "eficiência"],
    language: "pt"
  },
  {
    id: "disruptive-innovations",
    name: "Inovações Disruptivas",
    keywords: ["disruptivo", "inovação", "startup"],
    language: "pt"
  },
  {
    id: "automation",
    name: "Automação",
    keywords: ["automação", "robótica", "processo"],
    language: "pt"
  },
  {
    id: "production-robotics",
    name: "Robótica de Produção",
    keywords: ["robótica", "produção", "automação"],
    language: "pt"
  }
];

export const NEWS_LOOKBACK_DAYS = 7;
export const EXCLUDE_KEYWORDS = ["celebridade", "famoso", "esportes", "futebol"];
export const RELEVANCE_SCORE_THRESHOLD = 0.6;

export const SEARCH_SCHEDULE = {
  monday: ["business-management", "artificial-intelligence"],
  tuesday: ["digital-transformation", "turnarounds"],
  wednesday: ["zero-based-budgeting", "disruptive-innovations"],
  thursday: ["automation", "production-robotics"],
  searchTime: "06:00"
};

export const PUBLISH_SCHEDULE = {
  tuesday: ["business-management", "artificial-intelligence"],
  wednesday: ["turnarounds"],
  thursday: ["disruptive-innovations"],
  friday: ["production-robotics"],
  publishTime: "08:00"
};`,

  'app/api/news/search/route.js': `import { searchNewsByTopic } from "@/lib/news-service";
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
}`,

  'app/api/news/process/route.js': `import { processArticleComplete } from "@/lib/claude-service";
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
}`,

  'app/api/news/schedule/route.js': `import { SEARCH_SCHEDULE, PUBLISH_SCHEDULE, NEWS_TOPICS } from "@/config/news-topics-config";
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
}`
};

function createAllFiles() {
  Object.entries(files).forEach(([filePath, content]) => {
    const fullPath = path.join(__dirname, filePath);
    const dir = path.dirname(fullPath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log('OK: ' + filePath);
  });
  
  console.log('\nPronto! Todos os arquivos foram criados.');
}

createAllFiles();
