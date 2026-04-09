
const cron = require('node-cron');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const { SHIFT_RULES, getISTTime, getTodayIST, toMin } = require('../utils/attendanceHelpers');

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

// Schedule: Every 30 minutes
// This ensures that shortly after 09:20, 15:20, and 21:20, missing employees are marked.
const initAttendanceCron = () => {
    console.log('Initializing Attendance Cron Job (Every 30 mins)');
    cron.schedule('*/30 * * * *', () => {
        autoMarkAllAbsences();
    });

    // Also run once on startup to catch anything missed during downtime
    autoMarkAllAbsences();
};

module.exports = { initAttendanceCron };
