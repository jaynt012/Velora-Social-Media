const express = require('express');
const router = express.Router();
const notifController = require('../controllers/notifications.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.get('/',              verifyToken, notifController.getNotifications);
router.get('/unread-count',  verifyToken, notifController.getUnreadCount);

module.exports = router;
