import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { postId, title, summary, comment, question } = await request.json();

    if (!postId || !title || !summary || !comment || !question) {
      return NextResponse.json({ 
        error: "Campos obrigatórios faltando" 
      }, { status: 400 });
    }

    // Verificar credenciais
    if (!process.env.LINKEDIN_ACCESS_TOKEN || !process.env.LINKEDIN_ORG_ID) {
      return NextResponse.json({ 
        error: "Credenciais LinkedIn não configuradas",
        details: "Configure LINKEDIN_ACCESS_TOKEN e LINKEDIN_ORG_ID no Vercel"
      }, { status: 500 });
    }

    // Formatar post para LinkedIn
    const postContent = `${title}

${summary}

💭 Perspectiva Virtus Mirai:
${comment}

${question}

#IA #TransformaçãoDigital #Gestão #Liderança`;

    // Chamar LinkedIn Share API
    const response = await fetch(
      "https://api.linkedin.com/v2/ugcPosts",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.LINKEDIN_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
          "LinkedIn-Version": "202401"
        },
        body: JSON.stringify({
          author: `urn:li:organization:${process.env.LINKEDIN_ORG_ID}`,
          lifecycleState: "PUBLISHED",
          specificContent: {
            "com.linkedin.ugc.PublishContent": {
              shareMediaCategory: "NONE",
              shareCommentary: {
                text: postContent
              }
            }
          },
          visibility: {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
          }
        })
      }
    );

    const responseData = await response.json();

    if (!response.ok) {
      console.error("LinkedIn API Error:", responseData);
      return NextResponse.json({ 
        error: "Erro ao publicar no LinkedIn",
        details: responseData
      }, { status: response.status });
    }

    return NextResponse.json({
      success: true,
      postId,
      linkedinId: responseData.id,
      message: "✅ Post publicado no LinkedIn com sucesso!",
      linkedinUrl: `https://www.linkedin.com/feed/update/${responseData.id}/`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Erro ao publicar:", error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}