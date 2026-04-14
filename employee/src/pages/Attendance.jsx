import React, { useState, useEffect, useCallback } from 'react';
import { LogIn, LogOut, CheckCircle, Clock, Calendar, Loader2, AlertCircle } from 'lucide-react';

const Attendance = () => {
    const [todayRecord, setTodayRecord] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastRefreshed, setLastRefreshed] = useState(null);
    const [employeeUser, setEmployeeUser] = useState(null);
    const [attendanceRecords, setAttendanceRecords] = useState([]);

    const formatTime = (dateStr) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase();
    };

    const formatDateStr = (dateStr) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '—';

        const day = d.toLocaleDateString('en-IN', { day: '2-digit' });
        const month = d.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase();
        const year = d.getFullYear();
        return `${day} ${month} ${year}`;
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

            // Fetch today's status & records simultaneously
            const [statusRes, recordsRes] = await Promise.all([
                fetch(`http://localhost:5001/api/attendance/status/${user.id}`),
                fetch(`http://localhost:5001/api/attendance/employee/${user.id}`)
            ]);

            const statusData = await statusRes.json();
            const recordsData = await recordsRes.json();

            if (statusData.success && recordsData.success) {
                setTodayRecord(statusData.data);

                // Format records to match table expectations
                const records = (recordsData.data || []).map(r => ({
                    id: r._id,
                    date: r.date,
                    employeeId: r.employeeId,
                    employeeName: r.employeeName,
                    contact: r.contact || '—',
                    email: r.email || '',
                    role: r.role || '—',
                    shift: r.shift || '—',
                    checkIn: r.checkIn,
                    checkOut: r.checkOut,
                    status: r.status,
                    _id: r._id
                }));
                setAttendanceRecords(records);

                setLastRefreshed(new Date());
                setError(null);
            } else {
                setError(statusData.message || 'Failed to fetch attendance status.');
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
            if (data.success || data.message?.includes('Absent')) {
                fetchTodayStatus(true);
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
                fetchTodayStatus(true);
            } else {
                setError(data.message || 'Check-out failed. Please try again.');
            }
        } catch (err) {
            setError('Connection failed. Please try again.');
        } finally {
            setActionLoading(false);
        }
    };

    const isCheckedIn = todayRecord && todayRecord.checkIn;
    const isCheckedOut = todayRecord && todayRecord.checkOut;
    const isShiftComplete = isCheckedIn && isCheckedOut;
    const isMarkedAbsent = todayRecord && todayRecord.status === 'Absent';
    const isOnLeave = todayRecord && todayRecord.status === 'On Leave';

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Present': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'Absent': return 'bg-red-50 text-red-600 border-red-100';
            case 'Late': return 'bg-orange-50 text-orange-600 border-orange-100';
            case 'On Leave': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'Overtime': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
            default: return 'bg-gray-50 text-gray-600 border-gray-100';
        }
    };

    const getRoleBadge = (role) => {
        switch (role) {
            case 'Admin': return 'bg-purple-100 text-purple-700 font-bold';
            case 'Manager': return 'bg-blue-100 text-blue-700 font-bold';
            case 'Mechanic': return 'bg-emerald-100 text-emerald-700 font-bold';
            case 'Technician': return 'bg-amber-100 text-amber-700 font-bold';
            case 'Support': return 'bg-indigo-100 text-indigo-700 font-bold';
            case 'Staff': return 'bg-emerald-100 text-emerald-700 font-bold';
            case 'Chef': return 'bg-orange-100 text-orange-700 font-bold';
            case 'Waiter': return 'bg-pink-100 text-pink-700 font-bold';
            case 'Cashier': return 'bg-cyan-100 text-cyan-700 font-bold';
            case 'Delivery': return 'bg-lime-100 text-lime-700 font-bold';
            default: return 'bg-gray-100 text-gray-700 font-bold';
        }
    };

    const getShiftBadge = (shift) => {
        const lowerShift = (shift || '').toLowerCase();
        switch (lowerShift) {
            case 'morning': return 'bg-orange-50 text-orange-600 border-orange-100';
            case 'evening': return 'bg-purple-50 text-purple-600 border-purple-100';
            case 'night': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
            default: return 'bg-gray-50 text-gray-600 border-gray-100';
        }
    };

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto">
            {/* Header Area */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold uppercase text-[#011023] tracking-tight">Attendance</h1>

                {/* Check In / Out Buttons replace the Last Refreshed area natively */}
                <div className="flex items-center gap-4 w-56">
                    {loading ? (
                        <div className="w-full py-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center h-[38px]">
                            <Loader2 size={16} className="animate-spin text-gray-400" />
                        </div>
                    ) : isShiftComplete ? (
                        <div className="w-full py-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 font-bold text-[12px] uppercase tracking-widest text-center flex items-center justify-center gap-2">
                            {/* <CheckCircle size={16} /> */}
                            Shift Completed
                        </div>
                    ) : isMarkedAbsent ? (
                        <div className="relative group w-full">
                            <button
                                disabled
                                className="w-full py-2.5 rounded-xl bg-red-50 border border-red-100 text-red-500 font-bold text-[12px] uppercase tracking-widest text-center flex items-center justify-center gap-2 opacity-80"
                            >
                                Marked Absent
                            </button>
                            <div className="absolute top-full right-0 mt-2 w-76 p-3 bg-gray-900/90 backdrop-blur-md text-white text-[10px] font-semibold rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-center uppercase tracking-wider border border-white/10 shadow-2xl">
                                You cannot checkin for today as you are marked absent
                            </div>
                        </div>
                    ) : isCheckedIn ? (
                        <button
                            onClick={handleCheckOut}
                            disabled={actionLoading}
                            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-bold text-[13px] uppercase tracking-widest shadow-lg shadow-red-200 hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                            {actionLoading ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <>
                                    <LogOut size={16} />
                                    Check Out
                                </>
                            )}
                        </button>
                    ) : (
                        <div className="relative group w-full">
                            <button
                                onClick={handleCheckIn}
                                disabled={actionLoading || isOnLeave}
                                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#052558] to-[#527FB0] text-white font-bold text-[13px] uppercase tracking-widest shadow-lg shadow-blue-200 hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {actionLoading ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <>
                                        <LogIn size={16} />
                                        Check In
                                    </>
                                )}
                            </button>
                            {isOnLeave && (
                                <div className="absolute top-full right-0 mt-2 w-76 p-3 bg-gray-900/90 backdrop-blur-md text-white text-[10px] font-semibold rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-center uppercase tracking-wider border border-white/10 shadow-2xl">
                                    You are on leave from {formatDateStr(todayRecord.leaveStartDate)} - {formatDateStr(todayRecord.leaveEndDate)} check in after your leave ends
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-3 px-5 py-3.5 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-semibold">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                </div>
            )}

            {/* Main Table Area mapped from Garage Directory styling */}
            <div className="bg-white/60 backdrop-blur-xl max-h-[55rem] border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden">
                <div className="overflow-x-hidden overflow-y-auto h-[860px] relative hide-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 z-10 shadow-sm">
                            <tr className="bg-[#f0f6ff] text-[15px] uppercase text-center tracking-wider text-gray-500 border-b border-[#e6f0fa]">

                                <th className="p-4.5 font-bold text-center w-[12%]">Employee Id</th>
                                <th className="p-4.5 font-bold text-center w-[15%]">Employee Name</th>
                                <th className="p-4.5 font-bold text-center w-[10%]">Role</th>
                                <th className="p-4.5 font-bold text-center w-[10%]">Shift</th>
                                <th className="p-4.5 font-bold text-center w-[12%]">Date</th>
                                <th className="p-4.5 font-bold text-center w-[16%]">Check-in Time</th>
                                <th className="p-4.5 font-bold text-center w-[16%]">Check-out Time</th>
                                <th className="p-4.5 font-bold text-center w-[9%]">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y uppercase text-[12px] divide-[#e6f0fa]">
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="p-8 text-center">
                                        <div className="flex flex-col items-center justify-center gap-4 py-12">
                                            <Loader2 size={24} className="animate-spin text-[#527FB0]" />
                                            <span className="text-xs font-bold text-gray-400">LOADING RECORDS...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : attendanceRecords.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="p-8 text-center py-20">
                                        <span className="text-sm font-bold text-gray-400">NO ATTENDANCE RECORDS FOUND</span>
                                    </td>
                                </tr>
                            ) : attendanceRecords.map((r) => (
                                <tr key={r.id} className="text-center transition-all hover:bg-blue-50/30">

                                    <td className="p-4.5 font-semibold text-[#052558] text-sm truncate text-center">
                                        {r.employeeId}
                                    </td>
                                    <td className="p-4.5 text-center">
                                        <div className="font-semibold text-sm text-[#011023] truncate">{r.employeeName}</div>
                                    </td>
                                    <td className="p-4.5 text-center">
                                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wide ${getRoleBadge(r.role)}`}>
                                            {r.role}
                                        </span>
                                    </td>
                                    <td className="p-4.5 text-center">
                                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wide border ${getShiftBadge(r.shift)}`}>
                                            {r.shift}
                                        </span>
                                    </td>
                                    <td className="p-4.5 font-semibold text-[#011023] text-sm text-center">
                                        {formatDateStr(r.date)}
                                    </td>
                                    <td className="p-4.5 text-center">
                                        <span className="text-sm font-bold text-gray-600">
                                            {formatTime(r.checkIn)}
                                        </span>
                                    </td>
                                    <td className="p-4.5 text-center">
                                        <span className="text-[13px] font-bold text-gray-600">
                                            {formatTime(r.checkOut)}
                                        </span>
                                    </td>
                                    <td className="p-4.5 text-center">
                                        <span className={`px-3 py-1 rounded-xl text-xs font-semibold border uppercase tracking-wide ${getStatusBadge(r.status)}`}>
                                            {r.status === 'On Leave' ? 'On Leave' : r.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Attendance;
