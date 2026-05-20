import { savePost, getPostById, updatePostStatus } from "@/lib/post-storage";
import feedbackSystem from "@/lib/learning-feedback-system";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { postId, originalContent, editedContent, articleUrl } = await request.json();

    if (!postId || !originalContent || !editedContent) {
      return NextResponse.json(
        { error: "Dados obrigatorios: postId, originalContent, editedContent" },
        { status: 400 }
      );
    }

    // Comparar original vs editado
    const hasChanges = 
      originalContent.summary !== editedContent.summary ||
      originalContent.comment !== editedContent.comment;

    // Salvar no learning system
    const feedback = {
      postId,
      originalSummary: originalContent.summary,
      editedSummary: editedContent.summary,
      originalComment: originalContent.comment,
      editedComment: editedContent.comment,
      articleUrl: articleUrl,
      hasChanges,
      timestamp: new Date().toISOString(),
      approved: true
    };

    feedbackSystem.addFeedback(feedback);
    feedbackSystem.updateMetrics(hasChanges ? "edited" : "approved");

    // Atualizar status do post
    updatePostStatus(postId, "approved");

    return NextResponse.json({
      success: true,
      postId,
      hasChanges,
      feedback,
      metrics: feedbackSystem.exportMetrics(),
      message: hasChanges ? "Post editado e aprovado" : "Post aprovado sem mudancas",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Erro ao salvar aprovacao:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}