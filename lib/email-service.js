// lib/email-service.js
// Serviço de email para envio de posts para aprovação

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD,
  },
});

export async function sendApprovalEmail(postData) {
  try {
    // Construir dashboard URL
    const baseUrl = process.env.NEXTAUTH_URL || "https://hercules-approval.vercel.app";
    const dashboardUrl = `${baseUrl}/approval/review/${postData.postId}?title=${encodeURIComponent(postData.title)}&summary=${encodeURIComponent(postData.summary)}&comment=${encodeURIComponent(postData.comment)}&question=${encodeURIComponent(postData.question)}&source=${encodeURIComponent(postData.source || "")}&sourceUrl=${encodeURIComponent(postData.sourceUrl || "")}`;

    // ✅ NOVO: Extrair source e sourceUrl com fallbacks
    const source = postData.source || "Fonte desconhecida";
    const sourceUrl = postData.sourceUrl || postData.articleUrl || "#";

    // Email HTML com novo design Virtus Mirai
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0d1f3c 0%, #1B3A6B 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .header p { margin: 5px 0 0 0; font-size: 14px; opacity: 0.9; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .post-card { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #E8A020; border-radius: 4px; }
    .post-title { font-size: 18px; font-weight: bold; color: #0d1f3c; margin-bottom: 10px; }
    .post-section { margin: 15px 0; }
    .post-label { font-size: 12px; font-weight: bold; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
    .post-text { margin-top: 5px; font-size: 14px; line-height: 1.5; }
    .article-link { color: #1B3A6B; text-decoration: none; font-weight: 500; }
    .article-link:hover { text-decoration: underline; }
    .cta-button { 
      display: inline-block; 
      background: linear-gradient(135deg, #0d1f3c 0%, #1B3A6B 100%);
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 4px;
      font-weight: bold;
      margin-top: 20px;
    }
    .cta-button:hover { opacity: 0.9; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
    .source-badge { display: inline-block; background: #E8A020; color: white; padding: 4px 8px; border-radius: 3px; font-size: 12px; font-weight: bold; margin-bottom: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏢 Virtus Mirai</h1>
      <p>Novo post pronto para sua aprovação</p>
    </div>
    
    <div class="content">
      <div class="post-card">
        <!-- ✅ NOVO: Exibir fonte -->
        <div style="margin-bottom: 15px;">
          <span class="source-badge">📰 ${source}</span>
        </div>

        <div class="post-title">
          "${postData.title}"
        </div>
        
        <div class="post-section">
          <div class="post-label">📄 Resumo da Matéria</div>
          <div class="post-text">${postData.summary.replace(/\n/g, '<br>')}</div>
        </div>
        
        <div class="post-section">
          <div class="post-label">💭 Perspectiva Virtus Mirai</div>
          <div class="post-text">${postData.comment.replace(/\n/g, '<br>')}</div>
        </div>
        
        <div class="post-section">
          <div class="post-label">❓ Pergunta</div>
          <div class="post-text">${postData.question}</div>
        </div>
        
        <!-- ✅ NOVO: Link com sourceUrl em vez de articleUrl -->
        <div class="post-section">
          <div class="post-label">🔗 Artigo Original</div>
          <div class="post-text">
            <a href="${sourceUrl}" class="article-link" target="_blank">
              Leia o artigo completo em ${source} →
            </a>
          </div>
        </div>
        
        <a href="${dashboardUrl}" class="cta-button">
          ✏️ Revisar e Editar
        </a>
      </div>
      
      <div class="footer">
        <p>
          <strong>Próximos passos:</strong>
        </p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Clique em "Revisar e Editar" para ver o preview completo</li>
          <li>Edite título, resumo, perspectiva ou pergunta conforme necessário</li>
          <li>Clique em "Aprovar e Publicar" para confirmar</li>
          <li>O sistema aprenderá com suas edições para melhorar futuros posts</li>
        </ul>
        
        <p style="margin-top: 20px;">
          Este post será publicado na página do LinkedIn da Virtus Mirai.<br>
          Virtus Mirai © 2026 | Estratégia • Governança • Transformação Digital
        </p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    // Enviar email
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: process.env.APPROVAL_RECIPIENT_EMAIL,
      subject: `📌 Virtus Mirai: "${postData.title}" - Novo post para aprovação`,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("✅ Email enviado com sucesso:", info.messageId);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("❌ Erro ao enviar email:", error);
    throw new Error(`Erro ao enviar email: ${error.message}`);
  }
}

export default { sendApprovalEmail };