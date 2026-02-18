const mongoose = require('mongoose');

const PetrolCarSchema = new mongoose.Schema({
    brand: {
        type: String,
        required: true,
        unique: true
    },
    models: {
        type: [String], // Array of strings for car models
        default: []
    }
}, { timestamps: true });

module.exports = mongoose.model('PetrolCar', PetrolCarSchema);
