const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Public
exports.createBooking = async (req, res) => {
    try {
        const { user, vehicle, service, schedule, paymentMethod } = req.body;

        // Basic validation
        if (!user || !vehicle || !service || !schedule) {
            return res.status(400).json({ message: 'All booking fields are required' });
        }

        // Create Booking
        const isOnlinePayment = paymentMethod === 'netbanking' || (req.body.paymentId && req.body.paymentId !== 'CASH');

        const newBooking = new Booking({
            user: { ...user, id: user.id || user._id },
            vehicle,
            service,
            schedule,
            payment: {
                method: isOnlinePayment ? 'Razorpay' : 'Cash',
                status: isOnlinePayment ? 'Completed' : 'Pending',
                amount: parseFloat(service.price.replace(/[^\d.]/g, '')) || 0,
                transactionId: req.body.paymentId || `TXN${Date.now()}`
            }
        });

        const savedBooking = await newBooking.save();

        // If payment is online (Razorpay), create Payment record
        if (isOnlinePayment && user.id) {
            await Payment.create({
                user: user.id,
                booking: savedBooking._id,
                amount: savedBooking.payment.amount,
                method: 'Razorpay',
                status: 'Completed',
                transactionId: savedBooking.payment.transactionId
            });
        }

        // Create Notification (if user is logged in)
        if (user.id) {
            await Notification.create({
                user: user.id,
                message: `Booking Confirmed for ${vehicle.make} ${vehicle.model} on ${schedule.date}`,
                type: 'success'
            });
        }

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

// @desc    Get user bookings
// @route   GET /api/bookings/user/:userId
exports.getUserBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ 'user.id': req.params.userId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: bookings.length, data: bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};
