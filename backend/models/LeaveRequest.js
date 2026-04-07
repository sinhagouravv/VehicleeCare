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
    type: {
        type: String,
        enum: ['Sick Leave', 'Casual Leave', 'Planned Leave', 'Emergency Leave'],
        required: true
    },
    startDate: {
        type: String, // YYYY-MM-DD
        required: true
    },
    endDate: {
        type: String, // YYYY-MM-DD
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
    totalDays: {
        type: Number,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('LeaveRequest', LeaveRequestSchema);
