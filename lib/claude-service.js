// hercules-approval/lib/claude-service.js
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const CLAUDE_MODEL = "claude-opus-4-20250514";

export async function generateNewsSummary(article) {
  const prompt = `Você é assistente de execução para um consultor sênior brasileiro.
Leia esta notícia e gere um resumo EXECUTIVO de 2-3 linhas (máximo 100 palavras).
Foque em: o QUE aconteceu, POR QUÊ importa para executivos, e QUAL é a lição de negócio.

NOTÍCIA:
Título: ${article.title}
Descrição: ${article.description}

Responda APENAS com o resumo, sem cabeçalho.`;
  return await callClaudeAPI(prompt);
}

export async function generateHerculesComment(article, summary) {
  const prompt = `Você é Antonio Hercules Junior, consultor sênior com 40+ anos.
Sua PERSONA: Direto, provocador, sarcasmo inteligente, tira lições de experiências reais (cite ano).
Nunca usa emojis. Pergunta sempre termina com "não é?". Parágrafos curtos (2-4 linhas).

NOTÍCIA: ${article.title}
RESUMO: ${summary}

Gere um comentário LinkedIn (150-250 palavras) que valide o tema, traga perspectiva pessoal, 
faça conexão com empresa/mercado hoje, e encerre com pergunta provocadora.
Responda APENAS com o comentário, sem cabeçalho.`;
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
      throw new Error(`Claude API error: ${response.status}`);
    }
    const data = await response.json();
    return (data.content[0]?.text || "").trim();
  } catch (error) {
    console.error("Erro ao chamar Claude API:", error);
    throw error;
  }
}

export async function processArticleComplete(article) {
  console.log(`📝 Processando: ${article.title}`);
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
    console.error(`❌ Erro ao processar artigo: ${error.message}`);
    return null;
  }
}

export default {
  generateNewsSummary,
  generateHerculesComment,
  callClaudeAPI,
  processArticleComplete
};