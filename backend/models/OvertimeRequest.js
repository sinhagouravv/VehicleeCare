const mongoose = require('mongoose');

const OvertimeRequestSchema = new mongoose.Schema({
    employeeId: {
        type: String,
        required: true
    },
    employeeName: {
        type: String,
        required: true
    },
    employeePhone: {
        type: String,
        required: false
    },
    employeeEmail: {
        type: String,
        required: false
    },
    date: {
        type: String, // DD-MM-YYYY
        required: true
    },
    hours: {
        type: Number,
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    remarks: {
        type: String,
        required: false
    },
    garageId: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('OvertimeRequest', OvertimeRequestSchema);
