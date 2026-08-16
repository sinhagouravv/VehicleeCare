const mongoose = require('mongoose');
const LeaveRequest = require('../models/LeaveRequest');
const Employee = require('../models/Employee');
const Notification = require('../models/Notification');

// Helper: Generate unique 7-char Leave ID (LA + 5 unique non-zero digits)
const generateLeaveId = async () => {
    const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
    let isUnique = false;
    let newId = '';

    while (!isUnique) {
        newId = 'LA';
        let tempDigits = [...digits];
        for (let i = 0; i < 5; i++) {
            const idx = Math.floor(Math.random() * tempDigits.length);
            newId += tempDigits[idx];
            tempDigits.splice(idx, 1);
        }
        const existing = await LeaveRequest.findOne({ leaveId: newId });
        if (!existing) isUnique = true;
    }
    return newId;
};

// @desc    Request leave
// @route   POST /api/leaves/request
exports.requestLeave = async (req, res) => {
    try {
        const { 
            employeeId, employeeName, employeePhone: reqPhone, employeeEmail: reqEmail, 
            type, leaveTime, startDate, endDate, reason, garageId, startTime, endTime,
            parentLeaveId // For extension
        } = req.body;

        if (!employeeId || !employeeName || !type || !leaveTime || !startDate || !endDate || !reason || !garageId) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        // Fetch latest employee info for contact details (Source of Truth)
        let employee = await Employee.findOne({ employeeId: employeeId });
        
        // If not found by custom ID, and it's a valid ObjectId, try finding by MongoDB _id
        if (!employee && mongoose.Types.ObjectId.isValid(employeeId)) {
            employee = await Employee.findById(employeeId);
        }

        const finalPhone = employee?.phone || reqPhone || '';
        const finalEmail = employee?.email || reqEmail || '';

        // Calculate total days
        let diffDays = 0;
        if (leaveTime === 'Half Day') {
            diffDays = 0.5;
        } else {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const diffTime = Math.abs(end - start);
            diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        }

        let leaveId = '';
        if (parentLeaveId) {
            leaveId = `${parentLeaveId}E`;
        } else {
            leaveId = await generateLeaveId();
        }

        const newLeave = new LeaveRequest({
            employeeId,
            employeeName,
            employeePhone: finalPhone,
            employeeEmail: finalEmail,
            type,
            leaveTime,
            startDate,
            startTime,
            endDate,
            endTime,
            reason,
            totalDays: diffDays,
            leaveId,
            garageId
        });

        await newLeave.save();

        // Fire garage portal notification
        try {
            if (garageId) {
                const Garage = require('../models/Garage');
                const garageDoc = await Garage.findOne({ garageId });
                const garageName = garageDoc ? garageDoc.name : 'Garage';
                const leaveMsg = `Dear ${garageName}, Your employee ${employeeName} ${employeeId} had requested for a leave. Kindly review the details of the leave and approved or reject according.`;

                await Notification.create({
                    eventType: 'leave',
                    superCategory: 'garageNotification',
                    title: 'New Leave Request',
                    message: leaveMsg,
                    meta: {
                        leaveId: newLeave._id,
                        leaveCustomId: newLeave.leaveId,
                        employeeId: employeeId,
                        employeeName: employeeName,
                        garageId: garageId,
                        garageName: garageName,
                        type: type,
                        leaveTime: leaveTime,
                        reason: reason,
                        senderName: 'Administrator',
                        senderId: '184592037461'
                    }
                });
            }
        } catch (notifErr) {
            console.error('Failed to create garage notification for leave request:', notifErr);
        }

        res.status(201).json({ success: true, message: 'Leave request submitted successfully', data: newLeave });
    } catch (error) {
        console.error('[LeaveRequest] Error:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Get leave requests for an employee
// @route   GET /api/leaves/employee/:employeeId
exports.getEmployeeLeaves = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const leaves = await LeaveRequest.find({ employeeId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: leaves });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Get leave requests for a specific garage
// @route   GET /api/leaves/garage/:garageId
exports.getGarageLeaves = async (req, res) => {
    try {
        const { garageId } = req.params;
        const leaves = await LeaveRequest.find({ garageId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: leaves });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Get all leave requests (for Admin/Garage)
// @route   GET /api/leaves
exports.getAllLeaves = async (req, res) => {
    try {
        const leaves = await LeaveRequest.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: leaves });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Update leave status
// @route   PATCH /api/leaves/:id/status
exports.updateLeaveStatus = async (req, res) => {
    try {
        const { status, employeeId, remarks } = req.body;
        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const updateData = { status };
        if (remarks) updateData.remarks = remarks;

        const leave = await LeaveRequest.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!leave) {
            return res.status(404).json({ success: false, message: 'Leave request not found' });
        }

        const approver = await Employee.findOne({ employeeId: employeeId });

        // Create Notification
        let message = '';
        if (status === 'Approved') {
            message = 'Dear Employee, Your leave request ' + `${leave.leaveId}` + ' has been approved successfully. Please make sure to complete any pending work before your leave period begins. We wish you a pleasant and stress-free time off.';
        } else if (status === 'Rejected') {
            message = 'Dear Employee, Your leave request ' + `${leave.leaveId}` + ' has been reviewed and unfortunately could not be approved at this time. Please refer to the Remarks section for further details regarding the rejection.';
        }
        
        await Notification.create({
            eventType: 'leave',
            superCategory: 'employees_notification',
            title: `Leave Request ${status}`,
            message: message,
            meta: {
                leaveId: leave._id,
                leaveCustomId: leave.leaveId,
                employeeId: leave.employeeId,
                approverEmpId: employeeId,
                approverName: approver ? approver.name : 'MANAGER',
                remarks: remarks,
                status: status
            }
        });

        res.status(200).json({ success: true, data: leave });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Delete leave request
// @route   DELETE /api/leaves/:id
exports.deleteLeaveRequest = async (req, res) => {
    try {
        const leave = await LeaveRequest.findByIdAndDelete(req.params.id);
        if (!leave) {
            return res.status(404).json({ success: false, message: 'Leave request not found' });
        }
        res.status(200).json({ success: true, message: 'Leave request deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};
