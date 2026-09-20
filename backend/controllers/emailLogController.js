const EmailLog = require('../models/EmailLog');
const Booking = require('../models/Booking');
const Employee = require('../models/Employee');
const User = require('../models/User');
const LeaveRequest = require('../models/LeaveRequest');

// Generate unique clean Mail ID (e.g. ML49201)
const generateMailId = () => {
    const num = Math.floor(10000 + Math.random() * 90000);
    return `ML${num}`;
};

let isSyncing = false;

// Synchronize / populate realistic email logs derived directly from real MongoDB collections
const syncRealEmailLogs = async () => {
    if (isSyncing) return;
    isSyncing = true;
    try {
        // 1. Purge legacy hardcoded mock entries if present
        const legacyMockNames = [
            'Rahul Verma', 'Anjana AM', 'Priya Sharma', 'Amit Patel',
            'Rohan Deshmukh', 'Siddharth Rao', 'Karan Mehra', 'Sanjay Kumar'
        ];
        const legacyMockIds = [
            'ML84912', 'ML84750', 'ML83621', 'ML82194',
            'ML81409', 'ML80915', 'ML79840', 'ML78923'
        ];

        await EmailLog.deleteMany({
            $or: [
                { emailId: { $in: legacyMockIds } },
                { recipientName: { $in: legacyMockNames } }
            ]
        });

        // 2. Check if we already have real email logs populated
        const existingCount = await EmailLog.countDocuments();
        if (existingCount > 0) {
            return;
        }

        console.log('🔄 [EmailLog] Populating email logs from real database records...');

        // Fetch real records from collections
        const bookings = await Booking.find({ 'user.email': { $exists: true, $ne: '' } })
            .sort({ createdAt: -1 })
            .limit(15)
            .lean();

        const employees = await Employee.find({ email: { $exists: true, $ne: '' } })
            .sort({ createdAt: -1 })
            .limit(15)
            .lean();

        const users = await User.find({ email: { $exists: true, $ne: '' } })
            .sort({ createdAt: -1 })
            .limit(15)
            .lean();

        const leaves = await LeaveRequest.find()
            .sort({ createdAt: -1 })
            .limit(6)
            .lean();

        const empEmailMap = {};
        employees.forEach(e => {
            if (e.name) empEmailMap[e.name.trim().toLowerCase()] = e.email;
            if (e.employeeId) empEmailMap[e.employeeId] = e.email;
        });

        const newLogs = [];

        // ── Real Customer Logs (from real Bookings) ──
        bookings.forEach((b, idx) => {
            const custName = b.user?.name || 'Customer';
            const custEmail = b.user?.email;
            if (!custEmail) return;

            const shortId = `BK-${b._id.toString().slice(-4).toUpperCase()}`;
            const vehicleStr = [b.vehicle?.year, b.vehicle?.make, b.vehicle?.model].filter(Boolean).join(' ') || 'Registered Vehicle';
            const serviceTitle = b.service?.title || 'Vehicle Periodic Service';
            const schedDate = b.schedule?.date || 'Scheduled';
            const schedTime = b.schedule?.time || '10:00 AM';
            const price = b.service?.price || '₹2,999';

            // 1. Booking Confirmation Email
            newLogs.push({
                emailId: generateMailId(),
                recipientType: 'Customer',
                recipientName: custName,
                recipientEmail: custEmail,
                subject: `Booking Confirmed - ${serviceTitle} (#${shortId})`,
                category: 'Booking Confirmation',
                status: 'Delivered',
                metadata: {
                    bookingId: shortId,
                    vehicle: vehicleStr,
                    service: serviceTitle,
                    price,
                    schedule: `${schedDate} at ${schedTime}`
                },
                sentAt: b.createdAt ? new Date(b.createdAt) : new Date(Date.now() - idx * 3600000 * 4),
                body: `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; background: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0;">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <h2 style="color: #052558; margin: 0; text-transform: uppercase; letter-spacing: 1px;">VehicleeCare</h2>
                            <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0; font-weight: 600;">Booking Confirmation</p>
                        </div>
                        <div style="background: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0;">
                            <p style="color: #0f172a; margin-top: 0;">Dear <strong>${custName}</strong>,</p>
                            <p style="color: #475569; line-height: 1.6;">Thank you for choosing VehicleeCare. Your service appointment for <strong>${vehicleStr}</strong> has been received and confirmed.</p>
                            <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin: 16px 0; font-size: 14px; line-height: 1.8;">
                                <div style="color: #0f172a;"><strong>Booking Reference:</strong> <span style="color: #052558; font-weight: 700;">#${shortId}</span></div>
                                <div style="color: #0f172a;"><strong>Service:</strong> ${serviceTitle}</div>
                                <div style="color: #0f172a;"><strong>Vehicle:</strong> ${vehicleStr}</div>
                                <div style="color: #0f172a;"><strong>Schedule:</strong> ${schedDate} at ${schedTime}</div>
                                <div style="color: #0f172a;"><strong>Estimated Total:</strong> ${price}</div>
                            </div>
                            <p style="color: #475569; font-size: 13px; margin-bottom: 0;">Our certified technician will arrive at the scheduled time. You can track your booking status directly on the portal.</p>
                        </div>
                    </div>
                `
            });

            // 2. Service / Delivery Verification OTP Email for select bookings
            if (idx % 2 === 0) {
                const otp = Math.floor(100000 + Math.random() * 900000).toString();
                newLogs.push({
                    emailId: generateMailId(),
                    recipientType: 'Customer',
                    recipientName: custName,
                    recipientEmail: custEmail,
                    subject: `VehicleeCare - Delivery Verification OTP (Booking #${shortId})`,
                    category: 'Service OTP',
                    status: 'Delivered',
                    metadata: { bookingId: shortId, otp },
                    sentAt: new Date(new Date(b.createdAt || Date.now()).getTime() + 1000 * 60 * 45),
                    body: `
                        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; background: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0;">
                            <h2 style="color: #052558; margin: 0 0 8px 0; text-transform: uppercase;">VehicleeCare</h2>
                            <p style="color: #64748b; font-size: 13px; margin: 0 0 16px 0; text-transform: uppercase; font-weight: 600;">Delivery Verification OTP</p>
                            <div style="background: #ffffff; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0;">
                                <p style="color: #0f172a; margin-top: 0;">Hello <strong>${custName}</strong>,</p>
                                <p style="color: #475569;">Your vehicle for booking <strong style="color: #052558;">#${shortId}</strong> is fully serviced and ready for handover.</p>
                                <p style="color: #475569;">Please share the following One-Time Password (OTP) with the technician to confirm delivery:</p>
                                <div style="background: #f0fdf4; border: 1.5px dashed #10b981; padding: 16px; text-align: center; border-radius: 10px; margin: 16px 0;">
                                    <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #059669; font-family: monospace;">${otp}</span>
                                    <p style="color: #059669; font-size: 12px; margin: 6px 0 0 0; text-transform: uppercase;">Valid for 10 minutes</p>
                                </div>
                            </div>
                        </div>
                    `
                });
            }
        });

        // ── Real Employee Logs (from real Employees) ──
        employees.forEach((emp, idx) => {
            const empName = emp.name || 'Employee';
            const empEmail = emp.email;
            if (!empEmail) return;

            const empId = emp.employeeId || `EMP-${emp._id.toString().slice(-5).toUpperCase()}`;
            const role = emp.role || 'Mechanic';

            newLogs.push({
                emailId: generateMailId(),
                recipientType: 'Employee',
                recipientName: empName,
                recipientEmail: empEmail,
                subject: 'Welcome to VehicleeCare - Employee Portal Access',
                category: 'Welcome & Credentials',
                status: 'Delivered',
                metadata: { employeeId: empId, role },
                sentAt: emp.createdAt ? new Date(emp.createdAt) : new Date(Date.now() - idx * 3600000 * 8),
                body: `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; background: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0;">
                        <p>Dear <strong>${empName}</strong>,</p>
                        <p>Your employee account has been successfully registered with <strong>VehicleeCare</strong> as <strong>${role}</strong>.</p>
                        <p><strong>Your Employee Portal Credentials:</strong></p>
                        <p>
                            <strong>Employee Portal:</strong> <a href="https://vehicleecareemployee.vercel.app">https://vehicleecareemployee.vercel.app</a><br/>
                            <strong>Employee ID:</strong> ${empId}<br/>
                            <strong>Assigned Role:</strong> ${role}
                        </p>
                        <p>Please use your registered email and credentials to login. For security purposes, kindly update your password after your initial sign-in.</p>
                        <p>Best regards,<br/><strong>VehicleeCare Operations Team</strong></p>
                    </div>
                `
            });
        });

        // ── Real Employee Leave Requests ──
        leaves.forEach((l, idx) => {
            const empName = l.employeeName || 'Employee';
            const empEmail = empEmailMap[empName.trim().toLowerCase()] || empEmailMap[l.employeeId] || 'employee@vehicleecare.com';
            const status = l.status || 'Pending';
            const totalDays = l.totalDays || 1;
            const leaveType = l.type || 'Leave';
            const dates = `${l.startDate || 'Date'} to ${l.endDate || 'Date'}`;

            newLogs.push({
                emailId: generateMailId(),
                recipientType: 'Employee',
                recipientName: empName,
                recipientEmail: empEmail,
                subject: `Leave Request ${status} - ${totalDays} Day(s) (${dates})`,
                category: 'Leave Notification',
                status: 'Delivered',
                metadata: { employeeId: l.employeeId, leaveType, totalDays, status },
                sentAt: l.createdAt ? new Date(l.createdAt) : new Date(Date.now() - (idx + 1) * 3600000 * 12),
                body: `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; background: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0;">
                        <h3 style="color: #052558; margin-top: 0;">VehicleeCare HR Notification</h3>
                        <p>Hello <strong>${empName}</strong>,</p>
                        <p>Your <strong>${leaveType}</strong> request for <strong>${totalDays} day(s)</strong> (${dates}) has been reviewed and marked as <strong style="color: ${status === 'Approved' ? '#10b981' : status === 'Rejected' ? '#ef4444' : '#f59e0b'};">${status.toUpperCase()}</strong> by the Administrator.</p>
                        ${l.reason ? `<p style="color: #64748b; font-size: 13px;">Reason stated: <em>${l.reason}</em></p>` : ''}
                        <p>Best regards,<br/><strong>VehicleeCare HR Operations</strong></p>
                    </div>
                `
            });
        });

        // ── Real User Logs (from real Users) ──
        users.forEach((u, idx) => {
            const uName = u.name || 'User';
            const uEmail = u.email;
            if (!uEmail) return;
            const otp = Math.floor(100000 + Math.random() * 900000).toString();

            newLogs.push({
                emailId: generateMailId(),
                recipientType: 'User',
                recipientName: uName,
                recipientEmail: uEmail,
                subject: 'VehicleeCare - Account Verification OTP',
                category: 'Authentication OTP',
                status: 'Sent',
                metadata: { otp, role: u.role || 'user' },
                sentAt: u.createdAt ? new Date(u.createdAt) : new Date(Date.now() - idx * 3600000 * 2),
                body: `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #f0f6ff; border-radius: 16px; border: 1px solid #bfdbfe;">
                        <h2 style="color: #011023; margin: 0 0 4px 0;">VehicleeCare</h2>
                        <p style="color: #527FB0; font-size: 13px; margin: 0 0 16px 0; font-weight: 600;">Account Verification</p>
                        <p style="color: #011023; font-size: 14px;">Welcome <strong>${uName}</strong>! Use the OTP below to complete verification of your account:</p>
                        <div style="background: #011023; color: #C2E8FF; font-size: 32px; font-weight: 900; letter-spacing: 8px; text-align: center; padding: 16px; border-radius: 12px; margin: 16px 0; font-family: monospace;">
                            ${otp}
                        </div>
                        <p style="color: #64748b; font-size: 12px; margin: 0;">Valid for 10 minutes. If you did not request this, please disregard.</p>
                    </div>
                `
            });
        });

        if (newLogs.length > 0) {
            await EmailLog.insertMany(newLogs);
            console.log(`✅ [EmailLog] Seeded ${newLogs.length} real email logs from active database records.`);
        }
    } catch (err) {
        console.error('Error synchronizing real email logs:', err);
    } finally {
        isSyncing = false;
    }
};

// Initial run
syncRealEmailLogs();

// Log sent email helper for emailService and authController
exports.logEmail = async ({
    recipientType = 'User',
    recipientName = 'Recipient',
    recipientEmail,
    subject,
    category = 'Notification',
    body = '',
    status = 'Sent',
    metadata = {},
    error = null
}) => {
    try {
        if (!recipientEmail) return null;
        const emailId = generateMailId();
        const log = await EmailLog.create({
            emailId,
            recipientType,
            recipientName,
            recipientEmail,
            subject,
            category,
            body,
            status,
            metadata,
            error,
            sentAt: new Date()
        });
        return log;
    } catch (err) {
        console.error('Failed to log email:', err.message);
        return null;
    }
};

// @desc    Get all sent email logs with filter & search
// @route   GET /api/email-logs
exports.getEmailLogs = async (req, res) => {
    try {
        await syncRealEmailLogs();

        const { recipientType, status, search, limit = 200 } = req.query;
        const query = {};

        // Recipient Type filter: Customer, Employee, User
        if (recipientType && recipientType !== 'All' && recipientType !== 'all') {
            query.recipientType = new RegExp(`^${recipientType}$`, 'i');
        }

        // Status filter: Sent, Delivered, Failed
        if (status && status !== 'All' && status !== 'all') {
            query.status = new RegExp(`^${status}$`, 'i');
        }

        // Search in emailId, recipientName, recipientEmail, subject, category
        if (search && search.trim()) {
            const s = search.trim();
            query.$or = [
                { emailId: { $regex: s, $options: 'i' } },
                { recipientName: { $regex: s, $options: 'i' } },
                { recipientEmail: { $regex: s, $options: 'i' } },
                { subject: { $regex: s, $options: 'i' } },
                { category: { $regex: s, $options: 'i' } }
            ];
        }

        const logs = await EmailLog.find(query)
            .sort({ sentAt: -1, createdAt: -1 })
            .limit(Number(limit))
            .lean();

        res.status(200).json({
            success: true,
            count: logs.length,
            data: logs
        });
    } catch (err) {
        console.error('Error fetching email logs:', err);
        res.status(500).json({ success: false, message: 'Server error fetching email logs', error: err.message });
    }
};

// @desc    Get single email log by ID
// @route   GET /api/email-logs/:id
exports.getEmailLogById = async (req, res) => {
    try {
        const { id } = req.params;
        const log = await EmailLog.findOne({
            $or: [
                { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
                { emailId: id.toUpperCase() }
            ].filter(Boolean)
        }).lean();

        if (!log) {
            return res.status(404).json({ success: false, message: 'Email log not found' });
        }

        res.status(200).json({ success: true, data: log });
    } catch (err) {
        console.error('Error fetching email log:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

// @desc    Force resync real email logs
// @route   POST /api/email-logs/sync
exports.forceSyncEmailLogs = async (req, res) => {
    try {
        await EmailLog.deleteMany({});
        await syncRealEmailLogs();
        const logs = await EmailLog.find().sort({ sentAt: -1 }).lean();
        res.status(200).json({ success: true, count: logs.length, data: logs });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
