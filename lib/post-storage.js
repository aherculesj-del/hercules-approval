// lib/post-storage.js
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
}