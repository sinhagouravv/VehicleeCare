import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { isGuestUser } from '../hooks/useGuestGuard';

const checkGuestStatus = () => {
    const isGuest = isGuestUser();
    const isDismissed = sessionStorage.getItem('guestWelcomeDismissed') === 'true';
    return isGuest && !isDismissed;
};

const GuestWelcomeModal = () => {
    const [isOpen, setIsOpen] = useState(checkGuestStatus);
    const location = useLocation();

    useEffect(() => {
        setIsOpen(checkGuestStatus());
    }, [location.pathname]);

    const handleGetStarted = () => {
        sessionStorage.setItem('guestWelcomeDismissed', 'true');
        setIsOpen(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#011023]/10 backdrop-blur-[14px] animate-in fade-in duration-300">
            <div className="max-w-[40rem]  w-full text-center animate-in zoom-in-95 duration-300 space-y-6">

                <div className="space-y-3">
                    <h2 className="text-xl font-bold mb-8 text-[#011023] uppercase tracking-tight">
                        Guest Admin Access
                    </h2>
                    <p className="text-sm font-semibold text-gray-600 leading-relaxed uppercase tracking-wide">
                        Welcome to the Vehicleecare Admin Dashboard. You have been granted <strong className="font-bold text-[#011023]">guest admin access</strong>, allowing you to experience the functionality of the admin dashboard. Currently, you have <strong className="font-bold text-[#011023]">read-only access</strong> and can view all real data, excluding sensitive information.
                        <span className="block mt-3">Please adhere to the terms and conditions for a seamless experience.</span>
                    </p>
                </div>
                <div className="pt-16">
                    <button
                        type="button"
                        onClick={handleGetStarted}
                        className="px-14 py-2 bg-white/60 backdrop-blur-sm border border-white/60 text-[#011023] font-bold text-[13px] uppercase tracking-widest rounded-xl transition-all duration-300 cursor-pointer"
                    >
                        Get Started
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GuestWelcomeModal;
