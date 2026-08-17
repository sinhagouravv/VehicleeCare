const Notification = require('../models/Notification');
const UserNotification = require('../models/UserNotification');

// ── Internal helper (used by other controllers) ────────────────
const createAdminNotification = async ({ eventType, superCategory = 'general', title, message, meta = {} }) => {
    try {
        await Notification.create({ eventType, superCategory, title, message, meta });
    } catch (err) {
        console.error('[Notification] Failed to create:', err.message);
    }
};

// ── GET all admin notifications ────────────────────────────────
// GET /api/notifications
const getAll = async (req, res) => {
    try {
        const notifications = await Notification.find().sort({ createdAt: -1 });
        const unreadCount = notifications.filter(n => !n.isRead).length;
        res.status(200).json({ success: true, count: notifications.length, unreadCount, data: notifications });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};

// ── GET User Notifications ──────────────────────────────────────
// GET /api/notifications/user/:userId
const getUserNotifications = async (req, res) => {
    try {
        const userId = req.params.userId;
        const notifications = await UserNotification.find({ userId }).sort({ createdAt: -1 });
        const unreadCount = notifications.filter(n => !n.isRead).length;
        res.status(200).json({ success: true, count: notifications.length, unreadCount, data: notifications });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};

// ── Mark single as read ────────────────────────────────────────
// PATCH /api/notifications/:id/read
const markRead = async (req, res) => {
    try {
        let notif = await Notification.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
        if (!notif) {
            notif = await UserNotification.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
        }
        if (!notif) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, data: notif });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};

// ── Mark all as read ───────────────────────────────────────────
// PATCH /api/notifications/mark-all-read
const markAllRead = async (req, res) => {
    try {
        await Notification.updateMany({ isRead: false }, { isRead: true });
        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};

// ── Delete a notification ──────────────────────────────────────
// DELETE /api/notifications/:id
const deleteOne = async (req, res) => {
    try {
        await Notification.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};

// ── Toggle star status ─────────────────────────────────────────
// PATCH /api/notifications/:id/star
const toggleStar = async (req, res) => {
    try {
        let notif = await Notification.findById(req.params.id);
        if (!notif) {
            notif = await UserNotification.findById(req.params.id);
        }
        if (!notif) return res.status(404).json({ success: false, message: 'Not found' });

        notif.isStarred = !notif.isStarred;
        await notif.save();

        res.json({ success: true, isStarred: notif.isStarred, data: notif });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};

// ── Create a notification (Public/Internal) ──────────────────
// POST /api/notifications/create
const create = async (req, res) => {
    try {
        const { eventType, superCategory = 'general', title, message, meta } = req.body;
        const notification = await Notification.create({ eventType, superCategory, title, message, meta });
        res.status(201).json({ success: true, data: notification });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};

module.exports = { getAll, getUserNotifications, markRead, markAllRead, toggleStar, deleteOne, createAdminNotification, create };



