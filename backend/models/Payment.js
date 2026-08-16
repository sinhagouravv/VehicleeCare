const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
    paymentId: {
        type: String,
        required: true,
        unique: true
    },
    type: {
        type: String,
        enum: ['Booking', 'Subscription'],
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    business: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Assuming Business is tracked under User with role or separate model? The current app uses User model with different fields, or Business is a separate portal. Wait, let me check. Let's make it flexible or just use `user`.
    },
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking'
    },
    garageId: {
        type: String
    },
    amount: {
        type: Number,
        required: true
    },
    method: {
        type: String,
        required: true,
        enum: ['Cash', 'UPI', 'Card', 'Net Banking', 'Cash on Delivery']
    },
    status: {
        type: String,
        default: 'Pending',
        enum: ['Pending', 'Completed', 'Failed', 'Refunded', 'Partially Paid']
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
