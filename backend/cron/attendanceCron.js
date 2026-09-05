
const cron = require('node-cron');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const OvertimeRequest = require('../models/OvertimeRequest');
const { SHIFT_RULES, getISTTime, getTodayIST, toMin, getCheckOutStatusForTime, isNewEmployeeBlocked } = require('../utils/attendanceHelpers');

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
            // Skip marking new joining employees absent before their first shift start
            if (await isNewEmployeeBlocked(emp)) {
                continue;
            }
            const isDev = (emp.category || '').toLowerCase() === 'developer';
            const shift = isDev ? 'Full Day' : (emp.shift || 'Morning');
            const rules = SHIFT_RULES[shift] || SHIFT_RULES['Full Day'] || SHIFT_RULES.Morning;
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
                    try {
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
                    } catch (err) {
                        if (err.code === 11000) {
                            console.log(`[Cron] Attendance already exists for ${emp.name} (${emp.employeeId}) on ${today}`);
                        } else {
                            throw err;
                        }
                    }
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
 * Automatically check out any employee who hasn't checked out by their shift's checkout deadline:
 * - Morning shift: 3:20 PM (15:20 IST), or later if they have an approved overtime request.
 * - Other shifts: 9:20 PM (21:20 IST)
 * Sets their checkout time on that record's day, and updates their status.
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
            const isDev = (employee?.category || '').toLowerCase() === 'developer';
            const shift = isDev ? 'Full Day' : (employee?.shift || rec.shift || 'Morning');

            // Skip today's Night shift record (since it just started at 21:00)
            if (rec.date === todayStr && shift === 'Night') {
                continue;
            }

            let threshold = 21 * 60 + 20; // Default: 9:20 PM (21:20 IST)
            let checkoutTimeStr = 'T15:50:00.000Z'; // 21:20 IST in UTC

            if (shift === 'Full Day' || shift === 'FULL DAY') {
                threshold = 17 * 60 + 20; // 5:20 PM
                checkoutTimeStr = 'T11:50:00.000Z'; // 5:20 PM IST in UTC

                // Query for approved overtime request for this employee on this date
                const approvedOvertime = await OvertimeRequest.findOne({
                    employeeId: rec.employeeId,
                    date: rec.date,
                    status: 'Approved'
                });

                if (approvedOvertime) {
                    const otHours = approvedOvertime.hours || 0;
                    threshold += otHours * 60;
                    
                    const totalUTCMinutes = 11 * 60 + 50 + (otHours * 60);
                    const hrUTC = Math.floor(totalUTCMinutes / 60) % 24;
                    const minUTC = totalUTCMinutes % 60;
                    checkoutTimeStr = `T${hrUTC.toString().padStart(2, '0')}:${minUTC.toString().padStart(2, '0')}:00.000Z`;
                }
            } else if (shift === 'Morning') {
                threshold = 15 * 60 + 20; // 3:20 PM
                checkoutTimeStr = 'T09:50:00.000Z'; // 3:20 PM IST in UTC

                // Query for approved overtime request for this employee on this date
                const approvedOvertime = await OvertimeRequest.findOne({
                    employeeId: rec.employeeId,
                    date: rec.date,
                    status: 'Approved'
                });

                if (approvedOvertime) {
                    const otHours = approvedOvertime.hours || 0;
                    threshold += otHours * 60;
                    
                    const totalUTCMinutes = 9 * 60 + 50 + (otHours * 60);
                    const hrUTC = Math.floor(totalUTCMinutes / 60) % 24;
                    const minUTC = totalUTCMinutes % 60;
                    checkoutTimeStr = `T${hrUTC.toString().padStart(2, '0')}:${minUTC.toString().padStart(2, '0')}:00.000Z`;
                }
            }

            // Skip today's records for all shifts if the current time is before the threshold
            if (rec.date === todayStr) {
                const { total: currentTotalMinutes } = getISTTime();
                if (currentTotalMinutes < threshold) {
                    continue;
                }
            }

            // Set checkout time
            const checkoutDate = new Date(`${rec.date}${checkoutTimeStr}`);
            rec.checkOut = checkoutDate;

            // Update status based on checkout time
            const oldStatus = rec.status;
            const newStatus = getCheckOutStatusForTime(shift, oldStatus, threshold);
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

    // Run auto-checkout check every 10 minutes
    console.log('Initializing Auto-Checkout Cron Job (Every 10 mins)');
    cron.schedule('*/10 * * * *', () => {
        autoCheckOutAllEmployees();
    });

    // Also run once on startup to catch anything missed during downtime
    autoMarkAllAbsences();
    autoCheckOutAllEmployees();
};

module.exports = { initAttendanceCron };
