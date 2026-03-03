const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    messageId: { type: String },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    company: { type: String },
    subject: { type: String },
    message: { type: String, required: true },
    type: { type: String, enum: ['website', 'business'], default: 'website' },
    isRead: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Message', MessageSchema);
