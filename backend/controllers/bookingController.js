const Booking = require('../models/Booking');

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Public
exports.createBooking = async (req, res) => {
    try {
        const { user, vehicle, service, schedule } = req.body;

        // Basic validation
        if (!user || !vehicle || !service || !schedule) {
            return res.status(400).json({ message: 'All booking fields are required' });
        }

        const newBooking = new Booking({
            user,
            vehicle,
            service,
            schedule
        });

        const savedBooking = await newBooking.save();

        res.status(201).json({
            success: true,
            data: savedBooking,
            message: 'Booking confirmed successfully'
        });
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error: Unable to create booking',
            error: error.message
        });
    }
};

// @desc    Get all bookings (Admin use)
// @route   GET /api/bookings
// @access  Private (TODO: Add auth middleware)
exports.getBookings = async (req, res) => {
    try {
        const bookings = await Booking.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: bookings.length, data: bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};
