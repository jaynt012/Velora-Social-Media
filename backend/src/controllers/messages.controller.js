const db = require('../config/db');

// Get list of users the current user has chatted with
exports.getConversations = (req, res) => {
    const userId = req.user.id;
    
    // We want the latest message for each distinct user they chatted with
    const query = `
        SELECT u.id, u.username, u.avatar,
               m.content as lastMessage, m.created_at as timestamp, m.is_read
        FROM users u
        JOIN messages m ON (u.id = m.sender_id OR u.id = m.receiver_id)
        WHERE (m.sender_id = ? OR m.receiver_id = ?) AND u.id != ?
        GROUP BY u.id
        ORDER BY MAX(m.created_at) DESC
    `;
    
    db.all(query, [userId, userId, userId], (err, conversations) => {
        if (err) return res.status(500).json({ message: 'Error fetching conversations' });
        
        // Ensure avatars fall back to dicebear if null
        const formatted = conversations.map(c => ({
            ...c,
            avatar: c.avatar || `https://api.dicebear.com/8.x/avataaars/svg?seed=${c.username}`
        }));
        
        res.json(formatted);
    });
};

// Get unread messages count
exports.getUnreadCount = (req, res) => {
    const userId = req.user.id;
    
    const query = `
        SELECT COUNT(*) as count 
        FROM messages 
        WHERE receiver_id = ? AND is_read = 0
    `;
    
    db.get(query, [userId], (err, row) => {
        if (err) return res.status(500).json({ message: 'Error fetching unread count' });
        res.json({ count: row.count });
    });
};

// Get message history with a specific user
exports.getHistory = (req, res) => {
    const userId = req.user.id;
    const otherId = req.params.userId;
    
    const query = `
        SELECT id, sender_id, receiver_id, content, created_at as timestamp
        FROM messages 
        WHERE (sender_id = ? AND receiver_id = ?) 
           OR (sender_id = ? AND receiver_id = ?)
        ORDER BY created_at ASC
    `;
    
    db.all(query, [userId, otherId, otherId, userId], (err, messages) => {
        if (err) return res.status(500).json({ message: 'Error fetching messages' });
        
        // Mark as read if receiver is current user
        db.run('UPDATE messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ?', [otherId, userId]);
        
        res.json(messages);
    });
};
