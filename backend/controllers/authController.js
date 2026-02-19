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

        user = new User({ name, email, password });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();

        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            res.json({
                token,
                user: { id: user.id, name: user.name, email: user.email, isVerified: user.isVerified, role: user.role }
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
        jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            res.json({
                token,
                user: { id: user.id, name: user.name, email: user.email, isVerified: user.isVerified, role: user.role }
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
        const { userId, name, phone, address, currentPassword, newPassword } = req.body;
        if (!userId) return res.status(400).json({ msg: 'User ID required' });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        if (name) user.name = name.trim();
        if (phone !== undefined) user.phone = phone.trim();
        if (address !== undefined) user.address = address.trim();

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
            user: { id: user.id, name: user.name, email: user.email, phone: user.phone, address: user.address, isVerified: user.isVerified, role: user.role }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Update failed' });
    }
};
