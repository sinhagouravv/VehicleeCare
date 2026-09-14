import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAlert } from '../context/AlertContext';

export const GARAGE_AUTH_CHANNEL = 'vehicleecare_garage_auth';
export const GARAGE_LOGOUT_SYNC_KEY = 'garage_logout_sync';

/**
 * Broadcasts a garage logout event across all open browser tabs and clears auth storage.
 * @param {string|object} options - 'manual' or 'system', or an object with reason
 */
export const broadcastGarageLogout = (options = 'manual') => {
    try {
        const reason = typeof options === 'string' ? options : (options?.reason || 'manual');
        const syncPayload = { timestamp: Date.now(), reason };

        // Record sync payload before clearing auth tokens
        localStorage.setItem(GARAGE_LOGOUT_SYNC_KEY, JSON.stringify(syncPayload));

        localStorage.removeItem('garageToken');
        localStorage.removeItem('garageUser');
        localStorage.removeItem('guestWelcomeDismissed');
        sessionStorage.removeItem('guestWelcomeDismissed');
        localStorage.removeItem('guestSessionStartTime');
        localStorage.removeItem('guestLastActivity');
        localStorage.removeItem('guestSessionExpired');

        // Also broadcast via BroadcastChannel for instant same-browser cross-tab delivery
        if (typeof BroadcastChannel !== 'undefined') {
            const bc = new BroadcastChannel(GARAGE_AUTH_CHANNEL);
            bc.postMessage({ type: 'LOGOUT', reason, timestamp: Date.now() });
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
        const performTabLogout = (isSystemLogout = false) => {
            if (isSystemLogout && triggerAlert) {
                triggerAlert('You have been logged out from another tab.', 'info');
            }
            navigate('/login', { replace: true });
        };

        const checkIsSystemLogout = (parsedData) => {
            return parsedData?.reason === 'system';
        };

        // 1. Cross-tab storage event listener
        const handleStorageChange = (e) => {
            if (e.key === GARAGE_LOGOUT_SYNC_KEY && e.newValue) {
                try {
                    const parsed = JSON.parse(e.newValue);
                    performTabLogout(checkIsSystemLogout(parsed));
                } catch {
                    performTabLogout(false);
                }
            } else if (e.key === 'guestSessionExpired' && e.newValue) {
                // System session expiration (guest timeout)
                performTabLogout(true);
            } else if (e.key === 'garageToken' && !e.newValue) {
                try {
                    const syncRaw = localStorage.getItem(GARAGE_LOGOUT_SYNC_KEY);
                    const parsed = syncRaw ? JSON.parse(syncRaw) : null;
                    performTabLogout(checkIsSystemLogout(parsed));
                } catch {
                    performTabLogout(false);
                }
            }
        };

        // 2. BroadcastChannel listener
        let channel;
        if (typeof BroadcastChannel !== 'undefined') {
            try {
                channel = new BroadcastChannel(GARAGE_AUTH_CHANNEL);
                channel.onmessage = (event) => {
                    if (event.data?.type === 'LOGOUT') {
                        const isSystem = event.data?.reason === 'system';
                        performTabLogout(isSystem);
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
                try {
                    const syncRaw = localStorage.getItem(GARAGE_LOGOUT_SYNC_KEY);
                    const parsed = syncRaw ? JSON.parse(syncRaw) : null;
                    performTabLogout(checkIsSystemLogout(parsed));
                } catch {
                    performTabLogout(false);
                }
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
