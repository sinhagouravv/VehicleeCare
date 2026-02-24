const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
    adminId: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    twoFactorSecret: {
        type: String,
        required: false
    },
    role: {
        type: String,
        default: 'superadmin'
    },
    resetPasswordOtp: {
        type: String,
        required: false
    },
    resetPasswordExpires: {
        type: Date,
        required: false
    }
}, { timestamps: true });

module.exports = mongoose.model('Admin', AdminSchema);
