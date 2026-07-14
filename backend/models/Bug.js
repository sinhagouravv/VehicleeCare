const mongoose = require('mongoose');

const BugSchema = new mongoose.Schema({
    bugId: {
        type: String,
        required: true,
        unique: true
    },
    reporterId: {
        type: String,
        required: true
    },
    reporterName: {
        type: String,
        required: true
    },
    portal: {
        type: String,
        enum: ['garage', 'employee', 'admin', 'app', 'customer app', 'business', 'frontend'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    severity: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical'],
        default: 'Medium'
    },
    status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Resolved'],
        default: 'Pending'
    }
}, { timestamps: true });

module.exports = mongoose.model('Bug', BugSchema);
