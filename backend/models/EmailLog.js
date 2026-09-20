const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema({
    emailId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    recipientType: {
        type: String,
        enum: ['User', 'Employee', 'Customer', 'Garage', 'Admin'],
        required: true,
        index: true
    },
    recipientName: {
        type: String,
        default: 'Recipient'
    },
    recipientEmail: {
        type: String,
        required: true,
        index: true
    },
    subject: {
        type: String,
        required: true
    },
    category: {
        type: String,
        default: 'Notification',
        index: true
    },
    body: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Sent', 'Delivered', 'Failed'],
        default: 'Sent',
        index: true
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    error: {
        type: String,
        default: null
    },
    sentAt: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('EmailLog', emailLogSchema);
