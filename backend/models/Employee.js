const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    employeeId: {
        type: String,
        unique: true,
        required: true
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
    role: {
        type: String,
        enum: ['Mechanic', 'Manager', 'Technician', 'Support', 'Admin', 'Chef', 'Waiter', 'Cashier', 'Delivery', 'Staff'],
        default: 'Staff'
    },
    category: {
        type: String,
        enum: ['Garage', 'Station', 'Store', 'Parking'],
        default: ''
    },
    garageId: {
        type: String,
        default: ''
    },
    phone: {
        type: String,
        default: ''
    },
    address: {
        type: String,
        default: ''
    },
    shift: {
        type: String,
        enum: ['Morning', 'Evening', 'Night'],
        default: 'Morning'
    },
    panCard: {
        type: String,
        default: ''
    },
    adharCard: {
        type: String,
        default: ''
    },
    agreement: {
        type: String,
        default: ''
    },
    voterId: {
        type: String,
        default: ''
    },
    salaryType: {
        type: String,
        default: ''
    },
    isVerified: {
        type: Boolean,
        default: true
    },
    password: {
        type: String,
        default: ''
    },
    resetPasswordOtp: {
        type: String
    },
    resetPasswordExpires: {
        type: Date
    },
    emailOtp: {
        type: String
    },
    otpExpiry: {
        type: Date
    },
    avatar: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Employee', employeeSchema);
