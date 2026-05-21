require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk').default;
const nodemailer = require('nodemailer');

const client = new Anthropic();

async function testFullFlow() {
  try {
    console.log('\n?? INICIANDO TESTE COMPLETO\n');
    
    const article = {
      title: "Inteligência artificial podem criar um novo tipo de desigualdade social e digital",
      content: "Pesquisadores alertaram que a IA pode criar desigualdade baseada em renda e escolaridade.",
      url: "https://olhardigital.com.br/2026/05/15/"
    };

    console.log('1?? Gerando post com novo prompt Virtus Mirai...');
    const userPrompt = `Artigo: ${article.title}\n\nConteúdo: ${article.content}\n\nURL: ${article.url}`;
    
    const response = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1500,
      system: "Você é VIRTUS MIRAI. Gere post LinkedIn com: 1.TÍTULO (10-15 palavras) 2.RESUMO (2-3 linhas) 3.PERSPECTIVA (150-200 palavras) 4.PERGUNTA. Responda APENAS em JSON.",
      messages: [{ role: "user", content: userPrompt }],
    });

    const textContent = response.content.find((block) => block.type === "text");
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    const postData = JSON.parse(jsonMatch[0]);

    console.log('? Post gerado!');
    console.log('\n?? TÍTULO:', postData.title);
    console.log('\n2?? Enviando email...');
    
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD,
      },
    });

    const postId = 'test-' + Date.now();
    const dashboardUrl = 'https://hercules-approval.vercel.app/approval/review/' + postId;

    const htmlContent = `<html><head><style>body{font-family:Arial}.header{background:linear-gradient(135deg,#0d1f3c 0%,#1B3A6B 100%);color:white;padding:30px}.content{padding:30px;background:#f9f9f9}.post-card{background:white;padding:20px;border-left:4px solid #E8A020}.post-title{font-size:18px;font-weight:bold;color:#0d1f3c}.post-label{font-size:12px;font-weight:bold;color:#666}.post-text{margin-top:5px;font-size:14px}.cta-button{display:inline-block;background:linear-gradient(135deg,#0d1f3c 0%,#1B3A6B 100%);color:white;padding:12px 30px;text-decoration:none;border-radius:4px;margin-top:20px}.success-badge{background:#10b981;color:white;padding:10px;border-radius:4px;margin:10px 0;font-weight:bold}</style></head><body><div style="max-width:600px;margin:0 auto"><div class="header"><h1>?? Virtus Mirai</h1></div><div class="content"><div class="success-badge">? NOVO PROMPT COM TÍTULO IMPACTANTE!</div><div class="post-card"><div class="post-title">"${postData.title}"</div><div class="post-label">?? Resumo</div><div class="post-text">${postData.summary}</div><div class="post-label" style="margin-top:15px">?? Perspectiva Virtus Mirai</div><div class="post-text">${postData.comment.replace(/\n/g, '<br>')}</div><div class="post-label" style="margin-top:15px">? Pergunta</div><div class="post-text">${postData.question}</div><a href="${dashboardUrl}" class="cta-button">?? Revisar e Editar</a></div></div></div></body></html>`;

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: process.env.APPROVAL_RECIPIENT_EMAIL,
      subject: 'Virtus Mirai: ' + postData.title,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    
    console.log('? Email enviado!');
    console.log('\n?? aherculesj@gmail.com');
    console.log('?? Link: ' + dashboardUrl);
    console.log('\n? PRONTO!\n');

  } catch (error) {
    console.error('? Erro:', error.message);
  }
}

testFullFlow();
