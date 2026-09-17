const nodemailer = require('nodemailer');

// ── Centralized SMTP Transporter ──────────────────────────────────
// Uses Gmail SMTP with connection pooling for maximum reliability,
// preventing dropped connections and rate-limiting issues under concurrent traffic.
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // SSL
    pool: true,   // Keep-alive connection pooling
    maxConnections: 5,
    maxMessages: 100,
    socketTimeout: 15000,   // 15s — fail fast if SMTP stalls (prevents Render hanging)
    greedyErrors: true,     // Release pooled connections on error immediately
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Verify connection configuration on startup
transporter.verify((error) => {
    if (error) {
        console.error('❌ [EmailService] SMTP verification failed:', error.message);
    } else {
        console.log('✅ [EmailService] Centralized SMTP Mailer connected & ready.');
    }
});

const getSender = () => `"VehicleeCare" <${process.env.EMAIL_USER || 'support@vehicleecare.com'}>`;

/**
 * Generic mail sender wrapper with error logging and validation
 */
const sendEmail = async ({ to, subject, html, text, from }) => {
    if (!to || !to.trim()) {
        throw new Error('Recipient email is missing or empty');
    }

    const mailOptions = {
        from: from || getSender(),
        to: to.trim(),
        subject,
        html,
        ...(text ? { text } : {})
    };

    return await transporter.sendMail(mailOptions);
};

// ── Delivery Verification OTP Email ──────────────────────────────
const sendDeliveryOtpEmail = async ({ to, name, bookingId, otp }) => {
    const customerName = name || 'Customer';
    const bId = bookingId || 'N/A';

    const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #052558; font-size: 24px; font-weight: 800; letter-spacing: 0.5px; margin: 0; text-transform: uppercase;">VehicleeCare</h1>
                <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Delivery Verification</p>
            </div>

            <div style="background-color: #ffffff; padding: 28px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                <p style="color: #0f172a; font-size: 15px; line-height: 1.6; margin-top: 0;">
                    Hello <strong>${customerName}</strong>,
                </p>
                <p style="color: #475569; font-size: 14px; line-height: 1.6;">
                    Your vehicle for booking <strong style="color: #052558;">#${bId}</strong> is fully serviced and ready for delivery.
                </p>
                <p style="color: #475569; font-size: 14px; line-height: 1.6;">
                    Please share the following One-Time Password (OTP) with the technician to confirm handover:
                </p>

                <div style="background: #f0fdf4; border: 1.5px dashed #10b981; padding: 20px; text-align: center; border-radius: 10px; margin: 24px 0;">
                    <span style="font-size: 34px; font-weight: 800; letter-spacing: 10px; color: #059669; font-family: monospace;">${otp}</span>
                    <p style="color: #059669; font-size: 12px; font-weight: 600; margin: 8px 0 0 0; text-transform: uppercase; letter-spacing: 0.5px;">Valid for 10 minutes</p>
                </div>

                <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 16px; border-radius: 6px; margin: 20px 0;">
                    <p style="color: #1e40af; font-size: 12.5px; line-height: 1.5; margin: 0;">
                        <strong>Security Notice:</strong> Only provide this OTP to your assigned VehicleeCare technician once you have inspected and received your vehicle.
                    </p>
                </div>
            </div>

            <div style="text-align: center; margin-top: 24px; color: #94a3b8; font-size: 12px;">
                <p style="margin: 0;">© ${new Date().getFullYear()} VehicleeCare Services. All rights reserved.</p>
                <p style="margin: 4px 0 0 0;">If you did not request this, please contact support immediately.</p>
            </div>
        </div>
    `;

    return await sendEmail({
        to,
        subject: `VehicleeCare - Delivery Verification OTP (Booking #${bId})`,
        html
    });
};

// ── In-Service Start OTP Email ───────────────────────────────────
const sendInServiceOtpEmail = async ({ to, name, bookingId, otp }) => {
    const customerName = name || 'Customer';
    const bId = bookingId || 'N/A';

    const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #052558; font-size: 24px; font-weight: 800; letter-spacing: 0.5px; margin: 0; text-transform: uppercase;">VehicleeCare</h1>
                <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Service Start Verification</p>
            </div>

            <div style="background-color: #ffffff; padding: 28px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                <p style="color: #0f172a; font-size: 15px; line-height: 1.6; margin-top: 0;">
                    Hello <strong>${customerName}</strong>,
                </p>
                <p style="color: #475569; font-size: 14px; line-height: 1.6;">
                    Your vehicle service for booking <strong style="color: #052558;">#${bId}</strong> is about to begin.
                </p>
                <p style="color: #475569; font-size: 14px; line-height: 1.6;">
                    Please provide the verification OTP below to the technician to authorize service commencement:
                </p>

                <div style="background: #eff6ff; border: 1.5px dashed #3b82f6; padding: 20px; text-align: center; border-radius: 10px; margin: 24px 0;">
                    <span style="font-size: 34px; font-weight: 800; letter-spacing: 10px; color: #2563eb; font-family: monospace;">${otp}</span>
                    <p style="color: #2563eb; font-size: 12px; font-weight: 600; margin: 8px 0 0 0; text-transform: uppercase; letter-spacing: 0.5px;">Valid for 10 minutes</p>
                </div>
            </div>

            <div style="text-align: center; margin-top: 24px; color: #94a3b8; font-size: 12px;">
                <p style="margin: 0;">© ${new Date().getFullYear()} VehicleeCare Services. All rights reserved.</p>
            </div>
        </div>
    `;

    return await sendEmail({
        to,
        subject: `VehicleeCare - Service Verification OTP (Booking #${bId})`,
        html
    });
};

// ── Employee Welcome & Credentials Email ─────────────────────────
const sendEmployeeWelcomeEmail = async ({ to, name, employeeId, temporaryPassword, portalUrl }) => {
    const empName = name || 'Team Member';
    const siteUrl = portalUrl || 'https://vehicleecareemployee.vercel.app';
    const loginUrl = `${siteUrl.replace(/\/$/, '')}/login`;

    const html = `
        <p>Dear ${empName},</p>

        <p>Your employee account has been successfully registered with <strong>VehicleeCare</strong>.</p>
        <p><strong>Your Employee Portal Credentials:</strong></p>

        <p> <strong>Employee Website:</strong> <a href="${siteUrl}">VehicleeCare | Employee</a><br> <strong>Employee ID:</strong> ${employeeId}<br> <strong>Password:</strong> ${temporaryPassword}</p>

        <p>Please use these credentials to access your Employee Portal and manage your services, bookings, and profile.</p>

        <p>For security purposes, please change your temporary password immediately after your first login. This is a temporary password, kindly change it afterwards.</p>

        <p> <a href="${loginUrl}"> Login to Employee Portal </a></p>
        <p>Thank you for choosing VehicleeCare.</p>
        <p> Best regards,<br> <strong>VehicleeCare Team</strong></p>
    `;

    return await sendEmail({
        to,
        subject: 'Welcome to VehicleeCare - Employee Portal Access',
        html
    });
};

// ── Garage Welcome & Credentials Email ───────────────────────────
const sendGarageWelcomeEmail = async ({ to, name, garageId, temporaryPassword, portalUrl }) => {
    const garageName = name || 'Garage Partner';
    const siteUrl = portalUrl || process.env.GARAGE_PORTAL_URL || 'https://vehicleecaregarage.vercel.app';
    const loginUrl = `${siteUrl.replace(/\/$/, '')}/login`;

    const html = `
        <p>Dear ${garageName},</p>

        <p>
            Your garage has been successfully registered with
            <strong>VehicleeCare</strong>.
        </p>

        <p><strong>Your Garage Portal Credentials:</strong></p>

        <p>
            <strong>Garage Website:</strong> <a href="${siteUrl}">${siteUrl}</a><br>
            <strong>Garage ID:</strong> ${garageId}<br>
            <strong>Temporary Password:</strong> ${temporaryPassword}
        </p>

        <p>
            Please use these credentials to access your Garage Portal and
            manage your services, bookings, and profile.
        </p>

        <p>
            For security purposes, please change your temporary password
            immediately after your first login.
        </p>

        <p>
            <a href="${loginUrl}">
                Login to Garage Portal
            </a>
        </p>

        <p>Thank you for choosing VehicleeCare.</p>

        <p>
            Best regards,<br>
            <strong>VehicleeCare Team</strong>
        </p>
    `;

    return await sendEmail({
        to,
        subject: 'Welcome to VehicleeCare - Garage Portal Access',
        html
    });
};

// ── Authentication / Password Reset OTP Email ────────────────────
const sendAuthOtpEmail = async ({ to, name, portalTitle, purpose, otp }) => {
    const recipientName = name || 'User';
    const portal = portalTitle || 'VehicleeCare';
    const title = purpose || 'Password Reset Request';

    const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #f0f6ff; border-radius: 16px;">
            <h2 style="color: #011023; margin: 0 0 4px 0; font-size: 22px;">${portal}</h2>
            <p style="color: #527FB0; font-size: 13px; margin: 0 0 20px 0; font-weight: 600;">${title}</p>
            <p style="color: #011023; font-size: 14px; line-height: 1.5; margin-bottom: 16px;">
                Hi <strong>${recipientName}</strong>, use the OTP below to complete your verification:
            </p>
            <div style="background: #011023; color: #C2E8FF; font-size: 36px; font-weight: 900; letter-spacing: 10px; text-align: center; padding: 20px; border-radius: 12px; margin: 20px 0; font-family: monospace;">
                ${otp}
            </div>
            <p style="color: #64748b; font-size: 12px; margin: 0;">
                This OTP is valid for <strong>10 minutes</strong>. If you did not request this, please ignore this email.
            </p>
        </div>
    `;

    return await sendEmail({
        to,
        subject: `${portal} - ${title}`,
        html
    });
};

// ── Guest Login Security Alert Email ─────────────────────────────
const sendGuestLoginAlertEmail = async (details = {}) => {
    try {
        const targetEmail = process.env.ADMIN_ALERT_EMAIL || process.env.EMAIL_USER;
        if (!targetEmail) return null;

        const html = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <h1 style="color: #052558; font-size: 22px; font-weight: 800; margin: 0; text-transform: uppercase;">VehicleeCare Security Alert</h1>
                    <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Guest Admin Login Detected</p>
                </div>
                <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; font-size: 13px; line-height: 1.8; color: #1e293b;">
                    <p style="margin: 0 0 8px 0;"><strong>Application:</strong> ${details.application || 'VehicleeCare'}</p>
                    <p style="margin: 0 0 8px 0;"><strong>Session ID:</strong> <code style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">${details.sessionId || 'N/A'}</code></p>
                    <p style="margin: 0 0 8px 0;"><strong>User ID:</strong> ${details.userId || 'guestadmin@vehicleecare.com'}</p>
                    <p style="margin: 0 0 8px 0;"><strong>Role:</strong> <span style="background: #eff6ff; color: #1d4ed8; padding: 2px 8px; border-radius: 6px; font-weight: 600;">${details.role || 'guest_admin'}</span></p>
                    <p style="margin: 0 0 8px 0;"><strong>Action:</strong> <span style="background: #fdf4ff; color: #86198f; padding: 2px 8px; border-radius: 6px; font-weight: 600;">${details.action || 'VIEW_DASHBOARD'}</span></p>
                    <p style="margin: 0 0 8px 0;"><strong>IP Address:</strong> <code>${details.ipAddress || 'unknown'}</code></p>
                    <p style="margin: 0 0 8px 0;"><strong>User Agent:</strong> <span style="color: #64748b; font-size: 12px; word-break: break-all;">${details.userAgent || 'unknown'}</span></p>
                    <p style="margin: 0;"><strong>Timestamp:</strong> ${details.timestamp ? new Date(details.timestamp).toUTCString() : new Date().toUTCString()}</p>
                </div>
                <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 16px;">
                    This automated alert was generated when a user logged into VehicleeCare using guest credentials.
                </p>
            </div>
        `;

        return await sendEmail({
            to: targetEmail,
            subject: `[VehicleeCare Alert] Guest Admin Login Detected (${details.sessionId || 'Session'})`,
            html
        });
    } catch (err) {
        console.error('Failed to send guest login alert email:', err.message);
        return null;
    }
};

module.exports = {
    transporter,
    sendEmail,
    sendDeliveryOtpEmail,
    sendInServiceOtpEmail,
    sendEmployeeWelcomeEmail,
    sendGarageWelcomeEmail,
    sendAuthOtpEmail,
    sendGuestLoginAlertEmail
};

