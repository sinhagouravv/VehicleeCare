import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAlert } from '../context/AlertContext';

export const GARAGE_AUTH_CHANNEL = 'vehicleecare_garage_auth';
export const GARAGE_LOGOUT_SYNC_KEY = 'garage_logout_sync';

/**
 * Broadcasts a garage logout event across all open browser tabs and clears auth storage.
 */
export const broadcastGarageLogout = () => {
    try {
        localStorage.removeItem('garageToken');
        localStorage.removeItem('garageUser');
        localStorage.removeItem('guestWelcomeDismissed');
        sessionStorage.removeItem('guestWelcomeDismissed');
        localStorage.removeItem('guestSessionStartTime');
        localStorage.removeItem('guestLastActivity');
        localStorage.removeItem('guestSessionExpired');
        
        // Trigger storage event in other tabs
        localStorage.setItem(GARAGE_LOGOUT_SYNC_KEY, Date.now().toString());

        // Also broadcast via BroadcastChannel for instant same-browser cross-tab delivery
        if (typeof BroadcastChannel !== 'undefined') {
            const bc = new BroadcastChannel(GARAGE_AUTH_CHANNEL);
            bc.postMessage({ type: 'LOGOUT', timestamp: Date.now() });
            bc.close();
        }
    } catch (err) {
        console.error('Error during garage logout broadcast:', err);
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
                (e.key === 'garageToken' && !e.newValue) ||
                e.key === GARAGE_LOGOUT_SYNC_KEY ||
                (!e.key && !localStorage.getItem('garageToken'))
            ) {
                performTabLogout(true);
            }
        };

        // 2. BroadcastChannel listener
        let channel;
        if (typeof BroadcastChannel !== 'undefined') {
            try {
                channel = new BroadcastChannel(GARAGE_AUTH_CHANNEL);
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
            const token = localStorage.getItem('garageToken');
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
