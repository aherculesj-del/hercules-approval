import { generatePostContent } from "@/lib/claude-service";
import nodemailer from "nodemailer";
import { NewsAPIClient } from "@/lib/news-service";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    // 1. Buscar noticia real
    const newsClient = new NewsAPIClient();
    const articles = await newsClient.searchNews("inteligencia artificial transformacao digital", 1);

    if (!articles || articles.length === 0) {
      return NextResponse.json({ error: "Nenhuma noticia encontrada" }, { status: 404 });
    }

    const article = articles[0];

    // 2. Gerar conteudo com IA (NOVOS PARAMETROS)
    const postData = await generatePostContent({
      title: article.title,
      content: article.content || article.description,
      url: article.url,
    });

    if (!postData.success) {
      return NextResponse.json({ error: postData.error }, { status: 500 });
    }

    // 3. Enviar email
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

    const htmlContent = `<html><body style="font-family:Arial"><div style="background:#0d1f3c;color:white;padding:30px"><h1>Virtus Mirai - TESTE COM IA</h1><p style="color:#E8A020;font-weight:bold">Novo conteudo gerado automaticamente</p></div><div style="padding:30px;background:#f9f9f9"><div style="background:white;padding:20px;border-left:4px solid #E8A020"><div style="font-size:18px;font-weight:bold;color:#0d1f3c">${postData.title}</div><p><b>Resumo:</b> ${postData.summary}</p><p><b>Perspectiva:</b> ${postData.comment}</p><p><b>Pergunta:</b> ${postData.question}</p><a href="${dashboardUrl}" style="display:inline-block;background:#0d1f3c;color:white;padding:12px 30px;text-decoration:none;margin-top:20px;border-radius:4px;font-weight:bold">Revisar</a></div></div></body></html>`;

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.APPROVAL_RECIPIENT_EMAIL,
      subject: `TESTE COM IA: ${postData.title}`,
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
    console.error("Erro:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
