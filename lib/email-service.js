// lib/email-service.js
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD,
  },
});

export async function sendApprovalEmail(articleData, generatedContent) {
  const { title, url, source } = articleData;
  const { topicId } = generatedContent;
  const postId = articleData.id || Math.random().toString(36).substring(7);

  const reviewLink = `https://hercules-approval.vercel.app/approval/review/${postId}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; background: #f5f5f5; }
          .container { max-width: 600px; margin: 20px auto; background: white; padding: 20px; border-radius: 8px; }
          .header { border-bottom: 3px solid #0d1f3c; padding-bottom: 15px; margin-bottom: 20px; }
          .header h1 { color: #0d1f3c; margin: 0; font-size: 24px; }
          .article { background: #f9f9f9; padding: 15px; border-left: 4px solid #E8A020; margin: 20px 0; }
          .article h3 { color: #333; margin: 0 0 10px 0; }
          .article p { margin: 5px 0; color: #666; font-size: 14px; }
          .cta { margin: 30px 0; }
          .btn { padding: 14px 32px; background: #0d1f3c; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block; }
          .btn:hover { background: #1B3A6B; }
          .preview { background: #f0f0f0; padding: 15px; border-radius: 4px; margin: 20px 0; }
          .footer { border-top: 1px solid #ddd; margin-top: 30px; padding-top: 15px; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📝 Novo Conteúdo para Revisão</h1>
          </div>

          <div class="article">
            <h3>${title}</h3>
            <p><strong>Fonte:</strong> ${source?.name || "News API"}</p>
            <p><strong>Tema:</strong> ${topicId}</p>
            <p><a href="${url}" target="_blank">Ver artigo original →</a></p>
          </div>

          <div class="preview">
            <p style="color: #666; margin: 0;"><strong>Preview do conteúdo gerado:</strong> (edite no dashboard)</p>
          </div>

          <div class="cta">
            <a href="${reviewLink}" class="btn">✏️ Revisar e Editar</a>
          </div>

          <div class="footer">
            <p>Clique no botão acima para revisar, editar e aprovar o conteúdo.</p>
            <p>Sistema de Aprovação Hercules • LinkedIn Agent</p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.APPROVAL_RECIPIENT_EMAIL,
      subject: `[Hercules] Novo post para revisão: ${title.substring(0, 50)}...`,
      html: htmlContent,
    });

    console.log("✅ Email enviado:", info.messageId);
    return { success: true, messageId: info.messageId, postId };
  } catch (error) {
    console.error("❌ Erro ao enviar email:", error);
    throw error;
  }
}