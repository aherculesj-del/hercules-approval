export default function Home() {
  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ color: '#0d1f3c', marginBottom: '12px' }}>
        🤖 Agente LinkedIn Hercules
      </h1>
      <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '20px' }}>
        Sistema de aprovação de posts para o agente de IA do Hercules. Você receberá links por email quando o agente encontrar uma notícia relevante.
      </p>

      <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <p style={{ margin: '0 0 12px 0', color: '#333', fontWeight: '600' }}>
          📅 Cronograma de publicação:
        </p>
        <ul style={{ margin: '0', paddingLeft: '20px', color: '#666', fontSize: '14px' }}>
          <li>Segunda 8h: <strong>Governança + IA</strong></li>
          <li>Terça 8h: <strong>Turnaround & Eficiência</strong></li>
          <li>Quarta 8h: <strong>Modelo de Receita & Pricing</strong></li>
        </ul>
      </div>

      <div style={{ background: '#f0f7ff', padding: '20px', borderRadius: '8px', marginBottom: '20px', borderLeft: '3px solid #0066cc' }}>
        <p style={{ margin: '0', color: '#0066cc', fontWeight: '600', marginBottom: '8px' }}>
          ✓ Como funciona:
        </p>
        <ol style={{ margin: '0', paddingLeft: '20px', color: '#666', fontSize: '13px', lineHeight: '1.8' }}>
          <li>Agente busca notícia relevante</li>
          <li>Gera comentário em voz do Hercules</li>
          <li>Envia email com link de aprovação</li>
          <li>Você edita (opcional) ou aprova</li>
          <li>Post publicado automaticamente no LinkedIn</li>
        </ol>
      </div>

      <div style={{ background: '#fffbf0', padding: '20px', borderRadius: '8px', borderLeft: '3px solid #E8A020' }}>
        <p style={{ margin: '0', color: '#333', fontSize: '13px' }}>
          <strong>📧 Email de aprovação:</strong> Quando receber um email com link de aprovação, clique nele para editar e aprovar o post.
        </p>
      </div>

      <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #ddd', textAlign: 'center', color: '#999', fontSize: '12px' }}>
        <p style={{ margin: '0' }}>Hercules Approval System v1.0</p>
        <p style={{ margin: '4px 0 0 0' }}>✓ Sistema online e pronto para uso</p>
      </div>
    </div>
  );
}