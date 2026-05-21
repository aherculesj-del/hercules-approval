// app/api/approval/save/route.js
// POST /api/approval/save
// Salva post aprovado + aprende com edições do usuário

import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { postId, postContent, isApproved, learningFeedback } = body;

    if (!postId || !postContent) {
      return NextResponse.json(
        { error: "postId e postContent são obrigatórios" },
        { status: 400 }
      );
    }

    // Estrutura do post com TÍTULO
    const post = {
      id: postId,
      title: postContent.title,
      summary: postContent.summary,
      comment: postContent.comment,
      question: postContent.question,
      articleUrl: postContent.articleUrl,
      status: isApproved ? "approved" : "draft",
      createdAt: new Date().toISOString(),
      approvedAt: isApproved ? new Date().toISOString() : null,
      originalContent: postContent.original || null,
      editedContent: postContent.edited || null,
      learningFeedback: learningFeedback || {}
    };

    // Salvar post em KV com postId
    await kv.set(`post:${postId}`, JSON.stringify(post));

    // Se aprovado, adicionar à fila de publicação
    if (isApproved) {
      const publishQueue = await kv.get("publish_queue") || [];
      publishQueue.push({
        postId,
        scheduledFor: new Date().toISOString(),
        status: "pending_publish"
      });
      await kv.set("publish_queue", publishQueue);
      
      console.log(`✅ Post ${postId} aprovado e agendado para publicação`);
    }

    // Learning System: Capturar mudanças
    if (learningFeedback && learningFeedback.original && learningFeedback.edited) {
      const learningEntry = {
        postId,
        timestamp: new Date().toISOString(),
        field: learningFeedback.field, // "title" | "summary" | "comment" | "question"
        original: learningFeedback.original,
        edited: learningFeedback.edited,
        changeType: learningFeedback.changeType, // "improved" | "clarified" | "shortened" | "expanded"
        userFeedback: learningFeedback.reason // Por que editou?
      };

      // Salvar learning
      const learningHistory = await kv.get("learning_history") || [];
      learningHistory.push(learningEntry);
      await kv.set("learning_history", learningHistory);

      console.log(`📚 Learning capturado: ${learningFeedback.field} - ${learningFeedback.changeType}`);
    }

    return NextResponse.json({
      success: true,
      message: isApproved ? "Post aprovado e agendado para publicação!" : "Post salvo como rascunho",
      postId,
      status: post.status,
      post
    });
  } catch (error) {
    console.error("❌ Erro ao salvar post:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}