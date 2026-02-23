const Garage = require('../models/Garage');

// Generate unique 9-digit garageId: starts with "66", no digit "0", no repeats
const generateGarageId = async () => {
    const digits = '123456789'; // no 0
    // already fixed: '6','6' — need 7 more unique digits
    const generate = () => {
        let chars = ['6', '6'];
        const used = new Set(['6']);       // '6' is already used twice but we allow it
        const pool = digits.split('');
        const available = pool.filter(d => d !== '6'); // remaining after '6'

        // Pick 7 more chars from digits (can repeat, just no 0; no-repeat per spec like bookingId)
        // Using same approach as bookingId: no repeating chars
        // But we need 7 unique from "123456789" minus '6' that we already have
        // pool has 8 remaining digits (1,2,3,4,5,7,8,9)
        const shuffled = available.sort(() => Math.random() - 0.5);
        for (let i = 0; i < 7; i++) {
            chars.push(shuffled[i]);
        }
        // Shuffle positions 2..8 so it looks random
        const fixed = chars.slice(0, 2);
        const rest = chars.slice(2).sort(() => Math.random() - 0.5);
        return [...fixed, ...rest].join('');
    };

    let id;
    let exists = true;
    while (exists) {
        id = generate();
        exists = await Garage.findOne({ garageId: id });
    }
    return id;
};

// GET all garages
exports.getGarages = async (req, res) => {
    try {
        const garages = await Garage.find().sort({ createdAt: -1 });
        res.json({ success: true, data: garages });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST create garage
exports.createGarage = async (req, res) => {
    try {
        const garageId = await generateGarageId();
        const garage = await Garage.create({ ...req.body, garageId });
        res.status(201).json({ success: true, data: garage });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// PUT update garage
exports.updateGarage = async (req, res) => {
    try {
        const garage = await Garage.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!garage) return res.status(404).json({ success: false, message: 'Garage not found' });
        res.json({ success: true, data: garage });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// DELETE garage
exports.deleteGarage = async (req, res) => {
    try {
        const garage = await Garage.findByIdAndDelete(req.params.id);
        if (!garage) return res.status(404).json({ success: false, message: 'Garage not found' });
        res.json({ success: true, message: 'Garage deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
