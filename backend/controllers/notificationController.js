const Notification = require('../models/Notification');

// @desc    Get user notifications
// @route   GET /api/notifications/:userId
// @access  Public
exports.getUserNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.params.userId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: notifications.length, data: notifications });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
        res.status(200).json({ success: true, data: notification });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Mark all as read
// @route   PUT /api/notifications/user/:userId/read-all
exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany({ user: req.params.userId, isRead: false }, { isRead: true });
        res.status(200).json({ success: true, message: 'All marked as read' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};
