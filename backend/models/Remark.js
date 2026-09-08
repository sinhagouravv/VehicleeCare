const mongoose = require('mongoose');

const RemarkSchema = new mongoose.Schema({
    remarkId: {
        type: String,
        required: true,
        unique: true
    },
    referenceId: {
        type: String,
        required: true
    },
    bookingId: {
        type: String
    },
    bookingMongoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking'
    },
    reporterId: {
        type: String,
        default: 'EMPLOYEE'
    },
    reporterName: {
        type: String,
        default: 'Employee'
    },
    remarkerRole: {
        type: String,
        default: 'Technician'
    },
    remarkedRole: {
        type: String,
        default: 'Customer'
    },
    role: {
        type: String,
        default: 'Customer'
    },
    customerDetails: {
        type: String,
        default: '—'
    },
    remark: {
        type: String,
        required: true
    },
    status: {
        type: String,
        default: 'Pending'
    }
}, { timestamps: true });

module.exports = mongoose.model('Remark', RemarkSchema);
