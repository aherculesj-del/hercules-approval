// lib/linkedin-service.js
// Serviço para gerenciar LinkedIn OAuth2, tokens e publicação
const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const LINKEDIN_PERSON_ID = "4645947";
const LINKEDIN_REDIRECT_URI = "https://hercules-approval.vercel.app/api/linkedin/auth/callback";
const LINKEDIN_API_BASE = "https://api.linkedin.com/rest";
 
export function getAuthorizationUrl() {
  return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(LINKEDIN_REDIRECT_URI)}`;
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
 
export async function publishToLinkedIn(accessToken, postContent) {
  try {
    const postData = {
      author: `urn:li:person:${LINKEDIN_PERSON_ID}`,
      commentary: postContent.comment,
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: []
      },
      content: {
        article: {
          title: postContent.title,
          description: postContent.summary,
          source: postContent.articleUrl
        }
      },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false
    };
 
    console.log("📤 Enviando para LinkedIn:");
    console.log("URL:", `${LINKEDIN_API_BASE}/posts`);
    console.log("Headers:", {
      "Authorization": `Bearer ${accessToken.substring(0, 20)}...`,
      "Content-Type": "application/json",
      "LinkedIn-Version": "202605",
      "X-Restli-Protocol-Version": "2.0.0"
    });
    console.log("Body:", JSON.stringify(postData, null, 2));
 
    const response = await fetch(`${LINKEDIN_API_BASE}/posts`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "LinkedIn-Version": "202605",
        "X-Restli-Protocol-Version": "2.0.0"
      },
      body: JSON.stringify(postData)
    });
 
    console.log("📥 Resposta do LinkedIn:");
    console.log("Status:", response.status);
    console.log("Headers:", Object.fromEntries(response.headers));
 
    const responseText = await response.text();
    console.log("Body:", responseText);
 
    if (!response.ok) {
      let error;
      try {
        error = JSON.parse(responseText);
      } catch {
        error = { message: responseText, status: response.status };
      }
      throw new Error(`LinkedIn API error: ${JSON.stringify(error)}`);
    }
 
    const result = JSON.parse(responseText);
    console.log("✅ Post publicado:", result);
    return result;
  } catch (error) {
    console.error("❌ Erro ao publicar:", error);
    throw error;
  }
}
 
export { LINKEDIN_PERSON_ID, LINKEDIN_REDIRECT_URI };
 
