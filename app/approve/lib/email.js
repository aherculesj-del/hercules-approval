import nodemailer from 'nodemailer';

export async function sendApprovalEmail(postId, postContent, approvalLink) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: process.env.APPROVAL_RECIPIENT_EMAIL || process.env.GMAIL_USER,
      subject: `🤖 Hercules: Novo post para aprovação - #${postId}`,
      html: `
        <h2>🤖 Agente LinkedIn Hercules</h2>
        <h3>Novo post aguardando sua aprovação</h3>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Post ID:</strong> ${postId}</p>
          <p><strong>Conteúdo:</strong></p>
          <p style="font-size: 16px; line-height: 1.6;">${postContent}</p>
        </div>

        <p>
          <a href="${approvalLink}" style="display: inline-block; padding: 12px 30px; background: #0d1f3c; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
            👉 Aprovar ou Editar Post
          </a>
        </p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        
        <p style="color: #666; font-size: 12px;">
          Hercules Approval System | Sistema de aprovação de posts<br>
          <a href="https://hercules-approval.vercel.app" style="color: #0d1f3c;">Acessar dashboard</a>
        </p>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email enviado:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return { success: false, error: error.message };
  }
}