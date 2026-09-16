const crypto = require('crypto');
const Setting = require('../models/Setting');
const GuestLog = require('../models/GuestLog');

// @desc    Get a setting by key
// @route   GET /api/settings/:key
// @access  Public
exports.getSettingByKey = async (req, res) => {
    try {
        const { key } = req.params;

        // Redirect special guest keys to live computed values
        if (key === 'guestLoginCount') {
            return exports.getGuestLoginCount(req, res);
        }
        if (key === 'guestLoginStats') {
            return exports.getGuestLoginStats(req, res);
        }

        const setting = await Setting.findOne({ key });
        if (!setting) {
            return res.status(200).json({ success: true, data: null });
        }
        res.status(200).json({ success: true, data: setting.value, updatedAt: setting.updatedAt });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Create or update a setting
// @route   POST /api/settings
// @access  Private/Admin
exports.updateSetting = async (req, res) => {
    try {
        const { key, value } = req.body;
        if (!key) {
            return res.status(400).json({ success: false, message: 'Setting key is required' });
        }
        const setting = await Setting.findOneAndUpdate(
            { key },
            { value, updatedAt: Date.now() },
            { new: true, upsert: true, runValidators: true }
        );
        res.status(200).json({ success: true, data: setting, updatedAt: setting.updatedAt });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Record a new guest login and return live count
// @route   POST /api/settings/increment-guest-count
// @access  Public
exports.incrementGuestCount = async (req, res) => {
    try {
        const portal = (req.body.portal || 'admin').toLowerCase();
        const role = req.body.role || (
            portal === 'garage' ? 'guest_garage' :
            portal === 'employee' ? 'guest_employee' :
            'guest_admin'
        );
        const userId = req.body.userId || (
            portal === 'garage' ? 'guestgarage@vehicleecare.com' :
            portal === 'employee' ? 'guestemployee@vehicleecare.com' :
            'guestadmin@vehicleecare.com'
        );

        let ipAddress = req.body.ipAddress;
        if (!ipAddress || ipAddress === 'unknown') {
            const rawIp = (req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : '') ||
                req.socket?.remoteAddress ||
                req.ip ||
                '127.0.0.1';
            ipAddress = rawIp.replace(/^::ffff:/, '');
        }

        const userAgent = req.body.userAgent || req.headers['user-agent'] || 'Unknown Browser';
        const sessionId = req.body.sessionId || `sess_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        const normalizedUserId = String(userId || '').trim().toLowerCase();

        const ALLOWED_GUESTS = [
            'guestadmin@vehicleecare.com',
            'guestgarage@vehicleecare.com',
            'guestemployee@vehicleecare.com'
        ];

        if (!ALLOWED_GUESTS.includes(normalizedUserId)) {
            return res.status(403).json({
                success: false,
                message: 'Only guest accounts can be recorded as guest logins'
            });
        }

        // Deduplication: if a log was auto-recorded on login in the last 15 seconds, reuse it
        const fifteenSecondsAgo = new Date(Date.now() - 15000);
        const existingRecentLog = await GuestLog.findOne({
            portal,
            userId: normalizedUserId,
            timestamp: { $gte: fifteenSecondsAgo }
        });

        if (existingRecentLog) {
            const total = await GuestLog.countDocuments();
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
            return res.status(200).json({
                success: true,
                count: total,
                log: existingRecentLog,
                deduplicated: true
            });
        }

        // Create the guest login record
        const log = await GuestLog.create({
            sessionId,
            userId: normalizedUserId,
            role,
            portal,
            action: req.body.action || 'LOGIN',
            status: 'Active',
            ipAddress,
            userAgent,
            timestamp: new Date()
        });

        // Count live records
        const total = await GuestLog.countDocuments();

        // Sync to Setting for backward compatibility
        await Setting.findOneAndUpdate(
            { key: 'guestLoginCount' },
            { value: total, updatedAt: Date.now() },
            { upsert: true }
        ).catch(() => {});

        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.status(200).json({
            success: true,
            count: total,
            log
        });
    } catch (error) {
        console.error('Error in incrementGuestCount:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Get live guest login count computed from DB rows
// @route   GET /api/settings/guestLoginCount
// @access  Public
exports.getGuestLoginCount = async (req, res) => {
    try {
        const count = await GuestLog.countDocuments();
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.status(200).json({ success: true, data: count });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Get live breakdown stats computed from DB rows
// @route   GET /api/settings/guestLoginStats
// @access  Public
exports.getGuestLoginStats = async (req, res) => {
    try {
        const [total, admin, garage, employee] = await Promise.all([
            GuestLog.countDocuments(),
            GuestLog.countDocuments({ $or: [{ portal: 'admin' }, { role: /admin/i }] }),
            GuestLog.countDocuments({ $or: [{ portal: 'garage' }, { role: /garage/i }] }),
            GuestLog.countDocuments({ $or: [{ portal: 'employee' }, { role: /employee/i }] })
        ]);

        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.status(200).json({
            success: true,
            data: { total, admin, garage, employee }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Get latest guest login logs
// @route   GET /api/settings/guest-logs
// @access  Public
exports.getGuestLogs = async (req, res) => {
    try {
        // Auto-expire any active session older than 15 minutes
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        await GuestLog.updateMany(
            { 
                status: 'Active', 
                timestamp: { $lt: fifteenMinutesAgo } 
            },
            { 
                $set: { 
                    status: 'Expired', 
                    action: 'TIMEOUT' 
                } 
            }
        ).catch(() => {});

        const logs = await GuestLog.find()
            .sort({ timestamp: -1, createdAt: -1 })
            .limit(300)
            .lean();

        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.status(200).json({
            success: true,
            data: logs
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Update status for a guest session (e.g. Ended on logout, Expired on timeout)
// @route   POST /api/settings/guest-session-status
// @access  Public
exports.updateGuestSessionStatus = async (req, res) => {
    try {
        const { sessionId, status, action } = req.body;
        if (!sessionId) {
            return res.status(400).json({ success: false, message: 'Session ID is required' });
        }

        const validStatuses = ['Active', 'Expired', 'Ended'];
        const normalizedStatus = validStatuses.find(s => s.toLowerCase() === String(status || '').toLowerCase()) || 'Ended';

        const updated = await GuestLog.findOneAndUpdate(
            { sessionId },
            { 
                $set: {
                    status: normalizedStatus,
                    action: action || (normalizedStatus === 'Ended' ? 'LOGOUT' : 'TIMEOUT')
                }
            },
            { new: true }
        );

        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.status(200).json({
            success: true,
            log: updated
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Get details for a specific guest session
// @route   GET /api/settings/guest-session/:sessionId
// @access  Public
exports.getGuestSessionDetails = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const log = await GuestLog.findOne({
            $or: [{ sessionId }, { _id: sessionId.match(/^[0-9a-fA-F]{24}$/) ? sessionId : null }]
        });

        if (!log) {
            return res.status(404).json({ success: false, message: 'Session log not found' });
        }

        res.status(200).json({ success: true, data: log });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};
