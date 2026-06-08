
const cron = require('node-cron');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const { SHIFT_RULES, getISTTime, getTodayIST, toMin, getCheckOutStatusForTime } = require('../utils/attendanceHelpers');

/**
 * Automatically mark employees as 'Absent' if they haven't checked in 
 * by the 'absentAfter' threshold of their respective shift.
 */
const autoMarkAllAbsences = async () => {
    try {
        const { total: currentTotalMinutes } = getISTTime();
        const employees = await Employee.find({});

        let count = 0;
        for (const emp of employees) {
            const shift = emp.shift || 'Morning';
            const rules = SHIFT_RULES[shift];
            const today = getTodayIST(shift);

            let adjustedTotal = currentTotalMinutes;
            // Handle Night shift window comparison
            if (shift === 'Night' && currentTotalMinutes < 12 * 60) {
                adjustedTotal += 24 * 60;
            }

            // If current time is past the absent threshold
            if (adjustedTotal >= toMin(rules.absentAfter)) {
                const existing = await Attendance.findOne({ 
                    employeeId: emp.employeeId, 
                    date: today 
                });

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
                    console.log(`[Cron] Marked ${emp.name} (${emp.employeeId}) as Absent for ${today}`);
                    count++;
                }
            }
        }
        if (count > 0) {
            console.log(`[Cron] Auto-marked ${count} absences at ${new Date().toISOString()}`);
        }
    } catch (err) {
        console.error('[Cron] Error in autoMarkAllAbsences:', err);
    }
};

/**
 * Automatically check out any employee who hasn't checked out by 9:20 PM (21:20).
 * Sets their checkout time to 9:20 PM on that record's day, and updates their status.
 */
const autoCheckOutAllEmployees = async () => {
    try {
        const todayStr = getTodayIST('Morning'); // Standard YYYY-MM-DD
        
        // Find all records where checkIn is not null, but checkOut is null
        const recordsToCheckout = await Attendance.find({
            checkIn: { $ne: null },
            checkOut: null
        });

        let count = 0;
        for (const rec of recordsToCheckout) {
            const employee = await Employee.findOne({ employeeId: rec.employeeId });
            const shift = employee?.shift || rec.shift || 'Morning';

            // Skip today's Night shift record (since it just started at 21:00)
            if (rec.date === todayStr && shift === 'Night') {
                continue;
            }

            // Set checkout time to 9:20 PM IST of that record's day
            const checkoutDate = new Date(`${rec.date}T15:50:00.000Z`);
            rec.checkOut = checkoutDate;

            // Update status based on checking out at 9:20 PM (1280 minutes)
            const oldStatus = rec.status;
            const newStatus = getCheckOutStatusForTime(shift, oldStatus, 1280);
            rec.status = newStatus;

            await rec.save();
            console.log(`[Cron Auto-Checkout] Checked out ${rec.employeeName} (${rec.employeeId}) for ${rec.date}. Status: ${oldStatus} -> ${newStatus}`);
            count++;
        }
        if (count > 0) {
            console.log(`[Cron Auto-Checkout] Checked out ${count} employees successfully.`);
        }
    } catch (err) {
        console.error('[Cron] Error in autoCheckOutAllEmployees:', err);
    }
};

// Schedule: Every 30 minutes
// This ensures that shortly after 09:20, 15:20, and 21:20, missing employees are marked.
const initAttendanceCron = () => {
    console.log('Initializing Attendance Cron Job (Every 30 mins)');
    cron.schedule('*/30 * * * *', () => {
        autoMarkAllAbsences();
    });

    // Schedule auto-checkout at 9:20 PM (21:20) daily
    console.log('Scheduling Auto-Checkout Cron Job (Daily at 9:20 PM)');
    cron.schedule('20 21 * * *', () => {
        console.log('[Cron] Triggering daily auto-checkout at 9:20 PM');
        autoCheckOutAllEmployees();
    });

    // Also run once on startup to catch anything missed during downtime
    autoMarkAllAbsences();
    autoCheckOutAllEmployees();
};

module.exports = { initAttendanceCron };
