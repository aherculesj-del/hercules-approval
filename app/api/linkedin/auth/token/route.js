import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const response = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
      }).toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ 
        error: "Erro ao gerar token",
        details: data 
      }, { status: response.status });
    }

    return NextResponse.json({
      success: true,
      accessToken: data.access_token,
      expiresIn: data.expires_in,
      message: "✅ Token gerado com sucesso! Copie o token abaixo:",
      instructions: "Cole este token no Vercel como LINKEDIN_ACCESS_TOKEN"
    });

  } catch (error) {
    console.error("Erro:", error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}
