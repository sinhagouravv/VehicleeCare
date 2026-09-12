import { useAlert } from '../context/AlertContext';

export const isGuestUser = () => {
    try {
        const stored = localStorage.getItem('garageUser');
        if (!stored) return false;
        const user = JSON.parse(stored);
        return (
            user?.role === 'guest_garage' ||
            user?.role === 'guest_admin' ||
            user?.role === 'guest' ||
            user?.isGuest === true ||
            user?.ownerEmail === 'guestgarage@vehicleecare.com' ||
            user?.ownerEmail === 'guestadmin@vehicleecare.com' ||
            user?.garageId === '663428591'
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
                triggerAlert("The guest garage only has read rights.", "error");
            } else {
                alert("The guest garage only has read rights");
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
