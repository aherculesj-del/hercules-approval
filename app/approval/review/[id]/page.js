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
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    setTitle(searchParams.get("title") || "");
    setSummary(searchParams.get("summary") || "");
    setComment(searchParams.get("comment") || "");
    setQuestion(searchParams.get("question") || "");
  }, [searchParams]);

  async function handlePublish() {
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
          question
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
      </div>
      <div style={{ padding: "30px", background: "#f9f9f9", borderRadius: "0 0 8px 8px" }}>
        <div style={{ background: "white", padding: "20px", marginBottom: "20px", borderLeft: "4px solid #E8A020", borderRadius: "4px" }}>
          <h3 style={{ color: "#0d1f3c", margin: "0 0 10px" }}>📌 TÍTULO</h3>
          <textarea value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: "100%", height: "60px", padding: "10px", border: "1px solid #ddd", borderRadius: "4px", fontFamily: "Arial" }} />
        </div>
        <div style={{ background: "white", padding: "20px", marginBottom: "20px", borderLeft: "4px solid #E8A020", borderRadius: "4px" }}>
          <h3 style={{ color: "#0d1f3c", margin: "0 0 10px" }}>📄 RESUMO</h3>
          <textarea value={summary} onChange={(e) => setSummary(e.target.value)} style={{ width: "100%", height: "700px", padding: "10px", border: "1px solid #ddd", borderRadius: "4px", fontFamily: "Arial", resize: "vertical" }} />
        </div>
        <div style={{ background: "white", padding: "20px", marginBottom: "20px", borderLeft: "4px solid #E8A020", borderRadius: "4px" }}>
          <h3 style={{ color: "#0d1f3c", margin: "0 0 10px" }}>💭 PERSPECTIVA VIRTUS MIRAI</h3>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} style={{ width: "100%", height: "500px", padding: "10px", border: "1px solid #ddd", borderRadius: "4px", fontFamily: "Arial", resize: "vertical" }} />
        </div>
        <div style={{ background: "white", padding: "20px", marginBottom: "20px", borderLeft: "4px solid #E8A020", borderRadius: "4px" }}>
          <h3 style={{ color: "#0d1f3c", margin: "0 0 10px" }}>❓ PERGUNTA</h3>
          <textarea value={question} onChange={(e) => setQuestion(e.target.value)} style={{ width: "100%", height: "60px", padding: "10px", border: "1px solid #ddd", borderRadius: "4px", fontFamily: "Arial" }} />
        </div>
        <div style={{ background: "white", padding: "20px", marginBottom: "20px", borderTop: "2px solid #E8A020", borderRadius: "4px" }}>
          <h3 style={{ color: "#0d1f3c", margin: "0 0 15px" }}>📋 Preview</h3>
          <div style={{ background: "#f0f0f0", padding: "20px", borderRadius: "4px" }}>
            <div style={{ fontWeight: "bold", color: "#0d1f3c", marginBottom: "12px", fontSize: "16px" }}>{title}</div>
            <div style={{ marginBottom: "12px" }}>{summary}</div>
            <div style={{ marginBottom: "12px", borderLeft: "3px solid #E8A020", paddingLeft: "12px" }}>{comment}</div>
            <div style={{ marginBottom: "12px", color: "#0d1f3c", fontWeight: "bold" }}>{question}</div>
            <div style={{ color: "#0099ff", textDecoration: "underline", fontSize: "13px" }}>🔗 Leia o artigo original</div>
          </div>
        </div>
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