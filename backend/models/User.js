const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userId: {
        type: String,
        unique: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    address: {
        type: String,
        default: ''
    },
    phone: {
        type: String,
        default: ''
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    emailOtp: {
        type: String
    },
    otpExpiry: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    emailNotifications: {
        type: Boolean,
        default: true
    }
});

module.exports = mongoose.model('User', userSchema);
