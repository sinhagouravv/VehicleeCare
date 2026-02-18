const mongoose = require('mongoose');

const DieselCarSchema = new mongoose.Schema({
    brand: {
        type: String,
        required: true,
        unique: true
    },
    models: {
        type: [String],
        default: []
    }
}, { timestamps: true });

module.exports = mongoose.model('DieselCar', DieselCarSchema);
