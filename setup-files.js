#!/usr/bin/env node
// setup-files.js
// Cria todos os arquivos necessários para o projeto hercules-approval

const fs = require('fs');
const path = require('path');

const files = {
  'lib/news-service.js': `// hercules-approval/lib/news-service.js
// Serviço para buscar e filtrar notícias do NewsAPI

import {
  NEWS_TOPICS,
  NEWS_LOOKBACK_DAYS,
  EXCLUDE_KEYWORDS,
  RELEVANCE_SCORE_THRESHOLD
} from "@/config/news-topics-config";

const NEWSAPI_KEY = process.env.NEWSAPI_KEY;
const NEWSAPI_BASE_URL = "https://newsapi.org/v2";

export async function searchNewsByTopic(topicId) {
  const topic = NEWS_TOPICS.find(t => t.id === topicId);
  if (!topic) {
    throw new Error(\`Tema não encontrado: \${topicId}\`);
  }
  const query = topic.keywords.map(k => \`"\${k}"\`).join(" OR ");
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - NEWS_LOOKBACK_DAYS);
  try {
    const response = await fetch(
      \`\${NEWSAPI_BASE_URL}/everything?\` +
      \`q=\${encodeURIComponent(query)}&\` +
      \`from=\${fromDate.toISOString().split('T')[0]}&\` +
      \`language=\${topic.language}&\` +
      \`sortBy=relevancy&\` +
      \`pageSize=20&\` +
      \`apiKey=\${NEWSAPI_KEY}\`
    );
    if (!response.ok) {
      throw new Error(\`NewsAPI error: \${response.status}\`);
    }
    const data = await response.json();
    if (data.status !== "ok") {
      throw new Error(\`NewsAPI error: \${data.message}\`);
    }
    const filtered = data.articles
      .filter(article => {
        const title = (article.title || "").toLowerCase();
        const description = (article.description || "").toLowerCase();
        const combined = \`\${title} \${description}\`;
        return !EXCLUDE_KEYWORDS.some(keyword =>
          combined.includes(keyword.toLowerCase())
        );
      })
      .filter(article => article.description)
      .filter(article => article.urlToImage)
      .map(article => ({
        ...article,
        topicId,
        topicName: topic.name,
        searchedAt: new Date().toISOString()
      }));
    return filtered;
  } catch (error) {
    console.error(\`Erro ao buscar notícias para tema \${topicId}:\`, error);
    return [];
  }
}

export async function searchAllTopics() {
  const results = {};
  for (const topic of NEWS_TOPICS) {
    console.log(\`🔍 Buscando notícias para: \${topic.name}\`);
    const articles = await searchNewsByTopic(topic.id);
    results[topic.id] = articles;
    console.log(\`✅ Encontradas \${articles.length} notícias em \${topic.name}\`);
  }
  return results;
}

export async function searchSelectedThemes(themeIds) {
  const results = {};
  for (const themeId of themeIds) {
    console.log(\`🔍 Buscando notícias para: \${themeId}\`);
    const articles = await searchNewsByTopic(themeId);
    results[themeId] = articles;
  }
  return results;
}

export function isArticleRelevant(article) {
  const checks = {
    hasTitle: !!article.title,
    hasDescription: !!article.description && article.description.length > 50,
    hasContent: !!article.content && article.content.length > 100,
    hasImage: !!article.urlToImage,
    isNotSourceExcluded: !EXCLUDE_KEYWORDS.some(keyword =>
      (article.source?.name || "").toLowerCase().includes(keyword.toLowerCase())
    )
  };
  const passedChecks = Object.values(checks).filter(Boolean).length;
  const relevanceScore = passedChecks / Object.keys(checks).length;
  return relevanceScore >= RELEVANCE_SCORE_THRESHOLD;
}

export function formatArticleForPresentation(article) {
  return {
    id: \`\${new Date(article.publishedAt).getTime()}-\${article.url.substring(0, 20)}\`,
    title: article.title,
    description: article.description,
    content: article.content,
    source: article.source.name,
    author: article.author,
    publishedAt: article.publishedAt,
    imageUrl: article.urlToImage,
    articleUrl: article.url,
    topicId: article.topicId,
    topicName: article.topicName
  };
}

export default {
  searchNewsByTopic,
  searchAllTopics,
  searchSelectedThemes,
  isArticleRelevant,
  formatArticleForPresentation
};`,

  'lib/claude-service.js': `// hercules-approval/lib/claude-service.js
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const CLAUDE_MODEL = "claude-opus-4-20250514";

export async function generateNewsSummary(article) {
  const prompt = \`Você é assistente de execução para um consultor sênior brasileiro.
Leia esta notícia e gere um resumo EXECUTIVO de 2-3 linhas (máximo 100 palavras).
Foque em: o QUE aconteceu, POR QUÊ importa para executivos, e QUAL é a lição de negócio.

NOTÍCIA:
Título: \${article.title}
Descrição: \${article.description}

Responda APENAS com o resumo, sem cabeçalho.\`;
  return await callClaudeAPI(prompt);
}

export async function generateHerculesComment(article, summary) {
  const prompt = \`Você é Antonio Hercules Junior, consultor sênior com 40+ anos.
Sua PERSONA: Direto, provocador, sarcasmo inteligente, tira lições de experiências reais (cite ano).
Nunca usa emojis. Pergunta sempre termina com "não é?". Parágrafos curtos (2-4 linhas).

NOTÍCIA: \${article.title}
RESUMO: \${summary}

Gere um comentário LinkedIn (150-250 palavras) que valide o tema, traga perspectiva pessoal, 
faça conexão com empresa/mercado hoje, e encerre com pergunta provocadora.
Responda APENAS com o comentário, sem cabeçalho.\`;
  return await callClaudeAPI(prompt);
}

export async function callClaudeAPI(prompt, maxTokens = 500) {
  if (!CLAUDE_API_KEY) {
    throw new Error("CLAUDE_API_KEY não configurada");
  }
  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }]
      })
    });
    if (!response.ok) {
      const error = await response.json();
      console.error("Claude API Error:", error);
      throw new Error(\`Claude API error: \${response.status}\`);
    }
    const data = await response.json();
    return (data.content[0]?.text || "").trim();
  } catch (error) {
    console.error("Erro ao chamar Claude API:", error);
    throw error;
  }
}

export async function processArticleComplete(article) {
  console.log(\`📝 Processando: \${article.title}\`);
  try {
    const summary = await generateNewsSummary(article);
    const comment = await generateHerculesComment(article, summary);
    return {
      articleId: article.id,
      title: article.title,
      topicId: article.topicId,
      topicName: article.topicName,
      summary,
      comment,
      sourceUrl: article.articleUrl,
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error(\`❌ Erro ao processar artigo: \${error.message}\`);
    return null;
  }
}

export default {
  generateNewsSummary,
  generateHerculesComment,
  callClaudeAPI,
  processArticleComplete
};`,

  'lib/learning-feedback-system.js': `// hercules-approval/lib/learning-feedback-system.js
export class LearningFeedbackSystem {
  constructor() {
    this.feedback = [];
    this.metrics = {
      totalProcessed: 0,
      successful: 0,
      failed: 0,
      averageQuality: 0
    };
  }

  recordFeedback(articleId, feedback) {
    this.feedback.push({
      articleId,
      timestamp: new Date().toISOString(),
      quality: feedback.quality || 0,
      relevance: feedback.relevance || 0,
      tone: feedback.tone || "neutral",
      notes: feedback.notes || "",
      approved: feedback.approved || false
    });
  }

  updateMetrics(success = true) {
    this.metrics.totalProcessed++;
    if (success) {
      this.metrics.successful++;
    } else {
      this.metrics.failed++;
    }
  }

  getAverageQuality() {
    if (this.feedback.length === 0) return 0;
    const avgQuality = this.feedback.reduce((sum, f) => sum + f.quality, 0) / this.feedback.length;
    this.metrics.averageQuality = avgQuality;
    return avgQuality;
  }

  exportMetrics() {
    return {
      ...this.metrics,
      feedbackCount: this.feedback.length,
      successRate: this.metrics.totalProcessed > 0 
        ? (this.metrics.successful / this.metrics.totalProcessed * 100).toFixed(2) + '%'
        : '0%',
      averageQuality: this.getAverageQuality().toFixed(2)
    };
  }
}

export default new LearningFeedbackSystem();`
};

// Criar todos os arquivos
function createAllFiles() {
  Object.entries(files).forEach(([filePath, content]) => {
    const fullPath = path.join(__dirname, filePath);
    const dir = path.dirname(fullPath);
    
    // Criar diretório se não existir
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Criar arquivo
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Criado: ${filePath}`);
  });
  
  console.log('\n🎉 Todos os arquivos foram criados com sucesso!');
}

createAllFiles();
