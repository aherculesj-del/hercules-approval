import { sendApprovalEmail } from "@/lib/email-service";
import { savePost } from "@/lib/post-storage";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const postId = `test-${Date.now()}`;
    
    // Post de teste com novo prompt Virtus Mirai
    const testArticle = {
      title: "Inteligência artificial podem criar desigualdade digital",
      url: "https://olhardigital.com.br/2026/05/15/",
      source: { name: "OlharDigital" }
    };

    const generatedContent = {
      title: "IA amplifica desigualdade: renda e educação definem acesso à tecnologia",
      summary: "Pesquisadores alertam que alfabetização em IA varia drasticamente entre grupos socioeconômicos. Pessoas de maior renda e escolaridade adotam tecnologia 3x mais rápido.",
      comment: "Em 2025, vemos padrão claro: IA não democratiza acesso, amplifica desigualdades existentes. Na Virtus Mirai, trabalhamos com clientes enfrentando exatamente isto - transformação digital que deixa para trás quem não consegue acompanhar. Solução? Governança de TI inclusiva, capacitação estruturada, e arquitetura de sistemas que nivela o campo de jogo. Quando a IA é ferramenta de 10% enquanto 90% fica para trás, temos problema de estratégia, não de tecnologia. Hercules viu isso na 'Guerra dos Fascículos' - a tecnologia que deveria democratizar informação criou novos gatekeepers. Hoje, é a mesma dinâmica com IA.",
      question: "Na sua organização, quem está sendo deixado para trás na jornada de IA?"
    };

    const emailResult = await sendApprovalEmail(testArticle, generatedContent);
    
    const post = {
      postId,
      daySearched: new Date().toLocaleDateString('pt-BR'),
      article: testArticle,
      generatedContent,
      status: "pending_approval",
      createdAt: new Date().toISOString()
    };
    
    savePost(post);

    return NextResponse.json({
      success: true,
      message: "Email de teste enviado!",
      postId,
      emailSent: true,
      dashboardUrl: `https://hercules-approval.vercel.app/approval/review/${postId}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
