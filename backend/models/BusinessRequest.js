const mongoose = require('mongoose');

const businessRequestSchema = new mongoose.Schema({
    displayId: {
        type: String,
        unique: true
    },
    businessCategory: {
        type: String,
        required: true,
        enum: ['garage', 'charging', 'parking', 'store']
    },
    businessName: {
        type: String,
        required: true,
        trim: true
    },
    ownerName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    state: {
        type: String,
        required: true,
        trim: true
    },
    district: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        type: String,
        required: true
    },
    taxId: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    }
}, { timestamps: true });

module.exports = mongoose.model('BusinessRequest', businessRequestSchema);
