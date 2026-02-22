const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const { createAdminNotification } = require('./notificationController');

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Public
exports.createBooking = async (req, res) => {
    try {
        const { user, vehicle, service, schedule, garage, paymentMethod } = req.body;

        // Basic validation
        if (!user || !vehicle || !service || !schedule) {
            return res.status(400).json({ message: 'All booking fields are required' });
        }

        // Create Booking
        const isOnlinePayment = paymentMethod === 'netbanking' || (req.body.paymentId && req.body.paymentId !== 'CASH');

        // Generate custom Booking ID
        // Rules:
        // 1. Starts with "64"
        // 2. Length is 7 characters
        // 3. No "0" allowed
        // 4. No repeating characters
        // 5. Exactly 2 alphabets

        let generatedId;
        let isUnique = false;

        const generateCustomBookingId = () => {
            const digits = "1235789"; // no 0, no 6, no 4 (since 6 and 4 are used)
            const alphabets = "ABCDEFGHJKLMNPQRSTUVWXYZ";

            let idChars = ['6', '4'];
            let used = new Set(['6', '4']);

            const getRandomChar = (options) => {
                let char;
                do {
                    char = options[Math.floor(Math.random() * options.length)];
                } while (used.has(char));
                used.add(char);
                return char;
            };

            // 7 chars total, so we need 5 more: 2 alphabets, 3 digits
            idChars.push(getRandomChar(digits));
            idChars.push(getRandomChar(alphabets));
            idChars.push(getRandomChar(alphabets));
            idChars.push(getRandomChar(digits));
            idChars.push(getRandomChar(digits));

            return idChars.join('');
        };

        while (!isUnique) {
            generatedId = generateCustomBookingId();
            const existingId = await Booking.findOne({ bookingId: generatedId });
            if (!existingId) {
                isUnique = true;
            }
        }

        const newBooking = new Booking({
            bookingId: generatedId,
            user: { ...user, id: user.id || user._id },
            vehicle,
            service,
            schedule,
            garage,
            payment: {
                method: isOnlinePayment ? 'Net Banking' : 'Cash',
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
                method: 'Net Banking',
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

        // Fire admin notification
        createAdminNotification({
            eventType: 'booking_created',
            title: 'New Booking Received',
            message: `${user.name || 'A user'} booked ${service.title || 'a service'} for ${vehicle.make} ${vehicle.model} on ${schedule.date}.`,
            meta: { bookingId: savedBooking.bookingId, userId: user.id, service: service.title, vehicle: `${vehicle.make} ${vehicle.model}` }
        });

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

// @desc    Delete a booking
// @route   DELETE /api/bookings/:id
// @access  Private
exports.deleteBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }
        await booking.deleteOne();
        res.status(200).json({ success: true, message: 'Booking deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};
