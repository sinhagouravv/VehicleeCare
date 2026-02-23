const mongoose = require('mongoose');

const chargingStationSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    state: { type: String, required: true },
    district: { type: String, required: true },
    address: { type: String, required: true },
    coordinates: { type: String, required: true },
    ports: { type: Number, required: true, default: 1 },
    type: { type: [String], default: [] },
    status: { type: String, required: true, default: 'Operational' },
    ownerName: { type: String },
    ownerContact: { type: String },
    ownerEmail: { type: String }
}, {
    timestamps: true
});

module.exports = mongoose.model('ChargingStation', chargingStationSchema);
