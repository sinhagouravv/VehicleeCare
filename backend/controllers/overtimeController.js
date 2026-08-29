const mongoose = require('mongoose');
const OvertimeRequest = require('../models/OvertimeRequest');
const Employee = require('../models/Employee');
const Notification = require('../models/Notification');
const Remark = require('../models/Remark');


// Helper: Generate unique 7-char Overtime ID (O + 6 unique non-zero digits)
const generateOvertimeId = async () => {
    const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
    let isUnique = false;
    let newId = '';

    while (!isUnique) {
        newId = 'O';
        let tempDigits = [...digits];
        for (let i = 0; i < 6; i++) {
            const randomIndex = Math.floor(Math.random() * tempDigits.length);
            newId += tempDigits[randomIndex];
            tempDigits.splice(randomIndex, 1);
        }
        const existing = await OvertimeRequest.findOne({ overtimeId: newId });
        if (!existing) {
            isUnique = true;
        }
    }
    return newId;
};

// @desc    Request overtime
// @route   POST /api/overtime/request
exports.requestOvertime = async (req, res) => {
    try {
        const { 
            employeeId, employeeName, employeePhone: reqPhone, employeeEmail: reqEmail, 
            date, hours, reason, garageId
        } = req.body;

        if (!employeeId || !employeeName || !date || !hours || !reason || !garageId) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        // Fetch latest employee info for contact details
        let employee = await Employee.findOne({ employeeId: employeeId });
        if (!employee && mongoose.Types.ObjectId.isValid(employeeId)) {
            employee = await Employee.findById(employeeId);
        }

        const finalPhone = employee?.phone || reqPhone || '';
        const finalEmail = employee?.email || reqEmail || '';

        // Convert date from YYYY-MM-DD to DD-MM-YYYY for storage
        const formatToDDMMYYYY = (d) => {
            const parts = d.split('-');
            if (parts.length === 3 && parts[0].length === 4) {
                return `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
            return d; // already in DD-MM-YYYY or unknown, keep as-is
        };
        const formattedDate = formatToDDMMYYYY(date);
        const overtimeId = await generateOvertimeId();

        const newOvertime = new OvertimeRequest({
            employeeId,
            employeeName,
            employeePhone: finalPhone,
            employeeEmail: finalEmail,
            date: formattedDate,
            hours,
            reason,
            garageId,
            overtimeId
        });

        await newOvertime.save();

        // Fire garage portal notification
        try {
            if (garageId) {
                const Garage = require('../models/Garage');
                const garageDoc = await Garage.findOne({ garageId });
                const garageName = garageDoc ? garageDoc.name : 'Garage';
                const overtimeMsg = `Dear ${garageName}, Your employee ${employeeName} ${employeeId} had requested for a overtime. Kindly review the details of the overtime and approved or reject according.`;

                await Notification.create({
                    eventType: 'overtime',
                    superCategory: 'garageNotification',
                    title: 'New Overtime Request',
                    message: overtimeMsg,
                    meta: {
                        overtimeId: newOvertime._id,
                        employeeId: employeeId,
                        employeeName: employeeName,
                        garageId: garageId,
                        garageName: garageName,
                        hours: hours,
                        date: formattedDate,
                        reason: reason,
                        senderName: 'Administrator',
                        senderId: '184592037461'
                    }
                });
            }
        } catch (notifErr) {
            console.error('Failed to create garage notification for overtime request:', notifErr);
        }

        res.status(201).json({ success: true, message: 'Overtime request submitted successfully', data: newOvertime });
    } catch (error) {
        console.error('[OvertimeRequest] Error:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

const enrichOvertimes = async (overtimes) => {
    const garageIds = [...new Set(overtimes.map(o => o.garageId).filter(Boolean))];
    const otIds = overtimes.map(o => o.overtimeId || String(o._id));
    const mongoIds = overtimes.map(o => String(o._id));

    const [managers, existingRemarks] = await Promise.all([
        Employee.find({
            garageId: { $in: garageIds },
            role: { $in: ['Manager', 'Admin', 'manager', 'admin'] }
        }).lean(),
        Remark.find({
            $or: [
                { referenceId: { $in: otIds } },
                { bookingId: { $in: otIds } },
                { bookingMongoId: { $in: mongoIds } }
            ]
        }).lean()
    ]);

    const remarkMap = {};
    for (const r of existingRemarks) {
        const k1 = r.referenceId;
        const k2 = r.bookingId;
        const k3 = r.bookingMongoId ? String(r.bookingMongoId) : null;
        const info = { remark: r.remark, remarkId: r.remarkId };
        if (k1) remarkMap[k1] = info;
        if (k2) remarkMap[k2] = info;
        if (k3) remarkMap[k3] = info;
    }

    const managerMap = {};
    for (const m of managers) {
        if (!managerMap[m.garageId]) {
            managerMap[m.garageId] = m;
        }
    }

    return overtimes.map(o => {
        const doc = o.toObject ? o.toObject() : { ...o };
        const key1 = o.overtimeId;
        const key2 = String(o._id);
        const info = remarkMap[key1] || remarkMap[key2];
        if (!doc.employeeRemark && info) {
            doc.employeeRemark = info.remark;
        }
        if (!doc.remarkId && info) {
            doc.remarkId = info.remarkId;
        }
        if (!doc.approvedBy && doc.status !== 'Pending' && doc.garageId && managerMap[doc.garageId]) {
            const m = managerMap[doc.garageId];
            doc.approvedBy = m.name;
            doc.approvedById = m.employeeId || m._id;
            doc.approvedByRole = m.role || 'Manager';
        }
        return doc;
    });
};

// @desc    Get overtime requests for an employee
// @route   GET /api/overtime/employee/:employeeId
exports.getEmployeeOvertimes = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const overtimes = await OvertimeRequest.find({ employeeId }).sort({ createdAt: -1 });
        const enriched = await enrichOvertimes(overtimes);
        res.status(200).json({ success: true, data: enriched });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Get overtime requests for a specific garage
// @route   GET /api/overtime/garage/:garageId
exports.getGarageOvertimes = async (req, res) => {
    try {
        const { garageId } = req.params;
        const overtimes = await OvertimeRequest.find({ garageId }).sort({ createdAt: -1 });
        const enriched = await enrichOvertimes(overtimes);
        res.status(200).json({ success: true, data: enriched });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Get all overtime requests
// @route   GET /api/overtime
exports.getAllOvertimes = async (req, res) => {
    try {
        const overtimes = await OvertimeRequest.find().sort({ createdAt: -1 });
        const enriched = await enrichOvertimes(overtimes);
        res.status(200).json({ success: true, data: enriched });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Update overtime request status
// @route   PATCH /api/overtime/:id/status
exports.updateOvertimeStatus = async (req, res) => {
    try {
        const { status, employeeId, remarks, employeeRemark } = req.body;
        if (status && !['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        let updateData = {};
        if (status) updateData.status = status;
        if (remarks) updateData.remarks = remarks;
        if (employeeRemark !== undefined) updateData.employeeRemark = employeeRemark;

        let approver = null;
        if (employeeId) {
            approver = await Employee.findOne({ employeeId: employeeId });
            if (!approver && mongoose.Types.ObjectId.isValid(employeeId)) {
                approver = await Employee.findById(employeeId);
            }
        }
        if (approver) {
            updateData.approvedBy = approver.name;
            updateData.approvedById = approver.employeeId || approver._id;
            updateData.approvedByRole = approver.role || 'Manager';
        }

        const overtime = await OvertimeRequest.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!overtime) {
            return res.status(404).json({ success: false, message: 'Overtime request not found' });
        }

        if (!approver && employeeId) {
            approver = await Employee.findOne({ employeeId: employeeId });
        }

        let message = '';
        if (status === 'Approved') {
            message = `Dear employee, Your overtime request for ${overtime.hours} hours overtime on ${overtime.date} has been approved successfully. Please make sure to checkin and checkout on the time to avoid any penelty.`;
        } else if (status === 'Rejected') {
            message = `Dear employee, Your overtime request for ${overtime.hours} hours overtime on ${overtime.date} has been reviewed and unfortunately could not be approved at this time. Please refer to the remarks section for further details regarding the rejection.`;
        }
        
        await Notification.create({
            eventType: 'overtime',
            superCategory: 'employees_notification',
            title: `Overtime Request ${status}`,
            message: message,
            meta: {
                overtimeId: overtime._id,
                employeeId: overtime.employeeId,
                approverEmpId: approver ? approver.employeeId : employeeId || 'MANAGER',
                approverName: approver ? approver.name : 'MANAGER',
                remarks: remarks || '',
                status: status
            }
        });

        res.status(200).json({ success: true, data: overtime });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Delete overtime request
// @route   DELETE /api/overtime/:id
exports.deleteOvertimeRequest = async (req, res) => {
    try {
        const overtime = await OvertimeRequest.findByIdAndDelete(req.params.id);
        if (!overtime) {
            return res.status(404).json({ success: false, message: 'Overtime request not found' });
        }
        res.status(200).json({ success: true, message: 'Overtime request deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};
