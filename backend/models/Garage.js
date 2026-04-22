const mongoose = require('mongoose');

const GarageSchema = new mongoose.Schema({
    garageId: { type: String, unique: true },
    name: { type: String, required: true },
    state: { type: String },
    district: { type: String },
    address: { type: String },
    coordinates: { type: String },           // e.g. "30.7333, 76.7794"
    type: { type: [String] },          // e.g. ['Petrol', 'Diesel', 'EV']
    rating: { type: Number, default: null },
    partner: { type: Boolean, default: false },
    pickupDrop: { type: Boolean, default: false },
    ownerName: { type: String },
    ownerContact: { type: String },
    ownerEmail: { type: String },
    phone: { type: String },
    whatsapp: { type: String },
    workingHours: { type: String },
    workingDays: { type: String },
    services: { type: String },
    panCard: { type: String, default: '' },
    adharCard: { type: String, default: '' },
    voterId: { type: String, default: '' },
    password: { type: String },

    resetPasswordOtp: { type: String },
    resetPasswordExpires: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Garage', GarageSchema);
