import { useState, useEffect } from 'react';

export default function ApprovePage() {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const postId = params.get('postId');

    if (!postId) {
      setError('Parâmetro postId não fornecido');
      setLoading(false);
      return;
    }

    fetch(`/api/posts?postId=${postId}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError('Post não encontrado ou expirado');
        } else {
          setPost(data);
          setComment(data.comment);
          setCharCount(data.comment.length);
        }
      })
      .catch(() => setError('Erro ao carregar post'))
      .finally(() => setLoading(false));
  }, []);

  const handleCommentChange = (e) => {
    const text = e.target.value;
    setComment(text);
    setCharCount(text.length);
  };

  const handlePublish = () => {
    fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'publish',
        postId: post.postId,
        comment,
      }),
    })
      .then(res => res.json())
      .then(() => alert('Post publicado com sucesso!'))
      .catch(() => alert('Erro ao publicar'));
  };

  const handleReject = () => {
    if (!window.confirm('Tem certeza que deseja rejeitar?')) return;
    fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'reject',
        postId: post.postId,
      }),
    })
      .then(() => alert('Post rejeitado'))
      .catch(() => alert('Erro ao rejeitar'));
  };

  if (loading) return <div style={{ padding: '20px' }}>Carregando...</div>;
  if (error) return <div style={{ padding: '20px', color: 'red' }}>{error}</div>;
  if (!post) return <div style={{ padding: '20px' }}>Nenhum post encontrado</div>;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ color: '#0d1f3c' }}>Aprovação de Post</h1>

      <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <p><strong>Fonte:</strong> {post.news.source}</p>
        <p><strong>Data:</strong> {post.news.date}</p>
        <p><strong>Título:</strong> {post.news.title}</p>
        <p><strong>Resumo:</strong> {post.news.snippet}</p>
        <p><a href={post.news.url} target="_blank" rel="noopener noreferrer">Ver artigo completo</a></p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
          Comentário ({charCount}/280)
        </label>
        <textarea
          value={comment}
          onChange={handleCommentChange}
          style={{
            width: '100%',
            height: '100px',
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '12px',
          }}
        />
      </div>

      <div style={{ background: '#fffbf0', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <p style={{ margin: '0', fontSize: '12px' }}>
          <strong>Preview:</strong> {comment}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={handleReject}
          style={{
            padding: '10px 20px',
            background: '#ccc',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Rejeitar
        </button>
        <button
          onClick={handlePublish}
          style={{
            padding: '10px 20px',
            background: '#0066cc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Publicar agora
        </button>
      </div>
    </div>
  );
}