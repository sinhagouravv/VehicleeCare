const User = require('../models/User');
const Admin = require('../models/Admin');
const Garage = require('../models/Garage');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const nodemailer = require('nodemailer');
const { createAdminNotification } = require('./notificationController');

// ── Mailer Setup ────────────────────────────────────────────
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// ── Register ─────────────────────────────────────────────────
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: 'User already exists' });

        // Generate unique 9-digit user ID (starts with 65, no zeroes)
        let generatedId = '';
        let isUnique = false;

        while (!isUnique) {
            generatedId = '65';
            for (let i = 0; i < 7; i++) {
                generatedId += Math.floor(Math.random() * 9) + 1; // 1-9
            }

            const existingId = await User.findOne({ userId: generatedId });
            if (!existingId) {
                isUnique = true;
            }
        }

        user = new User({ userId: generatedId, name, email, password });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();

        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            // Fire admin notification
            createAdminNotification({
                eventType: 'user_registered',
                title: 'New User Registered',
                message: `${name} (${email}) has just created an account.`,
                meta: { userId: user.id, name, email }
            });
            res.json({
                token,
                user: { id: user.id, userId: user.userId, name: user.name, email: user.email, isVerified: user.isVerified, role: user.role }
            });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// ── Login ─────────────────────────────────────────────────────
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        let user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: `User not found: ${email}` });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: `Incorrect password for ${email}` });

        const payload = { user: { id: user.id } };

        // Backfill userId for existing users who don't have one
        if (!user.userId) {
            let generatedId = '';
            let isUnique = false;

            while (!isUnique) {
                generatedId = '65';
                for (let i = 0; i < 7; i++) {
                    generatedId += Math.floor(Math.random() * 9) + 1; // digits 1-9, no zero
                }
                const existingId = await User.findOne({ userId: generatedId });
                if (!existingId) isUnique = true;
            }
            user.userId = generatedId;
            await user.save();
        }

        jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            res.json({
                token,
                user: { id: user.id, userId: user.userId, name: user.name, email: user.email, isVerified: user.isVerified, role: user.role }
            });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// ── Admin Login ──────────────────────────────────────────────
exports.adminLogin = async (req, res) => {
    try {
        const { email, password, otp } = req.body;

        // Email field receives either email or the raw numeric Admin ID
        let admin = await Admin.findOne({
            $or: [{ email: email }, { adminId: email }]
        });

        if (!admin) {
            return res.status(401).json({ msg: 'Invalid admin credentials' });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({ msg: 'Invalid admin credentials' });
        }

        // If credentials match but no OTP is provided, tell frontend to show 2FA popup
        if (!otp) {
            return res.json({ requires2FA: true, msg: 'Please enter your Microsoft Authenticator code' });
        }

        // If OTP is provided, verify it via speakeasy using Admin's personal secret or fallback config
        const secretToUse = admin.twoFactorSecret || process.env.ADMIN_TOTP_SECRET;

        const verified = speakeasy.totp.verify({
            secret: secretToUse,
            encoding: 'base32',
            token: otp,
            window: 1 // allows 30 seconds before/after leniency
        });

        if (!verified) {
            return res.status(400).json({ msg: 'Invalid 2FA code. Please try again.' });
        }

        const payload = { admin: { id: admin.adminId, role: admin.role, dbId: admin._id } };

        jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' }, (err, token) => {
            if (err) throw err;
            res.json({ token, admin: { id: admin.adminId, email: admin.email, role: admin.role } });
        });

    } catch (err) {
        console.error("Admin login error:", err);
        res.status(500).send('Server Error');
    }
};

// ── Store Admin Login (No 2FA Required) ──────────────────────
exports.storeAdminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Email field receives either email or the raw numeric Admin ID
        let admin = await Admin.findOne({
            $or: [{ email: email }, { adminId: email }]
        });

        if (!admin) {
            return res.status(401).json({ msg: 'Invalid store admin credentials' });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({ msg: 'Invalid store admin credentials' });
        }

        const payload = { admin: { id: admin.adminId, role: admin.role, dbId: admin._id } };

        jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' }, (err, token) => {
            if (err) throw err;
            res.json({ token, admin: { id: admin.adminId, email: admin.email, role: admin.role } });
        });

    } catch (err) {
        console.error("Store Admin login error:", err);
        res.status(500).send('Server Error');
    }
};

// ── Admin Forgot Password (Send OTP) ────────────────────────
exports.adminForgotPassword = async (req, res) => {
    try {
        const { email } = req.body; // 'email' can be email or adminId

        const admin = await Admin.findOne({
            $or: [{ email: email }, { adminId: email }]
        });

        if (!admin) {
            return res.status(404).json({ msg: 'The email you entered is not an Admin Email, enter correct email address' });
        }

        // Generate 6-digit numeric OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Save to DB with 10-minute expiry
        admin.resetPasswordOtp = otp;
        admin.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
        await admin.save();

        // Send Email using transporter
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: admin.email, // ensure it routes to the actual admin email, not the adminId string
            subject: 'Admin Portal - Password Reset OTP',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 500px; margin: 0 auto; background-color: #f8fafc; border-radius: 8px;">
                    <h2 style="color: #0f172a;">Admin Password Reset</h2>
                    <p>You requested a password reset for your VehicleeCare Admin account.</p>
                    <div style="background-color: #e2e8f0; padding: 15px; text-align: center; border-radius: 6px; margin: 20px 0;">
                        <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #3b82f6;">${otp}</span>
                    </div>
                    <p style="font-size: 14px; color: #64748b;">This OTP will expire in 10 minutes. If you did not request this, please ignore this email.</p>
                </div>
            `
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Email Error:", error);
                return res.status(500).json({ msg: 'Failed to send OTP email' });
            }
            res.json({ msg: 'OTP sent to registered admin email successfully' });
        });

    } catch (err) {
        console.error("Admin forgot password error:", err);
        res.status(500).send('Server Error');
    }
};

// ── Admin Verify Reset OTP (Step 2) ─────────────────────────
exports.adminVerifyResetOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        const admin = await Admin.findOne({
            $or: [{ email: email }, { adminId: email }]
        });

        if (!admin) {
            return res.status(404).json({ msg: 'Admin account not found' });
        }

        if (admin.resetPasswordOtp !== otp || admin.resetPasswordExpires < Date.now()) {
            return res.status(400).json({ msg: 'Invalid or expired OTP' });
        }

        // OTP is valid
        res.json({ msg: 'OTP verified successfully' });

    } catch (err) {
        console.error("Admin verify reset OTP error:", err);
        res.status(500).send('Server Error');
    }
};

// ── Admin Reset Password (Verify & Update - Step 3) ────────
exports.adminResetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        const admin = await Admin.findOne({
            $or: [{ email: email }, { adminId: email }]
        });

        if (!admin) {
            return res.status(404).json({ msg: 'Admin account not found' });
        }

        if (admin.resetPasswordOtp !== otp || admin.resetPasswordExpires < Date.now()) {
            return res.status(400).json({ msg: 'Invalid or expired OTP' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        admin.password = await bcrypt.hash(newPassword, salt);

        // Clear OTP fields
        admin.resetPasswordOtp = undefined;
        admin.resetPasswordExpires = undefined;
        await admin.save();

        res.json({ msg: 'Password updated successfully. You can now log in.' });

    } catch (err) {
        console.error("Admin reset password error:", err);
        res.status(500).send('Server Error');
    }
};

// ── Garage Login ─────────────────────────────────────────────
exports.garageLogin = async (req, res) => {
    try {
        const { garageId, password } = req.body;

        const garage = await Garage.findOne({ garageId });
        if (!garage) {
            return res.status(401).json({ msg: 'Invalid garage credentials' });
        }

        const isMatch = await bcrypt.compare(password, garage.password);
        if (!isMatch) {
            return res.status(401).json({ msg: 'Invalid garage credentials' });
        }

        const payload = { garage: { id: garage.garageId, dbId: garage._id } };

        jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' }, (err, token) => {
            if (err) throw err;
            res.json({ token, garage: { id: garage.garageId, name: garage.name, ownerEmail: garage.ownerEmail } });
        });

    } catch (err) {
        console.error("Garage login error:", err);
        res.status(500).send('Server Error');
    }
};


// ── Garage Forgot Password (Send OTP - Step 1) ──────────────
exports.garageForgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const garage = await Garage.findOne({ ownerEmail: email });

        if (!garage) {
            return res.status(404).json({ msg: 'The email you entered is not an Garage Owner Email, enter correct email address' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        garage.resetPasswordOtp = otp;
        garage.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
        await garage.save();

        // Send Email
        const mailOptions = {
            from: `"VehicleeCare" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Garage Portal - Password Reset OTP',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f0f6ff; border-radius: 16px;">
                    <h2 style="color: #011023; margin-bottom: 4px;">VehicleeCare Garage</h2>
                    <p style="color: #527FB0; font-size: 13px; margin-bottom: 24px;">Password Reset Request</p>
                    <p style="color: #011023; font-size: 14px;">Hi <strong>${garage.name}</strong>, use the OTP below to reset your garage portal password:</p>
                    <div style="background: #011023; color: #C2E8FF; font-size: 36px; font-weight: 900; letter-spacing: 10px; text-align: center; padding: 20px; border-radius: 12px; margin: 20px 0;">${otp}</div>
                    <p style="color: #888; font-size: 12px;">This OTP is valid for <strong>10 minutes</strong>. If you did not request this, please ignore this email.</p>
                </div>
            `
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Email Error:", error);
                return res.status(500).json({ msg: 'Failed to send OTP email' });
            }
            res.json({ msg: 'OTP sent to registered garage email' });
        });

    } catch (err) {
        console.error("Garage forgot password error:", err);
        res.status(500).send('Server Error');
    }
};


// ── Garage Verify Reset OTP (Step 2) ─────────────────────────
exports.garageVerifyResetOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const garage = await Garage.findOne({ ownerEmail: email });

        if (!garage) {
            return res.status(404).json({ msg: 'Garage account not found' });
        }

        if (garage.resetPasswordOtp !== otp || garage.resetPasswordExpires < Date.now()) {
            return res.status(400).json({ msg: 'Invalid or expired OTP' });
        }

        res.json({ msg: 'OTP verified successfully' });

    } catch (err) {
        console.error("Garage verify reset OTP error:", err);
        res.status(500).send('Server Error');
    }
};


// ── Garage Reset Password (Verify & Update - Step 3) ────────
exports.garageResetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        const garage = await Garage.findOne({ ownerEmail: email });

        if (!garage) {
            return res.status(404).json({ msg: 'Garage account not found' });
        }

        if (garage.resetPasswordOtp !== otp || garage.resetPasswordExpires < Date.now()) {
            return res.status(400).json({ msg: 'Invalid or expired OTP' });
        }

        const salt = await bcrypt.genSalt(10);
        garage.password = await bcrypt.hash(newPassword, salt);

        garage.resetPasswordOtp = undefined;
        garage.resetPasswordExpires = undefined;
        await garage.save();

        res.json({ msg: 'Password updated successfully. You can now log in.' });

    } catch (err) {
        console.error("Garage reset password error:", err);
        res.status(500).send('Server Error');
    }
};

// ── Business Auth / Vendor Registration ────────────────────────
exports.businessRegister = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: 'Vendor already exists with this email' });

        let generatedId = '';
        let isUnique = false;
        while (!isUnique) {
            generatedId = '75';
            for (let i = 0; i < 7; i++) {
                generatedId += Math.floor(Math.random() * 9) + 1;
            }
            const existingId = await User.findOne({ userId: generatedId });
            if (!existingId) isUnique = true;
        }

        user = new User({ userId: generatedId, name, email, password, role: 'vendor' });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();

        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            res.json({
                token,
                business: { id: user.userId, name: user.name, email: user.email, role: user.role }
            });
        });
    } catch (err) {
        console.error("Business register error:", err);
        res.status(500).send('Server Error');
    }
};

exports.businessLogin = async (req, res) => {
    try {
        const { businessId, password } = req.body;

        const user = await User.findOne({
            $or: [{ email: businessId }, { userId: businessId }],
            role: 'vendor'
        });

        if (!user) return res.status(401).json({ msg: 'Invalid business credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ msg: 'Invalid business credentials' });

        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            res.json({
                token,
                business: { id: user.userId, name: user.name, email: user.email, role: user.role, subscriptionPlan: user.subscriptionPlan, subscriptionStatus: user.subscriptionStatus, subscriptionExpiry: user.subscriptionExpiry }
            });
        });
    } catch (err) {
        console.error("Business login error:", err);
        res.status(500).send('Server Error');
    }
};

exports.businessForgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({
            $or: [{ email: email }, { userId: email }],
            role: 'vendor'
        });

        if (!user) return res.status(404).json({ msg: 'Vendor account not found' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.emailOtp = otp;
        user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        // Send Email
        const mailOptions = {
            from: `"VehicleeCare" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: 'Business Portal - Password Reset OTP',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f0f6ff; border-radius: 16px;">
                    <h2 style="color: #011023; margin-bottom: 4px;">VehicleeCare Business</h2>
                    <p style="color: #527FB0; font-size: 13px; margin-bottom: 24px;">Password Reset Request</p>
                    <p style="color: #011023; font-size: 14px;">Hi <strong>${user.name}</strong>, use the OTP below to reset your business portal password:</p>
                    <div style="background: #011023; color: #C2E8FF; font-size: 36px; font-weight: 900; letter-spacing: 10px; text-align: center; padding: 20px; border-radius: 12px; margin: 20px 0;">${otp}</div>
                    <p style="color: #888; font-size: 12px;">This OTP is valid for <strong>10 minutes</strong>.</p>
                </div>
            `
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Email Error:", error);
                return res.status(500).json({ msg: 'Failed to send OTP email' });
            }
            res.json({ msg: 'OTP sent to registered business email' });
        });
    } catch (err) {
        console.error("Business forgot password error:", err);
        res.status(500).send('Server Error');
    }
};

exports.businessVerifyResetOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({
            $or: [{ email: email }, { userId: email }],
            role: 'vendor'
        });
        if (!user) return res.status(404).json({ msg: 'Vendor account not found' });

        if (user.emailOtp !== otp || new Date() > user.otpExpiry) {
            return res.status(400).json({ msg: 'Invalid or expired OTP' });
        }

        res.json({ msg: 'OTP verified successfully' });
    } catch (err) {
        console.error("Business verify reset OTP error:", err);
        res.status(500).send('Server Error');
    }
};

exports.businessResetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        const user = await User.findOne({
            $or: [{ email: email }, { userId: email }],
            role: 'vendor'
        });
        if (!user) return res.status(404).json({ msg: 'Vendor account not found' });

        if (user.emailOtp !== otp || new Date() > user.otpExpiry) {
            return res.status(400).json({ msg: 'Invalid or expired OTP' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.emailOtp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        res.json({ msg: 'Password updated successfully. You can now log in.' });
    } catch (err) {
        console.error("Business reset password error:", err);
        res.status(500).send('Server Error');
    }
};

// ── Send OTP ──────────────────────────────────────────────────
exports.sendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ msg: 'User not found' });
        if (user.isVerified) return res.status(400).json({ msg: 'Account already verified' });

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.emailOtp = otp;
        user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min
        await user.save();

        await transporter.sendMail({
            from: `"VehicleeCare" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Verify Your VehicleeCare Account',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f0f6ff; border-radius: 16px;">
                    <h2 style="color: #011023; margin-bottom: 4px;">VehicleeCare</h2>
                    <p style="color: #527FB0; font-size: 13px; margin-bottom: 24px;">Email Verification</p>
                    <p style="color: #011023; font-size: 14px;">Hi <strong>${user.name}</strong>, use the OTP below to verify your account:</p>
                    <div style="background: #011023; color: #C2E8FF; font-size: 36px; font-weight: 900; letter-spacing: 10px; text-align: center; padding: 20px; border-radius: 12px; margin: 20px 0;">${otp}</div>
                    <p style="color: #888; font-size: 12px;">This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
                </div>
            `
        });

        res.json({ msg: 'OTP sent to your email' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Failed to send OTP' });
    }
};

// ── Verify OTP ────────────────────────────────────────────────
exports.verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ msg: 'User not found' });
        if (user.isVerified) return res.status(400).json({ msg: 'Already verified' });

        if (!user.emailOtp || !user.otpExpiry) {
            return res.status(400).json({ msg: 'No OTP issued. Please request a new one.' });
        }
        if (new Date() > user.otpExpiry) {
            return res.status(400).json({ msg: 'OTP has expired. Please request a new one.' });
        }
        if (user.emailOtp !== otp.trim()) {
            return res.status(400).json({ msg: 'Invalid OTP' });
        }

        user.isVerified = true;
        user.emailOtp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        res.json({ msg: 'Account verified successfully', isVerified: true });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Verification failed' });
    }
};

// ── Update Profile ────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
    try {
        const { userId, name, phone, address, emailNotifications, currentPassword, newPassword } = req.body;
        if (!userId) return res.status(400).json({ msg: 'User ID required' });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        if (name) user.name = name.trim();
        if (phone !== undefined) user.phone = phone.trim();
        if (address !== undefined) user.address = address.trim();
        if (emailNotifications !== undefined) user.emailNotifications = emailNotifications;

        // Optional password change
        if (newPassword) {
            if (!currentPassword) return res.status(400).json({ msg: 'Current password required' });
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) return res.status(400).json({ msg: 'Current password is incorrect' });
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
        }

        await user.save();

        res.json({
            msg: 'Profile updated',
            user: { id: user.id, userId: user.userId, name: user.name, email: user.email, phone: user.phone, address: user.address, isVerified: user.isVerified, role: user.role }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Update failed' });
    }
};

// ── Get Me (refresh user data) ────────────────────────────────
exports.getMe = async (req, res) => {
    try {
        const { mongoId } = req.body;
        if (!mongoId) return res.status(400).json({ msg: 'ID required' });

        const user = await User.findById(mongoId).select('-password');
        if (!user) return res.status(404).json({ msg: 'User not found' });

        res.json({
            id: user.id,
            userId: user.userId,
            name: user.name,
            email: user.email,
            phone: user.phone,
            address: user.address,
            isVerified: user.isVerified,
            role: user.role,
            emailNotifications: user.emailNotifications
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Failed to fetch user' });
    }
};

// ── Send Settings OTP ─────────────────────────────────────────
// purpose: 'change-password' | 'delete-account'
exports.sendSettingsOtp = async (req, res) => {
    try {
        const { userId, purpose, currentPassword } = req.body;
        if (!userId) return res.status(400).json({ msg: 'User ID required' });
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        // For password change: verify current password first
        if (purpose === 'change-password') {
            if (!currentPassword) return res.status(400).json({ msg: 'Current password is required' });
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) return res.status(400).json({ msg: 'Current password is incorrect' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.emailOtp = otp;
        user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        const subjects = {
            'change-password': 'VehicleeCare — Confirm Password Change',
            'delete-account': 'VehicleeCare — Confirm Account Deletion',
        };
        const actions = {
            'change-password': 'change your password',
            'delete-account': '<strong style="color:#c00">permanently delete your account</strong>',
        };

        await transporter.sendMail({
            from: `"VehicleeCare" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: subjects[purpose] || 'VehicleeCare — Security Code',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f0f6ff; border-radius: 16px;">
                    <h2 style="color: #011023; margin-bottom: 4px;">VehicleeCare</h2>
                    <p style="color: #527FB0; font-size: 13px; margin-bottom: 24px;">Security Verification</p>
                    <p style="color: #011023; font-size: 14px;">Hi <strong>${user.name}</strong>, use this OTP to ${actions[purpose] || 'proceed'}:</p>
                    <div style="background: #011023; color: #C2E8FF; font-size: 36px; font-weight: 900; letter-spacing: 10px; text-align: center; padding: 20px; border-radius: 12px; margin: 20px 0;">${otp}</div>
                    <p style="color: #888; font-size: 12px;">Valid for <strong>10 minutes</strong>. Do not share it.</p>
                </div>
            `
        });

        res.json({ msg: 'OTP sent to your email' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Failed to send OTP' });
    }
};

// ── Change Password (OTP-verified) ────────────────────────────
exports.changePasswordOtp = async (req, res) => {
    try {
        const { userId, otp, newPassword } = req.body;
        if (!userId || !otp || !newPassword) return res.status(400).json({ msg: 'All fields required' });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ msg: 'User not found' });
        if (!user.emailOtp || !user.otpExpiry) return res.status(400).json({ msg: 'No OTP issued' });
        if (new Date() > user.otpExpiry) return res.status(400).json({ msg: 'OTP expired. Request a new one.' });
        if (user.emailOtp !== otp.trim()) return res.status(400).json({ msg: 'Invalid OTP' });
        if (newPassword.length < 6) return res.status(400).json({ msg: 'Password must be at least 6 characters' });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.emailOtp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        res.json({ msg: 'Password changed successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Failed to change password' });
    }
};

// ── Delete Account (OTP-verified) ─────────────────────────────
exports.deleteAccount = async (req, res) => {
    try {
        const { userId, otp } = req.body;
        if (!userId || !otp) return res.status(400).json({ msg: 'User ID and OTP required' });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ msg: 'User not found' });
        if (!user.emailOtp || !user.otpExpiry) return res.status(400).json({ msg: 'No OTP issued' });
        if (new Date() > user.otpExpiry) return res.status(400).json({ msg: 'OTP expired. Request a new one.' });
        if (user.emailOtp !== otp.trim()) return res.status(400).json({ msg: 'Invalid OTP' });

        await User.findByIdAndDelete(userId);
        res.json({ msg: 'Account deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Failed to delete account' });
    }
};
