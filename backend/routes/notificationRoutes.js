const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/notificationController');

router.get('/', ctrl.getAll);
router.get('/user/:userId', ctrl.getUserNotifications);
router.post('/create', ctrl.create);
router.patch('/mark-all-read', ctrl.markAllRead);

router.patch('/:id/read', ctrl.markRead);
router.patch('/:id/star', ctrl.toggleStar);
router.delete('/:id', ctrl.deleteOne);

module.exports = router;
