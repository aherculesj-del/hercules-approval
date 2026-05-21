import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const postId = `test-${Date.now()}`;
    const postData = {
      title: "IA amplifica desigualdade: renda e educacao definem acesso a tecnologia",
      summary: "Pesquisadores alertam que alfabetizacao em IA varia drasticamente entre grupos socioeconomicos.",
      comment: "Em 2025, vemos padrao claro: IA nao democratiza acesso, amplifica desigualdades existentes. Na Virtus Mirai, trabalhamos com clientes enfrentando exatamente isto.",
      question: "Na sua organizacao, quem esta sendo deixado para tras na jornada de IA?"
    };

    const encodedData = encodeURIComponent(JSON.stringify(postData));
    const dashboardUrl = `https://hercules-approval.vercel.app/approval/review/${postId}?data=${encodedData}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD,
      },
    });

    const htmlContent = `<html><body style="font-family:Arial"><div style="background:#0d1f3c;color:white;padding:30px"><h1>Virtus Mirai</h1></div><div style="padding:30px;background:#f9f9f9"><div style="background:white;padding:20px;border-left:4px solid #E8A020"><div style="font-size:18px;font-weight:bold;color:#0d1f3c">${postData.title}</div><p><b>Resumo:</b> ${postData.summary}</p><p><b>Perspectiva:</b> ${postData.comment}</p><p><b>Pergunta:</b> ${postData.question}</p><a href="${dashboardUrl}" style="display:inline-block;background:#0d1f3c;color:white;padding:12px 30px;text-decoration:none;margin-top:20px;border-radius:4px;font-weight:bold">Revisar</a></div></div></body></html>`;

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.APPROVAL_RECIPIENT_EMAIL,
      subject: "TESTE: Virtus Mirai - IA amplifica desigualdade",
      html: htmlContent,
    });

    return NextResponse.json({ success: true, postId, dashboardUrl });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
