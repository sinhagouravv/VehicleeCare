const ChargingStation = require('../models/ChargingStation');

// Get all charging stations
exports.getStations = async (req, res) => {
    try {
        const stations = await ChargingStation.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: stations.length, data: stations });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error fetching stations.' });
    }
};

// Create a new charging station
exports.createStation = async (req, res) => {
    try {
        const newStation = await ChargingStation.create(req.body);
        res.status(201).json({ success: true, data: newStation });
    } catch (err) {
        if (err.name === 'MongoServerError' && err.code === 11000) {
            return res.status(400).json({ success: false, message: 'Station ID already exists.' });
        }
        res.status(500).json({ success: false, message: 'Server error creating station.', error: err.message });
    }
};

// Update an existing charging station
exports.updateStation = async (req, res) => {
    try {
        const station = await ChargingStation.findOneAndUpdate({ id: req.params.id }, req.body, { new: true, runValidators: true });
        if (!station) {
            return res.status(404).json({ success: false, message: 'Station not found.' });
        }
        res.status(200).json({ success: true, data: station });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error updating station.', error: err.message });
    }
};

// Delete a charging station
exports.deleteStation = async (req, res) => {
    try {
        const station = await ChargingStation.findOneAndDelete({ id: req.params.id });
        if (!station) {
            return res.status(404).json({ success: false, message: 'Station not found.' });
        }
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error deleting station.' });
    }
};
