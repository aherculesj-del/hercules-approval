"use client";

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
}