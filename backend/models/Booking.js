const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    bookingId: { type: String },
    user: {
        id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        userId: { type: String },
        name: { type: String },
        phone: { type: String },
        email: { type: String },
        notes: { type: String }
    },
    payment: {
        method: { type: String },
        status: { type: String, default: 'Pending' },
        transactionId: { type: String },
        paymentId: { type: String },
        amount: { type: Number }
    },
    vehicle: {
        year: { type: String },
        make: { type: String },
        model: { type: String },
        fuelType: { type: String },
        type: { type: String },
        transmission: { type: String },
        number: { type: String }
    },
    service: {
        title: { type: String },
        price: { type: String }
    },
    schedule: {
        date: { type: String },
        time: { type: String }
    },
    garage: {
        id: { type: String },
        name: { type: String },
        state: { type: String },
        district: { type: String },
        pickupDrop: { type: String }
    },
    status: {
        type: String,
        default: 'Pending',
        enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled']
    }
}, { timestamps: true });

module.exports = mongoose.model('Booking', BookingSchema);
