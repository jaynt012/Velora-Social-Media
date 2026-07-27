const express = require('express');
const router = express.Router();
const messagesController = require('../controllers/messages.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.get('/conversations', verifyToken, messagesController.getConversations);
router.get('/unread-count', verifyToken, messagesController.getUnreadCount);
router.get('/:userId', verifyToken, messagesController.getHistory);

module.exports = router;
