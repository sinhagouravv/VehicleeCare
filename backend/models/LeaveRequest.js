const mongoose = require('mongoose');

const LeaveRequestSchema = new mongoose.Schema({
    employeeId: {
        type: String, // String ID (EMP-...) or ObjectId
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
    type: {
        type: String,
        enum: ['Sick Leave', 'Casual Leave', 'Planned Leave', 'Emergency Leave'],
        required: true
    },
    leaveTime: {
        type: String,
        enum: ['Full Day', 'Half Day'],
        default: 'Full Day'
    },
    startDate: {
        type: String, // YYYY-MM-DD
        required: true
    },
    startTime: {
        type: String, // HH:mm
        required: false // Optional for older records
    },
    endDate: {
        type: String, // YYYY-MM-DD
        required: true
    },
    endTime: {
        type: String, // HH:mm
        required: false // Optional for older records
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
    totalDays: {
        type: Number,
        required: true
    },
    leaveId: {
        type: String,
        required: true,
        unique: true
    },
    garageId: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('LeaveRequest', LeaveRequestSchema);
