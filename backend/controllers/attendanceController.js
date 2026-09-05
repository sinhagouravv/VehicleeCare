const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const LeaveRequest = require('../models/LeaveRequest');
const OvertimeRequest = require('../models/OvertimeRequest');
const { SHIFT_RULES, getISTTime, getTodayIST, toMin, getCheckOutStatusForTime, isNewEmployeeBlocked } = require('../utils/attendanceHelpers');

const lastAutoMarkTimes = {};



// ──────────────────────────────────────────────
// Determine check-in status based on shift
// ──────────────────────────────────────────────
const getCheckInStatus = (shift, approvedOvertimeHours = 0) => {
    const { total } = getISTTime();
    const rules = SHIFT_RULES[shift] || SHIFT_RULES.Morning;

    let adjustedTotal = total;
    if (shift === 'Night' && total < 12 * 60) {
        adjustedTotal += 24 * 60; // Push morning hours to "next day" for easy > comparison
    }

    let absentAfterMins = toMin(rules.absentAfter);
    let lateAfterMins = toMin(rules.lateAfter);

    if (shift === 'Evening' && approvedOvertimeHours > 0) {
        absentAfterMins -= approvedOvertimeHours * 60;
        lateAfterMins -= approvedOvertimeHours * 60;
    }

    if (adjustedTotal >= absentAfterMins) return 'Absent';   
    if (adjustedTotal >= lateAfterMins)   return 'Late';     
    return 'Present';                                          
};

// ──────────────────────────────────────────────
// Determine check-out status based on shift
// ──────────────────────────────────────────────
const getCheckOutStatus = (shift, currentStatus) => {
    const { total } = getISTTime();
    return getCheckOutStatusForTime(shift, currentStatus, total);
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

        if (employee.garageId) {
            delete lastAutoMarkTimes[employee.garageId.toString()];
        }

        // Block new joining employee checks until their first shift start
        if (await isNewEmployeeBlocked(employee)) {
            return res.status(400).json({
                success: false,
                isNewJoiningBlocked: true,
                message: "Since you are a new your account is still in process, you can CHECKIN at the time of your respective shift. Thank you."
            });
        }

        const isDev = (employee.category || '').toLowerCase() === 'developer';
        const shift = isDev ? 'Full Day' : (employee.shift || 'Morning');

        // Find approved overtime hours for this employee on calendar date today
        const { date: istDate } = getISTTime();
        const calendarToday = istDate.toISOString().split('T')[0];

        let approvedOvertimeHours = 0;
        if (shift === 'Evening') {
            const approvedOvertime = await OvertimeRequest.findOne({
                employeeId,
                date: calendarToday,
                status: 'Approved'
            });
            approvedOvertimeHours = approvedOvertime ? (approvedOvertime.hours || 0) : 0;
        }

        const today = getTodayIST(shift, approvedOvertimeHours);

        // 1. Check if employee is on an approved leave for today
        const activeLeave = await LeaveRequest.findOne({
            employeeId: employeeId,
            status: 'Approved',
            startDate: { $lte: today },
            endDate: { $gte: today }
        });

        if (activeLeave) {
            return res.status(403).json({ 
                success: false, 
                message: `Cannot check-in. You are marked as 'On Leave' from ${activeLeave.startDate} to ${activeLeave.endDate}.` 
            });
        }

        // 2. Prevent duplicate check-in
        const existing = await Attendance.findOne({ employeeId, date: today });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Already checked in today', data: existing });
        }

        const status = getCheckInStatus(shift, approvedOvertimeHours);

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
        if (err.code === 11000) {
            try {
                const today = getTodayIST(employee?.shift || 'Morning');
                const existing = await Attendance.findOne({ employeeId, date: today });
                if (existing) {
                    if (existing.status === 'Absent') {
                        return res.status(403).json({
                            success: false,
                            message: `Check-in window has closed for ${employee?.shift || 'Morning'} shift. Marked as Absent.`,
                            data: existing
                        });
                    }
                    return res.status(400).json({ success: false, message: 'Already checked in today', data: existing });
                }
            } catch (innerErr) {
                console.error('Error finding existing record in duplicate catch:', innerErr);
            }
        }
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

        if (record.garageId) {
            delete lastAutoMarkTimes[record.garageId.toString()];
        }

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

        // Find approved overtime hours for this employee on calendar date today
        const { date: istDate } = getISTTime();
        const calendarToday = istDate.toISOString().split('T')[0];

        let approvedOvertimeHours = 0;
        if (shift === 'Evening') {
            const approvedOvertime = await OvertimeRequest.findOne({
                employeeId: req.params.employeeId,
                date: calendarToday,
                status: 'Approved'
            });
            approvedOvertimeHours = approvedOvertime ? (approvedOvertime.hours || 0) : 0;
        }

        const today = getTodayIST(shift, approvedOvertimeHours);

        // Check if new joining employee is blocked
        if (employee && await isNewEmployeeBlocked(employee)) {
            return res.status(200).json({
                success: true,
                data: {
                    employeeId: req.params.employeeId,
                    isNewJoiningBlocked: true,
                    status: 'New Joining',
                    date: today
                }
            });
        }

        let record = await Attendance.findOne({ employeeId: req.params.employeeId, date: today });
        
        if (!record) {
            const activeLeave = await LeaveRequest.findOne({
                employeeId: req.params.employeeId,
                status: 'Approved',
                startDate: { $lte: today },
                endDate: { $gte: today }
            });

            if (activeLeave) {
                record = {
                    employeeId: req.params.employeeId,
                    status: 'On Leave',
                    leaveStartDate: activeLeave.startDate,
                    leaveEndDate: activeLeave.endDate,
                    date: today
                };
            }
        }

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
            // Skip marking new joining employees absent before their first shift start
            if (await isNewEmployeeBlocked(emp)) {
                continue;
            }
            const shift = emp.shift || 'Morning';

            // Find approved overtime hours for this employee on calendar date today
            const { date: istDate } = getISTTime();
            const calendarToday = istDate.toISOString().split('T')[0];

            let approvedOvertimeHours = 0;
            if (shift === 'Evening') {
                const approvedOvertime = await OvertimeRequest.findOne({
                    employeeId: emp.employeeId,
                    date: calendarToday,
                    status: 'Approved'
                });
                approvedOvertimeHours = approvedOvertime ? (approvedOvertime.hours || 0) : 0;
            }

            const rules = SHIFT_RULES[shift] || SHIFT_RULES.Morning;
            const today = getTodayIST(shift, approvedOvertimeHours);

            let absentAfterMins = toMin(rules.absentAfter);
            if (shift === 'Evening' && approvedOvertimeHours > 0) {
                absentAfterMins -= approvedOvertimeHours * 60;
            }

            let adjustedTotal = total;
            if (shift === 'Night' && total < 12 * 60) {
                adjustedTotal += 24 * 60;
            }

            if (adjustedTotal >= absentAfterMins) {
                const existing = await Attendance.findOne({ employeeId: emp.employeeId, date: today });
                if (!existing) {
                    // Check if employee is on approved leave
                    const activeLeave = await LeaveRequest.findOne({
                        employeeId: emp.employeeId,
                        status: 'Approved',
                        startDate: { $lte: today },
                        endDate: { $gte: today }
                    });

                    try {
                        if (activeLeave) {
                            // Mark as On Leave
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
                                status: 'On Leave',
                                leaveStartDate: activeLeave.startDate,
                                leaveEndDate: activeLeave.endDate
                            });
                        } else {
                            // Mark as Absent
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
                    } catch (err) {
                        if (err.code === 11000) {
                            console.log(`[Auto-Mark] Attendance already exists for ${emp.name} (${emp.employeeId}) on ${today}`);
                        } else {
                            throw err;
                        }
                    }
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
        const garageId = req.params.garageId;
        const now = Date.now();
        const lastMark = lastAutoMarkTimes[garageId] || 0;
        // Only run autoMarkAbsences at most once every 10 minutes (600000ms)
        if (now - lastMark > 10 * 60 * 1000) {
            await autoMarkAbsences(garageId);
            lastAutoMarkTimes[garageId] = now;
        }

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

        // Fetch leave requests for "On Leave" records to ensure leave dates are present
        const onLeaveRecords = updatedRecords.filter(r => r.status === 'On Leave' && (!r.leaveStartDate || !r.leaveEndDate));
        if (onLeaveRecords.length > 0) {
            for (const r of onLeaveRecords) {
                const leave = await LeaveRequest.findOne({
                    employeeId: r.employeeId,
                    status: 'Approved',
                    startDate: { $lte: r.date },
                    endDate: { $gte: r.date }
                });
                if (leave) {
                    r.leaveStartDate = leave.startDate;
                    r.leaveEndDate = leave.endDate;
                }
            }
        }

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

        // Fetch leave requests for "On Leave" records to ensure leave dates are present
        const onLeaveRecords = updatedRecords.filter(r => r.status === 'On Leave' && (!r.leaveStartDate || !r.leaveEndDate));
        if (onLeaveRecords.length > 0) {
            for (const r of onLeaveRecords) {
                const leave = await LeaveRequest.findOne({
                    employeeId: r.employeeId,
                    status: 'Approved',
                    startDate: { $lte: r.date },
                    endDate: { $gte: r.date }
                });
                if (leave) {
                    r.leaveStartDate = leave.startDate;
                    r.leaveEndDate = leave.endDate;
                }
            }
        }

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
        
        if (record.garageId) {
            delete lastAutoMarkTimes[record.garageId.toString()];
        }
        
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        console.error('Delete record error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = { checkIn, checkOut, getTodayStatus, getGarageAttendance, getEmployeeAttendance, deleteRecord };
