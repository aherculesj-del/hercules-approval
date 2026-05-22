"use client";
import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";

export default function ReviewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [comment, setComment] = useState("");
  const [question, setQuestion] = useState("");
  const [source, setSource] = useState("");                           // ✅ NOVO
  const [sourceUrl, setSourceUrl] = useState("");                     // ✅ NOVO
  const [isPublishing, setIsPublishing] = useState(false);

  // ✅ NOVO: Limites em caracteres COM espaços
  const limits = {
    title: 150,
    summary: 1200,
    comment: 600,
    question: 250
  };

  useEffect(() => {
    setTitle(searchParams.get("title") || "");
    setSummary(searchParams.get("summary") || "");
    setComment(searchParams.get("comment") || "");
    setQuestion(searchParams.get("question") || "");
    setSource(searchParams.get("source") || "");                     // ✅ NOVO
    setSourceUrl(searchParams.get("sourceUrl") || "");               // ✅ NOVO
  }, [searchParams]);

  // ✅ NOVO: Função para renderizar campo com contador
  const renderField = (label, value, setValue, limit, multiline = false) => {
    const charCount = value.length;
    const percentage = (charCount / limit) * 100;
    const isWarning = percentage > 80;
    const isError = percentage > 100;

    return (
      <div style={{ background: "white", padding: "20px", marginBottom: "20px", borderLeft: "4px solid #E8A020", borderRadius: "4px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <h3 style={{ color: "#0d1f3c", margin: 0 }}>{label}</h3>
          <span style={{ fontSize: "12px", fontWeight: "bold", color: isError ? "#dc2626" : isWarning ? "#f59e0b" : "#10b981" }}>
            {charCount} / {limit}
          </span>
        </div>

        {/* Progress bar */}
        <div style={{ width: "100%", height: "6px", backgroundColor: "#e5e7eb", borderRadius: "3px", marginBottom: "10px", overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${Math.min(percentage, 100)}%`,
              backgroundColor: isError ? "#dc2626" : isWarning ? "#f59e0b" : "#10b981",
              transition: "all 0.3s ease"
            }}
          ></div>
        </div>

        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          style={{
            width: "100%",
            height: multiline ? "300px" : "60px",
            padding: "10px",
            border: `2px solid ${isError ? "#dc2626" : isWarning ? "#f59e0b" : "#ddd"}`,
            borderRadius: "4px",
            fontFamily: "Arial",
            resize: "vertical",
            backgroundColor: isError ? "#fef2f2" : "white"
          }}
        />

        {isError && (
          <p style={{ color: "#dc2626", fontSize: "12px", marginTop: "5px", fontWeight: "bold" }}>
            ❌ Excedeu limite em {charCount - limit} caracteres
          </p>
        )}
      </div>
    );
  };

  async function handlePublish() {
    // ✅ NOVO: Validar limites antes de publicar
    const validation = {
      title: title.length <= limits.title,
      summary: summary.length <= limits.summary,
      comment: comment.length <= limits.comment,
      question: question.length <= limits.question
    };

    if (!Object.values(validation).every(v => v)) {
      alert("❌ Alguns campos excedem os limites máximos. Corrija antes de publicar.");
      return;
    }

    const confirmed = confirm("📱 Publicar este post no LinkedIn da Virtus Mirai?");
    if (!confirmed) return;

    setIsPublishing(true);
    try {
      const response = await fetch("/api/approval/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: params.id,
          title,
          summary,
          comment,
          question,
          source,                                                    // ✅ NOVO
          sourceUrl                                                 // ✅ NOVO
        })
      });

      const result = await response.json();

      if (response.ok) {
        alert(`✅ ${result.message}\n\n🔗 ${result.linkedinUrl}`);
        window.location.href = result.linkedinUrl;
      } else {
        alert(`❌ Erro: ${result.error}\n\n${result.details ? JSON.stringify(result.details) : ""}`);
      }
    } catch (error) {
      alert(`❌ Erro ao publicar: ${error.message}`);
    } finally {
      setIsPublishing(false);
    }
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 20px" }}>
      <div style={{ background: "linear-gradient(135deg,#0d1f3c,#1B3A6B)", color: "white", padding: "30px", borderRadius: "8px 8px 0 0" }}>
        <h1 style={{ margin: "0" }}>✏️ Revisar e Editar</h1>
        <p style={{ margin: "5px 0 0", fontSize: "14px" }}>Post ID: {params.id}</p>
        
        {/* ✅ NOVO: Exibir fonte e link */}
        {source && (
          <div style={{ marginTop: "15px", fontSize: "14px", borderTop: "1px solid rgba(255,255,255,0.3)", paddingTop: "15px" }}>
            <p style={{ margin: "5px 0" }}>📰 <strong>Fonte:</strong> {source}</p>
            {sourceUrl && (
              <p style={{ margin: "5px 0" }}>
                🔗 <a href={sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#E8A020", textDecoration: "underline" }}>
                  Ver artigo original
                </a>
              </p>
            )}
          </div>
        )}
      </div>

      <div style={{ padding: "30px", background: "#f9f9f9", borderRadius: "0 0 8px 8px" }}>
        {/* ✅ Campos com validação */}
        {renderField("📌 TÍTULO (máx. 150 caracteres)", title, setTitle, limits.title, false)}
        {renderField("📄 RESUMO (máx. 1200 caracteres - cite a fonte no início)", summary, setSummary, limits.summary, true)}
        {renderField("💭 PERSPECTIVA VIRTUS MIRAI (máx. 600 caracteres)", comment, setComment, limits.comment, true)}
        {renderField("❓ PERGUNTA (máx. 250 caracteres - termina com 'não é?')", question, setQuestion, limits.question, false)}

        {/* Preview */}
        <div style={{ background: "white", padding: "20px", marginBottom: "20px", borderTop: "2px solid #E8A020", borderRadius: "4px" }}>
          <h3 style={{ color: "#0d1f3c", margin: "0 0 15px" }}>📋 Preview</h3>
          <div style={{ background: "#f0f0f0", padding: "20px", borderRadius: "4px" }}>
            {source && <p style={{ fontSize: "12px", color: "#666", marginBottom: "10px" }}>📰 <strong>{source}</strong></p>}
            <div style={{ fontWeight: "bold", color: "#0d1f3c", marginBottom: "12px", fontSize: "16px" }}>{title || "(Título aqui...)"}</div>
            <div style={{ marginBottom: "12px", whiteSpace: "pre-wrap" }}>{summary || "(Resumo aqui...)"}</div>
            <div style={{ marginBottom: "12px", borderLeft: "3px solid #E8A020", paddingLeft: "12px" }}>{comment || "(Perspectiva aqui...)"}</div>
            <div style={{ marginBottom: "12px", color: "#0d1f3c", fontWeight: "bold" }}>{question || "(Pergunta aqui...)"}</div>
            {sourceUrl && (
              <a href={sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#0099ff", textDecoration: "underline", fontSize: "13px" }}>
                🔗 Leia o artigo original
              </a>
            )}
          </div>
        </div>

        {/* Botão */}
        <button 
          onClick={handlePublish}
          disabled={isPublishing}
          style={{ 
            width: "100%", 
            padding: "14px", 
            background: isPublishing ? "#cccccc" : "#10b981", 
            color: "white", 
            border: "none", 
            borderRadius: "4px", 
            fontSize: "16px", 
            fontWeight: "bold", 
            cursor: isPublishing ? "not-allowed" : "pointer",
            opacity: isPublishing ? 0.7 : 1
          }}
        >
          {isPublishing ? "⏳ Publicando..." : "✅ Aprovar e Publicar no LinkedIn"}
        </button>
      </div>
    </div>
  );
}