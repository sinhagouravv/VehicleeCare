const Notification = require('../models/Notification');
const UserNotification = require('../models/UserNotification');
const WebsiteReview = require('../models/WebsiteReview');
const BusinessReview = require('../models/BusinessReview');
const Bug = require('../models/Bug');

// ── Internal helper (used by other controllers) ────────────────
const createAdminNotification = async ({ eventType, superCategory = 'general', title, message, meta = {} }) => {
    try {
        await Notification.create({ eventType, superCategory, title, message, meta });
    } catch (err) {
        console.error('[Notification] Failed to create:', err.message);
    }
};

const syncMissingNotifications = async () => {
    try {
        const notifs = await Notification.find({ eventType: { $in: ['review_submitted', 'bug_reported'] } }).lean();

        const existingNotifReviewIds = new Set(
            notifs
                .map(n => n.meta?.reviewId || n.meta?.customReviewId)
                .filter(Boolean)
                .map(id => String(id))
        );

        // 1. Sync Website Reviews
        const websiteReviews = await WebsiteReview.find().lean();
        for (const wr of websiteReviews) {
            const wrIdStr = String(wr._id);
            const customIdStr = wr.reviewId ? String(wr.reviewId) : null;

            if (!existingNotifReviewIds.has(wrIdStr) && (!customIdStr || !existingNotifReviewIds.has(customIdStr))) {
                await Notification.create({
                    eventType: 'review_submitted',
                    superCategory: 'adminNotification',
                    title: 'New Review Submitted',
                    message: `A new review "${wr.text ? wr.text.substring(0, 60) + (wr.text.length > 60 ? '...' : '') : ''}" has been submitted by ${wr.name || 'a customer'}.`,
                    createdAt: wr.createdAt || new Date(),
                    meta: {
                        reviewId: wr._id,
                        customReviewId: wr.reviewId,
                        userName: wr.name,
                        displayUserId: wr.reviewId || 'GUEST',
                        reviewType: 'Website'
                    }
                });
            }
        }

        // 2. Sync Business Reviews
        const businessReviews = await BusinessReview.find().lean();
        for (const br of businessReviews) {
            const brIdStr = String(br._id);
            if (!existingNotifReviewIds.has(brIdStr)) {
                await Notification.create({
                    eventType: 'review_submitted',
                    superCategory: 'adminNotification',
                    title: 'New Business Review Submitted',
                    message: `A new business review "${br.review ? br.review.substring(0, 60) + (br.review.length > 60 ? '...' : '') : ''}" has been submitted by ${br.name}.`,
                    createdAt: br.createdAt || new Date(),
                    meta: {
                        reviewId: br._id,
                        userName: br.name,
                        displayUserId: br.businessUser || 'GUEST',
                        type: 'business',
                        reviewType: 'Business'
                    }
                });
            }
        }

        // 3. Sync Bugs
        const bugs = await Bug.find().lean();
        const existingNotifBugIds = new Set(
            notifs
                .map(n => n.meta?.bugId || n.meta?.mongoBugId)
                .filter(Boolean)
                .map(id => String(id))
        );

        for (const b of bugs) {
            const bIdStr = String(b._id);
            const customBugIdStr = b.bugId ? String(b.bugId) : null;

            if (!existingNotifBugIds.has(bIdStr) && (!customBugIdStr || !existingNotifBugIds.has(customBugIdStr))) {
                await Notification.create({
                    eventType: 'bug_reported',
                    superCategory: 'adminNotification',
                    title: 'New Bug Reported',
                    message: `Bug "${b.title}" was reported by ${b.reporterName} (${b.reporterId}) on ${b.portal} portal.`,
                    createdAt: b.createdAt || new Date(),
                    meta: {
                        bugId: b.bugId || b._id,
                        mongoBugId: b._id,
                        reporterId: b.reporterId,
                        reporterName: b.reporterName,
                        portal: b.portal
                    }
                });
            }
        }

        // 4. Sync Remarks
        const Remark = require('../models/Remark');
        const remarks = await Remark.find().lean();
        const remarkNotifs = await Notification.find({ eventType: { $in: ['remark', 'task_remark_added', 'remark_submitted'] } }).lean();
        const existingNotifRemarkIds = new Set(
            remarkNotifs
                .map(n => n.meta?.remarkId || n.meta?.mongoRemarkId)
                .filter(Boolean)
                .map(id => String(id))
        );

        for (const r of remarks) {
            const rIdStr = String(r._id);
            const customRemarkIdStr = r.remarkId ? String(r.remarkId) : null;

            if (!existingNotifRemarkIds.has(rIdStr) && (!customRemarkIdStr || !existingNotifRemarkIds.has(customRemarkIdStr))) {
                await Notification.create({
                    eventType: 'remark',
                    superCategory: 'adminNotification',
                    title: 'New Remark Added',
                    message: `Remark ${r.remarkId || ''} reported by ${r.reporterName || 'an employee'} for Ref #${r.referenceId || r.bookingId || '—'}: "${r.remark ? r.remark.substring(0, 60) + (r.remark.length > 60 ? '...' : '') : ''}"`,
                    createdAt: r.createdAt || new Date(),
                    meta: {
                        remarkId: r.remarkId || r._id,
                        mongoRemarkId: r._id,
                        reporterId: r.reporterId,
                        reporterName: r.reporterName,
                        referenceId: r.referenceId || r.bookingId
                    }
                });
            }
        }
    } catch (err) {
        console.error('Error syncing missing notifications:', err.message);
    }
};

// ── GET all admin notifications ────────────────────────────────
// GET /api/notifications
const getAll = async (req, res) => {
    try {
        await syncMissingNotifications();
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

module.exports = { getAll, getUserNotifications, markRead, markAllRead, toggleStar, deleteOne, createAdminNotification, create, syncMissingNotifications };



