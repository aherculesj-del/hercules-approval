// app/api/test/send-approval-email/route.js
// Endpoint de teste: envia um email de aprovação com dados fictícios
// GET /api/test/send-approval-email

import { sendApprovalEmail } from "@/lib/email-service";
import { savePost } from "@/lib/post-storage";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    // Artigo fictício para teste
    const testArticle = {
      id: `test-${Date.now()}`,
      title: "IA Revoluciona Gestão Empresarial em 2026",
      description: "Novas tecnologias de inteligência artificial estão transformando como as empresas gerenciam suas operações...",
      url: "https://example.com/article-test",
      source: { name: "TechNews Brasil" },
      urlToImage: "https://via.placeholder.com/400x300?text=IA+Empresarial"
    };

    // Conteúdo fictício gerado por Claude
    const generatedContent = {
      summary: "A inteligência artificial está revolucionando a forma como as empresas gerenciam suas operações, permitindo automação de processos, tomada de decisão mais rápida e redução significativa de custos operacionais. Empresas que adotaram IA veem ganhos de até 40% em eficiência.",
      comment: "Acompanhei de perto esse movimento quando implementamos novas tecnologias no Grupo Estado nos anos 2000. A questão central não é 'se' implementar IA, é 'quando' e 'como' integrar isso na cultura da empresa sem perder o DNA operacional. Quantas empresas brasileiras já têm um roadmap claro de IA? Não é?",
      topicId: "artificial-intelligence"
    };

    // Enviar email
    console.log("📧 Enviando email de teste...");
    const emailResult = await sendApprovalEmail(testArticle, generatedContent);

    if (emailResult.success) {
      // Salvar no storage para rastreamento
      const post = {
        postId: testArticle.id,
        daySearched: "teste",
        article: {
          title: testArticle.title,
          url: testArticle.url,
          source: testArticle.source
        },
        generatedContent,
        status: "pending_approval",
        isTest: true,
        createdAt: new Date().toISOString()
      };

      savePost(post);

      console.log("✅ Email de teste enviado com sucesso!");

      return NextResponse.json({
        success: true,
        message: "Email de teste enviado com sucesso!",
        postId: testArticle.id,
        emailMessage: emailResult.messageId,
        article: testArticle,
        generatedContent,
        instructions: [
          "Verifique seu email em aherculesj@gmail.com",
          "Clique no link 'Revisar e Editar'",
          "Edite o resumo e comentário como quiser",
          "Clique em 'Aprovar e Publicar'",
          "Verifique se o Learning System capturou suas edições"
        ]
      });
    } else {
      throw new Error("Falha ao enviar email");
    }
  } catch (error) {
    console.error("❌ Erro:", error);
    return NextResponse.json(
      { 
        error: error.message,
        hint: "Verifique se as env vars GMAIL_USER, GMAIL_PASSWORD e APPROVAL_RECIPIENT_EMAIL estão corretas"
      },
      { status: 500 }
    );
  }
}