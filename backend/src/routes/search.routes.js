const express = require('express');
const router = express.Router();
const searchController = require('../controllers/search.controller');

// Optional auth — no error if token is absent, but attaches user if present
const optionalAuth = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return next();
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'supersecretvelorakey';
    try { req.user = jwt.verify(token.replace('Bearer ', ''), JWT_SECRET); } catch (e) {}
    next();
};

router.get('/', optionalAuth, searchController.search);
router.get('/trending', optionalAuth, searchController.getTrendingTags);

module.exports = router;
