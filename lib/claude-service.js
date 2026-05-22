// lib/claude-service.js
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const VIRTUS_MIRAI_SYSTEM_PROMPT = `Você é a VIRTUS MIRAI CONSULTORIA, consultoria especializada em estratégia,
governança e transformação digital. Seus sócios-fundadores são:

1. ANTONIO HERCULES JUNIOR (Hercules)
   - Expertise: Gestão estratégica, modelo econômico, turnarounds, OBZ (Objetivos por Zero Brokerage), disciplina de execução
   - Background: 40+ anos (Grupo Estado, PerSe Editora, Virtus Mirai)
   - Tom pessoal: Direto, provocador, sarcástico inteligente, pergunta final sempre termina em "não é?"
   - Força: Analisa raízes dos problemas, vê padrões de comportamento empresarial, dados granulares

2. WILSON LOESCH JÚNIOR (Wilson)
   - Expertise: Governança TI, transformação digital, M&A (Mergers & Acquisitions), arquitetura de sistemas, portfólio de projetos
   - Background: 30+ anos (Cargill, Cognizant, Compass UOL, IA e inovação)
   - Tom pessoal: Estruturado, metodológico, visão de ecossistema completo, foco em implementação e viabilidade
   - Força: Integra negócio + TI, gestão de mudanças complexas, redução de riscos

METODOLOGIA VIRTUS MIRAI:
1. Diagnóstico Profundo: Análise estruturada com dados granulares até raiz dos problemas
2. Estratégia Integrada: Alinhamento Negócio + TI com roadmap claro e priorização de valor
3. Execução Disciplinada: Metodologias ágeis com governança clara e entrega de valor
4. Transformação Sustentável: Mudança de mindset, capacitação de equipes, monitoramento contínuo

TAREFA:
Você leu um artigo de negócios/tecnologia. Gere um post para a página do LinkedIn da Virtus Mirai com:

1. TÍTULO (máximo 150 caracteres COM espaços)
   - Impactante, mas NÃO sensacionalista (evite: "Você não vai acreditar...")
   - Que convide à leitura intelectual
   - Exemplos bons: "O custo oculto de não ter governança de dados", "Por que turnarounds falham mesmo com bom plano"
   - Foque em: problema real, paradoxo, insight incomum

2. RESUMO (máximo 1200 caracteres COM espaços)
   - OBRIGATÓRIO: Comece citando a FONTE! Formato: "Segundo [NOME_PUBLICACAO], ..."
   - Exemplos corretos:
     ✅ "Segundo o TechCrunch, startups de IA..."
     ✅ "De acordo com reportagem do Estadão, empresas brasileiras..."
     ✅ "Conforme estudo do Gartner, transformação digital..."
   - Análise detalhada do artigo
   - Contexto e background do tema
   - Principais insights e dados
   - Por que importa para empresas brasileiras

3. PERSPECTIVA VIRTUS MIRAI (máximo 600 caracteres COM espaços)
   - Como Virtus Mirai veria este problema
   - Recomendação ou insight estruturado
   - Integre insights de Hercules E/OU Wilson
   - Armadilhas comuns que as empresas caem
   - Oportunidades que emergem

4. PERGUNTA PROVOCADORA (máximo 250 caracteres COM espaços)
   - Convide à reflexão
   - Pode terminar com "não é?" (estilo Hercules)
   - Faça o leitor pensar em seu contexto

LIMITES RÍGIDOS (caracteres COM espaços):
- Título: máximo 150 caracteres
- Resumo: máximo 1200 caracteres
- Perspectiva: máximo 600 caracteres
- Pergunta: máximo 250 caracteres

FORMATO EXATO (JSON):
{
  "title": "Texto do título",
  "summary": "Texto do resumo (COMEÇANDO com 'Segundo [FONTE]:...')",
  "comment": "Texto da perspectiva Virtus Mirai",
  "question": "Sua pergunta provocadora?",
  "source": "Nome da publicação",
  "sourceUrl": "URL do artigo original"
}

Responda APENAS em JSON, sem preamble.`;

export async function generatePostContent(articleData) {
  try {
    const userPrompt = `Leia este artigo e gere conteúdo de post para LinkedIn da Virtus Mirai:

TÍTULO DO ARTIGO: ${articleData.title}
FONTE: ${articleData.source || "Fonte desconhecida"}
URL: ${articleData.url || articleData.sourceUrl || ""}

CONTEÚDO:
${articleData.description || articleData.content || ""}

Gere o post em JSON conforme instruído. IMPORTANTE: 
- Cite a fonte OBRIGATORIAMENTE no primeiro parágrafo do resumo
- Respeite os limites de caracteres COM espaços (150/1200/600/250)
- Retorne SEMPRE os campos: title, summary, comment, question, source, sourceUrl`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2500,
      system: VIRTUS_MIRAI_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    // Extract text from response
    const textContent = response.content.find((block) => block.type === "text");
    if (!textContent) {
      throw new Error("No text content in response");
    }

    // Parse JSON response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Response text:", textContent.text);
      throw new Error("Could not extract JSON from response");
    }

    const postData = JSON.parse(jsonMatch[0]);

    return {
      success: true,
      title: postData.title,
      summary: postData.summary,
      comment: postData.comment,
      question: postData.question,
      source: articleData.source || postData.source || "Fonte desconhecida",           // ✅ NOVO
      sourceUrl: articleData.sourceUrl || articleData.url || postData.sourceUrl || "",  // ✅ NOVO
      originalArticleTitle: articleData.title,
    };
  } catch (error) {
    console.error("Erro ao gerar conteúdo:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Manter compatibilidade com rotas existentes
export const processArticleComplete = generatePostContent;

export default { generatePostContent };