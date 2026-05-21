import { generatePostContent } from "@/lib/claude-service";
import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    // Artigo hardcoded para testar a IA com novos parametros
    const article = {
      title: "A inteligência artificial está mudando o mercado de trabalho brasileiro",
      content: "Um estudo recente mostra que 72% das empresas brasileiras estão adotando IA em seus processos. A transformação digital acelerou durante a pandemia e continua em ritmo acelerado. Empresas que não se adaptam correm risco de perder competitividade. O desafio agora é capacitar os colaboradores para trabalhar com essas novas tecnologias. Governança de dados se tornou crítica para evitar riscos de segurança.",
      url: "https://example.com/artigo"
    };

    // Gerar conteudo com IA (NOVOS PARAMETROS: 300-500 words + 800-1200 words)
    const postData = await generatePostContent(article);

    if (!postData.success) {
      return NextResponse.json({ error: postData.error }, { status: 500 });
    }

    // Enviar email
    const postId = `test-${Date.now()}`;
    const encodedData = encodeURIComponent(JSON.stringify({
      title: postData.title,
      summary: postData.summary,
      comment: postData.comment,
      question: postData.question,
    }));
    const dashboardUrl = `https://hercules-approval.vercel.app/approval/review/${postId}?data=${encodedData}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD,
      },
    });

    const htmlContent = `<html><body style="font-family:Arial"><div style="background:#0d1f3c;color:white;padding:30px"><h1>Virtus Mirai - TESTE IA REAL</h1><p style="color:#E8A020;font-weight:bold">Resumo expandido (300-500 palavras) + Perspectiva expandida (800-1200 palavras)</p></div><div style="padding:30px;background:#f9f9f9"><div style="background:white;padding:20px;border-left:4px solid #E8A020"><p><b>Artigo testado:</b> ${article.title}</p><div style="font-size:18px;font-weight:bold;color:#0d1f3c;margin-top:20px">${postData.title}</div><hr/><p><b>RESUMO (300-500 palavras esperadas):</b></p><p>${postData.summary}</p><hr/><p><b>PERSPECTIVA VIRTUS MIRAI (800-1200 palavras esperadas):</b></p><p>${postData.comment}</p><hr/><p><b>PERGUNTA:</b> ${postData.question}</p><a href="${dashboardUrl}" style="display:inline-block;background:#0d1f3c;color:white;padding:12px 30px;text-decoration:none;margin-top:20px;border-radius:4px;font-weight:bold">Revisar no Dashboard</a></div></div></body></html>`;

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.APPROVAL_RECIPIENT_EMAIL,
      subject: `TESTE IA: ${postData.title.substring(0, 50)}...`,
      html: htmlContent,
    });

    return NextResponse.json({
      success: true,
      postId,
      dashboardUrl,
      articleUsed: article.title,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Erro no full-test:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
