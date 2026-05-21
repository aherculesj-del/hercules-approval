// test-endpoint.js - Teste manual do fluxo completo

require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk').default;
const nodemailer = require('nodemailer');

const client = new Anthropic();

async function testFullFlow() {
  try {
    console.log('\n🚀 INICIANDO TESTE COMPLETO\n');
    
    // Artigo de teste
    const article = {
      title: "Inteligência artificial podem criar um novo tipo de desigualdade social e digital, aponta estudo",
      content: "Pesquisadores da Hong Kong Baptist University alertaram que a alfabetização em inteligência artificial pode criar uma nova desigualdade digital. A análise utilizou dados coletados pelo Pew Research Center mostrando que pessoas com maior renda e escolaridade reconhecem e utilizam inteligência artificial com mais facilidade, criando um novo tipo de divisão social.",
      url: "https://olhardigital.com.br/2026/05/15/inteligencia-artificial/"
    };

    // 1. Gerar com Claude
    console.log('1️⃣ Gerando post com novo prompt Virtus Mirai...');
    const userPrompt = `Artigo: ${article.title}\n\nConteúdo: ${article.content}\n\nURL: ${article.url}`;
    
    const response = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1500,
      system: "Você é VIRTUS MIRAI. Gere post LinkedIn com: 1.TÍTULO (10-15 palavras, impactante) 2.RESUMO (2-3 linhas) 3.PERSPECTIVA VIRTUS MIRAI (150-200 palavras, considerando expertise de Hercules em gestão e Wilson em TI) 4.PERGUNTA PROVOCADORA. Responda APENAS em JSON: {\"title\":\"...\",\"summary\":\"...\",\"comment\":\"...\",\"question\":\"...\"}",
      messages: [{ role: "user", content: userPrompt }],
    });

    const textContent = response.content.find((block) => block.type === "text");
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    const postData = JSON.parse(jsonMatch[0]);

    console.log('✅ Post gerado!');
    console.log('\n📌 TÍTULO:', postData.title);
    console.log('\n📝 RESUMO:', postData.summary);
    console.log('\n💭 PERSPECTIVA (primeiros 80 chars):', postData.comment.substring(0, 80) + '...');
    console.log('\n❓ PERGUNTA:', postData.question);

    // 2. Enviar email
    console.log('\n2️⃣ Enviando email para aprovação...');
    
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD,
      },
    });

    const postId = 'test-' + Date.now();
    const dashboardUrl = `https://hercules-approval.vercel.app/approval/review/${postId}`;

    const htmlContent = `
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0d1f3c 0%, #1B3A6B 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .post-card { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #E8A020; border-radius: 4px; }
    .post-title { font-size: 18px; font-weight: bold; color: #0d1f3c; margin-bottom: 10px; }
    .post-section { margin: 15px 0; }
    .post-label { font-size: 12px; font-weight: bold; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
    .post-text { margin-top: 5px; font-size: 14px; line-height: 1.5; }
    .cta-button { 
      display: inline-block; 
      background: linear-gradient(135deg, #0d1f3c 0%, #1B3A6B 100%);
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 4px;
      font-weight: bold;
      margin-top: 20px;
      cursor: pointer;
    }
    .cta-button:hover { opacity: 0.9; }
    .success-badge { background: #10b981; color: white; padding: 10px; border-radius: 4px; margin: 10px 0; font-weight: bold; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏢 Virtus Mirai</h1>
      <p>Novo post pronto para sua aprovação</p>
    </div>
    
    <div class="content">
      <div class="success-badge">✅ NOVO PROMPT VIRTUS MIRAI - Com TÍTULO impactante!</div>
      
      <div class="post-card">
        <div class="post-title">
          "${postData.title}"
        </div>
        
        <div class="post-section">
          <div class="post-label">📰 Resumo da Matéria</div>
          <div class="post-text">${postData.summary}</div>
        </div>
        
        <div class="post-section">
          <div class="post-label">💭 Perspectiva Virtus Mirai (Hercules + Wilson)</div>
          <div class="post-text">${postData.comment.replace(/\n/g, '<br>')}</div>
        </div>
        
        <div class="post-section">
          <div class="post-label">❓ Pergunta Provocadora</div>
          <div class="post-text">${postData.question}</div>
        </div>
        
        <div class="post-section">
          <div class="post-label">🔗 Artigo Original</div>
          <div class="post-text">
            <a href="${postData.articleUrl}" target="_blank">Leia o artigo completo →</a>
          </div>
        </div>
        
        <a href="${dashboardUrl}" class="cta-button">
          ✏️ Revisar e Editar
        </a>
      </div>
      
      <div class="footer">
        <p><strong>🎯 O que fazer:</strong></p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>✅ Clique em "Revisar e Editar"</li>
          <li>✅ Veja o novo dashboard com TÍTULO</li>
          <li>✅ Edite título, perspectiva ou pergunta</li>
          <li>✅ Clique "Aprovar e Publicar"</li>
        </ul>
        
        <p style="margin-top: 20px;">
          Este post será publicado na página do LinkedIn da Virtus Mirai.<br>
          Virtus Mirai © 2026 | Estratégia • Governança • Transformação Digital
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: process.env.APPROVAL_RECIPIENT_EMAIL,
      subject: `✅ TESTE: Virtus Mirai: "${postData.title}"`,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email enviado com sucesso!');
    console.log('\n📧 Verifique seu email: aherculesj@gmail.com');
    console.log('\n🔗 Link direto (se email não chegar):');
    console.log(dashboardUrl);
    console.log('\n✨ TESTE CONCLUÍDO!\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testFullFlow();