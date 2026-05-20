export default function SuccessPage() {
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
}