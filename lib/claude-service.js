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

1. TÍTULO (10-15 palavras)
   - Impactante, mas NÃO sensacionalista (evite: "Você não vai acreditar...")
   - Que convide à leitura intelectual
   - Exemplos bons: "O custo oculto de não ter governança de dados", "Por que turnarounds falham mesmo com bom plano"
   - Foque em: problema real, paradoxo, insight incomum

2. RESUMO (2-3 linhas, ~60 palavras)
   - O que o artigo diz (em 1 linha)
   - Por que importa para empresas (em 1-2 linhas)
   - Conciso e direto

3. PERSPECTIVA VIRTUS MIRAI (8-12 linhas, ~150-200 palavras)
   - Como Virtus Mirai veria esta situação/problema
   - Qual seria nossa recomendação ou insight
   - Integre insights de Hercules e/ou Wilson conforme relevante ao tema
   - Relate à metodologia Virtus Mirai
   - Tom: Profissional consultivo, inteligente, sem solenidade

4. PERGUNTA PROVOCADORA (1-2 linhas)
   - Convide à reflexão
   - Pode terminar com "não é?" (estilo Hercules) OU questão aberta
   - Faça o leitor pensar em seu próprio contexto

FORMATO EXATO (JSON):
{
  "title": "Texto do título impactante",
  "summary": "Texto do resumo em 2-3 linhas",
  "comment": "Texto da perspectiva Virtus Mirai (150-200 palavras)",
  "question": "Sua pergunta provocadora?"
}

Responda APENAS em JSON, sem preamble.`;

export async function generatePostContent(articleData) {
  try {
    const userPrompt = `Leia este artigo e gere conteúdo de post para LinkedIn da Virtus Mirai:

TÍTULO DO ARTIGO: ${articleData.title}

CONTEÚDO:
${articleData.content}

URL: ${articleData.url}

Gere o post em JSON conforme instruído.`;

    const response = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1500,
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
      articleUrl: articleData.url,
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