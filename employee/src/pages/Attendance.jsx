import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { LogIn, LogOut, CheckCircle, Clock, Calendar, Loader2, AlertCircle } from 'lucide-react';
import { TableSkeleton, SkeletonBlock } from '../components/Skeleton';
import { useFilter } from '../context/FilterContext';
import { useAlert } from '../context/AlertContext';

const Attendance = () => {
    const { triggerAlert } = useAlert();
    const [todayRecord, setTodayRecord] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastRefreshed, setLastRefreshed] = useState(null);
    const [employeeUser, setEmployeeUser] = useState(null);
    const [attendanceRecords, setAttendanceRecords] = useState([]);

    // Filter states
    const [statusFilter, setStatusFilter] = useState('all');
    const [shiftFilter, setShiftFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState('latest');
    const [timeRange, setTimeRange] = useState('all');

    const { setFilterConfig, setResultsCount } = useFilter();

    // Register filter options with the floating filter button
    useEffect(() => {
        setFilterConfig({
            title: 'Filter Attendance',
            groups: [
                {
                    id: 'status',
                    label: 'Status',
                    defaultValue: 'all',
                    options: [
                        { label: 'All', value: 'all' },
                        { label: 'Present', value: 'Present' },
                        { label: 'Absent', value: 'Absent' },
                        { label: 'Late', value: 'Late' },
                        { label: 'On Leave', value: 'On Leave' },
                        { label: 'Overtime', value: 'Overtime' }
                    ]
                },
                {
                    id: 'shift',
                    label: 'Shift',
                    defaultValue: 'all',
                    options: [
                        { label: 'All', value: 'all' },
                        { label: 'Morning', value: 'Morning' },
                        { label: 'Evening', value: 'Evening' }
                    ]
                }
            ],
            initialValues: {
                status: 'all',
                shift: 'all'
            },
            onChange: (newValues) => {
                if (newValues.status !== undefined) setStatusFilter(newValues.status);
                if (newValues.shift !== undefined) setShiftFilter(newValues.shift);
                if (newValues.sortOrder !== undefined) setSortOrder(newValues.sortOrder);
                if (newValues.timeRange !== undefined) setTimeRange(newValues.timeRange);
            },
            onReset: () => {
                setStatusFilter('all');
                setShiftFilter('all');
                setSortOrder('latest');
                setTimeRange('all');
            }
        });

        return () => {
            setFilterConfig(null);
            setResultsCount(null);
        };
    }, [setFilterConfig, setResultsCount]);

    const getItemDate = (item) => {
        if (!item) return null;
        const fields = [
            item.createdAt,
            item.date,
            item.timestamp,
            item.startDate,
            item.appliedDate,
            item.bookingDate,
            item.scheduledAt,
            item.updatedAt
        ];
        for (const f of fields) {
            if (!f) continue;
            if (f instanceof Date && !isNaN(f.getTime())) return f;
            if (typeof f === 'number') {
                const d = new Date(f);
                if (!isNaN(d.getTime())) return d;
            }
            if (typeof f === 'string') {
                const trimmed = f.trim();
                const ddmmyyyy = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
                if (ddmmyyyy) {
                    const day = parseInt(ddmmyyyy[1], 10);
                    const month = parseInt(ddmmyyyy[2], 10) - 1;
                    const year = parseInt(ddmmyyyy[3], 10);
                    const d = new Date(year, month, day);
                    if (!isNaN(d.getTime())) return d;
                }
                const d = new Date(trimmed);
                if (!isNaN(d.getTime())) return d;
            }
        }
        if (typeof item._id === 'string' && item._id.length === 24 && /^[a-f\d]{24}$/i.test(item._id)) {
            const timestamp = parseInt(item._id.substring(0, 8), 16) * 1000;
            const d = new Date(timestamp);
            if (!isNaN(d.getTime())) return d;
        }
        return null;
    };

    // Filter records dynamically
    const filteredRecords = useMemo(() => {
        const filtered = attendanceRecords.filter((record) => {
            if (statusFilter && statusFilter !== 'all') {
                const recStatus = (record.status || '').trim().toLowerCase();
                const targetStatus = statusFilter.trim().toLowerCase();
                if (recStatus !== targetStatus) {
                    return false;
                }
            }
            if (shiftFilter && shiftFilter !== 'all') {
                const recShift = (record.shift || '').trim().toLowerCase();
                const targetShift = shiftFilter.trim().toLowerCase();
                if (recShift !== targetShift) {
                    return false;
                }
            }
            if (timeRange && timeRange !== 'all') {
                const itemDate = getItemDate(record);
                if (itemDate) {
                    const now = new Date();
                    let cutoff;
                    if (timeRange === 'week') {
                        cutoff = new Date();
                        cutoff.setDate(now.getDate() - 7);
                    } else if (timeRange === 'month') {
                        cutoff = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    }
                    if (cutoff) {
                        cutoff.setHours(0, 0, 0, 0);
                        if (itemDate < cutoff) return false;
                    }
                }
            }
            return true;
        });

        return filtered.sort((a, b) => {
            const dateA = getItemDate(a)?.getTime() || 0;
            const dateB = getItemDate(b)?.getTime() || 0;
            if (sortOrder === 'oldest') {
                return dateA - dateB;
            }
            return dateB - dateA;
        });
    }, [attendanceRecords, statusFilter, shiftFilter, sortOrder, timeRange]);

    // Update floating filter counter badge
    useEffect(() => {
        if (setResultsCount) {
            setResultsCount(filteredRecords.length);
        }
    }, [filteredRecords.length, setResultsCount]);

    const formatTime = (dateStr) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).toLowerCase();
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

            const empId = user.employeeId || user.id;

            // Fetch today's status & records simultaneously
            const [statusRes, recordsRes] = await Promise.all([
                fetch(`https://vehicleecare.onrender.com/api/attendance/status/${empId}`),
                fetch(`https://vehicleecare.onrender.com/api/attendance/employee/${empId}`)
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
                setError(statusData.message ? `Attendance Status Error. ${statusData.message}` : 'Attendance Status Error. Failed to fetch attendance status.');
            }
        } catch (err) {
            setError('Connection Failed. Please check your network connection.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (error) {
            triggerAlert(error, 'error');
        }
    }, [error, triggerAlert]);

    useEffect(() => {
        fetchTodayStatus();
        const timer = setInterval(() => fetchTodayStatus(true), 5000);
        return () => clearInterval(timer);
    }, [fetchTodayStatus]);

    const handleCheckIn = async () => {
        if (!employeeUser) return;
        setActionLoading(true);
        try {
            const res = await fetch('https://vehicleecare.onrender.com/api/attendance/check-in', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employeeId: employeeUser.employeeId || employeeUser.id })
            });
            const data = await res.json();
            if (data.success || data.message?.includes('Absent')) {
                fetchTodayStatus(true);
            } else {
                setError(data.message ? `${data.message}` : 'Check-In Failed. Please try again later.');
            }
        } catch (err) {
            setError('Connection Failed. Please check your network connection.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCheckOut = async () => {
        if (!todayRecord?._id) return;
        setActionLoading(true);
        try {
            const res = await fetch(`https://vehicleecare.onrender.com/api/attendance/check-out/${todayRecord._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (data.success) {
                fetchTodayStatus(true);
            } else {
                setError(data.message ? `Check-Out Failed. ${data.message}` : 'Check-Out Failed. Please try again later.');
            }
        } catch (err) {
            setError('Connection Failed. Please check your network connection.');
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

    const formatRole = (role) => {
        if (!role) return 'Staff';
        const r = role.toUpperCase().replace(/\s+/g, '');
        if (r === 'SDEI') return 'SDE I';
        if (r === 'SDEII') return 'SDE II';
        if (r === 'SDEIII') return 'SDE III';
        if (r === 'QAI') return 'QA I';
        if (r === 'QAII') return 'QA II';
        if (r === 'QAIII') return 'QA III';
        if (r === 'SENIORQA') return 'Senior QA';
        return role;
    };

    const getRoleBadge = (role) => {
        const r = (role || '').toUpperCase().replace(/\s+/g, '');
        switch (r) {
            case 'ADMIN': return 'bg-purple-100 text-purple-700 font-bold';
            case 'MANAGER': return 'bg-blue-100 text-blue-700 font-bold';
            case 'STAFF': return 'bg-emerald-100 text-emerald-700 font-bold';
            case 'MECHANIC': return 'bg-emerald-100 text-emerald-700 font-bold';
            case 'TECHNICIAN': return 'bg-amber-100 text-amber-700 font-bold';
            case 'SUPPORT': return 'bg-indigo-100 text-indigo-700 font-bold';
            case 'SDEI': return 'bg-sky-100 text-sky-700 font-bold';
            case 'SDEII': return 'bg-blue-100 text-blue-700 font-bold';
            case 'SDEIII': return 'bg-indigo-100 text-indigo-700 font-bold';
            case 'JUNIOR': return 'bg-emerald-100 text-emerald-700 font-bold';
            case 'SENIOR': return 'bg-violet-100 text-violet-700 font-bold';
            case 'ASSOCIATE': return 'bg-purple-100 text-purple-700 font-bold';
            case 'QAI': return 'bg-amber-100 text-amber-700 font-bold';
            case 'QAII': return 'bg-amber-100 text-amber-700 font-bold';
            case 'QAIII': return 'bg-orange-100 text-orange-700 font-bold';
            case 'SENIORQA': return 'bg-rose-100 text-rose-700 font-bold';
            default: return 'bg-blue-100 text-blue-700 font-bold';
        }
    };

    const getShiftBadge = (shift) => {
        const lowerShift = (shift || '').toLowerCase();
        switch (lowerShift) {
            case 'full day':
            case 'full_day':
            case 'fullday': return 'bg-sky-50 text-sky-600 border-sky-100';
            case 'morning': return 'bg-orange-50 text-orange-600 border-orange-100';
            case 'evening': return 'bg-[#faf5ff] text-purple-600 border-purple-100';
            case 'night': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
            default: return 'bg-sky-50 text-sky-600 border-sky-100';
        }
    };

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto h-[calc(100vh-9.25rem)] flex flex-col">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold uppercase text-[#011023] tracking-tight">Attendance</h1>

                {/* Check In / Out Buttons replace the Last Refreshed area natively */}
                <div className="flex items-center gap-4 w-56">
                    {loading ? (
                        <SkeletonBlock className="h-[38px] w-full bg-slate-200 rounded-xl" />
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
                                <LogIn size={16} />
                                Check In
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

            {/* Main Table Area mapped from Garage Directory styling */}
            <div className="bg-white flex-1 min-h-0 border border-[#e9f2fb] rounded-2xl shadow-[0_1px_2.5px_0_rgba(0,0,0,0.07)] overflow-hidden flex flex-col">
                <div className="overflow-x-hidden overflow-y-auto text-center flex-1 relative hide-scrollbar">
                    <table className="w-full text-left border-collapse table-fixed">
                        <thead className="sticky top-0 z-10 shadow-sm">
                            <tr className="bg-[#f2f7ff] text-[15px] text-center uppercase tracking-wider text-gray-500 border-b border-[#f0f6fc]">
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
                                <TableSkeleton rows={15} cols={8} />
                            ) : filteredRecords.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="p-8 text-center py-20">
                                        <span className="text-sm font-bold text-gray-400">NO ATTENDANCE RECORDS FOUND</span>
                                    </td>
                                </tr>
                            ) : filteredRecords.map((r) => (
                                <tr key={r.id} className="text-center transition-all hover:bg-blue-50/30">

                                    <td className="p-4.5 font-semibold text-[#052558] text-sm truncate text-center">
                                        {r.employeeId}
                                    </td>
                                    <td className="p-4.5 text-center">
                                        <div className="font-semibold text-sm text-[#011023] truncate">{r.employeeName}</div>
                                    </td>
                                    <td className="p-4.5 text-center">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${getRoleBadge(r.role)}`}>
                                            {formatRole(r.role)}
                                        </span>
                                    </td>
                                    <td className="p-4.5 text-center">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border ${getShiftBadge(r.shift)}`}>
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
