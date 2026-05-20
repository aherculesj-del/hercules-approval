#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const files = {
  'config/news-topics-config.js': `// config/news-topics-config.js
// Configuração de temas, keywords e cronograma de busca

export const NEWS_TOPICS = [
  {
    id: "business-management",
    name: "Gestão Empresarial",
    keywords: ["gestão empresarial", "estratégia", "liderança", "executivos"],
    language: "pt"
  },
  {
    id: "artificial-intelligence",
    name: "Inteligência Artificial",
    keywords: ["inteligência artificial", "IA", "machine learning", "dados"],
    language: "pt"
  },
  {
    id: "digital-transformation",
    name: "Transformação Digital",
    keywords: ["transformação digital", "tecnologia", "inovação", "digital"],
    language: "pt"
  },
  {
    id: "turnarounds",
    name: "Turnarounds",
    keywords: ["turnaround", "reestruturação", "crise", "recuperação"],
    language: "pt"
  },
  {
    id: "zero-based-budgeting",
    name: "OBZ (Orçamento Base Zero)",
    keywords: ["orçamento base zero", "OBZ", "eficiência", "custos"],
    language: "pt"
  },
  {
    id: "disruptive-innovations",
    name: "Inovações Disruptivas",
    keywords: ["disruptivo", "inovação", "startup", "modelo de negócio"],
    language: "pt"
  },
  {
    id: "automation",
    name: "Automação",
    keywords: ["automação", "robótica", "processo", "eficiência"],
    language: "pt"
  },
  {
    id: "production-robotics",
    name: "Robótica de Produção e Comercial",
    keywords: ["robótica", "produção", "comercial", "automação"],
    language: "pt"
  }
];

export const NEWS_LOOKBACK_DAYS = 7;

export const EXCLUDE_KEYWORDS = [
  "celebridade",
  "famoso",
  "Hollywood",
  "esportes",
  "futebol",
  "jogo",
  "moda",
  "celebrity"
];

export const RELEVANCE_SCORE_THRESHOLD = 0.6;

export const SEARCH_SCHEDULE = {
  monday: ["business-management", "artificial-intelligence"],
  tuesday: ["digital-transformation", "turnarounds"],
  wednesday: ["zero-based-budgeting", "disruptive-innovations"],
  thursday: ["automation", "production-robotics"],
  searchTime: "06:00" // 6h da manhã
};

export const PUBLISH_SCHEDULE = {
  tuesday: ["business-management", "artificial-intelligence"],
  wednesday: ["turnarounds", "zero-based-budgeting"],
  thursday: ["disruptive-innovations", "automation"],
  friday: ["production-robotics"],
  publishTime: "08:00" // 8h da manhã
};

export default {
  NEWS_TOPICS,
  NEWS_LOOKBACK_DAYS,
  EXCLUDE_KEYWORDS,
  RELEVANCE_SCORE_THRESHOLD,
  SEARCH_SCHEDULE,
  PUBLISH_SCHEDULE
};`,

  'app/api/news/search/route.js': `// app/api/news/search/route.js
// GET /api/news/search?topic=business-management

import { searchNewsByTopic } from "@/lib/news-service";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const topicId = searchParams.get("topic");

  if (!topicId) {
    return NextResponse.json(
      { error: "Parâmetro 'topic' é obrigatório" },
      { status: 400 }
    );
  }

  try {
    console.log(\`🔍 Buscando notícias para tema: \${topicId}\`);
    const articles = await searchNewsByTopic(topicId);
    console.log(\`✅ Encontradas \${articles.length} notícias\`);

    return NextResponse.json({
      success: true,
      topicId,
      count: articles.length,
      articles,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(\`❌ Erro ao buscar notícias: \${error.message}\`);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}`,

  'app/api/news/process/route.js': `// app/api/news/process/route.js
// POST /api/news/process
// Body: { articles: [...], topicId: "..." }

import { processArticleComplete } from "@/lib/claude-service";
import feedbackSystem from "@/lib/learning-feedback-system";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { articles, topicId } = await request.json();

    if (!articles || !Array.isArray(articles)) {
      return NextResponse.json(
        { error: "Array 'articles' é obrigatório" },
        { status: 400 }
      );
    }

    console.log(\`📝 Processando \${articles.length} artigos para tema: \${topicId}\`);

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
        console.error(\`Erro ao processar artigo \${article.title}: \${error.message}\`);
        feedbackSystem.updateMetrics(false);
      }
    }

    console.log(\`✅ \${results.length} artigos processados com sucesso\`);

    return NextResponse.json({
      success: true,
      processed: results.length,
      total: articles.length,
      results,
      metrics: feedbackSystem.exportMetrics(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(\`❌ Erro ao processar artigos: \${error.message}\`);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}`,

  'app/api/news/schedule/route.js': `// app/api/news/schedule/route.js
// GET /api/news/schedule
// Retorna o cronograma de buscas e publicações

import { SEARCH_SCHEDULE, PUBLISH_SCHEDULE, NEWS_TOPICS } from "@/config/news-topics-config";
import { NextResponse } from "next/server";

export async function GET(request) {
  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long' }).toLowerCase();

  const schedule = {
    today,
    searchSchedule: SEARCH_SCHEDULE,
    publishSchedule: PUBLISH_SCHEDULE,
    topics: NEWS_TOPICS.map(t => ({
      id: t.id,
      name: t.name,
      keywords: t.keywords
    })),
    todaySearchTopics: SEARCH_SCHEDULE[today] || [],
    todayPublishTopics: PUBLISH_SCHEDULE[today] || []
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
    console.log(\`✅ Criado: \${filePath}\`);
  });
  
  console.log('\\n🎉 Todos os routes e config foram criados!');
}

createAllFiles();
