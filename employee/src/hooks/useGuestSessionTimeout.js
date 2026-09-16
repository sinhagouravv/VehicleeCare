import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { isGuestUser } from './useGuestGuard';
import { useAlert } from '../context/AlertContext';
import { broadcastEmployeeLogout } from './useMultiTabAuthSync';
import { updateGuestSessionStatus } from '../utils/guestCounter';

const TIMEOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const START_KEY = 'guestSessionStartTime';
const ACTIVITY_KEY = 'guestLastActivity';
const EXPIRED_KEY = 'guestSessionExpired';

export const useGuestSessionTimeout = () => {
    const navigate = useNavigate();
    const { triggerAlert } = useAlert();
    const lastThrottledUpdateRef = useRef(0);
    const isTerminatingRef = useRef(false);

    useEffect(() => {
        if (!isGuestUser()) return;

        const now = Date.now();

        // Initialize session timestamps if not present
        if (!localStorage.getItem(START_KEY)) {
            localStorage.setItem(START_KEY, String(now));
        }
        if (!localStorage.getItem(ACTIVITY_KEY)) {
            localStorage.setItem(ACTIVITY_KEY, String(now));
        }

        const terminateSession = (reason) => {
            if (isTerminatingRef.current) return;
            isTerminatingRef.current = true;

            updateGuestSessionStatus('Expired', reason);

            // Broadcast to other tabs as a system-initiated logout
            broadcastEmployeeLogout('system');

            // Clear credentials and guest session markers
            localStorage.removeItem('employeeToken');
            localStorage.removeItem('employeeUser');
            localStorage.removeItem('guestWelcomeDismissed');
            sessionStorage.removeItem('guestWelcomeDismissed');
            localStorage.removeItem(START_KEY);
            localStorage.removeItem(ACTIVITY_KEY);

            // Broadcast to other tabs
            try {
                localStorage.setItem(EXPIRED_KEY, JSON.stringify({ time: Date.now(), reason }));
            } catch (e) {
                // ignore
            }

            const alertMsg = reason === 'inactivity'
                ? 'Guest employee session timed out due to 15 minutes of inactivity.'
                : 'Guest employee session timed out (15-minute maximum limit reached).';

            if (triggerAlert) {
                triggerAlert(alertMsg, 'error');
            }

            navigate('/login', {
                replace: true,
                state: { sessionExpired: true, reason }
            });
        };

        // Track user activity across events (throttled to every 3 seconds)
        const updateActivity = () => {
            const currentTime = Date.now();
            if (currentTime - lastThrottledUpdateRef.current > 3000) {
                lastThrottledUpdateRef.current = currentTime;
                localStorage.setItem(ACTIVITY_KEY, String(currentTime));
            }
        };

        const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
        activityEvents.forEach(evt => window.addEventListener(evt, updateActivity, { passive: true }));

        // Check for inactivity or max session duration periodically
        const intervalId = setInterval(() => {
            if (!isGuestUser()) {
                clearInterval(intervalId);
                return;
            }

            const currentTime = Date.now();
            const sessionStart = parseInt(localStorage.getItem(START_KEY) || '0', 10);
            const lastActivity = parseInt(localStorage.getItem(ACTIVITY_KEY) || '0', 10);

            if (!sessionStart || !lastActivity) return;

            const idleTime = currentTime - lastActivity;
            const totalDuration = currentTime - sessionStart;

            if (idleTime >= TIMEOUT_DURATION_MS) {
                terminateSession('inactivity');
            } else if (totalDuration >= TIMEOUT_DURATION_MS) {
                terminateSession('max_duration');
            }
        }, 1000);

        // Sync expiration across tabs
        const handleStorage = (e) => {
            if (e.key === EXPIRED_KEY && e.newValue) {
                try {
                    const parsed = JSON.parse(e.newValue);
                    terminateSession(parsed?.reason || 'timeout');
                } catch {
                    terminateSession('timeout');
                }
            }
        };
        window.addEventListener('storage', handleStorage);

        return () => {
            clearInterval(intervalId);
            activityEvents.forEach(evt => window.removeEventListener(evt, updateActivity));
            window.removeEventListener('storage', handleStorage);
        };
    }, [navigate, triggerAlert]);
};

export default useGuestSessionTimeout;
