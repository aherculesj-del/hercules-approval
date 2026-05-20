// lib/post-storage.js
import fs from 'fs';

const storageFile = '/tmp/hercules-posts.json';

function readStorage() {
  try {
    if (fs.existsSync(storageFile)) {
      const data = fs.readFileSync(storageFile, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Erro ao ler storage:', error);
  }
  return { posts: [] };
}

function writeStorage(data) {
  try {
    fs.writeFileSync(storageFile, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Erro ao escrever storage:', error);
  }
}

export function savePost(post) {
  const storage = readStorage();
  post.savedAt = new Date().toISOString();
  post.status = post.status || 'pending_approval';
  storage.posts.push(post);
  writeStorage(storage);
  return post;
}

export function getPostsByStatus(status) {
  const storage = readStorage();
  return storage.posts.filter(p => p.status === status);
}