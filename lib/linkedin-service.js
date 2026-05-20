// lib/linkedin-service.js
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

  return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(LINKEDIN_REDIRECT_URI)}&scope=${scopes}`;
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
      throw new Error(`OAuth error: ${response.statusText}`);
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
      throw new Error(`Refresh error: ${response.statusText}`);
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
    const response = await fetch(`${LINKEDIN_API_BASE}/ugcPosts`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0"
      },
      body: JSON.stringify({
        author: `urn:li:organization:${LINKEDIN_PAGE_ID}`,
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
      throw new Error(`LinkedIn API error: ${JSON.stringify(error)}`);
    }

    const result = await response.json();
    console.log("✅ Post publicado no LinkedIn:", result);
    return result;
  } catch (error) {
    console.error("❌ Erro ao publicar no LinkedIn:", error);
    throw error;
  }
}

export { LINKEDIN_PAGE_ID, LINKEDIN_REDIRECT_URI };