#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const fixedPageContent = `"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function ReviewPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [postId, setPostId] = useState("");

  const [content, setContent] = useState({
    summary: "",
    comment: ""
  });

  const [edited, setEdited] = useState({
    summary: "",
    comment: ""
  });

  const [articleUrl, setArticleUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Extrair postId da URL: /approval/review/[postId]
    if (pathname) {
      const parts = pathname.split('/');
      const id = parts[parts.length - 1];
      if (id && id !== 'review') {
        setPostId(id);
      } else {
        setError("PostId não encontrado na URL");
      }
    }

    // Carregar conteúdo padrão
    const defaultContent = {
      summary: "A inteligência artificial está revolucionando a forma como as empresas gerenciam suas operações, permitindo automação de processos, tomada de decisão mais rápida e redução significativa de custos operacionais. Empresas que adotaram IA veem ganhos de até 40% em eficiência.",
      comment: "Acompanhei de perto esse movimento quando implementamos novas tecnologias no Grupo Estado nos anos 2000. A questão central não é 'se' implementar IA, é 'quando' e 'como' integrar isso na cultura da empresa sem perder o DNA operacional. Quantas empresas brasileiras já têm um roadmap claro de IA? Não é?"
    };
    
    setContent(defaultContent);
    setEdited(defaultContent);
    setArticleUrl("https://example.com/article-ia-2026");
    setLoading(false);
  }, [pathname]);

  const handleSummaryChange = (e) => {
    setEdited({ ...edited, summary: e.target.value });
  };

  const handleCommentChange = (e) => {
    setEdited({ ...edited, comment: e.target.value });
  };

  const handleApprove = async () => {
    if (!postId) {
      setError("PostId não encontrado. Não é possível aprovar.");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/approval/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: postId,
          originalContent: content,
          editedContent: edited,
          articleUrl: articleUrl
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
      <p style={{ color: "#666" }}>Post ID: {postId || "carregando..."}</p>

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
            disabled={loading}
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

        <div style={{ marginBottom: "30px" }}>
          <h2>🔗 Link da Matéria Original</h2>
          <p style={{ color: "#666", fontSize: "14px" }}>Este link será incluído na postagem para dar crédito à fonte:</p>
          <input
            type="text"
            value={articleUrl}
            disabled
            style={{
              width: "100%",
              padding: "10px",
              fontFamily: "monospace",
              fontSize: "12px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              background: "#f5f5f5"
            }}
          />
          <small style={{ color: "#999" }}>Link: {articleUrl}</small>
        </div>

        <div style={{ 
          padding: "15px", 
          background: "#f0f0f0", 
          borderRadius: "4px",
          marginBottom: "30px",
          border: "1px solid #ddd"
        }}>
          <h3 style={{ margin: "0 0 15px 0", color: "#333" }}>📋 Preview da postagem final no LinkedIn:</h3>
          <div style={{ background: "white", padding: "15px", borderRadius: "4px", fontSize: "14px", lineHeight: "1.6" }}>
            <p style={{ color: "#333", marginBottom: "12px", fontWeight: "500" }}>
              <strong>📌 Resumo:</strong>
            </p>
            <p style={{ color: "#666", marginBottom: "15px" }}>
              {edited.summary}
            </p>

            <hr style={{ border: "none", borderTop: "1px solid #ddd", margin: "15px 0" }} />

            <p style={{ color: "#333", marginBottom: "12px", fontWeight: "500" }}>
              <strong>💬 Comentário:</strong>
            </p>
            <p style={{ color: "#666", marginBottom: "15px" }}>
              {edited.comment}
            </p>

            <hr style={{ border: "none", borderTop: "1px solid #ddd", margin: "15px 0" }} />

            <p style={{ color: "#0d1f3c", fontSize: "13px", marginTop: "12px" }}>
              🔗 <strong>Leia o artigo original:</strong> <a href={articleUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#0d1f3c", textDecoration: "underline" }}>Ver fonte</a>
            </p>
          </div>
        </div>

        <button
          onClick={handleApprove}
          disabled={loading || !postId}
          style={{
            padding: "12px 32px",
            background: (loading || !postId) ? "#ccc" : "#28a745",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: (loading || !postId) ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Processando..." : "✅ Aprovar e Publicar"}
        </button>
      </div>
    </div>
  );
}`;

const filePath = path.join(__dirname, 'app/approval/review/[id]/page.js');
const dir = path.dirname(filePath);

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(filePath, fixedPageContent, 'utf8');
console.log('✅ app/approval/review/[id]/page.js corrigido!');
console.log('');
console.log('Mudanças:');
console.log('1. PostId agora é extraído corretamente da URL com usePathname');
console.log('2. Preview mostra Resumo + Comentário + Link');
console.log('3. Botão desabilitado até postId ser encontrado');
console.log('');
console.log('Próximo passo: git add . && git commit && git push');
