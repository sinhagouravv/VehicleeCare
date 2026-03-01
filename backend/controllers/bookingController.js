const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const UserNotification = require('../models/UserNotification');
const { createAdminNotification } = require('./notificationController');
const { generatePaymentId } = require('../utils/generateId');

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Public
exports.createBooking = async (req, res) => {
    try {
        const { user, vehicle, service, schedule, garage, paymentMethod } = req.body;

        // Basic validation
        if (!user || !vehicle || !service || !schedule) {
            return res.status(400).json({ success: false, message: 'All booking fields are required' });
        }
        if (!user.name || (!user.phone && !user.notes)) {
            // Allow missing phone — not a hard block
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

        const isFullOnline = paymentMethod === 'netbanking';
        const isCODAdvance = !isFullOnline && req.body.paymentId && req.body.paymentId !== 'CASH';

        const totalPrice = parseFloat(String(service.price ?? '0').replace(/[^\d.]/g, '')) || 0;
        const advancePaid = Math.round(totalPrice * 0.25);

        const newBooking = new Booking({
            bookingId: generatedId,
            user: { ...user, id: user.id || user._id },
            vehicle,
            service,
            schedule,
            garage,
            payment: {
                method: isFullOnline ? 'Net Banking' : isCODAdvance ? 'Cash on Delivery' : 'Cash',
                status: isFullOnline ? 'Completed' : isCODAdvance ? 'Partially Paid' : 'Pending',
                amount: isFullOnline ? totalPrice : isCODAdvance ? advancePaid : totalPrice,
                transactionId: req.body.paymentId || `TXN${Date.now()}`
            }
        });

        const savedBooking = await newBooking.save();
        let paymentRecord = null;

        // Create Universal Payment tracking record for all checkout methods
        if (user.id) {
            paymentRecord = await Payment.create({
                paymentId: generatePaymentId(),
                type: 'Booking',
                user: user.id,
                booking: savedBooking._id,
                amount: savedBooking.payment.amount,
                method: savedBooking.payment.method === 'Cash on Delivery' ? 'Cash' : 'Net Banking',
                status: savedBooking.payment.status,
                transactionId: savedBooking.payment.transactionId
            });
        }



        // Fire admin notification
        createAdminNotification({
            eventType: 'booking_created',
            title: 'New Booking Received',
            message: `${user.name || 'A user'} booked ${service.title || 'a service'} for ${vehicle.make} ${vehicle.model} on ${schedule.date}.`,
            meta: { bookingId: savedBooking.bookingId, userId: user.id, service: service.title, vehicle: `${vehicle.make} ${vehicle.model}` }
        });

        // Fire user notification if logged in
        if (user.id) {
            await UserNotification.create({
                userId: user.id,
                title: 'Booking Confirmed',
                message: `Your booking for ${vehicle.make} ${vehicle.model} on ${schedule.date} is confirmed!`,
                type: 'success'
            });
        }

        res.status(201).json({
            success: true,
            data: savedBooking,
            paymentId: paymentRecord ? paymentRecord.paymentId : null,
            message: 'Booking confirmed successfully'
        });
    } catch (error) {
        console.error('[Booking] Error creating booking:', error.message, error.stack);
        res.status(500).json({
            success: false,
            message: error.message || 'Server Error: Unable to create booking'
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
