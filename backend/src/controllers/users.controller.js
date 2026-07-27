const db = require('../config/db');

exports.getMe = (req, res) => {
    db.get(`
        SELECT id, username, display_name, email, avatar, bio, cover_image, location, website,
               (SELECT COUNT(*) FROM followers WHERE following_id = users.id) as followers,
               (SELECT COUNT(*) FROM followers WHERE follower_id = users.id) as following,
               (SELECT COUNT(*) FROM posts WHERE user_id = users.id) as posts
        FROM users 
        WHERE id = ?
    `, [req.user.id], (err, user) => {
        if (err || !user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    });
};

exports.getProfile = (req, res) => {
    const { username } = req.params;
    
    // Get user basic info + follower counts
    db.get(`
        SELECT u.id, u.username, u.display_name, u.avatar, u.bio, u.cover_image, u.location, u.website, u.joined_date,
               (SELECT COUNT(*) FROM followers WHERE following_id = u.id) as followers,
               (SELECT COUNT(*) FROM followers WHERE follower_id = u.id) as following
        FROM users u 
        WHERE u.username = ?
    `, [username], (err, user) => {
        if (err || !user) return res.status(404).json({ message: 'User not found' });

        // Get user's posts
        db.all(`
            SELECT p.id, p.content, p.likes_count as likes, p.comments_count as comments, p.created_at as timestamp,
                   u.username, u.avatar
            FROM posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.user_id = ?
            ORDER BY p.created_at DESC
        `, [user.id], (err, postsData) => {
            if (err) return res.status(500).json({ message: 'Server error' });

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

            // Check if current user is following
            if (req.user) {
                db.get('SELECT * FROM followers WHERE follower_id = ? AND following_id = ?', [req.user.id, user.id], (err, row) => {
                    user.isFollowing = !!row;
                    res.json({ user, posts });
                });
            } else {
                user.isFollowing = false;
                res.json({ user, posts });
            }
        });
    });
};

exports.updateProfile = (req, res) => {
    const { display_name, bio, location, website } = req.body;
    db.run('UPDATE users SET display_name = ?, bio = ?, location = ?, website = ? WHERE id = ?', [display_name, bio, location, website, req.user.id], function(err) {
        if (err) return res.status(500).json({ message: 'Error updating profile' });
        res.json({ message: 'Profile updated successfully' });
    });
};

exports.followUser = (req, res) => {
    const { id } = req.params; // Following ID
    if (parseInt(id) === req.user.id) return res.status(400).json({ message: 'Cannot follow yourself' });

    db.run('INSERT OR IGNORE INTO followers (follower_id, following_id) VALUES (?, ?)', [req.user.id, id], function(err) {
        if (err) return res.status(500).json({ message: 'Server error' });
        res.json({ message: 'Followed user' });
    });
};

exports.unfollowUser = (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM followers WHERE follower_id = ? AND following_id = ?', [req.user.id, id], function(err) {
        if (err) return res.status(500).json({ message: 'Server error' });
        res.json({ message: 'Unfollowed user' });
    });
};

exports.getSuggestions = (req, res) => {
    let query;
    let params = [];

    if (req.user) {
        // Exclude current user and users they already follow
        query = `
            SELECT id, username, avatar
            FROM users
            WHERE id != ? 
              AND id NOT IN (SELECT following_id FROM followers WHERE follower_id = ?)
            ORDER BY RANDOM()
            LIMIT 5
        `;
        params = [req.user.id, req.user.id];
    } else {
        query = `
            SELECT id, username, avatar
            FROM users
            ORDER BY RANDOM()
            LIMIT 5
        `;
    }

    db.all(query, params, (err, users) => {
        if (err) return res.status(500).json({ message: 'Server error' });
        res.json(users);
    });
};

// GET /api/users/:username/followers
exports.getFollowers = (req, res) => {
    const { username } = req.params;
    const query = `
        SELECT u.id, u.username, u.avatar 
        FROM users u
        JOIN followers f ON u.id = f.follower_id
        JOIN users target ON f.following_id = target.id
        WHERE target.username = ?
        ORDER BY f.created_at DESC
    `;
    db.all(query, [username], (err, users) => {
        if (err) return res.status(500).json({ message: 'Server error' });
        res.json(users.map(u => ({
            id: u.id,
            username: u.username,
            avatar: u.avatar || `https://api.dicebear.com/8.x/avataaars/svg?seed=${u.username}`
        })));
    });
};

// GET /api/users/:username/following
exports.getFollowing = (req, res) => {
    const { username } = req.params;
    const query = `
        SELECT u.id, u.username, u.avatar 
        FROM users u
        JOIN followers f ON u.id = f.following_id
        JOIN users target ON f.follower_id = target.id
        WHERE target.username = ?
        ORDER BY f.created_at DESC
    `;
    db.all(query, [username], (err, users) => {
        if (err) return res.status(500).json({ message: 'Server error' });
        res.json(users.map(u => ({
            id: u.id,
            username: u.username,
            avatar: u.avatar || `https://api.dicebear.com/8.x/avataaars/svg?seed=${u.username}`
        })));
    });
};
