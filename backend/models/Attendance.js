const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    employeeId: {
        type: String,
        required: true,
        ref: 'Employee'
    },
    employeeName: {
        type: String,
        required: true
    },
    contact: {
        type: String,
        default: ''
    },
    email: {
        type: String,
        default: ''
    },
    role: {
        type: String,
        default: ''
    },
    shift: {
        type: String,
        default: 'Morning'
    },
    garageId: {
        type: String,
        required: true
    },
    date: {
        type: String, // YYYY-MM-DD — for easy daily querying
        required: true
    },
    checkIn: {
        type: Date,
        default: null
    },
    checkOut: {
        type: Date,
        default: null
    },
    status: {
        type: String,
        enum: ['Present', 'Late', 'Absent', 'On Leave', 'Overtime'],
        default: 'Present'
    }
}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
