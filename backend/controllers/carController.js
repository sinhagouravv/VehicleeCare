const PetrolCar = require('../models/PetrolCar');
const DieselCar = require('../models/DieselCar');
const EVCar = require('../models/EVCar');

// @desc    Get cars by fuel type
// @route   GET /api/cars/:type
// @access  Public
exports.getCarsByType = async (req, res) => {
    try {
        const { type } = req.params;
        let cars = [];

        switch (type.toLowerCase()) {
            case 'petrol':
                cars = await PetrolCar.find({}, { brand: 1, models: 1 }).sort({ brand: 1 });
                break;
            case 'diesel':
                cars = await DieselCar.find({}, { brand: 1, models: 1 }).sort({ brand: 1 });
                break;
            case 'ev':
                cars = await EVCar.find({}, { brand: 1, models: 1 }).sort({ brand: 1 });
                break;
            case 'premium':
                return res.status(200).json({ success: true, data: [], message: 'Premium service coming soon' });
            default:
                return res.status(400).json({ success: false, message: 'Invalid fuel type' });
        }

        res.status(200).json({ success: true, count: cars.length, data: cars });
    } catch (error) {
        console.error('Error fetching cars:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};
