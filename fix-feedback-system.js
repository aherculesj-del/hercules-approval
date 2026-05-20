#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const fixedSaveRoute = `import { savePost, getPostById, updatePostStatus } from "@/lib/post-storage";
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

    // Atualizar métricas do learning system
    if (feedbackSystem && typeof feedbackSystem.updateMetrics === 'function') {
      feedbackSystem.updateMetrics(hasChanges ? "edited" : "approved");
    }

    // Atualizar status do post
    updatePostStatus(postId, "approved");

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

    return NextResponse.json({
      success: true,
      postId,
      hasChanges,
      feedback,
      metrics: feedbackSystem?.exportMetrics?.() || {},
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
}`;

const fixedFeedbackSystem = `// lib/learning-feedback-system.js
// Sistema de aprendizado que coleta feedback das edições

let feedbackData = {
  totalFeedback: 0,
  approved: 0,
  edited: 0,
  feedbackHistory: []
};

function updateMetrics(type) {
  feedbackData.totalFeedback += 1;
  if (type === "edited") {
    feedbackData.edited += 1;
  } else if (type === "approved") {
    feedbackData.approved += 1;
  }
}

function addFeedback(feedback) {
  feedbackData.feedbackHistory.push({
    ...feedback,
    addedAt: new Date().toISOString()
  });
}

function exportMetrics() {
  return {
    totalProcessed: feedbackData.totalFeedback,
    approved: feedbackData.approved,
    edited: feedbackData.edited,
    editRate: feedbackData.totalFeedback > 0 
      ? ((feedbackData.edited / feedbackData.totalFeedback) * 100).toFixed(1) + '%'
      : '0%'
  };
}

function getAllFeedback() {
  return feedbackData.feedbackHistory;
}

export default {
  updateMetrics,
  addFeedback,
  exportMetrics,
  getAllFeedback
};`;

const filePath1 = path.join(__dirname, 'app/api/approval/save/route.js');
const filePath2 = path.join(__dirname, 'lib/learning-feedback-system.js');

const dir1 = path.dirname(filePath1);
const dir2 = path.dirname(filePath2);

if (!fs.existsSync(dir1)) {
  fs.mkdirSync(dir1, { recursive: true });
}
if (!fs.existsSync(dir2)) {
  fs.mkdirSync(dir2, { recursive: true });
}

fs.writeFileSync(filePath1, fixedSaveRoute, 'utf8');
console.log('✅ app/api/approval/save/route.js corrigido!');

fs.writeFileSync(filePath2, fixedFeedbackSystem, 'utf8');
console.log('✅ lib/learning-feedback-system.js corrigido!');

console.log('');
console.log('Mudanças:');
console.log('1. Removido erro de addFeedback');
console.log('2. Adicionado tratamento seguro para metrics');
console.log('3. Learning system com métodos garantidos');
console.log('');
console.log('Próximo passo: git add . && git commit && git push');
