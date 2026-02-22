const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

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
        if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

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
