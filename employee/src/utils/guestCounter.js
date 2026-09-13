import API_BASE_URL from '../config/api';

export const recordGuestLogin = async (portal = 'employee') => {
    try {
        const res = await fetch(`${API_BASE_URL}/api/settings/increment-guest-count`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ portal })
        });

        if (res.ok) return;

        // Fallback: fetch current count and update directly
        const getRes = await fetch(`${API_BASE_URL}/api/settings/guestLoginCount`);
        let currentCount = 0;
        if (getRes.ok) {
            const getData = await getRes.json();
            currentCount = typeof getData?.data === 'number' ? getData.data : (Number(getData?.data) || 0);
        }

        await fetch(`${API_BASE_URL}/api/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: 'guestLoginCount', value: currentCount + 1 })
        });
    } catch (err) {
        console.error('Failed to record guest login:', err);
    }
};
