#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const cronContent = `// app/api/cron/search-news/route.js
// Cron Job automático: Busca → Claude → Email (todo dia às 6h UTC / 3h Brasil)

import { searchAllTopics } from "@/lib/news-service";
import { processArticleComplete } from "@/lib/claude-service";
import { sendApprovalEmail } from "@/lib/email-service";
import feedbackSystem from "@/lib/learning-feedback-system";
import { NextResponse } from "next/server";

// Storage simples em memória (em produção, usar banco de dados)
let processedPosts = [];

export async function GET(request) {
  // Validar que é chamada do Vercel (security)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== \`Bearer \${process.env.CRON_SECRET}\`) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    console.log("🔍 [CRON] Iniciando busca automática...");
    const allArticles = await searchAllTopics();

    const emailsSent = [];
    const errors = [];

    // Processar cada artigo
    for (const [topicId, articles] of Object.entries(allArticles)) {
      console.log(\`📰 Processando \${articles.length} artigos do tema: \${topicId}\`);

      for (const article of articles) {
        try {
          // Gerar resumo + comentário com Claude
          console.log(\`  → Gerando conteúdo para: \${article.title.substring(0, 50)}...\`);
          const generatedContent = await processArticleComplete(article);

          if (generatedContent) {
            // Enviar email de aprovação
            const postId = article.id || \`post-\${Date.now()}-\${Math.random().toString(36).substring(7)}\`;
            
            console.log(\`  → Enviando email de aprovação...\`);
            const emailResult = await sendApprovalEmail(article, generatedContent);

            // Salvar para rastreamento
            const post = {
              postId,
              article: {
                title: article.title,
                url: article.url,
                source: article.source
              },
              generatedContent: {
                summary: generatedContent.summary,
                comment: generatedContent.comment,
                topicId: generatedContent.topicId
              },
              emailSent: emailResult.success,
              messageId: emailResult.messageId,
              status: "pending_approval",
              createdAt: new Date().toISOString(),
              editedAt: null,
              approvedAt: null
            };

            processedPosts.push(post);
            emailsSent.push(postId);
            feedbackSystem.updateMetrics(true);
            
            console.log(\`  ✅ Email enviado para: \${postId}\`);
          }
        } catch (articleError) {
          console.error(\`  ❌ Erro ao processar artigo: \${articleError.message}\`);
          errors.push({
            title: article.title,
            error: articleError.message
          });
          feedbackSystem.updateMetrics(false);
        }
      }
    }

    const summary = {
      totalArticles: Object.values(allArticles).flat().length,
      emailsSent: emailsSent.length,
      errors: errors.length,
      topicsSummary: Object.entries(allArticles).reduce((acc, [topicId, articles]) => {
        acc[topicId] = articles.length;
        return acc;
      }, {})
    };

    console.log(\`✅ [CRON] Busca automática concluída!\`, summary);

    return NextResponse.json({
      success: true,
      message: "Cron job concluído com sucesso",
      summary,
      emailsSent,
      errors,
      metrics: feedbackSystem.exportMetrics(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("❌ Erro crítico no cron job:", error);
    return NextResponse.json(
      { error: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}`;

const filePath = path.join(__dirname, 'app/api/cron/search-news/route.js');
const dir = path.dirname(filePath);

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(filePath, cronContent, 'utf8');
console.log('✅ Cron Job atualizado com fluxo completo!');
console.log('');
console.log('Fluxo automático agora:');
console.log('1. Busca notícias de todos os 8 temas');
console.log('2. Claude gera resumo + comentário para cada uma');
console.log('3. Envia email com link de edição/aprovação');
console.log('4. Salva para rastreamento');
console.log('5. Learning System coleta feedback');
console.log('');
console.log('Cronograma: Todo dia às 3h da manhã (Brasil)');
