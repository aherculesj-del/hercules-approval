import { sendApprovalEmail } from '@/app/approve/lib/email';

// ====== CORS HEADERS ======
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
// ====== FIM CORS ======

// Enviar email de aprovação
console.log('📧 Tentando enviar email para:', process.env.GMAIL_USER);

export async function POST(request) {
  try {
    const body = await request.json();
    const { content, source } = body;

    if (!content) {
      return Response.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Gerar ID único para o post
    const postId = `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Criar objeto do post
    const post = {
      id: postId,
      content,
      source: source || 'linkedin',
      status: 'pending',
      createdAt: new Date().toISOString(),
      approvalLink: `${process.env.NEXTAUTH_URL || 'https://hercules-approval.vercel.app'}/approve?postId=${postId}`,
    };

    // Enviar email de aprovação
    console.log('📧 Tentando enviar email para:', process.env.GMAIL_USER);
    const emailResult = await sendApprovalEmail(
      postId,
      content,
      post.approvalLink
    );
    console.log('📧 Resultado do envio:', emailResult);

    // Retornar resposta
    return Response.json({
      success: true,
      postId,
      message: 'Email sent successfully',
      emailSent: emailResult.success,
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error in POST /api/posts:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  return Response.json({
    message: 'Posts API endpoint',
    method: 'GET',
  });
}