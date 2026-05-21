"use client";

import { useState, useEffect } from "react";

export default function ReviewPage({ params }) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [comment, setComment] = useState("");
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPost() {
      try {
        const response = await fetch(`/api/approval/get/${params.id}`);
        const data = await response.json();
        
        if (data.post && data.post.generatedContent) {
          const content = data.post.generatedContent;
          setTitle(content.title || "");
          setSummary(content.summary || "");
          setComment(content.comment || "");
          setQuestion(content.question || "");
        } else {
          setError("Post não encontrado");
        }
      } catch (err) {
        setError("Erro ao carregar: " + err.message);
      } finally {
        setLoading(false);
      }
    }
    loadPost();
  }, [params.id]);

  if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>⏳ Carregando...</div>;
  if (error) return <div style={{ padding: "40px", color: "red" }}>{error}</div>;

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 20px" }}>
      <div style={{ background: "linear-gradient(135deg,#0d1f3c,#1B3A6B)", color: "white", padding: "30px", borderRadius: "8px 8px 0 0" }}>
        <h1 style={{ margin: "0" }}>✏️ Revisar e Editar</h1>
        <p style={{ margin: "5px 0 0", fontSize: "14px" }}>Post ID: {params.id}</p>
      </div>

      <div style={{ padding: "30px", background: "#f9f9f9" }}>
        <div style={{ background: "white", padding: "20px", marginBottom: "20px", borderLeft: "4px solid #E8A020" }}>
          <h3 style={{ color: "#0d1f3c", margin: "0 0 10px" }}>📌 TÍTULO</h3>
          <textarea value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: "100%", height: "60px", padding: "10px", border: "1px solid #ddd", borderRadius: "4px", fontFamily: "Arial" }} />
        </div>

        <div style={{ background: "white", padding: "20px", marginBottom: "20px", borderLeft: "4px solid #E8A020" }}>
          <h3 style={{ color: "#0d1f3c", margin: "0 0 10px" }}>📄 RESUMO</h3>
          <textarea value={summary} onChange={(e) => setSummary(e.target.value)} style={{ width: "100%", height: "80px", padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }} />
        </div>

        <div style={{ background: "white", padding: "20px", marginBottom: "20px", borderLeft: "4px solid #E8A020" }}>
          <h3 style={{ color: "#0d1f3c", margin: "0 0 10px" }}>💭 PERSPECTIVA VIRTUS MIRAI</h3>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} style={{ width: "100%", height: "120px", padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }} />
        </div>

        <div style={{ background: "white", padding: "20px", marginBottom: "20px", borderLeft: "4px solid #E8A020" }}>
          <h3 style={{ color: "#0d1f3c", margin: "0 0 10px" }}>❓ PERGUNTA PROVOCADORA</h3>
          <textarea value={question} onChange={(e) => setQuestion(e.target.value)} style={{ width: "100%", height: "60px", padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }} />
        </div>

        <button onClick={() => alert("✅ Post aprovado!")} style={{ width: "100%", padding: "12px", background: "#10b981", color: "white", border: "none", borderRadius: "4px", fontSize: "16px", fontWeight: "bold", cursor: "pointer" }}>✅ Aprovar e Publicar</button>
      </div>
    </div>
  );
}