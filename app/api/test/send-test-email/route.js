import nodemailer from "nodemailer";
import { savePost } from "@/lib/post-storage";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const postId = `test-${Date.now()}`;
    const encodedData = encodeURIComponent(JSON.stringify({title:"IA amplifica desigualdade: renda e educação definem acesso à tecnologia",summary:"Pesquisadores alertam que alfabetização em IA varia drasticamente entre grupos socioeconômicos.",comment:"Em 2025, vemos padrão claro: IA não democratiza acesso, amplifica desigualdades existentes. Na Virtus Mirai, trabalhamos com clientes enfrentando exatamente isto - transformação digital que deixa para trás quem não consegue acompanhar.",question:"Na sua organização, quem está sendo deixado para trás na jornada de IA?"}));const dashboardUrl = `https://hercules-approval.vercel.app/approval/review/${postId}?data=${encodedData}`;

    // SALVA O POST
    savePost({
      postId,
      daySearched: new Date().toLocaleDateString('pt-BR'),
      generatedContent: {
        title: "IA amplifica desigualdade: renda e educação definem acesso à tecnologia",
        summary: "Pesquisadores alertam que alfabetização em IA varia drasticamente entre grupos socioeconômicos.",
        comment: "Em 2025, vemos padrão claro: IA não democratiza acesso, amplifica desigualdades existentes. Na Virtus Mirai, trabalhamos com clientes enfrentando exatamente isto - transformação digital que deixa para trás quem não consegue acompanhar.",
        question: "Na sua organização, quem está sendo deixado para trás na jornada de IA?"
      },
      status: "pending_approval",
      createdAt: new Date().toISOString()
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD,
      },
    });

    const htmlContent = `<html><head><style>body{font-family:Arial}.header{background:linear-gradient(135deg,#0d1f3c 0%,#1B3A6B 100%);color:white;padding:30px}.content{padding:30px;background:#f9f9f9}.post-card{background:white;padding:20px;border-left:4px solid #E8A020}.post-title{font-size:18px;font-weight:bold;color:#0d1f3c}.post-label{font-size:12px;font-weight:bold;color:#666;text-transform:uppercase}.post-text{margin-top:8px;font-size:14px;line-height:1.6}.cta{display:inline-block;background:linear-gradient(135deg,#0d1f3c 0%,#1B3A6B 100%);color:white;padding:12px 30px;text-decoration:none;border-radius:4px;margin-top:20px;font-weight:bold}</style></head><body><div style="max-width:600px;margin:0 auto"><div class="header"><h1>Virtus Mirai</h1><p>Novo post pronto para edição</p></div><div class="content"><div style="background:#10b981;color:white;padding:10px;border-radius:4px;margin-bottom:20px;font-weight:bold">? Teste de Email - Novo Prompt Virtus Mirai</div><div class="post-card"><div class="post-title">IA amplifica desigualdade: renda e educação definem acesso à tecnologia</div><div class="post-label">Resumo</div><div class="post-text">Pesquisadores alertam que alfabetização em IA varia drasticamente entre grupos socioeconômicos.</div><div class="post-label" style="margin-top:15px">Perspectiva Virtus Mirai</div><div class="post-text">Em 2025, vemos padrão claro: IA não democratiza acesso, amplifica desigualdades existentes. Na Virtus Mirai, trabalhamos com clientes enfrentando exatamente isto - transformação digital que deixa para trás quem não consegue acompanhar.</div><div class="post-label" style="margin-top:15px">Pergunta</div><div class="post-text">Na sua organização, quem está sendo deixado para trás na jornada de IA?</div><a href="${dashboardUrl}" class="cta">?? Revisar e Editar</a></div></div></div></body></html>`;

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: process.env.APPROVAL_RECIPIENT_EMAIL,
      subject: "? TESTE: Virtus Mirai - IA amplifica desigualdade",
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      message: "Email de teste enviado com sucesso!",
      postId,
      emailSent: true,
      dashboardUrl,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
