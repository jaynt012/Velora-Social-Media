const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// We need an optional auth middleware to check if the current user is following the profile
const optionalAuth = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return next();
    
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'supersecretvelorakey';
    try {
        req.user = jwt.verify(token.replace('Bearer ', ''), JWT_SECRET);
    } catch (e) {}
    next();
};

router.get('/me', verifyToken, usersController.getMe);
router.put('/me', verifyToken, usersController.updateProfile);
router.get('/suggestions', optionalAuth, usersController.getSuggestions);
router.get('/:username', optionalAuth, usersController.getProfile);
router.post('/:id/follow', verifyToken, usersController.followUser);
router.post('/:id/unfollow', verifyToken, usersController.unfollowUser);
router.get('/:username/followers', optionalAuth, usersController.getFollowers);
router.get('/:username/following', optionalAuth, usersController.getFollowing);

module.exports = router;
