import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const dbPath = process.env.POSTS_DB_PATH || '/tmp/posts.json';

  if (req.method === 'GET') {
    const { postId } = req.query;
    if (!postId) {
      return res.status(400).json({ error: 'postId required' });
    }

    try {
      if (!fs.existsSync(dbPath)) {
        return res.status(404).json({ error: 'Post not found' });
      }

      const data = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
      const post = data.find(p => p.postId === postId);

      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      // Check if expired (24h)
      const createdAt = new Date(post.createdAt);
      const now = new Date();
      if (now - createdAt > 24 * 60 * 60 * 1000) {
        return res.status(410).json({ error: 'Post expired' });
      }

      return res.status(200).json(post);
    } catch (err) {
      return res.status(500).json({ error: 'Server error' });
    }
  }

  if (req.method === 'POST') {
    const { action, postId, news, comment } = req.body;

    try {
      let data = [];
      if (fs.existsSync(dbPath)) {
        data = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
      }

      if (action === 'create') {
        const newPost = {
          postId,
          news,
          comment,
          status: 'pending',
          createdAt: new Date().toISOString(),
        };
        data.push(newPost);
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
        return res.status(200).json({ success: true, postId });
      }

      if (action === 'update') {
        const post = data.find(p => p.postId === postId);
        if (post) {
          post.comment = comment;
          fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
          return res.status(200).json({ success: true });
        }
        return res.status(404).json({ error: 'Post not found' });
      }

      if (action === 'publish') {
        const post = data.find(p => p.postId === postId);
        if (post) {
          post.status = 'published';
          fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
          return res.status(200).json({ success: true });
        }
        return res.status(404).json({ error: 'Post not found' });
      }

      if (action === 'reject') {
        data = data.filter(p => p.postId !== postId);
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
        return res.status(200).json({ success: true });
      }

      return res.status(400).json({ error: 'Invalid action' });
    } catch (err) {
      return res.status(500).json({ error: 'Server error' });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}