#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const files = {
  'lib/post-storage.js': `// lib/post-storage.js
// Storage em memória (para teste/demo)
// Em produção, usar Vercel KV ou banco de dados

let postsDatabase = [];

export function savePost(post) {
  post.savedAt = new Date().toISOString();
  post.status = post.status || 'pending_approval';
  postsDatabase.push(post);
  return post;
}

export function getPostsByStatus(status) {
  return postsDatabase.filter(p => p.status === status);
}

export function getPostById(postId) {
  return postsDatabase.find(p => p.postId === postId);
}

export function updatePostStatus(postId, status) {
  const post = postsDatabase.find(p => p.postId === postId);
  if (post) {
    post.status = status;
    post.updatedAt = new Date().toISOString();
  }
  return post;
}

export function getAllPosts() {
  return postsDatabase;
}`,

  'app/approval/review/[id]/page.js': `"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ReviewPage({ params }) {
  const router = useRouter();
  const postId = params.id;

  const [content, setContent] = useState({
    summary: "",
    comment: ""
  });

  const [edited, setEdited] = useState({
    summary: "",
    comment: ""
  });

  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Carregar conteúdo do post
    // Por enquanto, usando dados de exemplo
    const defaultContent = {
      summary: "A inteligência artificial está revolucionando a forma como as empresas gerenciam suas operações, permitindo automação de processos, tomada de decisão mais rápida e redução significativa de custos operacionais. Empresas que adotaram IA veem ganhos de até 40% em eficiência.",
      comment: "Acompanhei de perto esse movimento quando implementamos novas tecnologias no Grupo Estado nos anos 2000. A questão central não é 'se' implementar IA, é 'quando' e 'como' integrar isso na cultura da empresa sem perder o DNA operacional. Quantas empresas brasileiras já têm um roadmap claro de IA? Não é?"
    };
    
    setContent(defaultContent);
    setEdited(defaultContent);
    setLoading(false);
  }, [postId]);

  const handleSummaryChange = (e) => {
    setEdited({ ...edited, summary: e.target.value });
  };

  const handleCommentChange = (e) => {
    setEdited({ ...edited, comment: e.target.value });
  };

  const handleApprove = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/approval/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          originalContent: content,
          editedContent: edited
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        setSubmitted(true);
        setTimeout(() => {
          router.push("/approval/success");
        }, 1500);
      } else {
        setError(result.error || "Erro ao salvar aprovação");
      }
    } catch (error) {
      console.error("Erro:", error);
      setError(error.message || "Erro ao processar");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <p>Carregando conteúdo...</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h1>✅ Post aprovado!</h1>
        <p>Redirecionando para confirmação...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 20px" }}>
      <h1 style={{ color: "#0d1f3c" }}>✏️ Revisar e Editar Conteúdo</h1>
      <p style={{ color: "#666" }}>Post ID: {postId}</p>

      {error && (
        <div style={{ 
          padding: "12px", 
          background: "#fee", 
          color: "#c33", 
          borderRadius: "4px",
          marginBottom: "20px"
        }}>
          ❌ {error}
        </div>
      )}

      <div style={{ marginTop: "30px" }}>
        <div style={{ marginBottom: "30px" }}>
          <h2>📊 Resumo Executivo</h2>
          <textarea
            value={edited.summary}
            onChange={handleSummaryChange}
            disabled={loading}
            style={{
              width: "100%",
              height: "120px",
              padding: "12px",
              fontFamily: "Arial, sans-serif",
              fontSize: "14px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              opacity: loading ? 0.6 : 1
            }}
          />
          <small style={{ color: "#999" }}>Edite o resumo se necessário</small>
        </div>

        <div style={{ marginBottom: "30px" }}>
          <h2>💬 Comentário para LinkedIn</h2>
          <textarea
            value={edited.comment}
            onChange={handleCommentChange}
            disabled={loading}
            style={{
              width: "100%",
              height: "150px",
              padding: "12px",
              fontFamily: "Arial, sans-serif",
              fontSize: "14px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              opacity: loading ? 0.6 : 1
            }}
          />
          <small style={{ color: "#999" }}>Edite o comentário conforme sua voz</small>
        </div>

        <button
          onClick={handleApprove}
          disabled={loading}
          style={{
            padding: "12px 32px",
            background: loading ? "#ccc" : "#28a745",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Processando..." : "✅ Aprovar e Publicar"}
        </button>
      </div>
    </div>
  );
}`,

  'app/api/approval/save/route.js': `import { savePost, getPostById, updatePostStatus } from "@/lib/post-storage";
import feedbackSystem from "@/lib/learning-feedback-system";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { postId, originalContent, editedContent } = await request.json();

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
}`
};

function updateAllFiles() {
  Object.entries(files).forEach(([filePath, content]) => {
    const fullPath = path.join(__dirname, filePath);
    const dir = path.dirname(fullPath);
    
    if (!require('fs').existsSync(dir)) {
      require('fs').mkdirSync(dir, { recursive: true });
    }
    
    require('fs').writeFileSync(fullPath, content, 'utf8');
    console.log('✅ ' + filePath);
  });
  
  console.log('\n✅ Arquivos corrigidos com sucesso!');
  console.log('Próximo passo: git add . && git commit && git push');
}

updateAllFiles();
