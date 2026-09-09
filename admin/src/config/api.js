export const API_BASE_URL = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5001'
    : (import.meta.env.VITE_API_URL || 'https://vehicleecare.onrender.com');

export default API_BASE_URL;
