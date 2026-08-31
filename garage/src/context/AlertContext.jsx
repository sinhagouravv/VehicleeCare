import React, { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

const AlertContext = createContext();

export const useAlert = () => {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
};

export const AlertProvider = ({ children }) => {
    const [alertState, setAlertState] = useState({ show: false, message: '', phase: 'hidden', type: 'error' });

    const triggerAlert = useCallback((msg, type = 'error') => {
        // Simple mechanism to prevent overlapping alerts
        setAlertState(prev => {
            if (prev.show) return prev;
            return { show: true, message: msg, phase: 'ball-top', type };
        });

        setTimeout(() => setAlertState({ show: true, message: msg, phase: 'ball-center', type }), 50);
        setTimeout(() => setAlertState({ show: true, message: msg, phase: 'line', type }), 500);
        setTimeout(() => setAlertState({ show: true, message: msg, phase: 'ball-center', type }), 5500);
        setTimeout(() => setAlertState({ show: true, message: msg, phase: 'ball-top', type }), 6000);
        setTimeout(() => setAlertState({ show: false, message: '', phase: 'hidden', type }), 6500);
    }, []);

    return (
        <AlertContext.Provider value={{ triggerAlert }}>
            {children}
            
            {/* Global Custom Animated Alert */}
            {alertState.show && createPortal(
                <div className={`fixed inset-x-0 top-14 z-[9999] flex justify-center pointer-events-none px-4`}>
                    <div 
                        className={`${alertState.type === 'success' || alertState.type === 'info' ? 'bg-emerald-100 border-emerald-200 shadow-emerald-500/10' : 'bg-rose-100 border-rose-200 shadow-rose-500/10'} border flex items-center justify-center transition-all duration-[500ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] overflow-hidden rounded-full
                            ${alertState.phase === 'ball-top' ? 'max-w-[40px] min-w-[40px] px-0 h-10 -translate-y-24 opacity-0 scale-50' : ''}
                            ${alertState.phase === 'ball-center' ? 'max-w-[40px] min-w-[40px] px-0 h-10 translate-y-0 opacity-100 scale-100' : ''}
                            ${alertState.phase === 'line' ? 'max-w-[750px] min-w-[100px] px-8 py-2.5 min-h-[44px] h-auto translate-y-0 opacity-100 scale-100' : ''}
                        `}
                    >
                        <span className={`${alertState.type === 'success' || alertState.type === 'info' ? 'text-emerald-700' : 'text-rose-500'} font-semibold text-[12.5px] tracking-wider uppercase transition-opacity duration-300 text-center whitespace-pre-line leading-snug
                            ${alertState.phase === 'line' ? 'opacity-100 delay-300' : 'opacity-0'}
                        `}>
                            {alertState.message}
                        </span>
                    </div>
                </div>,
                document.body
            )}
        </AlertContext.Provider>
    );
};
