import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Eye, X, Trash2, Clock, CheckCircle2, XCircle, AlertCircle, Calendar, Loader2, MessageSquare } from 'lucide-react';
import useHighlight from '../hooks/useHighlight';
import { TableSkeleton } from '../components/Skeleton';
import { useFilter } from '../context/FilterContext';
import { useAlert } from '../context/AlertContext';
import { useRowLabels, FloatingLabelSelector, renderLabelIcon, stripEmoji, LABEL_FILTER_GROUP } from '../components/RowLabel';

const Attendance = () => {
    const { triggerAlert } = useAlert();
    const [lastRefreshed, setLastRefreshed] = useState(null);
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [recordToDelete, setRecordToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const [employees, setEmployees] = useState([]);
    const [isMarkModalOpen, setIsMarkModalOpen] = useState(false);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    const [attendanceStatus, setAttendanceStatus] = useState(null);
    const [statusLoading, setStatusLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // Filter states
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [shiftFilter, setShiftFilter] = useState('all');
    const [labelFilter, setLabelFilter] = useState('all');

    const { setFilterConfig, setResultsCount } = useFilter();
    const { rowLabels, activeLabelRowId, setActiveLabelRowId, handleSaveRowLabel, labelPopupRef, isLabelMode } = useRowLabels('garage_attendance_row_labels');

    // Register filter options with the floating filter button
    useEffect(() => {
        setFilterConfig({
            title: 'Filter Attendance',
            groups: [
                LABEL_FILTER_GROUP,
                {
                    id: 'shift',
                    label: 'Shift',
                    defaultValue: 'all',
                    options: [
                        { label: 'All', value: 'all' },
                        { label: 'Morning', value: 'Morning' },
                        { label: 'Evening', value: 'Evening' }
                    ]
                },
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
                    id: 'role',
                    label: 'Role',
                    defaultValue: 'all',
                    options: [
                        { label: 'All', value: 'all' },
                        { label: 'Admin', value: 'Admin' },
                        { label: 'Manager', value: 'Manager' },
                        { label: 'Mechanic', value: 'Mechanic' },
                        { label: 'Technician', value: 'Technician' },
                        { label: 'Support', value: 'Support' }
                    ]
                }
            ],
            initialValues: {
                role: 'all',
                status: 'all',
                shift: 'all',
                label: 'all'
            },
            onChange: (newValues) => {
                if (newValues.role !== undefined) setRoleFilter(newValues.role);
                if (newValues.status !== undefined) setStatusFilter(newValues.status);
                if (newValues.shift !== undefined) setShiftFilter(newValues.shift);
                if (newValues.label !== undefined) setLabelFilter(newValues.label);
            },
            onReset: () => {
                setRoleFilter('all');
                setStatusFilter('all');
                setShiftFilter('all');
                setLabelFilter('all');
            }
        });

        return () => {
            setFilterConfig(null);
            setResultsCount(null);
        };
    }, [setFilterConfig, setResultsCount]);

    // Compute display data for the table - moved from inline map to useMemo for stability
    const displayData = React.useMemo(() => {
        const today = new Date().toLocaleDateString('en-CA');
        const todayRecords = attendanceRecords.filter(r => r.date === today);
        
        const data = employees.map(emp => {
            const record = todayRecords.find(r => r.employeeId === emp.employeeId);
            if (record) return record;

            const now = new Date();
            const currentMins = now.getHours() * 60 + now.getMinutes();
            const shiftStr = (emp.shift || '').toLowerCase();
            
            const thresholds = {
                morning: 9 * 60 + 20, // 09:20 AM
                evening: 15 * 60 + 20, // 03:20 PM
                night: 21 * 60 + 20    // 09:20 PM
            };
            
            const threshold = thresholds[shiftStr] || thresholds.morning;
            const isPastAbsentTime = currentMins > threshold;

            return {
                id: `temp-${emp.employeeId}`,
                employeeId: emp.employeeId,
                employeeName: emp.name,
                contact: emp.phone || '—',
                role: emp.role || '—',
                shift: emp.shift || '—',
                date: today,
                checkIn: null,
                checkOut: null,
                status: isPastAbsentTime ? 'Absent' : '—',
                isMock: true
            };
        });

        // Sort: Morning -> Evening -> Night
        data.sort((a, b) => {
            const shiftPriority = { 'morning': 1, 'evening': 2, 'night': 3 };
            const pA = shiftPriority[(a.shift || '').toLowerCase()] || 99;
            const pB = shiftPriority[(b.shift || '').toLowerCase()] || 99;
            if (pA !== pB) return pA - pB;
            return (a.employeeName || '').localeCompare(b.employeeName || '');
        });

        return data;
    }, [employees, attendanceRecords]);

    const filteredData = React.useMemo(() => {
        return displayData.filter((r) => {
            const labelKey = r._id || r.id || r.employeeId;
            if (labelFilter && labelFilter !== 'all') {
                const itemLabel = rowLabels[labelKey] || rowLabels[r.employeeId];
                if (!itemLabel || itemLabel.toUpperCase() !== labelFilter.toUpperCase()) return false;
            }
            if (roleFilter && roleFilter !== 'all') {
                const recRole = (r.role || '').trim().toLowerCase();
                if (recRole !== roleFilter.trim().toLowerCase()) return false;
            }
            if (statusFilter && statusFilter !== 'all') {
                const recStatus = (r.status || '').trim().toLowerCase();
                if (recStatus !== statusFilter.trim().toLowerCase()) return false;
            }
            if (shiftFilter && shiftFilter !== 'all') {
                const recShift = (r.shift || '').trim().toLowerCase();
                if (recShift !== shiftFilter.trim().toLowerCase()) return false;
            }
            return true;
        });
    }, [displayData, roleFilter, statusFilter, shiftFilter]);

    useEffect(() => {
        if (setResultsCount) {
            setResultsCount(filteredData.length);
        }
    }, [filteredData.length, setResultsCount]);

    const highlightedRow = useHighlight(filteredData);

    // Lock body scroll when any modal is open
    useEffect(() => {
        if (isViewModalOpen || isMarkModalOpen || isDeleteModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isViewModalOpen, isMarkModalOpen, isDeleteModalOpen]);

    const fetchAttendance = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);

            const storedUser = localStorage.getItem('garageUser');
            if (!storedUser) { setLoading(false); return; }
            const user = JSON.parse(storedUser);

            const res = await fetch(`http://localhost:5001/api/attendance/garage/${user.id}`);
            const data = await res.json();

            if (data.success) {
                // Map the backend shape to what the table expects
                const records = (data.data || []).map(r => ({
                    id: r._id,
                    employeeId: r.employeeId,
                    employeeName: r.employeeName,
                    contact: r.contact || '—',
                    email: r.email || '',
                    role: r.role || '—',
                    shift: r.shift || '—',
                    date: r.date,
                    checkIn: r.checkIn,
                    checkOut: r.checkOut,
                    status: r.status,
                    _id: r._id
                }));
                setAttendanceRecords(records);
                setLastRefreshed(new Date());
            }
        } catch (error) {
            console.error('Failed to fetch attendance records', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchEmployees = useCallback(async () => {
        try {
            const storedUser = localStorage.getItem('garageUser');
            if (!storedUser) return;
            const user = JSON.parse(storedUser);

            const res = await fetch(`http://localhost:5001/api/employees/garage/${user.id}`);
            const data = await res.json();
            if (data.success) {
                setEmployees(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch employees', error);
        }
    }, []);

    const checkStatus = useCallback(async (empId) => {
        if (!empId) {
            setAttendanceStatus(null);
            return;
        }
        setStatusLoading(true);
        try {
            const res = await fetch(`http://localhost:5001/api/attendance/status/${empId}`);
            const data = await res.json();
            if (data.success) {
                setAttendanceStatus(data.data);
            } else {
                setAttendanceStatus(null);
            }
        } catch (error) {
            console.error('Failed to check status', error);
            setAttendanceStatus(null);
        } finally {
            setStatusLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isMarkModalOpen) {
            checkStatus(selectedEmployeeId);
        }
    }, [selectedEmployeeId, isMarkModalOpen, checkStatus]);

    const handleMarkAttendance = async (action) => {
        if (!selectedEmployeeId) return;
        setActionLoading(true);
        try {
            if (action === 'check-in') {
                const res = await fetch(`http://localhost:5001/api/attendance/check-in`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ employeeId: selectedEmployeeId })
                });
                const data = await res.json();
                if (!data.success && !data.message?.includes('Absent')) {
                    triggerAlert(data.message || 'Check-in failed', 'error');
                    return;
                }
                triggerAlert('Check-in successful', 'success');
            } else if (action === 'check-out') {
                if (!attendanceStatus || !attendanceStatus._id) return;
                const res = await fetch(`http://localhost:5001/api/attendance/check-out/${attendanceStatus._id}`, {
                    method: 'PUT'
                });
                const data = await res.json();
                if (!data.success) {
                    triggerAlert(data.message || 'Check-out failed', 'error');
                    return;
                }
                triggerAlert('Check-out successful', 'success');
            }
            await fetchAttendance();
            await checkStatus(selectedEmployeeId);
            setIsMarkModalOpen(false);
            setSelectedEmployeeId('');
            setAttendanceStatus(null);
        } catch (error) {
            console.error('Action failed', error);
            triggerAlert('Something went wrong', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendance();
        fetchEmployees();
        const timer = setInterval(() => fetchAttendance(true), 5000);
        return () => clearInterval(timer);
    }, [fetchAttendance, fetchEmployees]);

    const handleViewDetails = (record) => {
        setSelectedRecord(record);
        setIsViewModalOpen(true);
    };

    const confirmDeleteRecord = async () => {
        if (!recordToDelete || recordToDelete.isMock) {
            setIsDeleteModalOpen(false);
            setRecordToDelete(null);
            return;
        }
        setDeleting(true);
        try {
            const res = await fetch(`http://localhost:5001/api/attendance/${recordToDelete._id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                setAttendanceRecords(prev => prev.filter(r => r.id !== recordToDelete.id));
                setIsDeleteModalOpen(false);
                setRecordToDelete(null);
            }
        } catch (err) {
            console.error('Failed to delete attendance record', err);
        } finally {
            setDeleting(false);
        }
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '—';
        return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).toLowerCase();
    };

    // const formatDateStr = (dateStr) => {
    //     if (!dateStr) return '—';
    //     const d = new Date(dateStr);
    //     if (isNaN(d.getTime())) return '—';
        
    //     const day = d.toLocaleDateString('en-IN', { day: '2-digit' });
    //     const month = d.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase();
    //     const year = d.getFullYear();
    //     return `${day} ${month} ${year}`;
    // };

    const formatDateTime = (dateStr) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '—';
        
        const day = d.toLocaleDateString('en-IN', { day: '2-digit' });
        const month = d.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase();
        const year = d.getFullYear();
        const time = d.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }).toLowerCase();
        return `${day} ${month} ${year} | ${time}`;
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Present': return 'bg-emerald-100 text-emerald-700';
            case 'Absent': return 'bg-rose-100 text-rose-700';
            case 'Late': return 'bg-amber-100 text-amber-700';
            case 'On Leave': return 'bg-blue-100 text-blue-700';
            case 'Overtime': return 'bg-purple-100 text-purple-700';
            default: return 'bg-gray-100 text-gray-700';
        }
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

    const getRoleBadge = (role) => {
        switch (role) {
            case 'Admin': return 'bg-purple-100 text-purple-700 font-bold';
            case 'Manager': return 'bg-blue-100 text-blue-700 font-bold';
            case 'Mechanic': return 'bg-emerald-100 text-emerald-700 font-bold';
            case 'Technician': return 'bg-amber-100 text-amber-700 font-bold';
            case 'Support': return 'bg-indigo-100 text-indigo-700 font-bold';
            default: return 'bg-gray-100 text-gray-700 font-bold';
        }
    };

    const getShiftBadge = (shift) => {
        const lowerShift = (shift || '').toLowerCase();
        switch (lowerShift) {
            case 'morning': return 'bg-amber-100 text-amber-700';
            case 'evening': return 'bg-purple-100 text-purple-700';
            case 'night': return 'bg-indigo-100 text-indigo-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto h-[calc(100vh-9.25rem)] flex flex-col">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <h1 className="text-3xl font-bold text-[#011023] uppercase tracking-tight">Attendance Directory</h1>
                </div>
                <div className="flex items-center gap-2 text-xs uppercase text-gray-400 font-medium self-center">
                    {lastRefreshed
                        ? `Last refreshed | ${lastRefreshed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | ${lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`
                        : <div className="h-3.5 w-70 bg-slate-200 rounded-full animate-pulse" />}
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-white border border-[#e9f2fb] rounded-2xl shadow-[0_1px_2.5px_0_rgba(0,0,0,0.07)] flex-1 min-h-0 overflow-hidden flex flex-col">
                <div className="overflow-x-hidden overflow-y-auto text-center flex-1 relative hide-scrollbar">
                    <table className="w-full text-center border-collapse table-fixed">
                        <thead className="sticky top-0 z-10 shadow-sm">
                            <tr className="bg-[#f0f6ff] text-[15px] uppercase text-center tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                <th className="p-4.5 font-bold text-center w-[11%]">Employee Id</th>
                                <th className="p-4.5 font-bold text-center w-[13%]">Employee Name</th>
                                <th className="p-4.5 font-bold text-center w-[12%]">Contact</th>
                                <th className="p-4.5 font-bold text-center w-[9%]">Role</th>
                                <th className="p-4.5 font-bold text-center w-[9%]">Shift</th>
                                <th className="p-4.5 font-bold text-center w-[10%]">Date</th>
                                <th className="p-4.5 font-bold text-center w-[12%]">Check-in Time</th>
                                <th className="p-4.5 font-bold text-center w-[13%]">Check-out Time</th>
                                <th className="p-4.5 font-bold text-center w-[8%]">Status</th>
                                <th className="p-4.5 font-bold text-center w-[7%]">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y uppercase text-[12px] divide-[#e6f0fa]">
                            {loading && filteredData.length === 0 ? (
                                <TableSkeleton rows={15} cols={10} />
                            ) : filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan="10" className="p-8 text-center py-20 text-gray-400 font-bold uppercase">
                                        No attendance records found.
                                    </td>
                                </tr>
                            ) : filteredData.map((r) => {
                                const rowId = r._id || r.id || r.employeeId;
                                return (
                                    <tr 
                                        key={r.id} 
                                        id={`row-${rowId}`}
                                        onClick={() => {
                                            if (isLabelMode) {
                                                setActiveLabelRowId(prev => prev === rowId ? null : rowId);
                                            }
                                        }}
                                        className={`text-center cursor-pointer transition-all duration-1000 ${
                                            activeLabelRowId === rowId
                                                ? 'relative z-40 bg-blue-50/50'
                                                : highlightedRow === rowId 
                                                ? 'bg-emerald-100/60 rounded-2xl relative z-20 scale-[1.01]' 
                                                : 'hover:bg-blue-50/30'
                                        }`}
                                    >
                                        <td className="p-4 font-semibold text-[#052558] text-sm text-center w-[10%] relative">
                                            <div className="relative flex items-center justify-center w-full">
                                                {Boolean(rowLabels[rowId]) && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveLabelRowId(prev => prev === rowId ? null : rowId);
                                                        }}
                                                        className="absolute -left-1.5 top-1/2 -translate-y-1/2 cursor-pointer hover:scale-115 transition-transform active:scale-95 p-0.5"
                                                        title={`Label: ${stripEmoji(rowLabels[rowId])}`}
                                                    >
                                                        {renderLabelIcon(rowLabels[rowId], 16)}
                                                    </button>
                                                )}

                                                {activeLabelRowId === rowId && (
                                                    <FloatingLabelSelector 
                                                        rowId={rowId}
                                                        currentLabel={rowLabels[rowId]}
                                                        onSaveLabel={handleSaveRowLabel}
                                                        labelPopupRef={labelPopupRef}
                                                        topClass="-top-8"
                                                        positionClass="-left-4"
                                                    />
                                                )}
                                                <span className="truncate">{r.employeeId}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="font-semibold text-sm text-[#011023] truncate">{r.employeeName}</div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="text-sm text-[#052558] font-semibold">{r.contact}</div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2.5 py-1 text-xs font-semibold border border-transparent uppercase rounded-full whitespace-nowrap ${getRoleBadge(r.role)}`}>
                                                {r.role}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-block px-3 py-1 text-xs font-semibold uppercase rounded-full whitespace-nowrap ${getShiftBadge(r.shift)}`}>
                                                {r.shift}
                                            </span>
                                        </td>
                                        <td className="p-4 font-semibold text-[#011023] text-sm text-center">
                                            {formatDateStr(r.checkIn || r.date)}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="text-[13px] font-bold text-gray-600 tracking-wide">
                                                {formatTime(r.checkIn)}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="text-[13px] font-bold text-gray-600 tracking-wide">
                                                {formatTime(r.checkOut)}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-block px-3 py-1 text-xs font-semibold uppercase rounded-full whitespace-nowrap ${getStatusBadge(r.status)}`}>
                                                {r.status === 'On Leave' ? 'On Leave' : r.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-4">
                                                <button
                                                    onClick={() => handleViewDetails(r)}
                                                    className="text-gray-400 hover:text-blue-500 transition-colors"
                                                >
                                                    <Eye size={17} />
                                                </button>
                                                <button
                                                    onClick={() => handleViewDetails(r)}
                                                    className="text-gray-400 hover:text-emerald-500 transition-colors"
                                                >
                                                    <MessageSquare size={17} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* View Details Modal */}
            {isViewModalOpen && selectedRecord && createPortal(
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#011023]/10 backdrop-blur-sm"
                    onClick={() => setIsViewModalOpen(false)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[120vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-[#e6f0fa] flex justify-between items-center bg-gradient-to-r from-blue-50/50 to-white">
                            <div>
                                <h3 className="text-xl uppercase font-bold text-[#052558]">Attendance Details</h3>
                                <p className="text-sm text-gray-500 uppercase mt-1">ID: <span className="font-semibold text-gray-700">{selectedRecord.employeeId}</span></p>
                            </div>
                            <button
                                onClick={() => setIsViewModalOpen(false)}
                                className="p- text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="pr-6 pl-6 pb-6 overflow-y-auto flex-1 space-y-8 hide-scrollbar uppercase bg-[#fafcff]/50">
                           
                            {/* Attendance Table */}
                            <div className="border border-[#e6f0fa] rounded-2xl overflow-y-auto h-[475px] shadow-sm bg-white hide-scrollbar">
                                <table className="w-full  text-center border-collapse">
                                    <thead className="bg-gray-50 text-[12px] uppercase text-gray-400 tracking-widest  sticky top-0 z-20 shadow-sm">
                                        <tr>
                                            <th className="p-4 w-[15%] text-center">Date</th>
                                            <th className="p-4 w-[15%] text-center">Role</th>
                                            <th className="p-4 w-[13%] text-center">Shift</th>
                                            <th className="p-4 w-[17%] text-center">Check-in Time</th>
                                            <th className="p-4 w-[20%] text-center">Check-out Time</th>
                                            <th className="p-4 w-[14%] text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#e1ecf8]">
                                        {attendanceRecords
                                            .filter((r) => r.employeeId === selectedRecord.employeeId)
                                            .map((record) => (
                                                <tr key={record.id} className="hover:bg-gray-50/50 transition-all duration-300 text-center">
                                                    <td className="p-4.5">
                                                        <div className="text-xs text-[#011023] font-semibold uppercase">
                                                            {formatDateStr(record.date)}
                                                        </div>
                                                    </td>
                                                    <td className="p-4.5 text-center">
                                                        <span className={`inline-block px-3 py-1 text-xs font-semibold uppercase rounded-full ${getRoleBadge(record.role)}`}>
                                                            {record.role}
                                                        </span>
                                                    </td>
                                                    <td className="p-4.5 text-center">
                                                        <span className={`inline-block px-3 py-1 text-xs font-semibold uppercase rounded-full ${getShiftBadge(record.shift)}`}>
                                                            {record.shift}
                                                        </span>
                                                    </td>
                                                    <td className="p-4.5 uppercase">
                                                        <div className="font-semibold text-[#011023] text-xs tracking-wide">
                                                            {formatTime(record.checkIn)}
                                                        </div>
                                                    </td>
                                                    <td className="p-4.5 uppercase">
                                                        <div className="font-semibold text-[#011023] text-xs tracking-wide">
                                                            {formatTime(record.checkOut)}
                                                        </div>
                                                    </td>
                                                    <td className="p-4.5 text-center">
                                                        <span className={`inline-block px-3 py-1 text-xs font-semibold uppercase rounded-full ${getStatusBadge(record.status)}`}>
                                                            {record.status === 'On Leave' ? 'On Leave' : record.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && createPortal(
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#011023]/10 backdrop-blur-sm transition-all duration-300"
                    onClick={() => { setIsDeleteModalOpen(false); setRecordToDelete(null); }}
                >
                    <div 
                        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-8 text-center uppercase space-y-4">
                            <h3 className="text-2xl font-bold text-[#011023] uppercase tracking-tighter mb-9">Delete Record</h3>
                            <p className="text-[13px] text-gray-500 font-medium leading-relaxed">
                                This will permanently remove the attendance record for <span className="text-[#052558] font-bold uppercase">{recordToDelete?.employeeName}</span>. 
                                This action <span className="text-rose-600 font-bold uppercase">cannot be undone</span>.
                            </p>
                        </div>
                        <div className="p-2 bg-gray-50/80 border-t border-gray-100 grid grid-cols-2 gap-3 pb-8 px-8">
                            <button 
                                onClick={() => { setIsDeleteModalOpen(false); setRecordToDelete(null); }}
                                className="px-4 py-3.5 bg-white border border-gray-200 text-gray-400 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-white hover:text-gray-600 transition-all shadow-sm active:scale-95"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmDeleteRecord}
                                disabled={deleting}
                                className="px-4 py-3.5 bg-rose-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                            >
                                {deleting ? <Loader2 size={16} className="animate-spin" /> : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Mark Attendance Modal */}
            {isMarkModalOpen && createPortal(
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-[#011023]/20 backdrop-blur-sm"
                     onClick={() => setIsMarkModalOpen(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
                         onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-[#e6f0fa] flex justify-between items-center bg-gradient-to-r from-blue-50/50 to-white">
                            <div>
                                <h3 className="text-xl uppercase font-bold text-[#052558]">Mark Attendance</h3>
                                <p className="text-sm text-gray-500 uppercase mt-1">Select Employee to Check-in/out</p>
                            </div>
                            <button
                                onClick={() => setIsMarkModalOpen(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Select Employee</label>
                                <select 
                                    className="w-full bg-blue-50/30 border border-blue-100 rounded-xl p-3 text-sm font-semibold text-[#011023] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all uppercase"
                                    value={selectedEmployeeId}
                                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                >
                                    <option value="" disabled>-- Choose Employee --</option>
                                    {employees.map(emp => (
                                        <option key={emp._id} value={emp.employeeId}>
                                            {emp.employeeId} - {emp.name} ({emp.role})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedEmployeeId && (
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-gray-400 tracking-wider flex items-center gap-2 uppercase">Today's Status</h4>
                                    {statusLoading ? (
                                        <div className="text-sm text-gray-500 animate-pulse font-medium uppercase">Checking status...</div>
                                    ) : attendanceStatus ? (
                                        <div className="bg-blue-50/30 p-4 rounded-xl border border-blue-100 space-y-3">
                                            <p className="text-sm flex items-center"><span className="text-gray-500 w-24 shrink-0 uppercase font-bold text-[11px]">Status:</span> <span className={`font-bold uppercase text-[11px] px-2 py-0.5 rounded-lg border tracking-wide ${getStatusBadge(attendanceStatus.status)}`}>{attendanceStatus.status}</span></p>
                                            <p className="text-sm flex items-center"><span className="text-gray-500 w-24 shrink-0 uppercase font-bold text-xs">Check-in:</span> <span className="font-bold text-gray-800 uppercase text-xs truncate">{formatDateTime(attendanceStatus.checkIn)}</span></p>
                                            {attendanceStatus.checkOut && (
                                                <p className="text-sm flex items-center"><span className="text-gray-500 w-24 shrink-0 uppercase font-bold text-xs">Check-out:</span> <span className="font-bold text-gray-800 uppercase text-xs truncate">{formatDateTime(attendanceStatus.checkOut)}</span></p>
                                            )}
                                            
                                            <div className="pt-4 border-t border-blue-100/50 mt-4 flex justify-end gap-3">
                                                {attendanceStatus.status === 'On Leave' ? (
                                                    <span className="text-blue-600 font-bold uppercase text-xs flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 w-full justify-center">
                                                        Employee is On Leave ({formatDateStr(attendanceStatus.leaveStartDate)} - {formatDateStr(attendanceStatus.leaveEndDate)})
                                                    </span>
                                                ) : !attendanceStatus.checkOut ? (
                                                     <button
                                                        onClick={() => handleMarkAttendance('check-out')}
                                                        disabled={actionLoading}
                                                        className="px-6 py-2.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 shadow-lg shadow-orange-200 transition-all uppercase text-xs disabled:opacity-50"
                                                    >
                                                        {actionLoading ? 'Saving...' : 'Check Out'}
                                                    </button>
                                                ) : (
                                                    <span className="text-emerald-600 font-bold uppercase text-xs flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                                                        <CheckCircle2 size={16} /> Completed for today
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-blue-50/30 p-4 rounded-xl border border-blue-100 space-y-3 flex flex-col items-center justify-center py-6">
                                            <p className="text-sm font-bold text-gray-500 uppercase">Not Checked In Yet</p>
                                            <button
                                                onClick={() => handleMarkAttendance('check-in')}
                                                disabled={actionLoading}
                                                className="mt-2 px-8 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 shadow-lg shadow-emerald-200 transition-all uppercase text-xs disabled:opacity-50 flex items-center gap-2"
                                            >
                                                <CheckCircle2 size={18} />
                                                {actionLoading ? 'Saving...' : 'Check In'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default Attendance;
