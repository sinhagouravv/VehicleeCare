
// Shift Rules (all times in IST HH:MM 24h)
const SHIFT_RULES = {
    Morning: {
        start:      { h: 9,  m: 0  },   // 09:00 → on time
        lateAfter:  { h: 9,  m: 5  },   // 09:05 → Late
        absentAfter:{ h: 9,  m: 20 },   // 09:20 → can't check-in, mark Absent
        end:        { h: 15, m: 0  },   // 15:00 → shift ends
        overtimeAfter: { h: 15, m: 5 } // 15:05 → Overtime on check-out
    },
    Evening: {
        start:      { h: 15, m: 0  },   // 15:00 → on time
        lateAfter:  { h: 15, m: 5  },   // 15:05 → Late
        absentAfter:{ h: 15, m: 20 },   // 15:20 → Absent
        end:        { h: 21, m: 0  },   // 21:00 → shift ends
        overtimeAfter: { h: 21, m: 5 } // 21:05 → Overtime
    },
    Night: {
        start:      { h: 21, m: 0  },   // 21:00 → on time
        lateAfter:  { h: 21, m: 5  },   // 21:05 → Late
        absentAfter:{ h: 21, m: 20 },   // 21:20 → Absent
        end:        { h: 3,  m: 0  },   // 03:00 next day → shift ends
        overtimeAfter: { h: 3, m: 5 }  // 03:05 → Overtime
    }
};

const getISTTime = () => {
    const now = new Date();
    const istMs = now.getTime() + (5.5 * 60 * 60 * 1000);
    const ist = new Date(istMs);
    const h = ist.getUTCHours();
    const m = ist.getUTCMinutes();
    return { h, m, total: h * 60 + m, date: ist };
};

const getTodayIST = (shift = 'Morning', approvedOvertimeHours = 0) => {
    const { h, m, date } = getISTTime();
    const rules = SHIFT_RULES[shift] || SHIFT_RULES.Morning;
    
    const currentMins = h * 60 + m;
    const startMins = rules.start.h * 60 + rules.start.m;
    
    let windowStartMins = startMins - 15;
    if (shift === 'Evening' && approvedOvertimeHours > 0) {
        windowStartMins -= approvedOvertimeHours * 60;
    }
    
    let isPreviousBusinessDay = false;

    if (shift === 'Night') {
        if (currentMins < windowStartMins) {
            isPreviousBusinessDay = true;
        }
    } else {
        if (currentMins < windowStartMins) {
            isPreviousBusinessDay = true;
        }
    }

    if (isPreviousBusinessDay) {
        const yesterday = new Date(date);
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toISOString().split('T')[0];
    }
    
    return date.toISOString().split('T')[0];
};

const toMin = ({ h, m }) => h * 60 + m;

const getCheckOutStatusForTime = (shift, currentStatus, totalMinutes) => {
    if (shift === 'Evening') {
        return currentStatus;
    }
    const rules = SHIFT_RULES[shift] || SHIFT_RULES.Morning;

    let adjustedTotal = totalMinutes;
    let adjustedOvertimeThreshold = toMin(rules.overtimeAfter);

    if (shift === 'Night') {
        if (totalMinutes < 12 * 60) {
            adjustedTotal += 24 * 60;
        }
        adjustedOvertimeThreshold += 24 * 60;
    }

    if (adjustedTotal >= adjustedOvertimeThreshold) return 'Overtime';
    return currentStatus; // Keep existing status (Present/Late)
};

const getShiftWindowStart = (date, shift) => {
    const y = date.getUTCFullYear();
    const m = date.getUTCMonth();
    const d = date.getUTCDate();
    
    // Morning window start: 8:45 AM IST -> 3:15 AM UTC
    // Evening window start: 2:46 PM (14:46) IST -> 9:16 AM UTC
    // Night window start: 8:45 PM (20:45) IST -> 15:15 UTC (3:15 PM UTC)
    if (shift === 'Evening') {
        return new Date(Date.UTC(y, m, d, 9, 16, 0));
    } else if (shift === 'Night') {
        return new Date(Date.UTC(y, m, d, 15, 15, 0));
    } else {
        return new Date(Date.UTC(y, m, d, 3, 15, 0));
    }
};

const getShiftWindowStartForISTDate = (istDateStr, shift) => {
    const [year, month, day] = istDateStr.split('-').map(Number);
    const y = year;
    const m = month - 1;
    const d = day;
    
    if (shift === 'Evening') {
        return new Date(Date.UTC(y, m, d, 9, 16, 0));
    } else if (shift === 'Night') {
        return new Date(Date.UTC(y, m, d, 15, 15, 0));
    } else {
        return new Date(Date.UTC(y, m, d, 3, 15, 0));
    }
};

const isNewEmployeeBlocked = async (emp) => {
    if (!emp) return false;
    
    const mongoose = require('mongoose');
    const Attendance = mongoose.model('Attendance');
    
    // 1. Check if the employee has checked in before
    const hasCheckedInBefore = await Attendance.exists({ 
        employeeId: emp.employeeId, 
        checkIn: { $ne: null } 
    });
    if (hasCheckedInBefore) {
        return false;
    }

    // 2. Calculate tomorrow relative to their creation date in IST
    const shift = emp.shift || 'Morning';
    const createdAt = emp.createdAt ? new Date(emp.createdAt) : new Date();
    
    // Convert createdAt to IST and add 1 day
    const istMs = createdAt.getTime() + (5.5 * 60 * 60 * 1000);
    const istDate = new Date(istMs);
    istDate.setUTCDate(istDate.getUTCDate() + 1);
    const tomorrowISTStr = istDate.toISOString().split('T')[0];
    
    // Construct first eligible window start (tomorrow's shift start window)
    const firstEligibleWindow = getShiftWindowStartForISTDate(tomorrowISTStr, shift);

    // 3. Compare with current time
    const now = new Date();
    return now < firstEligibleWindow;
};

module.exports = {
    SHIFT_RULES,
    getISTTime,
    getTodayIST,
    toMin,
    getCheckOutStatusForTime,
    getShiftWindowStart,
    isNewEmployeeBlocked
};
