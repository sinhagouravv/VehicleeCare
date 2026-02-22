const Notification = require('../models/Notification');

// ── Create Admin Notification (internal helper) ────────────────
const createAdminNotification = async ({ eventType, title, message, meta = {} }) => {
    try {
        await Notification.create({ eventType, title, message, meta });
    } catch (err) {
        console.error('[Notification] Failed to create:', err.message);
    }
};

// ── GET all admin notifications ────────────────────────────────
// GET /api/notifications
exports.getAll = async (req, res) => {
    try {
        const notifications = await Notification.find().sort({ createdAt: -1 });
        const unreadCount = notifications.filter(n => !n.isRead).length;
        res.status(200).json({ success: true, count: notifications.length, unreadCount, data: notifications });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};

// ── Mark single as read ────────────────────────────────────────
// PATCH /api/notifications/:id/read
exports.markRead = async (req, res) => {
    try {
        const notif = await Notification.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
        if (!notif) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, data: notif });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};

// ── Mark all as read ───────────────────────────────────────────
// PATCH /api/notifications/mark-all-read
exports.markAllRead = async (req, res) => {
    try {
        await Notification.updateMany({ isRead: false }, { isRead: true });
        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};

// ── Delete a notification ──────────────────────────────────────
// DELETE /api/notifications/:id
exports.deleteOne = async (req, res) => {
    try {
        await Notification.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};

module.exports.createAdminNotification = createAdminNotification;
