require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk').default;
const nodemailer = require('nodemailer');

const client = new Anthropic();

const VIRTUS_MIRAI_SYSTEM_PROMPT = `Você é a VIRTUS MIRAI CONSULTORIA. Gere um post para LinkedIn com:
1. TÍTULO (10-15 palavras, impactante)
2. RESUMO (2-3 linhas)
3. PERSPECTIVA VIRTUS MIRAI (150-200 palavras)
4. PERGUNTA PROVOCADORA

Responda APENAS em JSON.`;

async function generatePostContent(articleData) {
  const userPrompt = `Artigo: ${articleData.title}\n\nConteúdo: ${articleData.content}\n\nURL: ${articleData.url}`;
  
  const response = await client.messages.create({
    model: "claude-opus-4-20250805",
    max_tokens: 1500,
    system: VIRTUS_MIRAI_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const textContent = response.content.find((block) => block.type === "text");
  const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
  const postData = JSON.parse(jsonMatch[0]);

  return {
    success: true,
    title: postData.title,
    summary: postData.summary,
    comment: postData.comment,
    question: postData.question,
    articleUrl: articleData.url,
  };
}

async function sendTestEmail(postData) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASSWORD,
    },
  });

  const htmlContent = `
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .header { background: linear-gradient(135deg, #0d1f3c 0%, #1B3A6B 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
    .content { padding: 30px; background: #f9f9f9; border-radius: 0 0 8px 8px; }
    .post-card { background: white; padding: 20px; border-left: 4px solid #E8A020; margin: 20px 0; border-radius: 4px; }
    .post-title { font-size: 18px; font-weight: bold; color: #0d1f3c; margin-bottom: 10px; }
    .post-label { font-size: 12px; font-weight: bold; color: #666; text-transform: uppercase; margin-top: 15px; }
    .post-text { margin-top: 5px; font-size: 14px; line-height: 1.5; }
  </style>
</head>
<body>
  <div style="max-width: 600px; margin: 0 auto;">
    <div class="header">
      <h1>🏢 Virtus Mirai</h1>
      <p>✅ TESTE: Novo post com VOZ e TÍTULO</p>
    </div>
    <div class="content">
      <div class="post-card">
        <div class="post-title">"${postData.title}"</div>
        
        <div class="post-label">📰 Resumo da Matéria</div>
        <div class="post-text">${postData.summary}</div>
        
        <div class="post-label">💭 Perspectiva Virtus Mirai</div>
        <div class="post-text">${postData.comment.replace(/\n/g, '<br>')}</div>
        
        <div class="post-label">❓ Pergunta Provocadora</div>
        <div class="post-text">${postData.question}</div>
        
        <div class="post-label">🔗 Artigo Original</div>
        <div class="post-text"><a href="${postData.articleUrl}">Leia aqui →</a></div>
      </div>
      
      <p style="font-size: 12px; color: #666; margin-top: 30px;">
        ✨ Este email foi gerado pelo novo prompt Virtus Mirai<br>
        Virtus Mirai © 2026 | Estratégia • Governança • Transformação Digital
      </p>
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
  return { success: true, messageId: info.messageId };
}

async function runTest() {
  console.log('\n🚀 INICIANDO TESTE COMPLETO\n');

  const testArticle = {
    title: "Inteligência artificial podem criar um novo tipo de desigualdade social e digital",
    content: "Pesquisadores da Hong Kong Baptist University alertaram que a alfabetização em inteligência artificial pode criar uma nova desigualdade digital. A análise utilizou dados coletados pelo Pew Research Center mostrando que pessoas com maior renda e escolaridade reconhecem e utilizam inteligência artificial com mais facilidade.",
    url: "https://olhardigital.com.br/2026/05/15/inteligencia-artificial/"
  };

  try {
    console.log('🤖 Gerando post com Claude...');
    const postResult = await generatePostContent(testArticle);
    
    console.log('✅ Post gerado com sucesso!');
    console.log('\n📌 TÍTULO:', postResult.title);
    console.log('\n📝 RESUMO:', postResult.summary);
    console.log('\n💭 PERSPECTIVA (primeiros 100 chars):', postResult.comment.substring(0, 100) + '...');
    console.log('\n❓ PERGUNTA:', postResult.question);

    console.log('\n📧 Enviando email...');
    await sendTestEmail(postResult);

    console.log('\n✨ TESTE CONCLUÍDO COM SUCESSO!\n');
    console.log('📬 Verifique seu email: aherculesj@gmail.com\n');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

runTest();