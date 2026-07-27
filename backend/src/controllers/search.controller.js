const db = require('../config/db');

exports.search = (req, res) => {
    const query = req.query.q;
    
    if (!query) {
        return res.json({ users: [], posts: [] });
    }
    
    const searchTerm = `%${query}%`;
    
    // Search users (by username or handle/name if we had it, for now just username)
    const usersQuery = `
        SELECT id, username, avatar, bio,
               EXISTS(SELECT 1 FROM followers WHERE follower_id = ? AND following_id = users.id) as isFollowing
        FROM users 
        WHERE username LIKE ? 
        LIMIT 10
    `;
    
    // Search posts (by content)
    const postsQuery = `
        SELECT p.id, p.content, p.likes_count as likes, p.comments_count as comments, p.created_at as timestamp,
               u.username, u.avatar
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.content LIKE ?
        ORDER BY p.created_at DESC
        LIMIT 20
    `;

    db.all(usersQuery, [req.user?.id || 0, searchTerm], (err, users) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error searching users' });
        }
        
        // Convert integer 0/1 to boolean
        users.forEach(u => u.isFollowing = !!u.isFollowing);
        
        db.all(postsQuery, [searchTerm], (err, postsData) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Error searching posts' });
            }
            
            // Format posts to match frontend expectation
            const posts = postsData.map(p => ({
                id: p.id,
                author: {
                    username: p.username,
                    handle: '@' + p.username,
                    avatar: p.avatar || `https://api.dicebear.com/8.x/avataaars/svg?seed=${p.username}`
                },
                content: p.content,
                timestamp: p.timestamp,
                likes: p.likes,
                comments: p.comments,
                liked: false
            }));

            res.json({ users, posts });
        });
    });
};

exports.getTrendingTags = (req, res) => {
    // Mock trending tags for now
    const trending = [
        { tag: '#DesignVibes', count: '12.4K' },
        { tag: '#Velora', count: '8.1K' },
        { tag: '#CreativeLife', count: '5.6K' },
        { tag: '#MoodBoard', count: '3.2K' },
        { tag: '#TechSetup', count: '2.8K' }
    ];
    res.json(trending);
};
