import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ShieldCheck, Lock, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { isGuestUser } from '../hooks/useGuestGuard';
import ToggleSwitch from './ui/toggle-switch-glass';
import { useAlert } from '../context/AlertContext';

const checkGuestStatus = () => {
    const isGuest = isGuestUser();
    const isDismissed = 
        localStorage.getItem('guestWelcomeDismissed') === 'true' || 
        sessionStorage.getItem('guestWelcomeDismissed') === 'true';
    return isGuest && !isDismissed;
};

const policyData = {
    terms: {
        title: "Terms and Conditions",
        subtitle: "Guest Employee Access",
        icon: <FileText className="text-[#527FB0]" size={22} />,
        paragraphs: [
            "VehicleeCare provides Guest Employee access solely to allow authorized users to explore and experience the functionality and features of the Employee Dashboard.",
            "Guest Employee accounts are provided with read-only access. You may view authorized employee information, but you may not modify, delete, manipulate, download, reproduce, distribute, or misuse any data displayed within the dashboard.",
            "Access to certain features, records, and sensitive information may be restricted based on your assigned permissions. You must not attempt to bypass these restrictions, access unauthorized areas, or interfere with the operation or security of the platform.",
            "All information accessible through the dashboard should be treated as confidential and for authorized viewing only, unless explicitly identified as public information.",
            "VehicleeCare reserves the right to modify, suspend, or terminate Guest Employee access at any time if misuse, unauthorized activity, or a violation of these terms is detected.",
            "By selecting “Get Started”, you acknowledge that you have read, understood, and agree to these Terms & Conditions and will use the dashboard responsibly and only for its intended purpose."
        ]
    },
    privacy: {
        title: "Privacy Policy",
        subtitle: "Privacy & Data Protection",
        icon: <ShieldCheck className="text-[#527FB0]" size={22} />,
        paragraphs: [
            "VehicleeCare respects your privacy and is committed to protecting information accessed through the Employee Dashboard. We take reasonable technical and organizational measures to maintain the confidentiality and security of information available through the platform.",
            "During your Guest Employee session, we may collect certain technical and usage information, including your IP address, device information, browser information, access time, and relevant activity logs. This information may be used for authentication, security monitoring, auditing, troubleshooting, abuse prevention, and service improvement.",
            "Guest Employee access is limited to authorized information, and sensitive, confidential, or personally identifiable information may be restricted or excluded based on your access level.",
            "Information collected through the dashboard will be handled responsibly and used only for legitimate operational, security, administrative, and service-related purposes.",
            "By continuing to use the Guest Employee Dashboard, you acknowledge and understand that the information described above may be collected and processed for the purposes stated in this Privacy Policy."
        ]
    },
    security: {
        title: "Security Protection",
        subtitle: "Security & Monitoring",
        icon: <Lock className="text-[#527FB0]" size={22} />,
        paragraphs: [
            "Guest Employee access is provided for authorized and controlled use only. Users are expected to use the dashboard responsibly and comply with all applicable policies, security requirements, and access restrictions.",
            "Any attempt to bypass authentication or access controls, gain unauthorized privileges, modify or delete data, access restricted information, or interfere with the platform's operation is strictly prohibited.",
            "For security purposes, your activity on this Guest Employee page may be monitored and recorded. This may include your IP address, device and browser information, access time, and relevant activity logs. This information is collected for security, auditing, troubleshooting, and abuse-prevention purposes related to the Guest Employee experience.",
            "Your activity may be reviewed when necessary to identify unauthorized access, suspicious behavior, or potential security incidents. VehicleeCare may restrict, suspend, or terminate access if activity is found to violate security requirements or these terms.",
            "Users must not attempt to exploit vulnerabilities, obtain credentials or system information, or conduct security testing without explicit authorization from VehicleeCare.",
            "By selecting “Get Started” and continuing to use the Guest Employee Dashboard, you acknowledge and consent to the monitoring and collection of technical information described above as part of the Guest Employee experience."
        ]
    }
};

const policyAlertMessages = {
    terms: 'Kindly accept the terms and conditions policy to continue',
    privacy: 'Kindly accept the privacy policy to continue',
    security: 'Kindly accept the security protection policy to continue'
};

const GuestWelcomeModal = () => {
    const { triggerAlert } = useAlert();
    const [isOpen, setIsOpen] = useState(checkGuestStatus);
    const [activePolicyModal, setActivePolicyModal] = useState(null);
    const [showWelcomeSplash, setShowWelcomeSplash] = useState(false);
    const [agreedPolicies, setAgreedPolicies] = useState({
        terms: false,
        privacy: false,
        security: false
    });
    const location = useLocation();

    useEffect(() => {
        setIsOpen(checkGuestStatus());
    }, [location.pathname]);

    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'guestWelcomeDismissed' && e.newValue === 'true') {
                setIsOpen(false);
                setShowWelcomeSplash(false);
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    useEffect(() => {
        if (showWelcomeSplash) {
            const timer = setTimeout(() => {
                const now = Date.now();
                localStorage.setItem('guestWelcomeDismissed', 'true');
                sessionStorage.setItem('guestWelcomeDismissed', 'true');
                localStorage.setItem('guestSessionStartTime', String(now));
                localStorage.setItem('guestLastActivity', String(now));
                setIsOpen(false);
                setShowWelcomeSplash(false);
                setTimeout(() => {
                    triggerAlert('Your Guest Employee session will expire in 15 minutes', 'success');
                }, 400);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [showWelcomeSplash, triggerAlert]);

    const openPolicyModal = (type) => {
        setActivePolicyModal(type);
        if (policyAlertMessages[type]) {
            triggerAlert(policyAlertMessages[type], 'success');
        }
    };

    const handleGetStarted = () => {
        if (!agreedPolicies.terms) {
            openPolicyModal('terms');
        } else if (!agreedPolicies.privacy) {
            openPolicyModal('privacy');
        } else if (!agreedPolicies.security) {
            openPolicyModal('security');
        } else {
            setShowWelcomeSplash(true);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={false}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.05, filter: "blur(12px)" }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#011023]/10 backdrop-blur-[13px]"
                >
                    {!showWelcomeSplash && (
                        <>
                            <div className="max-w-[40rem] w-full text-center animate-in zoom-in-95 duration-300 space-y-6">
                                <div className="space-y-3">
                                    <h2 className="text-xl font-bold mb-8 text-[#011023] uppercase tracking-tight">
                                        Guest Employee Access
                                    </h2>
                                    <p className="text-sm font-semibold text-gray-600 leading-relaxed uppercase tracking-wide">
                                        Welcome to the Vehicleecare Employee Dashboard. You have been granted <strong className="font-bold text-[#011023]">guest employee access</strong>, allowing you to experience the functionality of the employee dashboard. Currently, you have <strong className="font-bold text-[#011023]">read-only access</strong> and can view all real data, excluding sensitive information.
                                        <span className="block mt-3">Please adhere to the terms and conditions for a seamless experience.</span>
                                    </p>
                                </div>
                                <div className="pt-16">
                                    <button
                                        type="button"
                                        onClick={handleGetStarted}
                                        className="px-14 py-2 bg-white/60 backdrop-blur-sm border border-white/60 text-[#011023] font-bold text-[13px] uppercase tracking-widest rounded-xl transition-all duration-300 cursor-pointer hover:bg-white/70 shadow-sm"
                                    >
                                        Get Started
                                    </button>
                                </div>
                            </div>

                            {/* Bottom Footer Links */}
                            <div className="absolute bottom-6 inset-x-0 text-center flex flex-col items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-800">
                                <p className="text-[12px] font-semibold text-gray-800 normal-case tracking-wide">
                                    © 2026 VehicleeCare | ALL RIGHTS RESERVED
                                </p>
                                <div className="flex items-center justify-center gap-3">
                                    <button 
                                        type="button" 
                                        onClick={() => openPolicyModal('terms')} 
                                        className="hover:text-[#011023] transition-colors uppercase cursor-pointer"
                                    >
                                        Terms and Conditions
                                    </button>
                                    <span className="text-gray-600">|</span>
                                    <button 
                                        type="button" 
                                        onClick={() => openPolicyModal('privacy')} 
                                        className="hover:text-[#011023] transition-colors uppercase cursor-pointer"
                                    >
                                        Privacy Policy
                                    </button>
                                    <span className="text-gray-600">|</span>
                                    <button 
                                        type="button" 
                                        onClick={() => openPolicyModal('security')} 
                                        className="hover:text-[#011023] transition-colors uppercase cursor-pointer"
                                    >
                                        Security Protection
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Smooth Animated Policy Pop-up Modal */}
                    <AnimatePresence mode="wait">
                        {activePolicyModal && policyData[activePolicyModal] && (
                            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                                <motion.div 
                                    className="absolute inset-0 bg-[#011023]/1"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.25 }}
                                    onClick={() => setActivePolicyModal(null)}
                                />
                                <motion.div 
                                    key={activePolicyModal}
                                    initial={{ opacity: 0, scale: 0.92, y: 15 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                    transition={{ 
                                        type: "spring", 
                                        stiffness: 380, 
                                        damping: 28, 
                                        mass: 0.8 
                                    }}
                                    className={`w-full ${
                                        activePolicyModal === 'terms' ? 'max-w-3xl' : 'max-w-4xl'
                                    } bg-white/100 border border-white/70 rounded-3xl relative z-10 px-6 py-4 flex flex-col max-h-[85vh] text-center shadow-sm`}
                                >
                                    <div className="relative flex items-center justify-center pb-4 border-b border-gray-100 mb-6">
                                        <h3 className="text-lg font-bold text-center text-[#011023] uppercase tracking-tight">
                                            {policyData[activePolicyModal].title}
                                        </h3>
                                    </div>
                                    <div className="flex-1 overflow-y-auto text-xs font-semibold text-gray-600 leading-normal uppercase tracking-wide custom-scrollbar">
                                        {policyData[activePolicyModal].paragraphs.map((p, idx) => (
                                            <p key={idx} className="py-1 text-justify rounded-xl">
                                                {p}
                                            </p>
                                        ))}
                                    </div>
                                    <div className="pt-4 mt-4 border-t border-gray-100 flex items-center gap-3">
                                        <ToggleSwitch
                                            size="xs"
                                            isActive={agreedPolicies[activePolicyModal]}
                                            onChange={(val) => {
                                                const currentKey = activePolicyModal;
                                                setAgreedPolicies(prev => {
                                                    const updatedPolicies = { ...prev, [currentKey]: val };
                                                    if (val) {
                                                        setTimeout(() => {
                                                            if (!updatedPolicies.terms) {
                                                                openPolicyModal('terms');
                                                            } else if (!updatedPolicies.privacy) {
                                                                openPolicyModal('privacy');
                                                            } else if (!updatedPolicies.security) {
                                                                openPolicyModal('security');
                                                            } else {
                                                                setActivePolicyModal(null);
                                                                setShowWelcomeSplash(true);
                                                            }
                                                        }, 280);
                                                    }
                                                    return updatedPolicies;
                                                });
                                            }}
                                        />
                                        <span className="text-xs font-semibold text-[#011023] uppercase tracking-wide">
                                            I agree to the <strong className="font-bold">{policyData[activePolicyModal].title}</strong> of Vehicleecare
                                        </span>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>

                    {/* Animated Welcome Screen Overlay */}
                    {showWelcomeSplash && (
                        <div className="fixed inset-0 z-[20000] flex flex-col items-center justify-center bg-[#011023]/1 p-6">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 15 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                className="flex flex-col items-center space-y-6 text-center max-w-lg"
                            >
                                <div className="space-y-3">
                                    <motion.h1 
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: 0.2 }}
                                        className="text-2xl lg:text-3xl font-semibold uppercase tracking-tight text-[#011023]"
                                    >
                                        Welcome to VehicleeCare
                                    </motion.h1>
                                    <motion.p 
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: 0.35 }}
                                        className="text-xs font-semibold text-gray-600 uppercase tracking-widest"
                                    >
                                        Employee Dashboard | Access Granted
                                    </motion.p>
                                </div>

                                <motion.div 
                                    className="w-56 h-2 rounded-full overflow-hidden relative border border-gray-200/80"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <motion.div 
                                        className="h-full bg-[#c7d2fe] border border-[#a5b4fc] rounded-full shadow-xs"
                                        initial={{ width: "0%" }}
                                        animate={{ width: "100%" }}
                                        transition={{ duration: 4.6, ease: "linear", delay: 0.2 }}
                                    />
                                </motion.div>
                            </motion.div>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default GuestWelcomeModal;
