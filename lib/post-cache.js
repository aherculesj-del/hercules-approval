const postCache = new Map();

export function setPost(postId, data) {
  postCache.set(postId, data);
}

export function getPost(postId) {
  return postCache.get(postId);
}
