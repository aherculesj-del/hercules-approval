import { generatePostContent } from "@/lib/claude-service";
import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

const postCache = new Map();

export async function GET(request) {
  try {
    const article = {
      title: "A inteligencia artificial esta mudando o mercado de trabalho brasileiro",
      content: "Um estudo recente mostra que 72% das empresas brasileiras estao adotando IA. A transformacao digital acelerou durante a pandemia. Empresas que nao se adaptam perdem competitividade.",
      url: "https://example.com/artigo"
    };

    const postData = await generatePostContent(article);

    if (!postData.success) {
      return NextResponse.json({ error: postData.error }, { status: 500 });
    }

    const postId = `test-${Date.now()}`;
    
    postCache.set(postId, {
      title: postData.title,
      summary: postData.summary,
      comment: postData.comment,
      question: postData.question
    });

    const dashboardUrl = `https://hercules-approval.vercel.app/approval/review/${postId}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD,
      },
    });

    const htmlContent = `<html><body style="font-family:Arial"><div style="background:#0d1f3c;color:white;padding:30px"><h1>Virtus Mirai - TESTE IA</h1></div><div style="padding:30px"><div style="background:white;padding:20px;border-left:4px solid #E8A020"><h2>${postData.title}</h2><p><b>RESUMO:</b></p><p>${postData.summary}</p><p><b>PERSPECTIVA:</b></p><p>${postData.comment}</p><p><b>PERGUNTA:</b> ${postData.question}</p><a href="${dashboardUrl}" style="display:inline-block;background:#0d1f3c;color:white;padding:12px 30px;text-decoration:none;margin-top:20px">Revisar no Dashboard</a></div></div></body></html>`;

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.APPROVAL_RECIPIENT_EMAIL,
      subject: `TESTE: ${postData.title.substring(0, 50)}`,
      html: htmlContent,
    });

    return NextResponse.json({ success: true, postId, dashboardUrl, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error("Erro:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export function getPostCache(postId) {
  return postCache.get(postId);
}
