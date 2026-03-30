const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');

// Helper: get today's date string YYYY-MM-DD in IST
const getTodayIST = () => {
    const now = new Date();
    // IST = UTC+5:30
    const istOffset = 5.5 * 60 * 60 * 1000;
    const ist = new Date(now.getTime() + istOffset);
    return ist.toISOString().split('T')[0];
};

// @desc    Employee checks in
// @route   POST /api/attendance/check-in
const checkIn = async (req, res) => {
    try {
        const { employeeId } = req.body;

        if (!employeeId) {
            return res.status(400).json({ success: false, message: 'Employee ID is required' });
        }

        const employee = await Employee.findOne({ employeeId });
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }

        const today = getTodayIST();

        // Prevent duplicate check-in on the same day
        const existing = await Attendance.findOne({ employeeId, date: today });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Already checked in today', data: existing });
        }

        // Determine status: if checked in after 9:30 AM IST, mark as Late
        const now = new Date();
        const istHour = (now.getUTCHours() + 5) % 24;
        const istMinute = (now.getUTCMinutes() + 30) % 60;
        const isLate = istHour > 9 || (istHour === 9 && istMinute > 30);

        const record = await Attendance.create({
            employeeId,
            employeeName: employee.name,
            contact: employee.phone || '',
            email: employee.email || '',
            role: employee.role || '',
            garageId: employee.garageId,
            date: today,
            checkIn: now,
            status: isLate ? 'Late' : 'Present'
        });

        res.status(201).json({ success: true, data: record });
    } catch (err) {
        console.error('Check-in error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Employee checks out
// @route   PUT /api/attendance/check-out/:id
const checkOut = async (req, res) => {
    try {
        const record = await Attendance.findById(req.params.id);
        if (!record) {
            return res.status(404).json({ success: false, message: 'Attendance record not found' });
        }
        if (record.checkOut) {
            return res.status(400).json({ success: false, message: 'Already checked out', data: record });
        }

        record.checkOut = new Date();
        await record.save();

        res.status(200).json({ success: true, data: record });
    } catch (err) {
        console.error('Check-out error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get today's attendance status for an employee
// @route   GET /api/attendance/status/:employeeId
const getTodayStatus = async (req, res) => {
    try {
        const today = getTodayIST();
        const record = await Attendance.findOne({ employeeId: req.params.employeeId, date: today });
        res.status(200).json({ success: true, data: record || null });
    } catch (err) {
        console.error('Status fetch error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get all attendance records for a garage (today or all)
// @route   GET /api/attendance/garage/:garageId
const getGarageAttendance = async (req, res) => {
    try {
        const { date } = req.query; // optional ?date=YYYY-MM-DD filter
        const query = { garageId: req.params.garageId };
        if (date) query.date = date;

        const records = await Attendance.find(query).sort({ checkIn: -1 });
        res.status(200).json({ success: true, count: records.length, data: records });
    } catch (err) {
        console.error('Garage attendance fetch error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Delete an attendance record
// @route   DELETE /api/attendance/:id
const deleteRecord = async (req, res) => {
    try {
        const record = await Attendance.findByIdAndDelete(req.params.id);
        if (!record) {
            return res.status(404).json({ success: false, message: 'Record not found' });
        }
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        console.error('Delete record error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = { checkIn, checkOut, getTodayStatus, getGarageAttendance, deleteRecord };
