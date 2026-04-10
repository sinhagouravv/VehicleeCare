const LeaveRequest = require('../models/LeaveRequest');

// @desc    Request leave
// @route   POST /api/leaves/request
exports.requestLeave = async (req, res) => {
    try {
        const { employeeId, employeeName, type, leaveTime, startDate, endDate, reason } = req.body;

        if (!employeeId || !employeeName || !type || !leaveTime || !startDate || !endDate || !reason) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

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

        const newLeave = new LeaveRequest({
            employeeId,
            employeeName,
            type,
            leaveTime,
            startDate,
            endDate,
            reason,
            totalDays: diffDays
        });

        await newLeave.save();

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
        const { status } = req.body;
        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const leave = await LeaveRequest.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!leave) {
            return res.status(404).json({ success: false, message: 'Leave request not found' });
        }

        res.status(200).json({ success: true, data: leave });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};
