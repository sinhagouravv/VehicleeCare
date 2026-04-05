const mongoose = require('mongoose');

// Import all models needed for global search
const User = require('../models/User');
const Booking = require('../models/Booking');
const Garage = require('../models/Garage');
const ChargingStation = require('../models/ChargingStation');
const Employee = require('../models/Employee');
const Payment = require('../models/Payment');
const Message = require('../models/Message');
const Attendance = require('../models/Attendance');

// Hardcoded store locations since they are stored in JSON
// In this specific system, the Store page manages charging stations, which use the ChargingStation model.
// However, earlier in the code, `id` was used for charging stations.

exports.globalSearch = async (req, res) => {
    try {
        const query = req.query.q;
        const portal = req.query.portal || 'admin';
        const empId = req.query.empId; // MongoDB _id of the employee
        const garageId = req.query.garageId; // MongoDB _id of the garage

        if (!query || query.trim().length === 0) {
            return res.status(200).json({ success: true, data: [] });
        }

        const exactQuery = query.trim();
        const regexQuery = new RegExp(exactQuery, 'i'); // Case-insensitive matching

        let results = [];

        // 1. Search Users (userId, name, email) - ONLY for Admin
        if (portal === 'admin') {
            const users = await User.find({
                $or: [
                    { userId: regexQuery },
                    { name: regexQuery },
                    { email: regexQuery },
                    { phone: regexQuery }
                ]
            }).limit(5).select('userId name email role phone');

            users.forEach(u => {
                results.push({
                    type: 'User',
                    id: u.userId || u._id.toString(),
                    name: u.name,
                    subtitle: u.email,
                    path: '/users'
                });
            });
        }

        // 2. Search Bookings (bookingId, user name, service title)
        let bookingFilter = {
            $or: [
                { bookingId: regexQuery },
                { "user.name": regexQuery },
                { "user.phone": regexQuery },
                { "service.title": regexQuery }
            ]
        };

        // If employee portal, only show bookings assigned to this employee
        if (portal === 'employee' && empId) {
            bookingFilter = {
                $and: [
                    { 
                        $or: [
                            { "assignedEmployees.technician.id": empId },
                            { "assignedEmployees.support.id": empId }
                        ]
                    },
                    bookingFilter
                ]
            };
        }

        // If garage portal, only show bookings assigned to this garage
        if (portal === 'garage' && garageId) {
            bookingFilter = {
                $and: [
                    { "garage.id": garageId },
                    bookingFilter
                ]
            };
        }

        const bookings = await Booking.find(bookingFilter)
            .limit(10)
            .select('bookingId user service status');

        bookings.forEach(b => {
            results.push({
                type: 'Booking',
                id: b.bookingId || b._id.toString(),
                name: b.service?.title || 'Service',
                subtitle: b.user?.name || 'Unknown User',
                path: portal === 'employee' ? '/tasks' : (portal === 'garage' ? '/my-bookings' : '/bookings')
            });
        });

        // Search Employees for Garage Portal
        if (portal === 'garage' && garageId) {
            const employees = await Employee.find({
                $and: [
                    { garageId: garageId },
                    {
                        $or: [
                            { employeeId: regexQuery },
                            { name: regexQuery },
                            { email: regexQuery },
                            { phone: regexQuery }
                        ]
                    }
                ]
            }).limit(5).select('employeeId name role phone');

            employees.forEach(e => {
                results.push({
                    type: 'Employee',
                    id: e.employeeId || e._id.toString(),
                    name: e.name,
                    subtitle: e.role,
                    path: '/staff'
                });
            });

            // 6. Search Customers (via User model connected to garage bookings)
            const users = await User.find({
                $or: [
                    { userId: regexQuery },
                    { name: regexQuery },
                    { email: regexQuery },
                    { phone: regexQuery }
                ]
            }).limit(10).select('userId name email phone');

            users.forEach(u => {
                results.push({
                    type: 'Customer',
                    id: u.userId || u._id.toString(),
                    name: u.name,
                    subtitle: u.email,
                    path: '/customers'
                });
            });

            // 7. Search Payments for this Garage
            const payments = await Payment.find({
                $and: [
                    { garageId: garageId },
                    {
                        $or: [
                            { paymentId: regexQuery },
                            { transactionId: regexQuery }
                        ]
                    }
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

            // 8. Search Vehicles for this Garage
            const vehicles = await Booking.find({
                $and: [
                    { "garage.id": garageId },
                    {
                        $or: [
                            { "vehicle.number": regexQuery },
                            { "vehicle.make": regexQuery },
                            { "vehicle.model": regexQuery }
                        ]
                    }
                ]
            }).limit(5).select('vehicle bookingId');

            vehicles.forEach(v => {
                if (v.vehicle) {
                    results.push({
                        type: 'Vehicle',
                        id: v.vehicle.number || v.vehicle.id || v._id.toString(),
                        name: `${v.vehicle.make} ${v.vehicle.model}`,
                        subtitle: v.vehicle.number || 'Plate Pending',
                        path: '/vehicles'
                    });
                }
            });

            // 9. Search Staff on Leave (via Attendance)
            const attendance = await Attendance.find({
                $and: [
                    { garageId: garageId },
                    { status: 'On Leave' },
                    {
                        $or: [
                            { employeeName: regexQuery },
                            { employeeId: regexQuery }
                        ]
                    }
                ]
            }).limit(5);

            attendance.forEach(a => {
                results.push({
                    type: 'Leave',
                    id: a.employeeId,
                    name: a.employeeName,
                    subtitle: 'Currently on Leave',
                    path: '/attendance'
                });
            });
        }

        // Common Search Logic for all portals (duplicated for scoping/clarity in this specific architecture)
        if (portal === 'admin') {
            // Include Vehicles for Admin
            const allVehicles = await Booking.find({
                $or: [
                    { "vehicle.number": regexQuery },
                    { "vehicle.make": regexQuery },
                    { "vehicle.model": regexQuery }
                ]
            }).limit(5).select('vehicle');

            allVehicles.forEach(v => {
                if (v.vehicle) {
                    results.push({
                        type: 'Vehicle',
                        id: v.vehicle.number || v.vehicle.id || v._id.toString(),
                        name: `${v.vehicle.make} ${v.vehicle.model}`,
                        subtitle: v.vehicle.number || 'Plate Pending',
                        path: '/vehicles'
                    });
                }
            });

            // Include Staff on Leave for Admin
            const allOnLeave = await Attendance.find({ status: 'On Leave' }).limit(5);
            allOnLeave.forEach(a => {
                results.push({
                    type: 'Leave',
                    id: a.employeeId,
                    name: a.employeeName,
                    subtitle: 'Currently on Leave',
                    path: '/attendance'
                });
            });
        }
        if (portal === 'admin') {
            // 3. Search Garages
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

            // 4. Search Charging Stations
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
                    path: '/charging-stations'
                });
            });

            // 5. Search Employees 
            const employees = await Employee.find({
                $or: [
                    { employeeId: regexQuery },
                    { name: regexQuery },
                    { email: regexQuery },
                    { phone: regexQuery }
                ]
            }).limit(5).select('employeeId name role phone');

            employees.forEach(e => {
                results.push({
                    type: 'Employee',
                    id: e.employeeId || e._id.toString(),
                    name: e.name,
                    subtitle: e.role,
                    path: '/employees'
                });
            });

            // 6. Search Payments
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

            // 7. Search Messages
            const messages = await Message.find({
                $or: [
                    { name: regexQuery },
                    { email: regexQuery },
                    { messageId: regexQuery }
                ]
            }).limit(5).select('messageId name email type subject');

            messages.forEach(m => {
                results.push({
                    type: 'Message',
                    id: m.messageId || m._id.toString().slice(0, 10),
                    name: m.name,
                    subtitle: m.type || 'website',
                    path: '/messages'
                });
            });
        }

        // Sort results to prioritize exact ID matches
        results.sort((a, b) => {
            if (a.id.toLowerCase() === exactQuery.toLowerCase()) return -1;
            if (b.id.toLowerCase() === exactQuery.toLowerCase()) return 1;
            return 0;
        });

        res.status(200).json({
            success: true,
            data: results.slice(0, 10)
        });

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ success: false, message: 'Server search error' });
    }
};
