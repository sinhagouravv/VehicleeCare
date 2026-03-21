const Garage = require('../models/Garage');
const { createAdminNotification } = require('./notificationController');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Generate unique 9-digit garageId: starts with "66", no digit "0", no repeats
const generateGarageId = async () => {
    const digits = '123456789'; // no 0
    // already fixed: '6','6' — need 7 more unique digits
    const generate = () => {
        let chars = ['6', '6'];
        const used = new Set(['6']);       // '6' is already used twice but we allow it
        const pool = digits.split('');
        const available = pool.filter(d => d !== '6'); // remaining after '6'

        // Pick 7 more chars from digits (can repeat, just no 0; no-repeat per spec like bookingId)
        // Using same approach as bookingId: no repeating chars
        // But we need 7 unique from "123456789" minus '6' that we already have
        // pool has 8 remaining digits (1,2,3,4,5,7,8,9)
        const shuffled = available.sort(() => Math.random() - 0.5);
        for (let i = 0; i < 7; i++) {
            chars.push(shuffled[i]);
        }
        // Shuffle positions 2..8 so it looks random
        const fixed = chars.slice(0, 2);
        const rest = chars.slice(2).sort(() => Math.random() - 0.5);
        return [...fixed, ...rest].join('');
    };

    let id;
    let exists = true;
    while (exists) {
        id = generate();
        exists = await Garage.findOne({ garageId: id });
    }
    return id;
};

// GET all garages
exports.getGarages = async (req, res) => {
    try {
        const garages = await Garage.find().sort({ createdAt: -1 });
        res.json({ success: true, data: garages });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST create garage
exports.createGarage = async (req, res) => {
    try {
        const garageId = await generateGarageId();

        // Hash temporary password Pass@1234
        const tempPassword = 'Pass@1234';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(tempPassword, salt);

        const garage = await Garage.create({ ...req.body, garageId, password: hashedPassword });

        // Fire admin notification
        createAdminNotification({
            eventType: 'garage_added',
            title: 'New Garage Added',
            message: `A new garage, ${garage.name}, has been added (ID: ${garage.garageId}).`,
            meta: { garageId: garage.garageId, name: garage.name, ownerEmail: garage.ownerEmail }
        });

        // Send Welcome Email if ownerEmail is provided
        if (req.body.ownerEmail) {
            const mailOptions = {
                from: `"VehicleeCare Admin" <${process.env.EMAIL_USER}>`,
                to: req.body.ownerEmail,
                subject: 'Welcome to VehicleeCare - Your Garage Portal Login',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
                        <h2 style="color: #0f172a; text-transform: uppercase; margin-top: 0;">Welcome, ${req.body.name}!</h2>
                        <p style="color: #475569; font-size: 15px; line-height: 1.5;">Your garage has been successfully added to the <strong>VehicleeCare</strong> platform.</p>
                        
                        <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #cbd5e1; margin: 25px 0;">
                            <h3 style="color: #3b82f6; font-size: 14px; text-transform: uppercase; margin-top: 0; letter-spacing: 1px;">Your Login Credentials</h3>
                            <p style="margin: 10px 0; color: #334155;"><strong>Garage ID:</strong> <span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 16px;">${garageId}</span></p>
                            <p style="margin: 10px 0; color: #334155;"><strong>Password:</strong> <span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 16px;">${tempPassword}</span></p>
                        </div>
                        
                        <p style="color: #475569; font-size: 14px; margin-bottom: 25px;">Please log in to your Garage Portal to manage your services, bookings, and profile. We highly recommend changing your password immediately after your first login.</p>
                        
                        <a href="http://localhost:5175/login" style="display: inline-block; background-color: #052558; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; font-size: 14px;">Access Garage Portal</a>

                        <p>Thank you for choosing VehicleeCare!</p>
                        <br>
                        <p>Best regards,</p>
                        <p>VehicleeCare Team</p>
                    </div>
                `
            };

            // Send async without blocking UI return
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) console.error("Failed to send Welcome Email to Garage:", error);
            });
        }

        res.status(201).json({ success: true, data: garage });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// PUT update garage
exports.updateGarage = async (req, res) => {
    try {
        const garage = await Garage.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!garage) return res.status(404).json({ success: false, message: 'Garage not found' });
        res.json({ success: true, data: garage });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// DELETE garage
exports.deleteGarage = async (req, res) => {
    try {
        const garage = await Garage.findByIdAndDelete(req.params.id);
        if (!garage) return res.status(404).json({ success: false, message: 'Garage not found' });
        res.json({ success: true, message: 'Garage deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
