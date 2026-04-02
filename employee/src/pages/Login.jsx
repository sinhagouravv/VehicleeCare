import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, ShieldAlert, ShieldCheck, Loader, KeyRound, Eye, EyeOff, Mail, X } from 'lucide-react';
import logo from '../assets/logo.svg';

const Login = () => {
    const [employeeId, setEmployeeId] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Forgot Password States
    const [forgotPasswordStep, setForgotPasswordStep] = useState(0); // 0 = hidden, 1 = enter employee email, 2 = verify OTP, 3 = new pass
    const [resetEmployeeId, setResetEmployeeId] = useState('');
    const [resetEmail, setResetEmail] = useState('');
    const [resetOtp, setResetOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const navigate = useNavigate();

    // Auto-dismiss notifications after 5 seconds
    useEffect(() => {
        if (error || successMessage) {
            const timer = setTimeout(() => {
                setError('');
                setSuccessMessage('');
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error, successMessage]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setLoading(true);

        try {
            const res = await fetch('http://localhost:5001/api/auth/employee-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employeeId, password })
            });

            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('employeeToken', data.token);
                localStorage.setItem('employeeUser', JSON.stringify(data.employee));
                navigate('/');
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
            const res = await fetch('http://localhost:5001/api/auth/employee-forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employeeId: resetEmployeeId, email: resetEmail })
            });

            const data = await res.json();

            if (res.ok) {
                setForgotPasswordStep(2);
            } else {
                setError(data.msg || 'The email you entered is not registered');
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
            const res = await fetch('http://localhost:5001/api/auth/employee-verify-reset-otp', {
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
            const res = await fetch('http://localhost:5001/api/auth/employee-reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: resetEmail, otp: resetOtp, newPassword })
            });

            const data = await res.json();

            if (res.ok) {
                setForgotPasswordStep(0);
                setSuccessMessage('Password updated successfully. Please log in.');
                setEmployeeId('');
                setResetEmployeeId('');
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

    // Helper for 6-digit OTP boxes
    const handleOtpChange = (value, index) => {
        const newOtp = resetOtp.split('');
        newOtp[index] = value.slice(-1); // Only take last char
        const finalOtp = newOtp.join('');
        setResetOtp(finalOtp);

        // Auto focus next
        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            nextInput?.focus();
        }
    };

    const handleOtpKeyDown = (e, index) => {
        if (e.key === 'Backspace' && !resetOtp[index] && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`);
            prevInput?.focus();
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
                            <div className="w-6 sm:w-12 h-[2px] mx-2 bg-slate-100 relative overflow-hidden">
                                <div className={`absolute inset-0 bg-[#052558] transition-all duration-700 ease-in-out
                                    ${currentStep > step.id ? 'translate-x-0' : '-translate-x-full'}`} />
                            </div>
                        )}
                    </React.Fragment>
                ))}
            </div>
        );
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden font-sans">
            {/* Soft Ambient Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/20 rounded-full blur-[120px] mix-blend-multiply animate-pulse duration-10000"></div>
                <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-emerald-400/15 rounded-full blur-[150px] mix-blend-multiply"></div>
                <div className="absolute top-[40%] right-[10%] w-[30%] h-[30%] bg-purple-400/10 rounded-full blur-[100px] mix-blend-multiply"></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay"></div>
            </div>

            {/* MAIN LOGIN CARD */}
            <div className={`w-full max-w-md bg-white/60 backdrop-blur-2xl border border-white/80 rounded-[2.5rem] shadow-[0_20px_50px_rgba(5,37,88,0.06)] z-10 overflow-hidden relative transition-all duration-500 transform ${forgotPasswordStep > 0 ? 'scale-[0.98] blur-[2px] pointer-events-none opacity-40' : 'scale-100 opacity-100'}`}>
                <div className="p-10 md:p-12 relative">
                    <div className="text-center mb-12 relative">
                        <div className="mx-auto flex items-center justify-center mb-6 relative z-10 w-22 h-15">
                            <img src={logo} alt="VehicleeCare" className="w-full h-full object-contain drop-shadow-md" />
                        </div>
                        <p className="text-slate-400 font-bold mb-2 text-xs tracking-[0.2em] uppercase">vehicleecare</p>
                        <h2 className="text-3xl font-black text-[#011023] tracking-tight uppercase">Employee Portal</h2>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-7">
                        <div className="space-y-2">
                            <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Employee ID</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                                    <User size={18} />
                                </div>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={9}
                                    value={employeeId}
                                    onChange={(e) => setEmployeeId(e.target.value.replace(/\D/g, '').slice(0, 9))}
                                    className="w-full pl-12 pr-4 py-4 bg-white/80 border border-white rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all text-[#011023] placeholder-slate-300 font-semibold text-[15px] tracking-wide shadow-sm"
                                    placeholder="Enter 9-digit ID"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-12 py-4 bg-white/80 border border-white rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all text-[#011023] placeholder-slate-300 font-semibold text-[15px] tracking-widest shadow-sm"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-blue-500 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pb-2">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div className="relative flex items-center justify-center w-5 h-5 rounded-lg bg-white border-2 border-slate-100 shadow-sm transition-all peer-checked:border-blue-500">
                                    <input type="checkbox" className="appearance-none absolute inset-0 w-full h-full cursor-pointer checked:bg-white peer z-0" />
                                    <svg className="w-3 h-3 text-blue-500 opacity-0 peer-checked:opacity-100 transition-opacity z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <span className="text-slate-500 font-bold text-sm tracking-tight group-hover:text-[#011023] transition-colors">Remember me</span>
                            </label>
                            <button
                                type="button"
                                onClick={() => { setForgotPasswordStep(1); setError(''); }}
                                className="text-[#052558] font-bold text-sm hover:opacity-80 transition-all tracking-tight"
                            >
                                Forgot password?
                            </button>
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

            {/* FORGOT PASSWORD MODAL (POP-UP) */}
            {forgotPasswordStep > 0 && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-[#011023]/20 backdrop-blur-xl animate-in fade-in duration-500"
                        onClick={() => setForgotPasswordStep(0)}
                    />

                    {/* Modal Content */}
                    <div className="w-full max-w-2xl bg-white/95 backdrop-blur-2xl border border-white rounded-[1.5rem] shadow-[0_40px_100px_rgba(5,37,88,0.15)] relative z-10 overflow-hidden animate-in zoom-in-95 duration-500 ease-out p-12">

                        <div className="relative flex items-center justify-center mb-12">
                            <h3 className="text-2xl font-bold text-[#011023] uppercase tracking-tighter">Account Recovery</h3>
                            <button
                                onClick={() => setForgotPasswordStep(0)}
                                className="absolute right-0 text-slate-400 hover:text-[#011023] transition-all p-2 hover:bg-slate-50 rounded-full"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="text-center">
                            <StepIndicator currentStep={forgotPasswordStep} />

                            {/* STEP 1: Enter ID & Email */}
                            {forgotPasswordStep === 1 && (
                                <form onSubmit={handleSendResetOtp} className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 flex flex-col items-center">
                                    <div className="space-y-5 w-full max-w-lg">
                                        <div className="text-center space-y-2 mb-2">
                                            {/* <p className="text-[11px] font-black text-[#052558] uppercase tracking-[0.2em] opacity-80">Security Verification</p> */}
                                            <p className="text-sm font-bold text-slate-400 uppercase pb-7 leading-relaxed px-4">Kindly enter your <span className="text-[#052558] font-black text-sm uppercase tracking-normal">Employee ID</span> and <span className="text-[#052558] font-black text-sm uppercase tracking-normal">registered email</span> to receive your secure OTP.</p>
                                        </div>

                                        <div className="flex gap-6 w-full">
                                            <div className="space-y-2 text-center w-[35%]">
                                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Employee ID</label>
                                                <div className="relative group">
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        pattern="[0-9]*"
                                                        maxLength={9}
                                                        value={resetEmployeeId}
                                                        onChange={(e) => setResetEmployeeId(e.target.value.replace(/\D/g, '').slice(0, 9))}
                                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-xs focus:outline-none  transition-all text-[#011023] placeholder-slate-300 font-semibold text-sm text-center"
                                                        placeholder="Enter 9-digit ID"
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2 text-center w-[65%]">
                                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Registered Email</label>
                                                <div className="relative group">
                                                    <input
                                                        type="email"
                                                        value={resetEmail}
                                                        onChange={(e) => setResetEmail(e.target.value)}
                                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-xs focus:outline-none transition-all text-[#011023] placeholder-slate-300 font-semibold text-sm text-center"
                                                        placeholder="e.g. employee@vc.com"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full max-w-sm bg-[#052558] text-white py-5 rounded-2xl font-black tracking-[0.2em] uppercase text-xs shadow-[0_15px_30px_rgba(5,37,88,0.2)] transition-all duration-300 hover:shadow-[0_20px_40px_rgba(5,37,88,0.3)] mt-4"
                                    >
                                        {loading ? <Loader className="animate-spin mx-auto" size={20} /> : 'Generate OTP'}
                                    </button>
                                </form>
                            )}

                            {/* STEP 2: Verify OTP */}
                            {forgotPasswordStep === 2 && (
                                <form onSubmit={handleVerifyOtp} className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 flex flex-col items-center">
                                    <div className="space-y-5 w-full max-w-sm">
                                        <div className="text-center space-y-2 mb-6.5">
                                            <p className="text-sm font-bold text-slate-400 uppercase leading-relaxed px-4">Kindly enter the 6-digit code we sent to <br /><span className="text-[#052558] font-black text-[11px] uppercase tracking-normal">{resetEmail}</span></p>
                                        </div>

                                        <div className="flex justify-center gap-2 sm:gap-3 w-full px-2">
                                            {[0, 1, 2, 3, 4, 5].map((index) => (
                                                <input
                                                    key={index}
                                                    id={`otp-${index}`}
                                                    type="text"
                                                    maxLength="1"
                                                    value={resetOtp[index] || ''}
                                                    onChange={(e) => handleOtpChange(e.target.value, index)}
                                                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                                                    className="w-8 h-10 sm:w-10 sm:h-12 text-center text-lg font-bold text-[#011023] bg-white border border-slate-200 rounded-xl focus:outline-none transition-all shadow-sm"
                                                />
                                            ))}
                                        </div>

                                        <div className="text-center">
                                            <button
                                                type="button"
                                                onClick={handleSendResetOtp}
                                                className="text-[10px] font-black text-slate-400 uppercase tracking-widest  transition-colors"
                                            >
                                                Didn't get the code? <span className="text-[#052558]">Resend OTP</span>
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading || resetOtp.length !== 6}
                                        className="w-full max-w-sm bg-[#052558] text-white py-5 rounded-2xl font-black tracking-[0.2em] uppercase text-xs shadow-[0_15px_30px_rgba(5,37,88,0.2)] transition-all duration-300 hover:shadow-[0_20px_40px_rgba(5,37,88,0.3)]  active:scale-[0.98] disabled:opacity-70"
                                    >
                                        {loading ? <Loader className="animate-spin mx-auto" size={20} /> : 'Verify & Continue'}
                                    </button>
                                </form>
                            )}

                            {/* STEP 3: Reset Password */}
                            {forgotPasswordStep === 3 && (
                                <form onSubmit={handleResetPassword} className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 flex flex-col items-center">
                                    <div className="space-y-6 w-full max-w-lg">
                                        <div className="text-center space-y-2 mb-7">
                                            {/* <p className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.2em] opacity-80">Final Step</p> */}
                                            <p className="text-sm font-bold text-slate-400 uppercase leading-relaxed px-4">Create a new password for your account</p>
                                        </div>

                                        <div className="flex gap-6 w-full">
                                            <div className="space-y-2 text-center w-1/2">
                                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">New Password</label>
                                                <div className="relative group">
                                                    <input
                                                        type={showNewPassword ? "text" : "password"}
                                                        value={newPassword}
                                                        onChange={(e) => setNewPassword(e.target.value)}
                                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-xs focus:outline-none transition-all text-[#011023] placeholder-slate-300 font-semibold text-sm text-center tracking-widest"
                                                        placeholder="••••••••"
                                                        required
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-[#052558] transition-colors"
                                                    >
                                                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-2 text-center w-1/2">
                                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Confirm Password</label>
                                                <div className="relative group">
                                                    <input
                                                        type={showConfirmPassword ? "text" : "password"}
                                                        value={confirmNewPassword}
                                                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-xs focus:outline-none transition-all text-[#011023] placeholder-slate-300 font-semibold text-sm text-center tracking-widest"
                                                        placeholder="••••••••"
                                                        required
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-[#052558] transition-colors"
                                                    >
                                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading || !newPassword || !confirmNewPassword}
                                        className="w-full max-w-sm bg-[#052558] text-white py-5 rounded-2xl font-black tracking-[0.2em] uppercase text-xs shadow-[0_15px_30px_rgba(5,37,88,0.2)] transition-all duration-300 hover:shadow-[0_20px_40px_rgba(5,37,88,0.3)]  active:scale-[0.98] disabled:opacity-70 mt-3"
                                    >
                                        {loading ? <Loader className="animate-spin mx-auto" size={20} /> : 'Update New Password'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* FIXED NOTIFICATIONS */}
            <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-3 w-full max-w-sm px-6 pointer-events-none">
                {error && (
                    <div className="bg-white/90 backdrop-blur-md border-l-[6px] border-red-500 text-red-700 px-6 py-5 rounded-2xl shadow-2xl flex items-center gap-4 text-sm animate-in slide-in-from-top duration-500 font-bold pointer-events-auto">
                        <ShieldAlert size={22} className="shrink-0 text-red-500" />
                        <span>{error}</span>
                    </div>
                )}
                {successMessage && (
                    <div className="bg-white/90 backdrop-blur-md border-l-[6px] border-emerald-500 text-emerald-700 px-6 py-5 rounded-2xl shadow-2xl flex items-center gap-4 text-sm animate-in slide-in-from-top duration-500 font-bold pointer-events-auto">
                        <ShieldCheck size={22} className="shrink-0 text-emerald-500" />
                        <span>{successMessage}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Login;
