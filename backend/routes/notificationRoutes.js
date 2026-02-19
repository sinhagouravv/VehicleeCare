const express = require('express');
const router = express.Router();
const { getUserNotifications, markAsRead, markAllAsRead } = require('../controllers/notificationController');

router.get('/user/:userId', getUserNotifications);
router.put('/:id/read', markAsRead);
router.put('/user/:userId/read-all', markAllAsRead);

module.exports = router;
