
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

const getTodayIST = (shift = 'Morning') => {
    const { h, m, date } = getISTTime();
    const rules = SHIFT_RULES[shift] || SHIFT_RULES.Morning;
    
    const currentMins = h * 60 + m;
    const startMins = rules.start.h * 60 + rules.start.m;
    const windowStartMins = startMins - 15; 
    
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

module.exports = {
    SHIFT_RULES,
    getISTTime,
    getTodayIST,
    toMin
};
