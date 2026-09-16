import API_BASE_URL from '../config/api';

/**
 * Record a new guest login from garage portal
 * @param {string} portal - 'garage'
 * @param {object} details - { role, userId, sessionId }
 */
export const recordGuestLogin = async (portal = 'garage', details = {}) => {
    try {
        const payload = {
            portal,
            role: details.role || 'guest_garage',
            userId: details.userId || 'guestgarage@vehicleecare.com',
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
            window.dispatchEvent(new CustomEvent('guestCountUpdated', { detail: data }));
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
        console.error('Failed to record garage guest login:', err);
    }
    return null;
};

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
        console.error('Failed to update garage guest session status:', err);
    }
    return null;
};

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
