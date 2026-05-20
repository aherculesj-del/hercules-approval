// hercules-approval/lib/news-service.js
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
    throw new Error(`Tema não encontrado: ${topicId}`);
  }
  const query = topic.keywords.map(k => `"${k}"`).join(" OR ");
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - NEWS_LOOKBACK_DAYS);
  try {
    const response = await fetch(
      `${NEWSAPI_BASE_URL}/everything?` +
      `q=${encodeURIComponent(query)}&` +
      `from=${fromDate.toISOString().split('T')[0]}&` +
      `language=${topic.language}&` +
      `sortBy=relevancy&` +
      `pageSize=20&` +
      `apiKey=${NEWSAPI_KEY}`
    );
    if (!response.ok) {
      throw new Error(`NewsAPI error: ${response.status}`);
    }
    const data = await response.json();
    if (data.status !== "ok") {
      throw new Error(`NewsAPI error: ${data.message}`);
    }
    const filtered = data.articles
      .filter(article => {
        const title = (article.title || "").toLowerCase();
        const description = (article.description || "").toLowerCase();
        const combined = `${title} ${description}`;
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
    console.error(`Erro ao buscar notícias para tema ${topicId}:`, error);
    return [];
  }
}

export async function searchAllTopics() {
  const results = {};
  for (const topic of NEWS_TOPICS) {
    console.log(`🔍 Buscando notícias para: ${topic.name}`);
    const articles = await searchNewsByTopic(topic.id);
    results[topic.id] = articles;
    console.log(`✅ Encontradas ${articles.length} notícias em ${topic.name}`);
  }
  return results;
}

export async function searchSelectedThemes(themeIds) {
  const results = {};
  for (const themeId of themeIds) {
    console.log(`🔍 Buscando notícias para: ${themeId}`);
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
    id: `${new Date(article.publishedAt).getTime()}-${article.url.substring(0, 20)}`,
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
};