const mongoose = require('mongoose');

// Import all models needed for global search
const User = require('../models/User');
const Booking = require('../models/Booking');
const Garage = require('../models/Garage');
const ChargingStation = require('../models/ChargingStation');
const Employee = require('../models/Employee');
const Payment = require('../models/Payment');
const Message = require('../models/Message');

// Hardcoded store locations since they are stored in JSON
// In this specific system, the Store page manages charging stations, which use the ChargingStation model.
// However, earlier in the code, `id` was used for charging stations.

exports.globalSearch = async (req, res) => {
    try {
        const query = req.query.q;
        if (!query || query.trim().length === 0) {
            return res.status(200).json({ success: true, data: [] });
        }

        const exactQuery = query.trim();
        const regexQuery = new RegExp(exactQuery, 'i'); // Case-insensitive matching

        let results = [];

        // 1. Search Users (userId, name, email)
        const users = await User.find({
            $or: [
                { userId: regexQuery },
                { name: regexQuery },
                { email: regexQuery }
            ]
        }).limit(5).select('userId name email role');

        users.forEach(u => {
            results.push({
                type: 'User',
                id: u.userId || u._id.toString(),
                name: u.name,
                subtitle: u.email,
                path: '/users'
            });
        });

        // 2. Search Bookings (bookingId)
        const bookings = await Booking.find({
            $or: [
                { bookingId: regexQuery },
                { "user.name": regexQuery },
                { "service.title": regexQuery }
            ]
        }).limit(5).select('bookingId user service status');

        bookings.forEach(b => {
            results.push({
                type: 'Booking',
                id: b.bookingId || b._id.toString().slice(0, 10),
                name: b.service?.title || 'Service',
                subtitle: b.user?.name || 'Unknown User',
                path: '/bookings'
            });
        });

        // 3. Search Garages (garageId, name)
        const garages = await Garage.find({
            $or: [
                { garageId: regexQuery },
                { name: regexQuery }
            ]
        }).limit(5).select('garageId name district state');

        garages.forEach(g => {
            results.push({
                type: 'Garage',
                id: g.garageId || g._id.toString(),
                name: g.name,
                subtitle: `${g.district}, ${g.state}`,
                path: '/garages'
            });
        });

        // 4. Search Charging Stations / Stores (id, name)
        const stations = await ChargingStation.find({
            $or: [
                { id: regexQuery },
                { name: regexQuery }
            ]
        }).limit(5).select('id name district state');

        stations.forEach(s => {
            results.push({
                type: 'Charging Station',
                id: s.id || s._id.toString(),
                name: s.name,
                subtitle: `${s.district}, ${s.state}`,
                path: '/charging-stations' // or /store
            });
        });

        // 5. Search Employees (employeeId, name, email)
        const employees = await Employee.find({
            $or: [
                { employeeId: regexQuery },
                { name: regexQuery },
                { email: regexQuery }
            ]
        }).limit(5).select('employeeId name role');

        employees.forEach(e => {
            results.push({
                type: 'Employee',
                id: e.employeeId || e._id.toString(),
                name: e.name,
                subtitle: e.role,
                path: '/employees'
            });
        });

        // 6. Search Payments (paymentId, transactionId)
        const payments = await Payment.find({
            $or: [
                { paymentId: regexQuery },
                { transactionId: regexQuery }
            ]
        }).limit(5).select('paymentId amount method status transactionId');

        payments.forEach(p => {
            results.push({
                type: 'Payment',
                id: p.paymentId || p.transactionId || p._id.toString(),
                name: `Rs. ${p.amount}`,
                subtitle: `${p.method} - ${p.status}`,
                path: '/payments'
            });
        });

        // 7. Search Messages (messageId, name, email)
        // Message schema doesn't have custom messageId normally, we check _id or custom ones if they exist
        // Since we may get a mongoose cast error converting strings to ObjectIds, we only check strings.
        const msgQuery = [
            { name: regexQuery },
            { email: regexQuery }
        ];
        // If the query looks like a valid ObjectId or a custom messageId
        msgQuery.push({ messageId: regexQuery });

        const messages = await Message.find({ $or: msgQuery })
            .limit(5).select('messageId name email type subject');

        messages.forEach(m => {
            results.push({
                type: 'Message',
                id: m.messageId || m._id.toString().slice(0, 10),
                name: m.name,
                subtitle: m.type || 'website',
                path: '/messages'
            });
        });

        // Sort results to prioritize exact ID matches
        results.sort((a, b) => {
            if (a.id.toLowerCase() === exactQuery.toLowerCase()) return -1;
            if (b.id.toLowerCase() === exactQuery.toLowerCase()) return 1;
            return 0;
        });

        // Take top 10 results overall
        res.status(200).json({
            success: true,
            data: results.slice(0, 10)
        });

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ success: false, message: 'Server search error' });
    }
};
