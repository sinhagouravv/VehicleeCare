const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const User = require('../models/User');
const UserNotification = require('../models/UserNotification');
const Employee = require('../models/Employee');
const { createAdminNotification } = require('./notificationController');
const { generatePaymentId } = require('../utils/generateId');
const nodemailer = require('nodemailer');

// ── Mailer Setup ────────────────────────────────────────────
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

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

        // Look up the garage's Admin employee
        const garageAdminForNotif = await Employee.findOne({ garageId: String(garage?.id || '').trim(), role: 'Admin', isVerified: true });

        // Fire admin notification
        createAdminNotification({
            eventType: 'booking_created',
            title: 'New Booking Received',
            message: `Booked ${service.title || 'a service'} for ${vehicle.make} ${vehicle.model} on ${schedule.date}.`,
            meta: { 
                bookingId: savedBooking.bookingId, 
                userId: savedBooking.user.id, 
                userName: savedBooking.user.name,
                displayUserId,
                service: service.title, 
                vehicle: `${vehicle.make} ${vehicle.model}`,
                garageId: garage?.id || null,
                assignedEmployees: savedBooking.assignedEmployees,
                adminName: garageAdminForNotif ? garageAdminForNotif.name : 'ADMIN',
                adminEmpId: garageAdminForNotif ? garageAdminForNotif.employeeId : 'SYSTEM'
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
        const bookings = await Booking.find({ 'garage.id': req.params.garageId })
            .populate('assignedEmployees.technician.id', 'role')
            .populate('assignedEmployees.mechanic.id', 'role')
            .sort({ createdAt: -1 })
            .lean();
        
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

const autoAssignMechanic = async (booking) => {
    if (!booking.assignedEmployees) booking.assignedEmployees = {};
    if (!booking.assignedEmployees.mechanic || !booking.assignedEmployees.mechanic.id) {
        const garageId = booking.garage?.id ? String(booking.garage.id).trim() : null;
        const mechanics = await Employee.find({ garageId, isVerified: true, role: 'Mechanic' });
        if (mechanics.length > 0) {
            const mech = mechanics[Math.floor(Math.random() * mechanics.length)];
            booking.assignedEmployees.mechanic = {
                id: mech._id,
                employeeId: mech.employeeId,
                name: mech.name
            };
            booking.markModified('assignedEmployees');

            // Notify the mechanic
            const garageAdminForMechNotif = await Employee.findOne({ garageId: String(booking.garage?.id || '').trim(), role: 'Admin', isVerified: true });
            createAdminNotification({
                eventType: 'booking_created',
                title: 'New Mechanic Assignment',
                message: `You have been assigned as Mechanic for ${booking.vehicle?.make} ${booking.vehicle?.model}.`,
                meta: {
                    bookingId: booking.bookingId,
                    userId: booking.user?.id,
                    userName: booking.user?.name,
                    service: booking.service?.title,
                    vehicle: `${booking.vehicle?.make} ${booking.vehicle?.model}`,
                    garageId: booking.garage?.id,
                    assignedEmployees: booking.assignedEmployees,
                    adminName: garageAdminForMechNotif ? garageAdminForMechNotif.name : 'ADMIN',
                    adminEmpId: garageAdminForMechNotif ? garageAdminForMechNotif.employeeId : 'SYSTEM'
                }
            });
        }
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

        if (status === 'In Service' && booking.status !== 'In Service') {
            await autoAssignMechanic(booking);
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
        const mongoose = require('mongoose');
        
        // Build query to search in technician, support, and mechanic fields
        const query = mongoose.Types.ObjectId.isValid(employeeId)
            ? {
                $or: [
                    { 'assignedEmployees.technician.id': employeeId },
                    { 'assignedEmployees.technician.employeeId': employeeId },
                    { 'assignedEmployees.support.id': employeeId },
                    { 'assignedEmployees.support.employeeId': employeeId },
                    { 'assignedEmployees.mechanic.id': employeeId },
                    { 'assignedEmployees.mechanic.employeeId': employeeId }
                ]
              }
            : {
                $or: [
                    { 'assignedEmployees.technician.employeeId': employeeId },
                    { 'assignedEmployees.support.employeeId': employeeId },
                    { 'assignedEmployees.mechanic.employeeId': employeeId }
                ]
              };

        // If employeeId is a valid MongoDB ObjectId, Mongoose handles it.
        // If it's a 9-digit string, it will match the .employeeId fields.
        
        let bookings = await Booking.find(query)
            .sort({ createdAt: -1 })
            .populate('assignedEmployees.technician.id', 'phone');

        bookings = bookings.map(b => {
            const booking = b.toObject();
            if (booking.assignedEmployees?.technician?.id) {
                booking.assignedEmployees.technician.phone = booking.assignedEmployees.technician.id.phone;
                booking.assignedEmployees.technician.id = booking.assignedEmployees.technician.id._id;
            }
            return booking;
        });

        res.status(200).json({ success: true, data: bookings });
    } catch (error) {
        console.error('[GetEmployeeBookings] Error:', error.stack || error);
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
// @desc    Send OTP for "In Service" transition
// @route   POST /api/bookings/:id/send-otp
// @access  Private
exports.sendInServiceOTP = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        booking.otp = otp;
        booking.otpExpires = Date.now() + 10 * 60 * 1000; // 10 mins
        await booking.save();

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: booking.user.email,
            subject: 'VehicleeCare - Service Verification OTP',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                    <h2 style="color: #011023; text-transform: uppercase; letter-spacing: 1px;">Service Verification</h2>
                    <p style="color: #64748b;">Your vehicle service for booking <strong>#${booking.bookingId}</strong> is about to start. Please provide the following OTP to the technician:</p>
                    <div style="background: #f8fafc; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #3b82f6;">${otp}</span>
                    </div>
                    <p style="font-size: 12px; color: #94a3b8;">This OTP is valid for 10 minutes. If you did not request this, please contact support.</p>
                </div>
            `
        };

        // Fire and forget email delivery for faster response
        transporter.sendMail(mailOptions).catch(err => {
            console.error("Delayed OTP email failure:", err);
        });

        // Return success immediately to UI
        res.status(200).json({ success: true, message: 'OTP sending initiated' });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Verify OTP and transition to "In Service"
// @route   POST /api/bookings/:id/verify-otp
// @access  Private
exports.verifyInServiceOTP = async (req, res) => {
    try {
        const { otp, duration } = req.body;
        const booking = await Booking.findById(req.params.id);

        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

        if (booking.otp !== otp || booking.otpExpires < Date.now()) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        booking.status = 'In Service';
        booking.serviceDuration = duration;
        booking.otp = undefined;
        booking.otpExpires = undefined;

        await autoAssignMechanic(booking);

        await booking.save();

        res.json({ success: true, message: 'Status updated to In Service', data: booking });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Send OTP for "Delivered" transition
// @route   POST /api/bookings/:id/send-delivery-otp
exports.sendDeliveryOTP = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        booking.otp = otp;
        booking.otpExpires = Date.now() + 10 * 60 * 1000; // 10 mins
        await booking.save();

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: booking.user.email,
            subject: 'VehicleeCare - Delivery Verification OTP',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                    <h2 style="color: #011023; text-transform: uppercase; letter-spacing: 1px;">Delivery Verification</h2>
                    <p style="color: #64748b;">Your vehicle for booking <strong>#${booking.bookingId}</strong> is ready for delivery. Please provide the following OTP to the technician to complete the handover:</p>
                    <div style="background: #f8fafc; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #10b981;">${otp}</span>
                    </div>
                    <p style="font-size: 12px; color: #94a3b8;">This OTP is valid for 10 minutes. If you did not request this, please contact support.</p>
                </div>
            `
        };

        // Fire and forget email delivery for faster response
        transporter.sendMail(mailOptions).catch(err => {
            console.error("Delayed delivery OTP email failure:", err);
        });

        // Return success immediately to UI
        res.status(200).json({ success: true, message: 'Delivery OTP sending initiated' });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Verify Delivery OTP and transition to "Delivered"
// @route   POST /api/bookings/:id/verify-delivery-otp
exports.verifyDeliveryOTP = async (req, res) => {
    try {
        const { otp } = req.body;
        const booking = await Booking.findById(req.params.id);

        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

        if (booking.otp !== otp || booking.otpExpires < Date.now()) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        booking.status = 'Delivered';
        booking.isDelivered = true;
        booking.otp = undefined;
        booking.otpExpires = undefined;
        await booking.save();

        res.json({ success: true, message: 'Status updated to Delivered', data: booking });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};
