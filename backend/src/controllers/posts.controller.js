const db = require('../config/db');

// GET /api/posts — paginated feed
exports.getFeed = (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;

    db.all(`
        SELECT p.id, p.content, p.image_url, p.likes_count, p.comments_count, p.created_at,
               u.id as user_id, u.username, u.avatar
        FROM posts p
        JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
    `, [limit, offset], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Server error' });

        const posts = rows.map(p => ({
            id: p.id,
            content: p.content,
            image_url: p.image_url,
            timestamp: p.created_at,
            likes: p.likes_count,
            comments: p.comments_count,
            liked: false,
            author: {
                id: p.user_id,
                username: p.username,
                handle: '@' + p.username,
                avatar: p.avatar || `https://api.dicebear.com/8.x/avataaars/svg?seed=${p.username}`
            }
        }));

        res.json({ posts, page, hasMore: rows.length === limit });
    });
};

// POST /api/posts
exports.createPost = (req, res) => {
    const { content } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ message: 'Content is required' });

    let imageUrl = '';
    if (req.file) {
        imageUrl = `/uploads/${req.file.filename}`;
    }

    db.run('INSERT INTO posts (user_id, content, image_url) VALUES (?, ?, ?)', [req.user.id, content.trim(), imageUrl], function(err) {
        if (err) return res.status(500).json({ message: 'Server error' });
        res.status(201).json({ message: 'Post created', postId: this.lastID, image_url: imageUrl });
    });
};

// DELETE /api/posts/:id
exports.deletePost = (req, res) => {
    db.run('DELETE FROM posts WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], function(err) {
        if (err || this.changes === 0) return res.status(403).json({ message: 'Not authorized or not found' });
        res.json({ message: 'Post deleted' });
    });
};

// POST /api/posts/:id/like
exports.likePost = (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    
    db.get('SELECT * FROM post_likes WHERE user_id = ? AND post_id = ?', [userId, id], (err, row) => {
        if (row) return res.status(400).json({ message: 'Already liked' });
        db.run('INSERT INTO post_likes (user_id, post_id) VALUES (?, ?)', [userId, id], (err) => {
            if (err) return res.status(500).json({ message: 'Server error' });
            db.run('UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?', [id]);
            // Create notification
            db.get('SELECT user_id FROM posts WHERE id = ?', [id], (err, post) => {
                if (post && post.user_id !== userId) {
                    db.run('INSERT INTO notifications (recipient_id, actor_id, type, post_id) VALUES (?, ?, ?, ?)',
                        [post.user_id, userId, 'like', id]);
                }
            });
            res.json({ message: 'Liked' });
        });
    });
};

// POST /api/posts/:id/unlike
exports.unlikePost = (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    db.run('DELETE FROM post_likes WHERE user_id = ? AND post_id = ?', [userId, id], (err) => {
        if (err) return res.status(500).json({ message: 'Server error' });
        db.run('UPDATE posts SET likes_count = MAX(likes_count - 1, 0) WHERE id = ?', [id]);
        res.json({ message: 'Unliked' });
    });
};

// GET /api/posts/:id/comments
exports.getComments = (req, res) => {
    db.all(`
        SELECT c.id, c.content, c.created_at,
               u.id as user_id, u.username, u.avatar
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.post_id = ?
        ORDER BY c.created_at ASC
    `, [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Server error' });
        res.json(rows.map(c => ({
            id: c.id,
            content: c.content,
            timestamp: c.created_at,
            author: {
                id: c.user_id,
                username: c.username,
                avatar: c.avatar || `https://api.dicebear.com/8.x/avataaars/svg?seed=${c.username}`
            }
        })));
    });
};

// POST /api/posts/:id/comments
exports.addComment = (req, res) => {
    const { content } = req.body;
    const { id } = req.params;
    const userId = req.user.id;
    if (!content || !content.trim()) return res.status(400).json({ message: 'Content required' });

    db.run('INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)', [id, userId, content.trim()], function(err) {
        if (err) return res.status(500).json({ message: 'Server error' });
        db.run('UPDATE posts SET comments_count = comments_count + 1 WHERE id = ?', [id]);
        // Create notification
        db.get('SELECT user_id FROM posts WHERE id = ?', [id], (err, post) => {
            if (post && post.user_id !== userId) {
                db.run('INSERT INTO notifications (recipient_id, actor_id, type, post_id) VALUES (?, ?, ?, ?)',
                    [post.user_id, userId, 'comment', id]);
            }
        });
        db.get(`SELECT c.id, c.content, c.created_at, u.username, u.avatar FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?`, [this.lastID], (err, row) => {
            res.status(201).json({
                id: row.id,
                content: row.content,
                timestamp: row.created_at,
                author: { id: userId, username: row.username, avatar: row.avatar || `https://api.dicebear.com/8.x/avataaars/svg?seed=${row.username}` }
            });
        });
    });
};
