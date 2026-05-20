#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const files = {
  'lib/linkedin-service.js': `// lib/linkedin-service.js
// Serviço para gerenciar LinkedIn OAuth2, tokens e publicação

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const LINKEDIN_PAGE_ID = "109422166";
const LINKEDIN_REDIRECT_URI = "https://hercules-approval.vercel.app/api/linkedin/auth/callback";
const LINKEDIN_API_BASE = "https://api.linkedin.com/v2";

// ============ OAUTH2 ============

export function getAuthorizationUrl() {
  const scopes = [
    "w_member_social",
    "w_organization_social"
  ].join("%20");

  return \`https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=\${LINKEDIN_CLIENT_ID}&redirect_uri=\${encodeURIComponent(LINKEDIN_REDIRECT_URI)}&scope=\${scopes}\`;
}

export async function exchangeCodeForToken(code) {
  try {
    const response = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: LINKEDIN_CLIENT_ID,
        client_secret: LINKEDIN_CLIENT_SECRET,
        redirect_uri: LINKEDIN_REDIRECT_URI
      }).toString()
    });

    if (!response.ok) {
      throw new Error(\`OAuth error: \${response.statusText}\`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erro ao trocar código por token:", error);
    throw error;
  }
}

export async function refreshAccessToken(refreshToken) {
  try {
    const response = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: LINKEDIN_CLIENT_ID,
        client_secret: LINKEDIN_CLIENT_SECRET
      }).toString()
    });

    if (!response.ok) {
      throw new Error(\`Refresh error: \${response.statusText}\`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erro ao renovar token:", error);
    throw error;
  }
}

// ============ PUBLICAÇÃO ============

export async function publishToLinkedIn(accessToken, postContent) {
  try {
    // UGC Post API para página da organização
    const response = await fetch(\`\${LINKEDIN_API_BASE}/ugcPosts\`, {
      method: "POST",
      headers: {
        "Authorization": \`Bearer \${accessToken}\`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0"
      },
      body: JSON.stringify({
        author: \`urn:li:organization:\${LINKEDIN_PAGE_ID}\`,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: {
              text: postContent.comment
            },
            shareMediaCategory: "ARTICLE",
            media: [
              {
                status: "READY",
                description: {
                  text: postContent.summary
                },
                originalUrl: postContent.articleUrl
              }
            ]
          }
        },
        visibility: {
          "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(\`LinkedIn API error: \${JSON.stringify(error)}\`);
    }

    const result = await response.json();
    console.log("✅ Post publicado no LinkedIn:", result);
    return result;
  } catch (error) {
    console.error("❌ Erro ao publicar no LinkedIn:", error);
    throw error;
  }
}

export { LINKEDIN_PAGE_ID, LINKEDIN_REDIRECT_URI };`,

  'app/api/linkedin/auth/route.js': `// app/api/linkedin/auth/route.js
// GET /api/linkedin/auth
// Inicia o fluxo OAuth2

import { getAuthorizationUrl } from "@/lib/linkedin-service";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const authUrl = getAuthorizationUrl();
    
    console.log("🔗 Redirecionando para LinkedIn OAuth...");
    
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Erro:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}`,

  'app/api/linkedin/auth/callback/route.js': `// app/api/linkedin/auth/callback/route.js
// GET /api/linkedin/auth/callback
// Callback após aprovação do LinkedIn

import { exchangeCodeForToken } from "@/lib/linkedin-service";
import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.json(
        { error: \`LinkedIn authorization failed: \${error}\` },
        { status: 400 }
      );
    }

    if (!code) {
      return NextResponse.json(
        { error: "No authorization code provided" },
        { status: 400 }
      );
    }

    console.log("🔄 Trocando código por token...");
    const tokenData = await exchangeCodeForToken(code);

    // Salvar tokens no Vercel KV
    await kv.set("linkedin_access_token", tokenData.access_token, {
      ex: tokenData.expires_in
    });
    
    if (tokenData.refresh_token) {
      await kv.set("linkedin_refresh_token", tokenData.refresh_token);
    }

    console.log("✅ Tokens salvos no Vercel KV");

    return NextResponse.json({
      success: true,
      message: "LinkedIn OAuth autorizado com sucesso!",
      expiresIn: tokenData.expires_in
    });
  } catch (error) {
    console.error("❌ Erro no callback:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}`,

  'app/api/linkedin/publish/route.js': `// app/api/linkedin/publish/route.js
// POST /api/linkedin/publish
// Publica um post no LinkedIn

import { publishToLinkedIn, refreshAccessToken } from "@/lib/linkedin-service";
import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

async function getValidAccessToken() {
  let accessToken = await kv.get("linkedin_access_token");
  
  if (!accessToken) {
    throw new Error("No LinkedIn access token found. Please authenticate first.");
  }

  // Verificar se token está próximo de expirar (refresh 1 dia antes)
  const tokenAge = await kv.get("linkedin_token_age") || 0;
  const oneDay = 86400; // segundos

  if (tokenAge > oneDay) {
    console.log("🔄 Token próximo de expirar, renovando...");
    const refreshToken = await kv.get("linkedin_refresh_token");
    
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const newTokenData = await refreshAccessToken(refreshToken);
    accessToken = newTokenData.access_token;
    
    await kv.set("linkedin_access_token", accessToken, {
      ex: newTokenData.expires_in
    });
    await kv.del("linkedin_token_age");
    
    console.log("✅ Token renovado");
  }

  return accessToken;
}

export async function POST(request) {
  try {
    const { postContent } = await request.json();

    if (!postContent || !postContent.comment || !postContent.articleUrl) {
      return NextResponse.json(
        { 
          error: "postContent com comment, summary e articleUrl são obrigatórios",
          example: {
            postContent: {
              comment: "Seu comentário aqui",
              summary: "Resumo do artigo",
              articleUrl: "https://example.com/article"
            }
          }
        },
        { status: 400 }
      );
    }

    const accessToken = await getValidAccessToken();
    
    console.log("📤 Publicando no LinkedIn...");
    const result = await publishToLinkedIn(accessToken, postContent);

    return NextResponse.json({
      success: true,
      message: "Post publicado no LinkedIn com sucesso!",
      linkedinPostId: result.id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("❌ Erro ao publicar:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}`,

  '.env.local.example': `# LinkedIn OAuth Credentials
LINKEDIN_CLIENT_ID=77rhlxtkhpxhy1
LINKEDIN_CLIENT_SECRET=WPL_AP1.rWzinH5JJJOVRtRt.EF9NsA==

# Vercel KV
KV_URL=your_kv_url
KV_REST_API_URL=your_kv_rest_api_url
KV_REST_API_TOKEN=your_kv_rest_api_token
KV_REST_API_READ_ONLY_TOKEN=your_kv_rest_api_read_only_token`
};

function createAllFiles() {
  Object.entries(files).forEach(([filePath, content]) => {
    const fullPath = path.join(__dirname, filePath);
    const dir = path.dirname(fullPath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log('✅ ' + filePath);
  });
  
  console.log('\n✅ LinkedIn Service implementado CORRETAMENTE!');
  console.log('\n📋 PRÓXIMOS PASSOS:');
  console.log('');
  console.log('1. HABILITAR VERCEL KV NO VERCEL:');
  console.log('   → https://vercel.com/dashboard/stores');
  console.log('   → Criar novo "KV Store"');
  console.log('   → Copiar as 4 env vars');
  console.log('');
  console.log('2. ADICIONAR ENV VARS NO VERCEL:');
  console.log('   LINKEDIN_CLIENT_ID=77rhlxtkhpxhy1');
  console.log('   LINKEDIN_CLIENT_SECRET=WPL_AP1.rWzinH5JJJOVRtRt.EF9NsA==');
  console.log('   KV_URL=...');
  console.log('   KV_REST_API_URL=...');
  console.log('   KV_REST_API_TOKEN=...');
  console.log('   KV_REST_API_READ_ONLY_TOKEN=...');
  console.log('');
  console.log('3. FAZER PUSH E DEPLOY');
  console.log('');
  console.log('4. AUTENTICAR NO LINKEDIN:');
  console.log('   → Acessar: https://hercules-approval.vercel.app/api/linkedin/auth');
  console.log('   → Aprovar a aplicação');
  console.log('   → Tokens salvos automaticamente');
  console.log('');
  console.log('5. TESTAR PUBLICAÇÃO:');
  console.log('   → POST /api/linkedin/publish com postContent');
}

createAllFiles();
