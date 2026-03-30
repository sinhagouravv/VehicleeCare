import React, { useState, useEffect, useCallback } from 'react';
import { LogIn, LogOut, CheckCircle, Clock, Calendar, Loader2, AlertCircle } from 'lucide-react';

const Attendance = () => {
    const [todayRecord, setTodayRecord] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastRefreshed, setLastRefreshed] = useState(null);
    const [employeeUser, setEmployeeUser] = useState(null);

    const formatTime = (dateStr) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
    };

    const fetchTodayStatus = useCallback(async (silent = false) => {
        try {
            const storedUser = localStorage.getItem('employeeUser');
            if (!storedUser) {
                setError('Please login again.');
                setLoading(false);
                return;
            }
            const user = JSON.parse(storedUser);
            setEmployeeUser(user);

            if (!silent) setLoading(true);

            const res = await fetch(`http://localhost:5001/api/attendance/status/${user.id}`);
            const data = await res.json();

            if (data.success) {
                setTodayRecord(data.data);
                setLastRefreshed(new Date());
                setError(null);
            } else {
                setError(data.message || 'Failed to fetch attendance status.');
            }
        } catch (err) {
            setError('Connection failed. Please check your network.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTodayStatus();
        const timer = setInterval(() => fetchTodayStatus(true), 5000);
        return () => clearInterval(timer);
    }, [fetchTodayStatus]);

    const handleCheckIn = async () => {
        if (!employeeUser) return;
        setActionLoading(true);
        try {
            const res = await fetch('http://localhost:5001/api/attendance/check-in', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employeeId: employeeUser.id })
            });
            const data = await res.json();
            if (data.success) {
                setTodayRecord(data.data);
                setError(null);
            } else {
                setError(data.message || 'Check-in failed. Please try again.');
            }
        } catch (err) {
            setError('Connection failed. Please try again.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCheckOut = async () => {
        if (!todayRecord?._id) return;
        setActionLoading(true);
        try {
            const res = await fetch(`http://localhost:5001/api/attendance/check-out/${todayRecord._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (data.success) {
                setTodayRecord(data.data);
                setError(null);
            } else {
                setError(data.message || 'Check-out failed. Please try again.');
            }
        } catch (err) {
            setError('Connection failed. Please try again.');
        } finally {
            setActionLoading(false);
        }
    };

    // Determine current state
    const isCheckedIn = todayRecord && todayRecord.checkIn;
    const isCheckedOut = todayRecord && todayRecord.checkOut;
    const isShiftComplete = isCheckedIn && isCheckedOut;

    const getStatusColor = (status) => {
        switch (status) {
            case 'Present': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
            case 'Late': return 'text-orange-600 bg-orange-50 border-orange-100';
            case 'Absent': return 'text-red-600 bg-red-50 border-red-100';
            default: return 'text-gray-600 bg-gray-50 border-gray-100';
        }
    };

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-extrabold uppercase text-[#011023] tracking-tight">Attendance</h1>
                <div className="flex items-center gap-2 text-xs uppercase text-gray-400 font-medium self-center">
                    {lastRefreshed
                        ? `Last refreshed | ${lastRefreshed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | ${lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`
                        : 'Loading…'}
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-3 px-5 py-3.5 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-semibold">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                </div>
            )}

            <div className="bg-white/70 backdrop-blur-md border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] p-8">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <Loader2 size={32} className="animate-spin text-[#527FB0]" />
                        <p className="text-sm font-bold uppercase tracking-widest text-gray-400">Loading attendance…</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-8">
                        {/* Date Header */}
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-2 text-gray-400 text-xs uppercase font-bold tracking-widest mb-1">
                                <Calendar size={14} />
                                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()}
                            </div>
                            <h2 className="text-2xl font-black text-[#011023] uppercase tracking-tight">
                                Today's Attendance
                            </h2>
                        </div>

                        {/* Status Indicator */}
                        <div className="flex flex-col items-center gap-3">
                            {isShiftComplete ? (
                                <div className="w-28 h-28 rounded-full bg-emerald-50 border-4 border-emerald-200 flex items-center justify-center shadow-lg shadow-emerald-100">
                                    <CheckCircle size={52} className="text-emerald-500" />
                                </div>
                            ) : isCheckedIn ? (
                                <div className="w-28 h-28 rounded-full bg-blue-50 border-4 border-blue-200 flex items-center justify-center shadow-lg shadow-blue-100">
                                    <Clock size={52} className="text-blue-500 animate-pulse" />
                                </div>
                            ) : (
                                <div className="w-28 h-28 rounded-full bg-gray-50 border-4 border-gray-200 flex items-center justify-center shadow-inner">
                                    <LogIn size={52} className="text-gray-300" />
                                </div>
                            )}

                            {isShiftComplete ? (
                                <span className={`px-4 py-1.5 rounded-xl text-xs font-black border uppercase tracking-wider ${getStatusColor(todayRecord.status)}`}>
                                    {todayRecord.status} — Shift Complete
                                </span>
                            ) : isCheckedIn ? (
                                <span className={`px-4 py-1.5 rounded-xl text-xs font-black border uppercase tracking-wider ${getStatusColor(todayRecord.status)}`}>
                                    {todayRecord.status} — On Shift
                                </span>
                            ) : (
                                <span className="px-4 py-1.5 rounded-xl text-xs font-black border uppercase tracking-wider text-gray-500 bg-gray-50 border-gray-100">
                                    Not Checked In Yet
                                </span>
                            )}
                        </div>

                        {/* Time Details */}
                        {(isCheckedIn) && (
                            <div className="grid grid-cols-2 gap-6 w-full max-w-sm">
                                <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 text-center">
                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Check-in</p>
                                    <p className="text-2xl font-black text-[#011023] tracking-tight">{formatTime(todayRecord.checkIn)}</p>
                                    <p className="text-[11px] text-gray-400 mt-0.5 font-semibold">{formatDate(todayRecord.checkIn)}</p>
                                </div>
                                <div className={`border rounded-2xl p-5 text-center ${isCheckedOut ? 'bg-emerald-50/50 border-emerald-100' : 'bg-gray-50 border-gray-100'}`}>
                                    <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isCheckedOut ? 'text-emerald-400' : 'text-gray-400'}`}>Check-out</p>
                                    <p className="text-2xl font-black text-[#011023] tracking-tight">
                                        {isCheckedOut ? formatTime(todayRecord.checkOut) : '—'}
                                    </p>
                                    <p className="text-[11px] text-gray-400 mt-0.5 font-semibold">
                                        {isCheckedOut ? formatDate(todayRecord.checkOut) : 'Pending'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Action Button */}
                        <div className="w-full max-w-xs">
                            {isShiftComplete ? (
                                <div className="w-full py-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 font-black text-sm uppercase tracking-widest text-center flex items-center justify-center gap-2">
                                    <CheckCircle size={18} />
                                    Shift Completed
                                </div>
                            ) : isCheckedIn ? (
                                <button
                                    onClick={handleCheckOut}
                                    disabled={actionLoading}
                                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-red-200 hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                                >
                                    {actionLoading ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <>
                                            <LogOut size={18} />
                                            Check Out
                                        </>
                                    )}
                                </button>
                            ) : (
                                <button
                                    onClick={handleCheckIn}
                                    disabled={actionLoading}
                                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#052558] to-[#527FB0] text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-200 hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                                >
                                    {actionLoading ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <>
                                            <LogIn size={18} />
                                            Check In
                                        </>
                                    )}
                                </button>
                            )}
                        </div>

                        {/* Employee Info Footer */}
                        {employeeUser && (
                            <p className="text-xs text-gray-400 uppercase font-bold tracking-widest">
                                {employeeUser.name} · {employeeUser.id} · {employeeUser.role || 'Employee'}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Attendance;
