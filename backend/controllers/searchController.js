const User = require('../models/User');
const Booking = require('../models/Booking');
const Garage = require('../models/Garage');
const ChargingStation = require('../models/ChargingStation');
const Employee = require('../models/Employee');
const Payment = require('../models/Payment');
const Message = require('../models/Message');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const Bug = require('../models/Bug');
const Remark = require('../models/Remark');
const Request = require('../models/Request');

/**
 * Helper to escape special regex characters safely
 */
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

/**
 * Helper to generate or format Document IDs for Employee/Garage documents
 */
function getOrGenerateDocId(entity, docKey) {
    if (entity[`${docKey}DocId`]) {
        return entity[`${docKey}DocId`].toUpperCase();
    }
    let hash = 0;
    const str = `${entity._id || ''}-${docKey}`;
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 31 + str.charCodeAt(i)) % 9000000;
    }
    const num = 1000000 + Math.abs(hash);
    return `D${num}`;
}

const DOC_DEFS = [
    { key: 'panCard', label: 'PAN Card' },
    { key: 'adharCard', label: 'Aadhar Card' },
    { key: 'voterId', label: 'Voter Card' },
    { key: 'drivingLicense', label: 'Driving License' },
    { key: 'agreement', label: 'Employment Agreement' },
    { key: 'signature', label: 'Signature' },
];

/**
 * Global Search Controller
 * Handles global search across models with portal-level scoping.
 */
exports.globalSearch = async (req, res) => {
    try {
        const query = req.query.q;
        const portal = req.query.portal || 'admin';
        const empId = req.query.empId;
        const garageId = req.query.garageId;

        if (!query || query.trim().length === 0) {
            return res.status(200).json({ success: true, data: [] });
        }

        const exactQuery = query.trim();
        const escaped = escapeRegex(exactQuery);
        // Match start of string, start of word (after whitespace/hyphen), or numeric boundary
        const regexQuery = new RegExp(`(^|\\b|\\s|-)${escaped}`, 'i');

        let results = [];

        // ==========================================
        // 1. ADMIN PORTAL SEARCH
        // ==========================================
        if (portal === 'admin') {
            const [
                users,
                bookings,
                garages,
                stations,
                employees,
                payments,
                messages,
                vehicles,
                leaveRequests,
                onLeaveStaff,
                bugs,
                remarks,
                requests,
                docEmployees,
                docGarages
            ] = await Promise.all([
                // Users
                User.find({ userId: regexQuery }).limit(50).select('userId name email role phone'),

                // Bookings
                Booking.find({ bookingId: regexQuery }).limit(50).select('bookingId user service status'),

                // Garages
                Garage.find({ garageId: regexQuery }).limit(50).select('garageId name district state'),

                // Charging Stations
                ChargingStation.find({ id: regexQuery }).limit(50).select('id name district state'),

                // Employees
                Employee.find({ employeeId: regexQuery }).limit(50).select('employeeId name role email phone'),

                // Payments
                Payment.find({ paymentId: regexQuery }).limit(50).select('paymentId amount method status'),

                // Messages
                Message.find({ messageId: regexQuery }).limit(50).select('messageId name email type subject'),

                // Vehicles
                Booking.find({ "vehicle.number": regexQuery }).limit(50).select('vehicle'),

                // Leave Requests
                LeaveRequest.find({
                    $or: [
                        { leaveId: regexQuery },
                        { employeeId: regexQuery }
                    ]
                }).limit(50).select('leaveId employeeName type status startDate endDate'),

                // Staff currently on leave
                Attendance.find({
                    $and: [
                        { status: 'On Leave' },
                        { employeeId: regexQuery }
                    ]
                }).limit(50).select('employeeId employeeName status'),

                // Bugs
                Bug.find({ bugId: regexQuery }).limit(50).select('bugId title status reporterName severity'),

                // Remarks
                Remark.find({
                    $or: [
                        { remarkId: regexQuery },
                        { referenceId: regexQuery },
                        { bookingId: regexQuery }
                    ]
                }).limit(50).select('remarkId referenceId bookingId remark reporterName status'),

                // Requests
                Request.find({
                    $or: [
                        { requestId: regexQuery },
                        { displayId: regexQuery },
                        { employeeId: regexQuery }
                    ]
                }).limit(50).select('requestId displayId employeeId name reason status'),

                // Employees for document checking
                Employee.find({
                    $or: [
                        { panCardDocId: regexQuery },
                        { adharCardDocId: regexQuery },
                        { voterIdDocId: regexQuery },
                        { drivingLicenseDocId: regexQuery },
                        { agreementDocId: regexQuery },
                        { signatureDocId: regexQuery },
                        { employeeId: regexQuery }
                    ]
                }).limit(50),

                // Garages for document checking
                Garage.find({
                    $or: [
                        { panCardDocId: regexQuery },
                        { adharCardDocId: regexQuery },
                        { voterIdDocId: regexQuery },
                        { drivingLicenseDocId: regexQuery },
                        { agreementDocId: regexQuery },
                        { signatureDocId: regexQuery },
                        { garageId: regexQuery }
                    ]
                }).limit(50)
            ]);

            // Transform Users
            users.forEach(u => {
                results.push({
                    type: 'User',
                    id: u.userId || u._id.toString(),
                    name: u.name || 'User',
                    subtitle: u.email || u.phone || 'User Record',
                    path: '/users'
                });
            });

            // Transform Bookings
            bookings.forEach(b => {
                results.push({
                    type: 'Booking',
                    id: b.bookingId || b._id.toString(),
                    name: b.service?.title || 'Service Booking',
                    subtitle: b.user?.name || 'Customer',
                    path: '/bookings'
                });
            });

            // Transform Garages
            garages.forEach(g => {
                results.push({
                    type: 'Garage',
                    id: g.garageId || g._id.toString(),
                    name: g.name || 'Garage',
                    subtitle: `${g.district || ''}, ${g.state || ''}`.replace(/^,\s*|,\s*$/g, '') || 'Garage Location',
                    path: '/garages'
                });
            });

            // Transform Charging Stations
            stations.forEach(s => {
                results.push({
                    type: 'Charging Station',
                    id: s.id || s._id.toString(),
                    name: s.name || 'Station',
                    subtitle: `${s.district || ''}, ${s.state || ''}`.replace(/^,\s*|,\s*$/g, '') || 'Charging Location',
                    path: '/charging-stations'
                });
            });

            // Transform Employees
            employees.forEach(e => {
                results.push({
                    type: 'Employee',
                    id: e.employeeId || e._id.toString(),
                    name: e.name || 'Employee',
                    subtitle: e.role || e.email || 'Staff Member',
                    path: '/employees'
                });
            });

            // Transform Payments
            payments.forEach(p => {
                if (p.paymentId) {
                    results.push({
                        type: 'Payment',
                        id: p.paymentId,
                        name: p.amount ? `Rs. ${p.amount}` : 'Payment Record',
                        subtitle: `${p.method || 'Payment'} - ${p.status || 'Completed'}`,
                        path: '/payments'
                    });
                }
            });

            // Transform Messages
            messages.forEach(m => {
                results.push({
                    type: 'Message',
                    id: m.messageId || m._id.toString().slice(0, 10),
                    name: m.name || 'Contact Inquiry',
                    subtitle: m.subject || m.email || 'Website Message',
                    path: '/messages'
                });
            });

            // Transform Vehicles
            vehicles.forEach(v => {
                if (v.vehicle && (v.vehicle.number || v.vehicle.make || v.vehicle.model)) {
                    results.push({
                        type: 'Vehicle',
                        id: v.vehicle.number || v.vehicle.id || v._id.toString(),
                        name: `${v.vehicle.make || ''} ${v.vehicle.model || ''}`.trim() || 'Vehicle',
                        subtitle: v.vehicle.number || 'Plate Pending',
                        path: '/vehicles'
                    });
                }
            });

            // Transform Leave Requests
            leaveRequests.forEach(l => {
                results.push({
                    type: 'Leave',
                    id: l.leaveId || l._id.toString(),
                    name: l.employeeName ? `${l.employeeName} (${l.type || 'Leave'})` : (l.type || 'Leave Request'),
                    subtitle: `${l.status || 'Pending'} | ${l.startDate || ''} to ${l.endDate || ''}`,
                    path: '/employees'
                });
            });

            // Transform On Leave Staff
            onLeaveStaff.forEach(a => {
                results.push({
                    type: 'Leave',
                    id: a.employeeId || a._id.toString(),
                    name: a.employeeName || 'Employee',
                    subtitle: 'Currently on Leave',
                    path: '/attendance'
                });
            });

            // Transform Bugs
            bugs.forEach(b => {
                results.push({
                    type: 'Bug',
                    id: b.bugId || b._id.toString(),
                    name: b.title || 'Bug Report',
                    subtitle: `${b.status || 'Pending'} | ${b.reporterName || 'Reporter'}`,
                    path: '/bug'
                });
            });

            // Transform Remarks
            remarks.forEach(r => {
                results.push({
                    type: 'Remark',
                    id: r.remarkId || r.referenceId || r._id.toString(),
                    name: r.remark ? (r.remark.length > 35 ? r.remark.slice(0, 35) + '...' : r.remark) : 'Remark',
                    subtitle: r.bookingId ? `Booking: ${r.bookingId}` : (r.reporterName || 'Employee'),
                    path: '/remarks'
                });
            });

            // Transform Requests
            requests.forEach(r => {
                results.push({
                    type: 'Request',
                    id: r.requestId || r.displayId || r._id.toString(),
                    name: r.reason || r.name || 'System Request',
                    subtitle: `${r.status || 'Pending'} | ${r.name || r.employeeId || ''}`,
                    path: '/request'
                });
            });

            // Transform Documents (Upload Documents)
            const processEntityDocs = (entity, entityType) => {
                DOC_DEFS.forEach(doc => {
                    const docId = getOrGenerateDocId(entity, doc.key);
                    const docIdMatch = regexQuery.test(docId);

                    if (docIdMatch) {
                        results.push({
                            type: 'Document',
                            id: docId,
                            name: `${doc.label} (${entity.name || entityType})`,
                            subtitle: `${entityType} Document`,
                            path: '/upload-documents'
                        });
                    }
                });
            };

            docEmployees.forEach(e => processEntityDocs(e, 'Employee'));
            docGarages.forEach(g => processEntityDocs(g, 'Garage'));
        }

        // ==========================================
        // 2. GARAGE PORTAL SEARCH
        // ==========================================
        else if (portal === 'garage') {
            let bookingFilter = {
                $and: [{ bookingId: regexQuery }]
            };
            if (garageId) {
                bookingFilter.$and.push({ "garage.id": garageId });
            }

            let employeeFilter = {
                $and: [{ employeeId: regexQuery }]
            };
            if (garageId) {
                employeeFilter.$and.push({ garageId: garageId });
            }

            let paymentFilter = {
                $and: [{ paymentId: regexQuery }]
            };
            if (garageId) {
                paymentFilter.$and.push({ garageId: garageId });
            }

            let vehicleFilter = {
                $and: [{ "vehicle.number": regexQuery }]
            };
            if (garageId) {
                vehicleFilter.$and.push({ "garage.id": garageId });
            }

            let leaveFilter = {
                $and: [
                    {
                        $or: [
                            { leaveId: regexQuery },
                            { employeeId: regexQuery }
                        ]
                    }
                ]
            };
            if (garageId) {
                leaveFilter.$and.push({ garageId: garageId });
            }

            let attendanceFilter = {
                $and: [
                    { status: 'On Leave' },
                    { employeeId: regexQuery }
                ]
            };
            if (garageId) {
                attendanceFilter.$and.push({ garageId: garageId });
            }

            const [
                bookings,
                employees,
                customers,
                payments,
                vehicles,
                leaves,
                attendance
            ] = await Promise.all([
                Booking.find(bookingFilter).limit(50).select('bookingId user service status'),
                Employee.find(employeeFilter).limit(50).select('employeeId name role phone'),
                User.find({ userId: regexQuery }).limit(50).select('userId name email phone'),
                Payment.find(paymentFilter).limit(50).select('paymentId amount method status transactionId'),
                Booking.find(vehicleFilter).limit(50).select('vehicle'),
                LeaveRequest.find(leaveFilter).limit(50).select('leaveId employeeName type status startDate endDate'),
                Attendance.find(attendanceFilter).limit(50).select('employeeId employeeName')
            ]);

            bookings.forEach(b => {
                results.push({
                    type: 'Booking',
                    id: b.bookingId || b._id.toString(),
                    name: b.service?.title || 'Service Booking',
                    subtitle: b.user?.name || 'Customer',
                    path: '/my-bookings'
                });
            });

            employees.forEach(e => {
                results.push({
                    type: 'Employee',
                    id: e.employeeId || e._id.toString(),
                    name: e.name || 'Staff Member',
                    subtitle: e.role || 'Garage Staff',
                    path: '/staff'
                });
            });

            customers.forEach(u => {
                results.push({
                    type: 'Customer',
                    id: u.userId || u._id.toString(),
                    name: u.name || 'Customer',
                    subtitle: u.email || u.phone || 'Customer Profile',
                    path: '/customers'
                });
            });

            payments.forEach(p => {
                if (p.paymentId) {
                    results.push({
                        type: 'Payment',
                        id: p.paymentId,
                        name: p.amount ? `Rs. ${p.amount}` : 'Payment Record',
                        subtitle: `${p.method || 'Payment'} - ${p.status || 'Completed'}`,
                        path: '/payments'
                    });
                }
            });

            vehicles.forEach(v => {
                if (v.vehicle && (v.vehicle.number || v.vehicle.make || v.vehicle.model)) {
                    results.push({
                        type: 'Vehicle',
                        id: v.vehicle.number || v.vehicle.id || v._id.toString(),
                        name: `${v.vehicle.make || ''} ${v.vehicle.model || ''}`.trim() || 'Vehicle',
                        subtitle: v.vehicle.number || 'Plate Pending',
                        path: '/vehicles'
                    });
                }
            });

            leaves.forEach(l => {
                results.push({
                    type: 'Leave',
                    id: l.leaveId || l._id.toString(),
                    name: l.employeeName ? `${l.employeeName} (${l.type || 'Leave'})` : (l.type || 'Leave Request'),
                    subtitle: `${l.status || 'Pending'} | ${l.startDate || ''} to ${l.endDate || ''}`,
                    path: '/leave'
                });
            });

            attendance.forEach(a => {
                results.push({
                    type: 'Leave',
                    id: a.employeeId || a._id.toString(),
                    name: a.employeeName || 'Staff Member',
                    subtitle: 'Currently on Leave',
                    path: '/attendance'
                });
            });
        }

        // ==========================================
        // 3. EMPLOYEE PORTAL SEARCH
        // ==========================================
        else if (portal === 'employee') {
            let bookingConditions = [{ bookingId: regexQuery }];

            if (empId) {
                bookingConditions.push({
                    $or: [
                        { "assignedEmployees.technician.id": empId },
                        { "assignedEmployees.support.id": empId }
                    ]
                });
            }

            let leaveConditions = [{ leaveId: regexQuery }];

            if (empId) {
                let empIdMatch = [{ employeeId: empId }];
                try {
                    const empRecord = await Employee.findById(empId).select('employeeId');
                    if (empRecord && empRecord.employeeId && empRecord.employeeId !== empId) {
                        empIdMatch.push({ employeeId: empRecord.employeeId });
                    }
                } catch (e) { /* Ignore invalid ObjectId */ }
                leaveConditions.push({ $or: empIdMatch });
            }

            const [assignedBookings, employeeLeaves] = await Promise.all([
                Booking.find({ $and: bookingConditions }).limit(50).select('bookingId user service status'),
                LeaveRequest.find({ $and: leaveConditions }).limit(50).select('leaveId type status startDate endDate')
            ]);

            assignedBookings.forEach(b => {
                results.push({
                    type: 'Booking',
                    id: b.bookingId || b._id.toString(),
                    name: b.service?.title || 'Assigned Task',
                    subtitle: b.user?.name || 'Customer',
                    path: '/tasks'
                });
            });

            employeeLeaves.forEach(l => {
                results.push({
                    type: 'Leave',
                    id: l.leaveId || l._id.toString(),
                    name: l.type || 'Leave Request',
                    subtitle: `${l.status || 'Pending'} | ${l.startDate || ''} to ${l.endDate || ''}`,
                    path: '/leave'
                });
            });
        }

        // ==========================================
        // 4. DEDUPLICATION & RELEVANCE SORTING
        // ==========================================
        // Remove duplicates by unique combination of type + id
        const uniqueMap = new Map();
        results.forEach(item => {
            const key = `${item.type}_${item.id}`;
            if (!uniqueMap.has(key)) {
                uniqueMap.set(key, item);
            }
        });

        const deduplicatedResults = Array.from(uniqueMap.values());

        // Helper function for prefix matching (1st alphabet / number / word start)
        const matchesPrefix = (text, query) => {
            if (!text || !query) return false;
            const t = String(text).trim().toLowerCase();
            const q = String(query).trim().toLowerCase();
            if (!q) return false;

            if (t.startsWith(q)) return true;

            const tClean = t.replace(/-/g, '');
            const qClean = q.replace(/-/g, '');
            if (tClean.startsWith(qClean)) return true;

            const words = t.split(/[\s_()/-]+/);
            if (words.some(w => w.startsWith(q))) return true;

            const numPart = tClean.replace(/^[a-z]+/i, '');
            if (numPart && numPart.startsWith(qClean)) return true;

            return false;
        };

        // Filter results strictly by item.id prefix match
        const prefixMatchedResults = deduplicatedResults.filter(item =>
            matchesPrefix(item.id, exactQuery)
        );

        // Sort by match relevance: Exact ID -> StartsWith ID
        const qLower = exactQuery.toLowerCase();
        prefixMatchedResults.sort((a, b) => {
            const aId = String(a.id || '').toLowerCase();
            const bId = String(b.id || '').toLowerCase();

            // 1. Exact ID match
            if (aId === qLower && bId !== qLower) return -1;
            if (bId === qLower && aId !== qLower) return 1;

            // 2. ID starts with query
            if (aId.startsWith(qLower) && !bId.startsWith(qLower)) return -1;
            if (bId.startsWith(qLower) && !aId.startsWith(qLower)) return 1;

            return 0;
        });

        return res.status(200).json({
            success: true,
            data: prefixMatchedResults.slice(0, 50)
        });

    } catch (error) {
        console.error('Global search error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server search error'
        });
    }
};
