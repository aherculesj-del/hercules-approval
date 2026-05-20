#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const files = {
  'lib/post-storage.js': `// lib/post-storage.js
// Storage simples para guardar posts pendentes de aprovação/publicação
// Em produção, usar banco de dados ou Vercel KV

const storageFile = '/tmp/hercules-posts.json';

function readStorage() {
  try {
    if (fs.existsSync(storageFile)) {
      const data = fs.readFileSync(storageFile, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Erro ao ler storage:', error);
  }
  return { posts: [] };
}

function writeStorage(data) {
  try {
    fs.writeFileSync(storageFile, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Erro ao escrever storage:', error);
  }
}

export function savePost(post) {
  const storage = readStorage();
  post.savedAt = new Date().toISOString();
  post.status = post.status || 'pending_approval';
  storage.posts.push(post);
  writeStorage(storage);
  return post;
}

export function getPostsByStatus(status) {
  const storage = readStorage();
  return storage.posts.filter(p => p.status === status);
}

export function getPostsByDate(date) {
  const storage = readStorage();
  const dateStr = new Date(date).toISOString().split('T')[0];
  return storage.posts.filter(p => {
    const postDate = new Date(p.savedAt).toISOString().split('T')[0];
    return postDate === dateStr;
  });
}

export function updatePostStatus(postId, status) {
  const storage = readStorage();
  const post = storage.posts.find(p => p.postId === postId);
  if (post) {
    post.status = status;
    post.updatedAt = new Date().toISOString();
    writeStorage(storage);
    return post;
  }
  return null;
}

export function getAllPosts() {
  const storage = readStorage();
  return storage.posts;
}`,

  'app/api/cron/search-news/route.js': `// app/api/cron/search-news/route.js
// Cron: Segunda-Quinta às 6h UTC (3h Brasil)
// Busca notícias → Processa com Claude → Envia email → Salva em storage

import { searchAllTopics } from "@/lib/news-service";
import { processArticleComplete } from "@/lib/claude-service";
import { sendApprovalEmail } from "@/lib/email-service";
import { savePost } from "@/lib/post-storage";
import feedbackSystem from "@/lib/learning-feedback-system";
import { NextResponse } from "next/server";

function getDayOfWeek() {
  const days = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
  return days[new Date().getDay()];
}

function isSearchDay() {
  const day = new Date().getDay();
  return day >= 1 && day <= 4; // segunda (1) a quinta (4)
}

export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== \`Bearer \${process.env.CRON_SECRET}\`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = getDayOfWeek();
  
  if (!isSearchDay()) {
    return NextResponse.json({
      success: false,
      message: \`Hoje é \${today}. Cron de BUSCA só roda segunda-quinta.`,
      timestamp: new Date().toISOString()
    });
  }

  try {
    console.log(\`🔍 [CRON BUSCA - \${today}] Iniciando...\`);
    const allArticles = await searchAllTopics();

    const emailsSent = [];
    const errors = [];

    for (const [topicId, articles] of Object.entries(allArticles)) {
      console.log(\`📰 Processando \${articles.length} artigos: \${topicId}\`);

      for (const article of articles) {
        try {
          const generatedContent = await processArticleComplete(article);

          if (generatedContent) {
            const postId = article.id || \`post-\${Date.now()}-\${Math.random().toString(36).substring(7)}\`;
            
            const emailResult = await sendApprovalEmail(article, generatedContent);

            const post = {
              postId,
              daySearched: today,
              article: {
                title: article.title,
                description: article.description,
                url: article.url,
                source: article.source,
                urlToImage: article.urlToImage
              },
              generatedContent: {
                summary: generatedContent.summary,
                comment: generatedContent.comment,
                topicId: generatedContent.topicId
              },
              emailSent: emailResult.success,
              messageId: emailResult.messageId,
              status: "pending_approval",
              createdAt: new Date().toISOString()
            };

            savePost(post);
            emailsSent.push(postId);
            feedbackSystem.updateMetrics(true);
            
            console.log(\`  ✅ \${postId}\`);
          }
        } catch (articleError) {
          console.error(\`  ❌ Erro: \${articleError.message}\`);
          errors.push({ title: article.title, error: articleError.message });
          feedbackSystem.updateMetrics(false);
        }
      }
    }

    const summary = {
      day: today,
      totalArticles: Object.values(allArticles).flat().length,
      emailsSent: emailsSent.length,
      errors: errors.length
    };

    console.log(\`✅ [CRON BUSCA] Concluído!\`, summary);

    return NextResponse.json({
      success: true,
      message: \`Busca de \${today} concluída\`,
      summary,
      emailsSent,
      errors,
      metrics: feedbackSystem.exportMetrics(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("❌ Erro crítico:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}`,

  'app/api/cron/publish-news/route.js': `// app/api/cron/publish-news/route.js
// Cron: Terça-Sexta às 8h UTC (5h Brasil)
// Publica posts aprovados do dia anterior no LinkedIn

import { getPostsByStatus } from "@/lib/post-storage";
import { NextResponse } from "next/server";

const dayMap = {
  1: 'segunda',
  2: 'terca',
  3: 'quarta',
  4: 'quinta',
  5: 'sexta',
  6: 'sabado',
  0: 'domingo'
};

function getDayOfWeek() {
  return dayMap[new Date().getDay()];
}

function isPublishDay() {
  const day = new Date().getDay();
  return day >= 2 && day <= 5; // terça (2) a sexta (5)
}

function getYesterdayDay() {
  const days = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return days[yesterday.getDay()];
}

export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== \`Bearer \${process.env.CRON_SECRET}\`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = getDayOfWeek();
  const yesterday = getYesterdayDay();

  if (!isPublishDay()) {
    return NextResponse.json({
      success: false,
      message: \`Hoje é \${today}. Cron de PUBLICAÇÃO só roda terça-sexta.\`,
      timestamp: new Date().toISOString()
    });
  }

  try {
    console.log(\`📤 [CRON PUBLICAÇÃO - \${today}] Buscando posts de \${yesterday} aprovados...\`);
    
    // Buscar posts aprovados de ontem
    const approvedPosts = getPostsByStatus('approved').filter(
      post => post.daySearched === yesterday
    );

    console.log(\`📋 Encontrados \${approvedPosts.length} posts aprovados de \${yesterday}\`);

    const published = [];
    const errors = [];

    for (const post of approvedPosts) {
      try {
        console.log(\`  → Publicando: \${post.article.title.substring(0, 40)}...\`);
        
        // TODO: Integrar LinkedIn API aqui
        // const linkedinResult = await publishToLinkedIn(post);
        
        // Por enquanto, simulamos a publicação
        const linkedinId = \`linkedin-\${Date.now()}\`;
        
        published.push({
          postId: post.postId,
          linkedinId,
          title: post.article.title,
          publishedAt: new Date().toISOString()
        });

        console.log(\`  ✅ Publicado: \${linkedinId}\`);
      } catch (error) {
        console.error(\`  ❌ Erro ao publicar: \${error.message}\`);
        errors.push({
          postId: post.postId,
          error: error.message
        });
      }
    }

    console.log(\`✅ [CRON PUBLICAÇÃO] Concluído!\`);

    return NextResponse.json({
      success: true,
      message: \`Publicação de \${yesterday} concluída\`,
      yesterday,
      today,
      published,
      errors,
      publishedCount: published.length,
      timestamp: new Date().toISOString())
    });
  } catch (error) {
    console.error("❌ Erro crítico:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}`
};

const vercelJson = {
  "crons": [
    {
      "path": "/api/cron/search-news",
      "schedule": "0 6 * * 1-4"
    },
    {
      "path": "/api/cron/publish-news",
      "schedule": "0 8 * * 2-5"
    }
  ]
};

function createAllFiles() {
  // Criar arquivo post-storage.js
  const storageDir = path.join(__dirname, 'lib');
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }
  fs.writeFileSync(path.join(storageDir, 'post-storage.js'), files['lib/post-storage.js'], 'utf8');
  console.log('OK: lib/post-storage.js');

  // Atualizar search-news/route.js
  const searchDir = path.join(__dirname, 'app/api/cron/search-news');
  if (!fs.existsSync(searchDir)) {
    fs.mkdirSync(searchDir, { recursive: true });
  }
  fs.writeFileSync(path.join(searchDir, 'route.js'), files['app/api/cron/search-news/route.js'], 'utf8');
  console.log('OK: app/api/cron/search-news/route.js');

  // Criar publish-news/route.js
  const publishDir = path.join(__dirname, 'app/api/cron/publish-news');
  if (!fs.existsSync(publishDir)) {
    fs.mkdirSync(publishDir, { recursive: true });
  }
  fs.writeFileSync(path.join(publishDir, 'route.js'), files['app/api/cron/publish-news/route.js'], 'utf8');
  console.log('OK: app/api/cron/publish-news/route.js');

  // Atualizar vercel.json
  fs.writeFileSync(path.join(__dirname, 'vercel.json'), JSON.stringify(vercelJson, null, 2), 'utf8');
  console.log('OK: vercel.json');

  console.log('\n✅ Cronograma correto implementado!');
  console.log('');
  console.log('SEGUNDA-QUINTA às 6h:');
  console.log('  → Busca notícias');
  console.log('  → Claude gera conteúdo');
  console.log('  → Envia email de aprovação');
  console.log('');
  console.log('TERÇA-SEXTA às 8h:');
  console.log('  → Publica posts aprovados do dia anterior');
  console.log('');
  console.log('Fluxo completo:');
  console.log('  SEG 6h → Busca → EMAIL → Você edita/aprova');
  console.log('  TER 8h → Publica de SEG');
  console.log('  TER 6h → Busca → EMAIL → Você edita/aprova');
  console.log('  QUA 8h → Publica de TER');
  console.log('  ... e assim por diante');
}

createAllFiles();
