const db = require('../config/db');

// GET /api/notifications
exports.getNotifications = (req, res) => {
    const userId = req.user.id;
    db.all(`
        SELECT n.id, n.type, n.is_read, n.created_at,
               u.id as actor_id, u.username, u.avatar,
               p.content as post_content
        FROM notifications n
        JOIN users u ON n.actor_id = u.id
        LEFT JOIN posts p ON n.post_id = p.id
        WHERE n.recipient_id = ?
        ORDER BY n.created_at DESC
        LIMIT 50
    `, [userId], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Server error' });

        const notifications = rows.map(n => ({
            id: n.id,
            type: n.type,
            isRead: n.is_read,
            timestamp: n.created_at,
            actor: {
                id: n.actor_id,
                username: n.username,
                avatar: n.avatar || `https://api.dicebear.com/8.x/avataaars/svg?seed=${n.username}`
            },
            postContent: n.post_content ? n.post_content.substring(0, 100) : null
        }));

        // Mark all as read
        db.run('UPDATE notifications SET is_read = 1 WHERE recipient_id = ?', [userId]);
        
        res.json(notifications);
    });
};

// GET /api/notifications/unread-count
exports.getUnreadCount = (req, res) => {
    db.get('SELECT COUNT(*) as count FROM notifications WHERE recipient_id = ? AND is_read = 0', [req.user.id], (err, row) => {
        if (err) return res.status(500).json({ message: 'Server error' });
        res.json({ count: row.count });
    });
};
