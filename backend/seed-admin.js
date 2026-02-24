require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');

console.log('Connecting to MongoDB...');
mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('MongoDB Connected.');

        // 1. Check if admin already exists
        const existingAdmin = await Admin.findOne({ email: process.env.ADMIN_EMAIL });
        if (existingAdmin) {
            console.log('Admin already seeded in database.');
            process.exit(0);
        }

        // 2. Hash hardcoded password temporarily to initialize DB
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('Pass@9957', salt);

        // 3. Create Admin record using the numeric adminId format
        const newAdmin = new Admin({
            adminId: '184592037461',
            email: process.env.ADMIN_EMAIL,
            password: hashedPassword,
            twoFactorSecret: process.env.ADMIN_TOTP_SECRET // Load from .env
        });

        await newAdmin.save();
        console.log('✅ Admin successfully seeded to MongoDB with numeric ID 184592037461');
        process.exit(0);
    })
    .catch((err) => {
        console.error('Error connecting to DB or seeding:', err);
        process.exit(1);
    });
