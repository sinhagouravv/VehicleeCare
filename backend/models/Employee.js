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
        enum: ['Mechanic', 'Manager', 'Technician', 'Support', 'Admin'],
        default: 'Mechanic'
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
        enum: ['Morning', 'Evening'],
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
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Employee', employeeSchema);
