const mongoose = require('mongoose');

const IdCardRequestSchema = new mongoose.Schema({
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
    purpose: {
        type: String,
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
    employeeRemark: {
        type: String,
        required: false
    },
    garageId: {
        type: String,
        required: true
    },
    appointmentDate: {
        type: String,
        required: false,
        default: ''
    },
    appointmentTime: {
        type: String,
        required: false,
        default: ''
    },
    meetingId: {
        type: String,
        required: false
    },
    approvedBy: {
        type: String,
        default: ''
    },
    approvedById: {
        type: String,
        default: ''
    },
    approvedByRole: {
        type: String,
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('IdCardRequest', IdCardRequestSchema);
