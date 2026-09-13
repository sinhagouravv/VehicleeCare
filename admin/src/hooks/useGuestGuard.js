import { useAlert } from '../context/AlertContext';

export const isGuestUser = () => {
    try {
        const stored = localStorage.getItem('adminUser');
        if (!stored) return false;
        const user = JSON.parse(stored);
        if (user?.isGuest === false) return false;
        return (
            user?.role === 'guest_admin' ||
            user?.role === 'guest' ||
            user?.isGuest === true ||
            user?.email === 'guestadmin@vehicleecare.com'
        );
    } catch (e) {
        return false;
    }
};

export const useGuestGuard = () => {
    let triggerAlert = null;
    try {
        const alertCtx = useAlert();
        triggerAlert = alertCtx.triggerAlert;
    } catch (e) {
        // Fallback if rendered outside AlertContext
    }

    const guardGuestAction = (actionCallback) => {
        if (isGuestUser()) {
            if (triggerAlert) {
                triggerAlert("The guest admin only has read rights.", "error");
            } else {
                alert("The guest admin only has read rights");
            }
            return true; // Action blocked
        }
        if (typeof actionCallback === 'function') {
            actionCallback();
        }
        return false; // Action allowed
    };

    return { isGuest: isGuestUser(), guardGuestAction };
};

export default useGuestGuard;
