const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    method: {
        type: String,
        required: true,
        enum: ['Cash', 'UPI', 'Card', 'Net Banking']
    },
    status: {
        type: String,
        default: 'Pending',
        enum: ['Pending', 'Completed', 'Failed', 'Refunded']
    },
    transactionId: {
        type: String
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Payment', PaymentSchema);
