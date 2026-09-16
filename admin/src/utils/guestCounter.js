import API_BASE_URL from '../config/api';

/**
 * Record a new guest login
 * @param {string} portal - 'admin' | 'garage' | 'employee'
 * @param {object} details - { role, userId, sessionId }
 */
export const recordGuestLogin = async (portal = 'admin', details = {}) => {
    try {
        const payload = {
            portal,
            role: details.role || (portal === 'admin' ? 'guest_admin' : portal === 'garage' ? 'guest_garage' : 'guest_employee'),
            userId: details.userId || (portal === 'admin' ? 'guestadmin@vehicleecare.com' : portal === 'garage' ? 'guestgarage@vehicleecare.com' : 'guestemployee@vehicleecare.com'),
            ...details
        };

        const res = await fetch(`${API_BASE_URL}/api/settings/increment-guest-count`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            const data = await res.json();
            if (data?.log?.sessionId) {
                try {
                    localStorage.setItem('guestCurrentSessionId', data.log.sessionId);
                } catch (e) {}
            }
            // Notify current window
            window.dispatchEvent(new CustomEvent('guestCountUpdated', { detail: data }));

            // Notify other tabs
            try {
                const bc = new BroadcastChannel('guest_tracker_channel');
                bc.postMessage({ type: 'GUEST_LOGIN_RECORDED', data });
                bc.close();
            } catch (e) {}

            try {
                localStorage.setItem('last_guest_login_time', Date.now().toString());
            } catch (e) {}

            return data;
        }
    } catch (err) {
        console.error('Failed to record guest login:', err);
    }
    return null;
};

/**
 * Update guest session status (Ended on logout, Expired on timeout)
 */
export const updateGuestSessionStatus = async (status = 'Ended', reason = 'manual') => {
    try {
        const sessionId = localStorage.getItem('guestCurrentSessionId');
        if (!sessionId) return null;

        const res = await fetch(`${API_BASE_URL}/api/settings/guest-session-status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId,
                status,
                action: status === 'Expired' ? 'TIMEOUT' : 'LOGOUT'
            })
        });

        if (res.ok) {
            const data = await res.json();
            window.dispatchEvent(new CustomEvent('guestSessionStatusChanged', { detail: data }));
            try {
                const bc = new BroadcastChannel('guest_tracker_channel');
                bc.postMessage({ type: 'GUEST_SESSION_STATUS_CHANGED', data });
                bc.close();
            } catch (e) {}
            return data;
        }
    } catch (err) {
        console.error('Failed to update guest session status:', err);
    }
    return null;
};

/**
 * Fetch total live guest login count from server
 */
export const fetchGuestCount = async () => {
    try {
        const res = await fetch(`${API_BASE_URL}/api/settings/guestLoginCount?t=${Date.now()}`);
        if (res.ok) {
            const data = await res.json();
            return typeof data?.data === 'number' ? data.data : (Number(data?.data) || 0);
        }
    } catch (err) {
        console.error('Failed to fetch guest count:', err);
    }
    return 0;
};

/**
 * Fetch all guest login log records
 */
export const fetchGuestLogs = async () => {
    try {
        const res = await fetch(`${API_BASE_URL}/api/settings/guest-logs?t=${Date.now()}`);
        if (res.ok) {
            const data = await res.json();
            return Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
        }
    } catch (err) {
        console.error('Failed to fetch guest logs:', err);
    }
    return [];
};

/**
 * Fetch portal breakdown stats (total, admin, garage, employee)
 */
export const fetchGuestStats = async () => {
    try {
        const res = await fetch(`${API_BASE_URL}/api/settings/guestLoginStats?t=${Date.now()}`);
        if (res.ok) {
            return await res.json();
        }
    } catch (err) {
        console.error('Failed to fetch guest stats:', err);
    }
    return { data: { total: 0, admin: 0, garage: 0, employee: 0 } };
};
