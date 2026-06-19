const mongoose = require('mongoose');
const OvertimeRequest = require('../models/OvertimeRequest');
const Employee = require('../models/Employee');
const Notification = require('../models/Notification');


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

        const newOvertime = new OvertimeRequest({
            employeeId,
            employeeName,
            employeePhone: finalPhone,
            employeeEmail: finalEmail,
            date: formattedDate,
            hours,
            reason,
            garageId
        });

        await newOvertime.save();

        res.status(201).json({ success: true, message: 'Overtime request submitted successfully', data: newOvertime });
    } catch (error) {
        console.error('[OvertimeRequest] Error:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Get overtime requests for an employee
// @route   GET /api/overtime/employee/:employeeId
exports.getEmployeeOvertimes = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const overtimes = await OvertimeRequest.find({ employeeId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: overtimes });
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
        res.status(200).json({ success: true, data: overtimes });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Get all overtime requests
// @route   GET /api/overtime
exports.getAllOvertimes = async (req, res) => {
    try {
        const overtimes = await OvertimeRequest.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: overtimes });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Update overtime request status
// @route   PATCH /api/overtime/:id/status
exports.updateOvertimeStatus = async (req, res) => {
    try {
        const { status, employeeId, remarks } = req.body;
        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const updateData = { status };
        if (remarks) updateData.remarks = remarks;

        const overtime = await OvertimeRequest.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!overtime) {
            return res.status(404).json({ success: false, message: 'Overtime request not found' });
        }

        const approver = await Employee.findOne({ employeeId: employeeId });

        let message = '';
        if (status === 'Approved') {
            message = `Dear employee, Your overtime request for ${overtime.hours} hours overtime on ${overtime.date} has been approved successfully. Please make sure to checkin and checkout on the time to avoid any penelty.`;
        } else if (status === 'Rejected') {
            message = `Dear employee, Your overtime request for ${overtime.hours} hours overtime on ${overtime.date} has been reviewed and unfortunately could not be approved at this time. Please refer to the remarks section for further details regarding the rejection.`;
        }
        
        await Notification.create({
            eventType: 'overtime',
            title: `Overtime Request ${status}`,
            message: message,
            meta: {
                overtimeId: overtime._id,
                employeeId: overtime.employeeId,
                approverEmpId: employeeId,
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
