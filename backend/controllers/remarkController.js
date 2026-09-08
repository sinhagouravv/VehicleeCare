const Remark = require('../models/Remark');
const Booking = require('../models/Booking');
const LeaveRequest = require('../models/LeaveRequest');
const OvertimeRequest = require('../models/OvertimeRequest');
const IdCardRequest = require('../models/IdCardRequest');
const Employee = require('../models/Employee');
const { createAdminNotification } = require('./notificationController');

// Helper to resolve actual Employee Role from Database
const getEmployeeRole = async (empId, fallback = 'Technician') => {
    if (!empId || empId === '—') return fallback;
    try {
        const mongoose = require('mongoose');
        const emp = await Employee.findOne({
            $or: [
                { employeeId: String(empId) },
                { _id: mongoose.Types.ObjectId.isValid(empId) ? empId : null }
            ]
        }).lean();
        if (emp && emp.role) return emp.role;
    } catch (_) {}
    return fallback;
};

// Helper to generate custom Remark ID (8 characters: 'R' + 7 random digits)
const generateRemarkId = async () => {
    let isUnique = false;
    let newId = '';
    while (!isUnique) {
        const randomDigits = Math.floor(1000000 + Math.random() * 9000000).toString();
        newId = `R${randomDigits}`;
        const existing = await Remark.findOne({ remarkId: newId });
        if (!existing) {
            isUnique = true;
        }
    }
    return newId;
};

// @desc    Create a new Remark
// @route   POST /api/remarks
exports.createRemark = async (req, res) => {
    try {
        const {
            referenceId,
            bookingId,
            bookingMongoId,
            reporterId,
            reporterName,
            role,
            remarkerRole,
            remarkedRole,
            customerDetails,
            remark,
            status
        } = req.body;

        const refId = referenceId || bookingId;

        if (!refId || !remark) {
            return res.status(400).json({ success: false, message: 'Reference ID and Remark content are required' });
        }

        const mongoose = require('mongoose');
        const validMongoId = bookingMongoId && mongoose.Types.ObjectId.isValid(bookingMongoId) ? bookingMongoId : null;

        // Prevent duplicate remark for the same reference ID
        const existingRemark = await Remark.findOne({
            $or: [
                { referenceId: refId },
                { bookingId: refId },
                ...(validMongoId ? [{ bookingMongoId: validMongoId }] : [])
            ]
        });

        if (existingRemark) {
            return res.status(400).json({ success: false, message: 'A remark has already been submitted for this item.' });
        }

        const remarkId = await generateRemarkId();

        const resolvedRemarkerRole = await getEmployeeRole(reporterId, remarkerRole || 'Technician');
        const resolvedRemarkedRole = await getEmployeeRole(customerDetails, remarkedRole || role || 'Customer');

        const newRemark = await Remark.create({
            remarkId,
            referenceId: refId,
            bookingId: bookingId || refId,
            bookingMongoId: validMongoId,
            reporterId: reporterId || 'EMPLOYEE',
            reporterName: reporterName || 'Employee',
            remarkerRole: resolvedRemarkerRole,
            remarkedRole: resolvedRemarkedRole,
            role: resolvedRemarkedRole,
            customerDetails: customerDetails || '—',
            remark,
            status: status || 'Pending'
        });

        // Sync employeeRemark on the underlying target document
        try {
            if (validMongoId) {
                await Promise.allSettled([
                    OvertimeRequest.findByIdAndUpdate(validMongoId, { employeeRemark: remark }),
                    LeaveRequest.findByIdAndUpdate(validMongoId, { employeeRemark: remark }),
                    IdCardRequest.findByIdAndUpdate(validMongoId, { employeeRemark: remark }),
                    Booking.findByIdAndUpdate(validMongoId, { employeeRemark: remark })
                ]);
            }
            if (refId) {
                await Promise.allSettled([
                    OvertimeRequest.findOneAndUpdate({ overtimeId: refId }, { employeeRemark: remark }),
                    LeaveRequest.findOneAndUpdate({ leaveId: refId }, { employeeRemark: remark }),
                    IdCardRequest.findOneAndUpdate({ meetingId: refId }, { employeeRemark: remark }),
                    Booking.findOneAndUpdate({ bookingId: refId }, { employeeRemark: remark })
                ]);
            }
        } catch (syncErr) {
            console.error('Error syncing employeeRemark to target document:', syncErr.message);
        }

        // Create Admin Notification
        try {
            createAdminNotification({
                eventType: 'remark',
                superCategory: 'adminNotification',
                title: 'New Remark Added',
                message: `Remark ${remarkId} reported by ${newRemark.reporterName || 'an employee'} for Ref #${refId}: "${remark}"`,
                meta: {
                    remarkId: newRemark.remarkId,
                    mongoRemarkId: newRemark._id,
                    referenceId: refId,
                    reporterName: newRemark.reporterName,
                    reporterId: newRemark.reporterId
                }
            });
        } catch (notifErr) {
            console.error('Error firing remark admin notification:', notifErr.message);
        }

        // Create Employee Notification (superCategory: 'employees_notification', eventType: 'review')
        try {
            createAdminNotification({
                eventType: 'review',
                superCategory: 'employees_notification',
                title: 'Remark Submitted',
                message: `Dear Employee, Your remark ${remarkId} has been submitted successfully. We appreciate your time and attention fro the same`,
                meta: {
                    employeeId: reporterId || newRemark.reporterId,
                    remarkId: newRemark.remarkId,
                    mongoRemarkId: newRemark._id,
                    referenceId: refId,
                    senderName: 'ADMINISTRATOR'
                }
            });
        } catch (empNotifErr) {
            console.error('Error firing remark employee notification:', empNotifErr.message);
        }

        res.status(201).json({ success: true, data: newRemark });
    } catch (err) {
        console.error('Error creating remark:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get all Remarks
// @route   GET /api/remarks
exports.getAllRemarks = async (req, res) => {
    try {
        const remarks = await Remark.find({}).sort({ createdAt: -1 }).lean();
        res.status(200).json({ success: true, data: remarks });
    } catch (err) {
        console.error('Error fetching remarks:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Update Remark status
// @route   PATCH /api/remarks/:id/status
exports.updateRemarkStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({ success: false, message: 'Status is required' });
        }

        const remarkItem = await Remark.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );

        if (!remarkItem) {
            return res.status(404).json({ success: false, message: 'Remark not found' });
        }

        res.status(200).json({ success: true, data: remarkItem });
    } catch (err) {
        console.error('Error updating remark status:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Delete a Remark
// @route   DELETE /api/remarks/:id
exports.deleteRemark = async (req, res) => {
    try {
        const remarkItem = await Remark.findByIdAndDelete(req.params.id);
        if (!remarkItem) {
            return res.status(404).json({ success: false, message: 'Remark not found' });
        }
        res.status(200).json({ success: true, message: 'Remark deleted successfully' });
    } catch (err) {
        console.error('Error deleting remark:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
