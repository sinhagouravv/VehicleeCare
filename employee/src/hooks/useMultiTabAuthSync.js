import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAlert } from '../context/AlertContext';

export const EMPLOYEE_AUTH_CHANNEL = 'vehicleecare_employee_auth';
export const EMPLOYEE_LOGOUT_SYNC_KEY = 'employee_logout_sync';

/**
 * Broadcasts an employee logout event across all open browser tabs and clears auth storage.
 */
export const broadcastEmployeeLogout = () => {
    try {
        localStorage.removeItem('employeeToken');
        localStorage.removeItem('employeeUser');
        localStorage.removeItem('guestWelcomeDismissed');
        sessionStorage.removeItem('guestWelcomeDismissed');
        localStorage.removeItem('guestSessionStartTime');
        localStorage.removeItem('guestLastActivity');
        localStorage.removeItem('guestSessionExpired');
        
        // Trigger storage event in other tabs
        localStorage.setItem(EMPLOYEE_LOGOUT_SYNC_KEY, Date.now().toString());

        // Also broadcast via BroadcastChannel for instant same-browser cross-tab delivery
        if (typeof BroadcastChannel !== 'undefined') {
            const bc = new BroadcastChannel(EMPLOYEE_AUTH_CHANNEL);
            bc.postMessage({ type: 'LOGOUT', timestamp: Date.now() });
            bc.close();
        }
    } catch (err) {
        console.error('Error during employee logout broadcast:', err);
    }
};

/**
 * Hook to automatically detect logout from other tabs and redirect this tab to /login.
 */
export const useMultiTabAuthSync = () => {
    const navigate = useNavigate();
    const { triggerAlert } = useAlert() || {};

    useEffect(() => {
        const performTabLogout = (notify = true) => {
            if (notify && triggerAlert) {
                triggerAlert('You have been logged out from another tab.', 'info');
            }
            navigate('/login', { replace: true });
        };

        // 1. Cross-tab storage event listener
        const handleStorageChange = (e) => {
            if (
                (e.key === 'employeeToken' && !e.newValue) ||
                e.key === EMPLOYEE_LOGOUT_SYNC_KEY ||
                (!e.key && !localStorage.getItem('employeeToken'))
            ) {
                performTabLogout(true);
            }
        };

        // 2. BroadcastChannel listener
        let channel;
        if (typeof BroadcastChannel !== 'undefined') {
            try {
                channel = new BroadcastChannel(EMPLOYEE_AUTH_CHANNEL);
                channel.onmessage = (event) => {
                    if (event.data?.type === 'LOGOUT') {
                        performTabLogout(true);
                    }
                };
            } catch (err) {
                console.error('Error setting up BroadcastChannel:', err);
            }
        }

        // 3. Focus / Visibility check: if user returns to this tab after logging out in another tab
        const handleFocusOrVisibility = () => {
            const token = localStorage.getItem('employeeToken');
            if (!token) {
                performTabLogout(false);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('focus', handleFocusOrVisibility);
        document.addEventListener('visibilitychange', handleFocusOrVisibility);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('focus', handleFocusOrVisibility);
            document.removeEventListener('visibilitychange', handleFocusOrVisibility);
            if (channel) {
                try {
                    channel.close();
                } catch (e) {
                    // ignore
                }
            }
        };
    }, [navigate, triggerAlert]);
};

export default useMultiTabAuthSync;
