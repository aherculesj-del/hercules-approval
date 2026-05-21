import { NextResponse } from "next/server";

let savedAccessToken = null;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    if (!code) {
      return NextResponse.json({ error: "Código não fornecido" }, { status: 400 });
    }

    // Trocar code por access token
    const response = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
        redirect_uri: "https://hercules-approval.vercel.app/api/linkedin/auth/callback",
      }).toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ 
        error: "Erro ao obter token",
        details: data 
      }, { status: response.status });
    }

    // Salvar token em memória
    savedAccessToken = data.access_token;

    return NextResponse.json({
      success: true,
      message: "✅ Token obtido com sucesso!",
      accessToken: data.access_token,
      expiresIn: data.expires_in,
      instructions: "Copie o token e cole no Vercel como LINKEDIN_ACCESS_TOKEN"
    });

  } catch (error) {
    console.error("Erro:", error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}

export function getToken() {
  return savedAccessToken;
}