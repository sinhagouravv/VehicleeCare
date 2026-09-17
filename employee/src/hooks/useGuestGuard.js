import { useAlert } from '../context/AlertContext';

export const isGuestUser = () => {
    try {
        const stored = localStorage.getItem('employeeUser');
        if (!stored) return false;
        const user = JSON.parse(stored);
        // Rely solely on the backend-authoritative isGuest flag.
        return user?.isGuest === true;
    } catch (e) {
        return false;
    }
};

export const maskEmail = (email, isGuest = true) => {
    if (!email || email === 'N/A' || email === '—') return email || '—';
    if (!isGuest) return email;
    const parts = String(email).split('@');
    if (parts.length !== 2) return '••••••••••••';
    const [user, domain] = parts;
    const maskedUser = user.length > 3 
        ? `${user.slice(0, 2)}${'*'.repeat(Math.max(4, user.length - 4))}${user.slice(-2)}`
        : `${user[0] || ''}***`;
    const domainParts = domain.split('.');
    const maskedDomain = domainParts[0].length > 2 
        ? `${domainParts[0][0]}***${domainParts[0].slice(-1)}`
        : '***';
    return `${maskedUser}@${maskedDomain}.${domainParts.slice(1).join('.')}`;
};

export const maskPhone = (phone, isGuest = true) => {
    if (!phone || phone === '—' || phone === 'N/A') return phone || '—';
    if (!isGuest) return phone;
    const str = String(phone).trim();
    if (str.length <= 4) return '••••••••';
    return `${str.slice(0, 2)}${'*'.repeat(Math.max(4, str.length - 4))}${str.slice(-2)}`;
};

export const maskAddress = (address, isGuest = true) => {
    if (!address || address === '—' || address === 'N/A' || address === 'No Address Provided') return address || '—';
    if (!isGuest) return address;
    const str = String(address).trim();
    if (str.length <= 6) return '••••••••';
    return `${str.slice(0, 3)}${'*'.repeat(Math.max(6, str.length - 6))}${str.slice(-3)}`;
};

export const isRealValue = (val) => {
    if (!val) return false;
    const str = String(val).trim();
    if (!str || str === '—' || str === '-' || str.toUpperCase() === 'N/A') return false;
    if (str.toLowerCase().startsWith('no ') || str.toLowerCase().includes('no address')) return false;
    return true;
};

export const maskTransactionId = (txnId, isGuest = true) => {
    if (!txnId || txnId === '—' || txnId === 'N/A') return txnId || '—';
    if (!isGuest) return txnId;
    const str = String(txnId).trim();
    if (str.length <= 4) return '••••••••••••';
    return `${str.slice(0, 3)}${'*'.repeat(Math.max(6, str.length - 6))}${str.slice(-3)}`;
};

export const maskProfilePicture = (src, isGuest = true) => {
    if (!isGuest) return src;
    return '';
};

export const useGuestGuard = () => {
    let triggerAlert = null;
    try {
        const alertCtx = useAlert();
        triggerAlert = alertCtx.triggerAlert;
    } catch (e) {
        // Fallback if rendered outside AlertContext
    }

    const isGuest = isGuestUser();

    const guardGuestAction = (actionCallback) => {
        if (isGuest) {
            if (triggerAlert) {
                triggerAlert("The guest employee only has read rights.", "error");
            } else {
                alert("The guest employee only has read rights.");
            }
            return true; // Action blocked
        }
        if (typeof actionCallback === 'function') {
            actionCallback();
        }
        return false; // Action allowed
    };

    return { 
        isGuest, 
        guardGuestAction,
        maskEmail: (email) => maskEmail(email, isGuest),
        maskPhone: (phone) => maskPhone(phone, isGuest),
        maskAddress: (address) => maskAddress(address, isGuest),
        maskTransactionId: (txnId) => maskTransactionId(txnId, isGuest),
        isRealValue
    };
};

export default useGuestGuard;
