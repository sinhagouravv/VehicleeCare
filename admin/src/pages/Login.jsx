import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ShieldAlert, ShieldCheck, Loader, KeyRound, Eye, EyeOff, X } from 'lucide-react';
import logo from '../assets/logo.svg';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [otp, setOtp] = useState('');
    const [showOTPModal, setShowOTPModal] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Forgot Password States
    const [forgotPasswordStep, setForgotPasswordStep] = useState(0); 
    const [resetEmail, setResetEmail] = useState('');
    const [resetOtp, setResetOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const navigate = useNavigate();

    // Auto-dismiss notifications
    useEffect(() => {
        if (error || successMessage) {
            const timer = setTimeout(() => {
                setError('');
                setSuccessMessage('');
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error, successMessage]);

    // Helper for 6-digit OTP boxes (Recovery)
    const handleResetOtpChange = (value, index) => {
        if (value && !/^\d+$/.test(value)) return;
        const paddedOtp = resetOtp.padEnd(6, ' ');
        const newOtpArray = paddedOtp.split('');
        newOtpArray[index] = value || ' ';
        const finalOtp = newOtpArray.join('');
        setResetOtp(finalOtp);

        if (value && index < 5) {
            const nextInput = document.getElementById(`reset-otp-${index + 1}`);
            nextInput?.focus();
        }
    };

    const handleResetOtpKeyDown = (e, index) => {
        if (e.key === 'Backspace' || e.key === 'Delete') {
            const paddedOtp = resetOtp.padEnd(6, ' ');
            const otpArray = paddedOtp.split('');
            if (otpArray[index] !== ' ') {
                e.preventDefault();
                otpArray[index] = ' ';
                setResetOtp(otpArray.join(''));
            } else if (index > 0) {
                e.preventDefault();
                otpArray[index - 1] = ' ';
                setResetOtp(otpArray.join(''));
                const prevInput = document.getElementById(`reset-otp-${index - 1}`);
                prevInput?.focus();
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            e.preventDefault();
            const prevInput = document.getElementById(`reset-otp-${index - 1}`);
            prevInput?.focus();
        } else if (e.key === 'ArrowRight' && index < 5) {
            e.preventDefault();
            const nextInput = document.getElementById(`reset-otp-${index + 1}`);
            nextInput?.focus();
        }
    };

    // Helper for 2FA OTP boxes
    const handle2FAOtpChange = (value, index) => {
        if (value && !/^\d+$/.test(value)) return;
        const paddedOtp = otp.padEnd(6, ' ');
        const newOtpArray = paddedOtp.split('');
        newOtpArray[index] = value || ' ';
        const finalOtp = newOtpArray.join('');
        setOtp(finalOtp);

        if (value && index < 5) {
            const nextInput = document.getElementById(`2fa-otp-${index + 1}`);
            nextInput?.focus();
        }
    };

    const handle2FAOtpKeyDown = (e, index) => {
        if (e.key === 'Backspace' || e.key === 'Delete') {
            const paddedOtp = otp.padEnd(6, ' ');
            const otpArray = paddedOtp.split('');
            if (otpArray[index] !== ' ') {
                e.preventDefault();
                otpArray[index] = ' ';
                setOtp(otpArray.join(''));
            } else if (index > 0) {
                e.preventDefault();
                otpArray[index - 1] = ' ';
                setOtp(otpArray.join(''));
                const prevInput = document.getElementById(`2fa-otp-${index - 1}`);
                prevInput?.focus();
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            e.preventDefault();
            const prevInput = document.getElementById(`2fa-otp-${index - 1}`);
            prevInput?.focus();
        } else if (e.key === 'ArrowRight' && index < 5) {
            e.preventDefault();
            const nextInput = document.getElementById(`2fa-otp-${index + 1}`);
            nextInput?.focus();
        }
    };

    const StepIndicator = ({ currentStep }) => {
        const steps = [
            { id: 1, label: 'Details' },
            { id: 2, label: 'Verify' },
            { id: 3, label: 'Reset' }
        ];

        return (
            <div className="flex items-center justify-center mb-16 w-full px-2">
                {steps.map((step, index) => (
                    <React.Fragment key={step.id}>
                        <div className="flex flex-col items-center relative group cursor-default">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 shadow-sm
                                ${currentStep > step.id 
                                    ? 'border-[#052558] bg-[#052558] text-white' 
                                    : currentStep === step.id
                                        ? 'border-[#052558] bg-white text-[#052558] ring-4 ring-slate-50'
                                        : 'border-slate-100 bg-white text-slate-300'}`}>
                                {currentStep > step.id ? (
                                    <ShieldCheck size={14} strokeWidth={3} />
                                ) : (
                                    <span className="text-sm font-black">
                                        {step.id}
                                    </span>
                                )}
                            </div>
                            <span className={`absolute -bottom-5 text-[8px] font-black uppercase tracking-widest transition-all duration-500 whitespace-nowrap
                                ${currentStep >= step.id ? 'text-[#052558] opacity-100' : 'text-slate-300 opacity-40'}`}>
                                {step.label}
                            </span>
                        </div>
                        {index < steps.length - 1 && (
                            <div className="w-8 sm:w-16 h-[2px] mx-2 bg-slate-100 relative overflow-hidden">
                                <div className={`absolute inset-0 bg-[#052558] transition-all duration-700 ease-in-out
                                    ${currentStep > step.id ? 'translate-x-0' : '-translate-x-full'}`} />
                            </div>
                        )}
                    </React.Fragment>
                ))}
            </div>
        );
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setLoading(true);

        try {
            const res = await fetch('http://localhost:5001/api/auth/admin-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, otp: showOTPModal ? otp : undefined })
            });

            const data = await res.json();

            if (res.ok && !data.requires2FA) {
                localStorage.setItem('adminToken', data.token);
                localStorage.setItem('adminUser', JSON.stringify(data.admin));
                navigate('/dashboard');
            } else if (data.requires2FA) {
                setShowOTPModal(true);
            } else {
                setError(data.msg || 'Invalid credentials');
            }
        } catch (err) {
            setError('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    const handleSendResetOtp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5001/api/auth/admin-forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: resetEmail })
            });

            const data = await res.json();

            if (res.ok) {
                setForgotPasswordStep(2);
            } else {
                setError(data.msg || 'Invalid credentials');
            }
        } catch (err) {
            setError('Server connection failed');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5001/api/auth/admin-verify-reset-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: resetEmail, otp: resetOtp })
            });

            const data = await res.json();

            if (res.ok) {
                setForgotPasswordStep(3);
            } else {
                setError(data.msg || 'Invalid or expired OTP');
            }
        } catch (err) {
            setError('Server connection failed');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmNewPassword) {
            setError('Passwords do not match');
            return;
        }
        setError('');
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5001/api/auth/admin-reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: resetEmail, otp: resetOtp, newPassword })
            });

            const data = await res.json();
            if (res.ok) {
                setForgotPasswordStep(0);
                setSuccessMessage('Password updated successfully. Please log in.');
                setEmail(resetEmail);
                setResetOtp('');
                setNewPassword('');
                setConfirmNewPassword('');
                setResetEmail('');
            } else {
                setError(data.msg || 'Failed to update password');
            }
        } catch (err) {
            setError('Server connection failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden font-sans">
            {/* Ambient Background */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/20 rounded-full blur-[120px] mix-blend-multiply animate-pulse duration-10000"></div>
                <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-emerald-400/15 rounded-full blur-[150px] mix-blend-multiply"></div>
                <div className="absolute top-[40%] right-[10%] w-[30%] h-[30%] bg-purple-400/10 rounded-full blur-[100px] mix-blend-multiply"></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay"></div>
            </div>

            {/* MAIN LOGIN CARD */}
            <div className={`w-full max-w-md bg-white/60 backdrop-blur-2xl border border-white/80 rounded-[2rem] shadow-[0_8px_30px_rgba(5,37,88,0.06)] z-10 overflow-hidden relative transition-all duration-500 ${forgotPasswordStep > 0 || showOTPModal ? 'scale-[0.98] blur-[2px] opacity-40 pointer-events-none' : 'scale-100 opacity-100'}`}>
                <div className="p-10 relative">
                    <div className="text-center mb-10 relative">
                        <div className="mx-auto flex items-center justify-center mb-5 relative z-10 w-22 h-15">
                            <img src={logo} alt="VehicleeCare Admin" className="w-full h-full object-contain drop-shadow-md" />
                        </div>
                        <p className="text-gray-500 font-medium mb-2 text-sm tracking-widest uppercase">vehicleecare</p>
                        <h2 className="text-3xl font-black text-[#011023] tracking-tight uppercase">Admin Portal</h2>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[12px] font-bold text-gray-400 uppercase tracking-widest ml-1 block">Email / Admin ID</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400"><Mail size={18} /></div>
                                <input
                                    type="text"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-white/80 border border-white rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all text-[#011023] placeholder-slate-300 font-semibold text-[15px] shadow-sm"
                                    placeholder="Enter credentials"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[12px] font-bold text-gray-400 uppercase tracking-widest ml-1 block">Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400"><Lock size={18} /></div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-12 py-4 bg-white/80 border border-white rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all text-[#011023] placeholder-slate-300 font-semibold text-[15px] tracking-widest shadow-sm"
                                    placeholder="••••••••"
                                    required
                                />
                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 cursor-pointer" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end text-sm py-2">
                            <button type="button" onClick={() => setForgotPasswordStep(1)} className="text-blue-500 font-bold hover:text-blue-600 transition-colors">Forgot password?</button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-[#052558] to-[#527FB0] text-white py-5 rounded-2xl font-black tracking-[0.2em] uppercase text-xs shadow-[0_15px_30px_rgba(5,37,88,0.2)] transition-all duration-300 hover:shadow-[0_20px_40px_rgba(5,37,88,0.3)]"
                        >
                            {loading ? <Loader className="animate-spin mx-auto" size={20} /> : 'Login'}
                        </button>
                    </form>
                </div>
            </div>

            {/* FORGOT PASSWORD MODAL */}
            {forgotPasswordStep > 0 && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#011023]/20 backdrop-blur-xl animate-in fade-in duration-500" onClick={() => setForgotPasswordStep(0)} />
                    <div className="w-full max-w-2xl bg-white/95 backdrop-blur-2xl border border-white rounded-[1.5rem] shadow-[0_40px_100px_rgba(5,37,88,0.15)] relative z-10 overflow-hidden animate-in zoom-in-95 duration-500 ease-out p-12">
                        <div className="relative flex items-center justify-center mb-12">
                            <h3 className="text-2xl font-black text-[#011023] uppercase tracking-tighter">Account Recovery</h3>
                            <button onClick={() => setForgotPasswordStep(0)} className="absolute right-0 text-slate-400 hover:text-[#011023] transition-all p-2 hover:bg-slate-50 rounded-full"><X size={20} /></button>
                        </div>

                        <div className="text-center">
                            <StepIndicator currentStep={forgotPasswordStep} />
                            {forgotPasswordStep === 1 && (
                                <form onSubmit={handleSendResetOtp} className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 flex flex-col items-center">
                                    <div className="space-y-4 w-full max-w-sm">
                                        <p className="text-sm font-bold text-slate-400 uppercase pb-4">Enter your Admin ID / Email to receive OTP</p>
                                        <input
                                            type="text"
                                            value={resetEmail}
                                            onChange={(e) => setResetEmail(e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none text-[#011023] text-center font-semibold text-sm"
                                            placeholder="Enter Credentials"
                                            required
                                        />
                                    </div>
                                    <button type="submit" disabled={loading} className="w-full max-w-sm bg-[#052558] text-white py-5 rounded-2xl font-black tracking-[0.2em] uppercase text-xs shadow-xl transition-all hover:scale-[1.02]">
                                        {loading ? <Loader className="animate-spin mx-auto" size={20} /> : 'Generate OTP'}
                                    </button>
                                </form>
                            )}
                            {forgotPasswordStep === 2 && (
                                <form onSubmit={handleVerifyOtp} className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 flex flex-col items-center">
                                    <div className="space-y-4 w-full max-w-sm">
                                        <p className="text-sm font-bold text-slate-400 uppercase">Enter the 6-digit code sent to your email</p>
                                        <div className="flex justify-center gap-3">
                                            {[0, 1, 2, 3, 4, 5].map((index) => (
                                                <input
                                                    key={index}
                                                    id={`reset-otp-${index}`}
                                                    type="text"
                                                    maxLength="1"
                                                    value={resetOtp[index]?.trim() || ''}
                                                    onChange={(e) => handleResetOtpChange(e.target.value, index)}
                                                    onKeyDown={(e) => handleResetOtpKeyDown(e, index)}
                                                    onFocus={(e) => e.target.select()}
                                                    autoComplete="off"
                                                    className="w-10 h-12 text-center text-lg font-bold text-[#011023] bg-white border border-slate-200 rounded-xl focus:outline-none shadow-sm caret-transparent selection:bg-transparent selection:text-[#011023]"
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <button type="submit" disabled={loading || resetOtp.replace(/\s+/g, '').length !== 6} className="w-full max-w-sm bg-[#052558] text-white py-5 rounded-2xl font-black tracking-[0.2em] uppercase text-xs shadow-xl transition-all hover:scale-[1.02]">
                                        {loading ? <Loader className="animate-spin mx-auto" size={20} /> : 'Verify & Continue'}
                                    </button>
                                </form>
                            )}
                            {forgotPasswordStep === 3 && (
                                <form onSubmit={handleResetPassword} className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 flex flex-col items-center">
                                    <div className="space-y-6 w-full max-w-lg">
                                        <p className="text-sm font-bold text-slate-400 uppercase">Create a new password</p>
                                        <div className="flex gap-6 w-full">
                                            <div className="space-y-2 w-1/2">
                                                <label className="text-[11px] font-bold text-slate-400 uppercase block">New Password</label>
                                                <input type={showNewPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-center font-semibold text-sm tracking-widest" placeholder="••••••••" required />
                                            </div>
                                            <div className="space-y-2 w-1/2">
                                                <label className="text-[11px] font-bold text-slate-400 uppercase block">Confirm Password</label>
                                                <input type={showConfirmPassword ? "text" : "password"} value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-center font-semibold text-sm tracking-widest" placeholder="••••••••" required />
                                            </div>
                                        </div>
                                    </div>
                                    <button type="submit" disabled={loading} className="w-full max-w-sm bg-[#052558] text-white py-5 rounded-2xl font-black tracking-[0.2em] uppercase text-xs shadow-xl transition-all hover:scale-[1.02]">
                                        {loading ? <Loader className="animate-spin mx-auto" size={20} /> : 'Update Password'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 2FA OTP MODAL */}
            {showOTPModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#011023]/40 backdrop-blur-xl animate-in fade-in duration-500" onClick={() => setShowOTPModal(false)} />
                    <div className="w-full max-w-md bg-white border border-white rounded-[2rem] shadow-2xl relative z-10 p-10 animate-in zoom-in-95 duration-300">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600"><KeyRound size={32} /></div>
                            <h3 className="text-2xl font-black text-[#011023] uppercase">Two-Factor Auth</h3>
                            <p className="text-gray-400 text-sm font-bold mt-2 font-mono uppercase">Enter verify code</p>
                        </div>
                        <form onSubmit={handleLogin} className="space-y-8 flex flex-col items-center">
                            <div className="flex justify-center gap-2 sm:gap-3 w-full px-2">
                                {[0, 1, 2, 3, 4, 5].map((index) => (
                                    <input
                                        key={index}
                                        id={`2fa-otp-${index}`}
                                        type="text"
                                        maxLength="1"
                                        value={otp[index]?.trim() || ''}
                                        onChange={(e) => handle2FAOtpChange(e.target.value, index)}
                                        onKeyDown={(e) => handle2FAOtpKeyDown(e, index)}
                                        onFocus={(e) => e.target.select()}
                                        autoComplete="off"
                                        className="w-10 h-12 text-center text-lg font-bold text-[#011023] bg-white border border-slate-200 rounded-xl focus:outline-none shadow-sm caret-transparent selection:bg-transparent selection:text-[#011023]"
                                    />
                                ))}
                            </div>
                            <button type="submit" disabled={loading || otp.replace(/\s+/g, '').length !== 6} className="w-full bg-[#052558] text-white py-5 rounded-2xl font-black tracking-[0.2em] uppercase text-xs shadow-xl transition-all hover:scale-[1.02]">
                                {loading ? <Loader className="animate-spin mx-auto" size={20} /> : 'Verify & Login'}
                            </button>
                            <button type="button" onClick={() => setShowOTPModal(false)} className="w-full text-center text-xs font-bold text-gray-400 hover:text-gray-600 uppercase pt-4 transition-colors">Cancel</button>
                        </form>
                    </div>
                </div>
            )}

            <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-3 w-full max-w-md px-4 pointer-events-none">
                {error && (
                    <div className="bg-white border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 text-sm animate-in slide-in-from-top-4 pointer-events-auto font-semibold">
                        <ShieldAlert size={20} className="shrink-0 text-red-500" />
                        <span>{error}</span>
                    </div>
                )}
                {successMessage && (
                    <div className="bg-white border-l-4 border-green-500 text-green-700 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 text-sm animate-in slide-in-from-top-4 pointer-events-auto font-semibold">
                        <ShieldCheck size={20} className="shrink-0 text-green-500" />
                        <span>{successMessage}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Login;
