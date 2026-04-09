const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const { SHIFT_RULES, getISTTime, getTodayIST, toMin } = require('../utils/attendanceHelpers');



// ──────────────────────────────────────────────
// Determine check-in status based on shift
// ──────────────────────────────────────────────
const getCheckInStatus = (shift) => {
    const { total } = getISTTime();
    const rules = SHIFT_RULES[shift] || SHIFT_RULES.Morning;

    let adjustedTotal = total;
    if (shift === 'Night' && total < 12 * 60) {
        adjustedTotal += 24 * 60; // Push morning hours to "next day" for easy > comparison
    }

    if (adjustedTotal >= toMin(rules.absentAfter)) return 'Absent';   
    if (adjustedTotal >= toMin(rules.lateAfter))   return 'Late';     
    return 'Present';                                          
};

// ──────────────────────────────────────────────
// Determine check-out status based on shift
// ──────────────────────────────────────────────
const getCheckOutStatus = (shift, currentStatus) => {
    const { total } = getISTTime();
    const rules = SHIFT_RULES[shift] || SHIFT_RULES.Morning;

    let adjustedTotal = total;
    let adjustedOvertimeThreshold = toMin(rules.overtimeAfter);

    if (shift === 'Night') {
        if (total < 12 * 60) {
            adjustedTotal += 24 * 60;
        }
        adjustedOvertimeThreshold += 24 * 60;
    }

    if (adjustedTotal >= adjustedOvertimeThreshold) return 'Overtime';
    return currentStatus; // Keep existing status (Present/Late)
};

// ──────────────────────────────────────────────
// @desc  Employee checks in
// @route POST /api/attendance/check-in
// ──────────────────────────────────────────────
const checkIn = async (req, res) => {
    try {
        const { employeeId } = req.body;
        if (!employeeId) return res.status(400).json({ success: false, message: 'Employee ID is required' });

        const employee = await Employee.findOne({ employeeId });
        if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

        const shift = employee.shift || 'Morning';
        const today = getTodayIST(shift);

        // Prevent duplicate check-in
        const existing = await Attendance.findOne({ employeeId, date: today });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Already checked in today', data: existing });
        }

        const status = getCheckInStatus(shift);

        // If past absent threshold — create Absent record but do NOT allow a normal check-in
        if (status === 'Absent') {
            const absentRecord = await Attendance.create({
                employeeId,
                employeeName: employee.name,
                contact: employee.phone || '',
                email: employee.email || '',
                role: employee.role || '',
                shift: shift,
                garageId: employee.garageId,
                date: today,
                checkIn: null,
                status: 'Absent'
            });
            return res.status(403).json({
                success: false,
                message: `Check-in window has closed for ${shift} shift. Marked as Absent.`,
                data: absentRecord
            });
        }

        const record = await Attendance.create({
            employeeId,
            employeeName: employee.name,
            contact: employee.phone || '',
            email: employee.email || '',
            role: employee.role || '',
            shift: shift,
            garageId: employee.garageId,
            date: today,
            checkIn: new Date(),
            status
        });

        res.status(201).json({ success: true, data: record });
    } catch (err) {
        console.error('Check-in error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// ──────────────────────────────────────────────
// @desc  Employee checks out
// @route PUT /api/attendance/check-out/:id
// ──────────────────────────────────────────────
const checkOut = async (req, res) => {
    try {
        const record = await Attendance.findById(req.params.id);
        if (!record) return res.status(404).json({ success: false, message: 'Attendance record not found' });
        if (record.checkOut) return res.status(400).json({ success: false, message: 'Already checked out', data: record });

        const employee = await Employee.findOne({ employeeId: record.employeeId });
        const shift = employee?.shift || 'Morning';

        record.checkOut = new Date();
        record.status = getCheckOutStatus(shift, record.status);
        await record.save();

        res.status(200).json({ success: true, data: record });
    } catch (err) {
        console.error('Check-out error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// ──────────────────────────────────────────────
// @desc  Get today's status for an employee
// @route GET /api/attendance/status/:employeeId
// ──────────────────────────────────────────────
const getTodayStatus = async (req, res) => {
    try {
        const employee = await Employee.findOne({ employeeId: req.params.employeeId });
        const shift = employee?.shift || 'Morning';
        const today = getTodayIST(shift);
        const record = await Attendance.findOne({ employeeId: req.params.employeeId, date: today });
        res.status(200).json({ success: true, data: record || null });
    } catch (err) {
        console.error('Status fetch error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// ──────────────────────────────────────────────
// Helper: Auto-mark absent employees
// ──────────────────────────────────────────────
const autoMarkAbsences = async (garageId) => {
    try {
        const { total } = getISTTime();
        const employees = await Employee.find({ garageId });

        for (const emp of employees) {
            const shift = emp.shift || 'Morning';
            const rules = SHIFT_RULES[shift] || SHIFT_RULES.Morning;
            const today = getTodayIST(shift);

            let adjustedTotal = total;
            if (shift === 'Night' && total < 12 * 60) {
                adjustedTotal += 24 * 60;
            }

            if (adjustedTotal >= toMin(rules.absentAfter)) {
                const existing = await Attendance.findOne({ employeeId: emp.employeeId, date: today });
                if (!existing) {
                    await Attendance.create({
                        employeeId: emp.employeeId,
                        employeeName: emp.name,
                        contact: emp.phone || '',
                        email: emp.email || '',
                        role: emp.role || '',
                        shift: shift,
                        garageId: emp.garageId,
                        date: today,
                        checkIn: null,
                        status: 'Absent'
                    });
                }
            }
        }
    } catch (err) {
        console.error('Error auto-marking absences:', err);
    }
};

// ──────────────────────────────────────────────
// @desc  Get all attendance records for a garage
// @route GET /api/attendance/garage/:garageId
// ──────────────────────────────────────────────
const getGarageAttendance = async (req, res) => {
    try {
        await autoMarkAbsences(req.params.garageId);

        const { date } = req.query;
        const query = { garageId: req.params.garageId };
        if (date) query.date = date;

        const records = await Attendance.find(query).sort({ date: -1 }).lean();
        
        // Fetch employees to get their actual current shift
        const employees = await Employee.find({ garageId: req.params.garageId }).select('employeeId shift');
        const shiftMap = {};
        employees.forEach(emp => {
            shiftMap[emp.employeeId] = emp.shift || 'Morning';
        });

        const updatedRecords = records.map(record => ({
            ...record,
            shift: shiftMap[record.employeeId] || record.shift || 'Morning'
        }));

        res.status(200).json({ success: true, count: updatedRecords.length, data: updatedRecords });
    } catch (err) {
        console.error('Garage attendance fetch error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// ──────────────────────────────────────────────
// @desc  Get all attendance records for an employee
// @route GET /api/attendance/employee/:employeeId
// ──────────────────────────────────────────────
const getEmployeeAttendance = async (req, res) => {
    try {
        const records = await Attendance.find({ employeeId: req.params.employeeId }).sort({ date: -1 }).lean();
        
        const employee = await Employee.findOne({ employeeId: req.params.employeeId }).select('shift');
        const shift = employee ? (employee.shift || 'Morning') : 'Morning';

        const updatedRecords = records.map(record => ({
            ...record,
            shift: record.shift || shift
        }));

        res.status(200).json({ success: true, count: updatedRecords.length, data: updatedRecords });
    } catch (err) {
        console.error('Employee attendance fetch error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// ──────────────────────────────────────────────
// @desc  Delete an attendance record
// @route DELETE /api/attendance/:id
// ──────────────────────────────────────────────
const deleteRecord = async (req, res) => {
    try {
        const record = await Attendance.findByIdAndDelete(req.params.id);
        if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        console.error('Delete record error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = { checkIn, checkOut, getTodayStatus, getGarageAttendance, getEmployeeAttendance, deleteRecord };
