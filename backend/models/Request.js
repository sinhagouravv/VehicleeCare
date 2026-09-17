const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
    requestId: {
        type: String,
        required: true,
        unique: true
    },
    displayId: {
        type: String
    },
    employeeId: {
        type: String,
        required: true
    },
    portal: {
        type: String,
        enum: ['EMPLOYEE', 'GARAGE', 'USER', 'ADMIN', 'Employee', 'Garage', 'User', 'Admin'],
        default: 'EMPLOYEE'
    },
    name: {
        type: String,
        default: ''
    },
    reason: {
        type: String,
        required: true
    },
    explanation: {
        type: String,
        default: ''
    },
    description: {
        type: String,
        default: ''
    },
    tentativeTime: {
        type: String,
        default: '1 Week'
    },
    status: {
        type: String,
        default: 'Pending'
    },
    remark: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

requestSchema.index({ employeeId: 1, portal: 1, createdAt: -1 });

module.exports = mongoose.model('Request', requestSchema);
