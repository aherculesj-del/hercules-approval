#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const files = {
  'lib/email-service.js': `// lib/email-service.js
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD,
  },
});

export async function sendApprovalEmail(articleData, generatedContent) {
  const { title, url, source } = articleData;
  const { topicId } = generatedContent;
  const postId = articleData.id || Math.random().toString(36).substring(7);

  const reviewLink = \`https://hercules-approval.vercel.app/approval/review/\${postId}\`;

  const htmlContent = \`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; background: #f5f5f5; }
          .container { max-width: 600px; margin: 20px auto; background: white; padding: 20px; border-radius: 8px; }
          .header { border-bottom: 3px solid #0d1f3c; padding-bottom: 15px; margin-bottom: 20px; }
          .header h1 { color: #0d1f3c; margin: 0; font-size: 24px; }
          .article { background: #f9f9f9; padding: 15px; border-left: 4px solid #E8A020; margin: 20px 0; }
          .article h3 { color: #333; margin: 0 0 10px 0; }
          .article p { margin: 5px 0; color: #666; font-size: 14px; }
          .cta { margin: 30px 0; }
          .btn { padding: 14px 32px; background: #0d1f3c; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block; }
          .btn:hover { background: #1B3A6B; }
          .preview { background: #f0f0f0; padding: 15px; border-radius: 4px; margin: 20px 0; }
          .footer { border-top: 1px solid #ddd; margin-top: 30px; padding-top: 15px; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📝 Novo Conteúdo para Revisão</h1>
          </div>

          <div class="article">
            <h3>\${title}</h3>
            <p><strong>Fonte:</strong> \${source?.name || "News API"}</p>
            <p><strong>Tema:</strong> \${topicId}</p>
            <p><a href="\${url}" target="_blank">Ver artigo original →</a></p>
          </div>

          <div class="preview">
            <p style="color: #666; margin: 0;"><strong>Preview do conteúdo gerado:</strong> (edite no dashboard)</p>
          </div>

          <div class="cta">
            <a href="\${reviewLink}" class="btn">✏️ Revisar e Editar</a>
          </div>

          <div class="footer">
            <p>Clique no botão acima para revisar, editar e aprovar o conteúdo.</p>
            <p>Sistema de Aprovação Hercules • LinkedIn Agent</p>
          </div>
        </div>
      </body>
    </html>
  \`;

  try {
    const info = await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.APPROVAL_RECIPIENT_EMAIL,
      subject: \`[Hercules] Novo post para revisão: \${title.substring(0, 50)}...\`,
      html: htmlContent,
    });

    console.log("✅ Email enviado:", info.messageId);
    return { success: true, messageId: info.messageId, postId };
  } catch (error) {
    console.error("❌ Erro ao enviar email:", error);
    throw error;
  }
}`,

  'app/api/approval/save/route.js': `import feedbackSystem from "@/lib/learning-feedback-system";
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

    return NextResponse.json({
      success: true,
      postId,
      hasChanges,
      feedback,
      metrics: feedbackSystem.exportMetrics(),
      message: hasChanges ? "Post editado e aprovado" : "Post aprovado sem mudancas"
    });
  } catch (error) {
    console.error("Erro ao salvar aprovacao:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}`,

  'app/approval/review/[id]/page.js': `"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function ReviewPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id;

  const [content, setContent] = useState({
    summary: "Resumo será carregado aqui...",
    comment: "Comentário será carregado aqui..."
  });

  const [edited, setEdited] = useState({
    summary: "",
    comment: ""
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Aqui você buscaria o conteúdo gerado via API
    // Por enquanto, mostramos um default
    setContent({
      summary: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      comment: "Pergunta provocadora: não é?"
    });
    setEdited({
      summary: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      comment: "Pergunta provocadora: não é?"
    });
  }, [postId]);

  const handleSummaryChange = (e) => {
    setEdited({ ...edited, summary: e.target.value });
  };

  const handleCommentChange = (e) => {
    setEdited({ ...edited, comment: e.target.value });
  };

  const handleApprove = async () => {
    setLoading(true);
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
        }, 2000);
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao salvar aprovacao");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h1>✅ Post aprovado!</h1>
        <p>Redirecionando...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 20px" }}>
      <h1 style={{ color: "#0d1f3c" }}>✏️ Revisar e Editar Conteúdo</h1>
      <p style={{ color: "#666" }}>Post ID: {postId}</p>

      <div style={{ marginTop: "30px" }}>
        <div style={{ marginBottom: "30px" }}>
          <h2>📊 Resumo Executivo</h2>
          <textarea
            value={edited.summary}
            onChange={handleSummaryChange}
            style={{
              width: "100%",
              height: "120px",
              padding: "12px",
              fontFamily: "Arial, sans-serif",
              fontSize: "14px",
              border: "1px solid #ddd",
              borderRadius: "4px"
            }}
          />
          <small style={{ color: "#999" }}>Edite o resumo se necessário</small>
        </div>

        <div style={{ marginBottom: "30px" }}>
          <h2>💬 Comentário para LinkedIn</h2>
          <textarea
            value={edited.comment}
            onChange={handleCommentChange}
            style={{
              width: "100%",
              height: "150px",
              padding: "12px",
              fontFamily: "Arial, sans-serif",
              fontSize: "14px",
              border: "1px solid #ddd",
              borderRadius: "4px"
            }}
          />
          <small style={{ color: "#999" }}>Edite o comentário conforme sua voz</small>
        </div>

        <button
          onClick={handleApprove}
          disabled={loading}
          style={{
            padding: "12px 32px",
            background: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? "Salvando..." : "✅ Aprovar e Publicar"}
        </button>
      </div>
    </div>
  );
}`,

  'app/approval/success/page.js': `export default function SuccessPage() {
  return (
    <div style={{ padding: "60px 20px", textAlign: "center", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div>
        <h1 style={{ fontSize: "48px", color: "#28a745" }}>✅ Sucesso!</h1>
        <p style={{ fontSize: "18px", color: "#666", marginTop: "20px" }}>
          Seu post foi aprovado e será publicado em breve.
        </p>
        <p style={{ color: "#999", marginTop: "40px" }}>
          O sistema aprendeu com suas edições para futuras gerações.
        </p>
      </div>
    </div>
  );
}`
};

function createAllFiles() {
  Object.entries(files).forEach(([filePath, content]) => {
    const fullPath = require('path').join(__dirname, filePath);
    const dir = require('path').dirname(fullPath);
    
    if (!require('fs').existsSync(dir)) {
      require('fs').mkdirSync(dir, { recursive: true });
    }
    
    require('fs').writeFileSync(fullPath, content, 'utf8');
    console.log('OK: ' + filePath);
  });
  
  console.log('\nTodos os arquivos foram criados!');
}

createAllFiles();
