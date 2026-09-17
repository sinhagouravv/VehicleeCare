const mongoose = require('mongoose');

const guestLogSchema = new mongoose.Schema({
    application: {
        type: String,
        default: 'VehicleeCare'
    },
    sessionId: {
        type: String,
        required: true,
        index: true
    },
    userId: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: 'guest_admin'
    },
    action: {
        type: String,
        default: 'LOGIN'
    },
    status: {
        type: String,
        default: 'Active'
    },
    ipAddress: {
        type: String,
        default: '127.0.0.1'
    },
    userAgent: {
        type: String,
        default: 'Unknown Browser'
    },
    portal: {
        type: String,
        default: 'admin'
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
}, { timestamps: true });

guestLogSchema.index({ portal: 1, userId: 1, timestamp: -1 });

module.exports = mongoose.model('GuestLog', guestLogSchema);
