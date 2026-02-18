const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    user: {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        email: { type: String },
        notes: { type: String }
    },
    vehicle: {
        year: { type: String, required: true },
        make: { type: String, required: true },
        model: { type: String, required: true },
        fuelType: { type: String, required: true },
        type: { type: String, required: true },
        transmission: { type: String, required: true },
        number: { type: String, required: true }
    },
    service: {
        title: { type: String, required: true },
        price: { type: String, required: true }
    },
    schedule: {
        date: { type: String, required: true },
        time: { type: String, required: true }
    },
    status: {
        type: String,
        default: 'Pending',
        enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled']
    }
}, { timestamps: true });

module.exports = mongoose.model('Booking', BookingSchema);
