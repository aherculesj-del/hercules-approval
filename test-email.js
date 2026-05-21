require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk').default;
const nodemailer = require('nodemailer');

const client = new Anthropic();

async function generatePostContent(articleData) {
  const userPrompt = `Artigo: ${articleData.title}\n\nConteúdo: ${articleData.content}\n\nURL: ${articleData.url}`;
  
  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1500,
    system: "Gere post LinkedIn com TÍTULO (10-15 palavras), RESUMO (2-3 linhas), PERSPECTIVA (150-200 palavras) e PERGUNTA. Responda APENAS em JSON.",
    messages: [{ role: "user", content: userPrompt }],
  });

  const textContent = response.content.find((block) => block.type === "text");
  const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
  const postData = JSON.parse(jsonMatch[0]);

  return { success: true, title: postData.title, summary: postData.summary, comment: postData.comment, question: postData.question, articleUrl: articleData.url };
}

async function sendTestEmail(postData) {
  const transporter = nodemailer.createTransport({ service: "gmail", auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASSWORD } });
  const htmlContent = `<html><body><div style="max-width:600px;margin:0 auto"><div style="background:#0d1f3c;color:white;padding:30px"><h1>Virtus Mirai</h1></div><div style="padding:30px;background:#f9f9f9"><div style="background:white;padding:20px;border-left:4px solid #E8A020"><h2 style="color:#0d1f3c;margin:0 0 10px">${postData.title}</h2><p><b>Resumo:</b> ${postData.summary}</p><p><b>Perspectiva:</b> ${postData.comment.replace(/\n/g, '<br>')}</p><p><b>Pergunta:</b> ${postData.question}</p></div></div></div></body></html>`;
  const mailOptions = { from: process.env.GMAIL_USER, to: process.env.APPROVAL_RECIPIENT_EMAIL, subject: `Virtus Mirai: ${postData.title}`, html: htmlContent };
  await transporter.sendMail(mailOptions);
}

async function runTest() {
  console.log('\n?? INICIANDO TESTE\n');
  const testArticle = { title: "Inteligência artificial criam desigualdade digital", content: "IA pode criar desigualdade baseada em renda e escolaridade.", url: "https://olhardigital.com.br/2026/05/15/" };
  try {
    console.log('?? Gerando post...');
    const postResult = await generatePostContent(testArticle);
    console.log('? Post:', postResult.title);
    console.log('\n?? Enviando email...');
    await sendTestEmail(postResult);
    console.log('? ENVIADO!\n');
  } catch (error) {
    console.error('? Erro:', error.message);
  }
}

runTest();
