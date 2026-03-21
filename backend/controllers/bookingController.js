const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const User = require('../models/User');
const UserNotification = require('../models/UserNotification');
const Employee = require('../models/Employee');
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

        // --- Auto Employee Assignment Logic ---
        // Determine Shift: 9am-3pm (Morning), 3pm-9pm (Evening)
        let shift = 'Morning';
        if (schedule.time) {
            const timeStr = String(schedule.time).toLowerCase();
            // Regex to find the first occurrence of a number (hour) and am/pm
            const match = timeStr.match(/(\d+)(?::\d+)?\s*(am|pm)/);
            
            if (match) {
                let hour = parseInt(match[1]);
                const period = match[2];

                if (period === 'pm' && hour !== 12) hour += 12;
                if (period === 'am' && hour === 12) hour = 0;

                // Evening: 3 PM (15:00) to 9 PM (21:00)
                if (hour >= 15 && hour < 21) {
                    shift = 'Evening';
                } else {
                    shift = 'Morning';
                }
            } else {
                // Check if it's a fixed slot string like "9am-3pm"
                if (timeStr.includes('evening') || timeStr.includes('3pm')) {
                    shift = 'Evening';
                } else {
                    shift = 'Morning';
                }
            }
        }


        // Find available employees (Technician and Support) for the shift
        const garageId = garage?.id ? String(garage.id).trim() : null;
        
        // Fetch all verified employees for this specific garage
        // We filter by shift in-memory so Mongoose defaults are applied to records missing explicit shift fields
        const allEmployees = await Employee.find({ garageId, isVerified: true });

        const technicians = allEmployees.filter(e => 
            e.shift === shift && /^Technician$/i.test(e.role)
        );
        
        const supportStaff = allEmployees.filter(e => 
            e.shift === shift && /^Support$/i.test(e.role)
        );

        console.log(`[Assignment] Garage: ${garageId}, Shift: ${shift}, Found: Techs(${technicians.length}), Support(${supportStaff.length})`);


        const assignedEmployees = {
            technician: null,
            support: null
        };

        if (technicians.length > 0) {
            const tech = technicians[Math.floor(Math.random() * technicians.length)];
            assignedEmployees.technician = {
                id: tech._id,
                employeeId: tech.employeeId,
                name: tech.name
            };
        }

        if (supportStaff.length > 0) {
            const supp = supportStaff[Math.floor(Math.random() * supportStaff.length)];
            assignedEmployees.support = {
                id: supp._id,
                employeeId: supp.employeeId,
                name: supp.name
            };
        }

        // ----------------------------------------

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

        const payId = generatePaymentId();

        const newBooking = new Booking({
            bookingId: generatedId,
            user: { ...user, id: user.id || user._id },
            vehicle,
            service: {
                id: service.id,
                title: service.title,
                price: service.price
            },
            schedule,
            garage,
            payment: {
                method: isFullOnline ? 'Net Banking' : isCODAdvance ? 'Cash on Delivery' : 'Cash',
                status: isFullOnline ? 'Completed' : isCODAdvance ? 'Partially Paid' : 'Pending',
                amount: isFullOnline ? totalPrice : isCODAdvance ? advancePaid : totalPrice,
                transactionId: req.body.paymentId || `TXN${Date.now()}`,
                paymentId: payId
            },
            assignedEmployees
        });

        newBooking.markModified('assignedEmployees');
        const savedBooking = await newBooking.save();
        let paymentRecord = null;

        // Create Universal Payment tracking record for all checkout methods
        if (user.id) {
            paymentRecord = await Payment.create({
                paymentId: savedBooking.payment.paymentId,
                type: 'Booking',
                user: user.id,
                booking: savedBooking._id,
                garageId: garage?.id || null,
                amount: savedBooking.payment.amount,
                method: savedBooking.payment.method === 'Cash on Delivery' ? 'Cash' : 'Net Banking',
                status: savedBooking.payment.status,
                transactionId: savedBooking.payment.transactionId
            });
        }



        // Fetch full user to get custom userId (65...)
        const fullUser = user.id ? await User.findById(user.id) : null;
        const displayUserId = fullUser?.userId || user.userId || 'GUEST';

        // Fire admin notification
        createAdminNotification({
            eventType: 'booking_created',
            title: 'New Booking Received',
            message: `Booked ${service.title || 'a service'} for ${vehicle.make} ${vehicle.model} on ${schedule.date}.`,
            meta: { 
                bookingId: savedBooking.bookingId, 
                userId: savedBooking.user.id, 
                userName: savedBooking.user.name,
                displayUserId, // This will be the 65... ID
                service: service.title, 
                vehicle: `${vehicle.make} ${vehicle.model}` 
            }
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
        const bookings = await Booking.find().sort({ createdAt: -1 }).lean();
        
        // Populate missing paymentId for existing bookings
        const enrichedBookings = await Promise.all(bookings.map(async (booking) => {
            if (!booking.payment?.paymentId) {
                const payment = await Payment.findOne({ booking: booking._id });
                if (payment) {
                    if (!booking.payment) booking.payment = {};
                    booking.payment.paymentId = payment.paymentId;
                }
            }
            return booking;
        }));

        res.status(200).json({ success: true, count: enrichedBookings.length, data: enrichedBookings });
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

// @desc    Get garage bookings
// @route   GET /api/bookings/garage/:garageId
exports.getGarageBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ 'garage.id': req.params.garageId }).sort({ createdAt: -1 }).lean();
        
        // Populate missing paymentId for existing bookings
        const enrichedBookings = await Promise.all(bookings.map(async (booking) => {
            if (!booking.payment?.paymentId) {
                const payment = await Payment.findOne({ booking: booking._id });
                if (payment) {
                    if (!booking.payment) booking.payment = {};
                    booking.payment.paymentId = payment.paymentId;
                }
            }
            return booking;
        }));

        res.status(200).json({ success: true, count: enrichedBookings.length, data: enrichedBookings });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
// @access  Private
exports.updateBookingStatus = async (req, res) => {
    try {
        const { status, isPickedUp, isDelivered } = req.body;
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        if (status) booking.status = status;
        if (isPickedUp !== undefined) booking.isPickedUp = isPickedUp;
        if (isDelivered !== undefined) booking.isDelivered = isDelivered;

        await booking.save();
        res.status(200).json({ success: true, data: booking });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Get bookings for a specific employee
// @route   GET /api/bookings/employee/:employeeId
// @access  Private
exports.getEmployeeBookings = async (req, res) => {
    try {
        const { employeeId } = req.params;
        // Search in both technician and support IDs
        const bookings = await Booking.find({
            $or: [
                { 'assignedEmployees.technician.id': employeeId },
                { 'assignedEmployees.support.id': employeeId }
            ]
        }).sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: bookings });
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
