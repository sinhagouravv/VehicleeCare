import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Eye, X, Trash2, Clock, CheckCircle2, XCircle, AlertCircle, Calendar } from 'lucide-react';

const Attendance = () => {
    const [lastRefreshed, setLastRefreshed] = useState(null);
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ open: false, record: null });

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

    useEffect(() => {
        fetchAttendance();
        const timer = setInterval(() => fetchAttendance(true), 5000);
        return () => clearInterval(timer);
    }, [fetchAttendance]);

    const handleViewDetails = (record) => {
        setSelectedRecord(record);
        setIsViewModalOpen(true);
    };

    const handleDeleteRecord = async () => {
        if (!deleteModal.record) return;
        try {
            const res = await fetch(`http://localhost:5001/api/attendance/${deleteModal.record._id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                setAttendanceRecords(prev => prev.filter(r => r.id !== deleteModal.record.id));
            }
        } catch (err) {
            console.error('Failed to delete attendance record', err);
        } finally {
            setDeleteModal({ open: false, record: null });
        }
    };

    const formatDate = (dateStr) => {
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
            case 'Present': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'Absent': return 'bg-red-50 text-red-600 border-red-100';
            case 'Late': return 'bg-orange-50 text-orange-600 border-orange-100';
            case 'On Leave': return 'bg-blue-50 text-blue-600 border-blue-100';
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
            default: return 'bg-gray-100 text-gray-700 font-bold';
        }
    };

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-[#011023] uppercase tracking-tight">Attendance Directory</h1>
                <div className="flex items-center gap-2 text-xs uppercase text-gray-400 font-medium self-center">
                    {lastRefreshed
                        ? `Last refreshed | ${lastRefreshed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | ${lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`
                        : 'Loading…'}
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-white/60 backdrop-blur-xl max-h-[55rem] border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden">
                <div className="overflow-x-hidden overflow-y-auto h-[860px] relative hide-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 z-10 shadow-sm">
                            <tr className="bg-[#f0f6ff] text-[15px] uppercase text-center tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                <th className="p-4.5 font-bold text-center w-[10%]">Employee Id</th>
                                <th className="p-4.5 font-bold text-center w-[12%]">Employee Name</th>
                                <th className="p-4.5 font-bold text-center w-[15%]">Contact</th>
                                <th className="p-4.5 font-bold text-center w-[7%]">Role</th>
                                <th className="p-4.5 font-bold text-center w-[15%]">Check-in Time</th>
                                <th className="p-4.5 font-bold text-center w-[15%]">Check-out Time</th>
                                <th className="p-4.5 font-bold text-center w-[7%]">Status</th>
                                <th className="p-4.5 font-bold text-center w-[7%]">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y uppercase text-[12px] divide-[#e6f0fa]">
                            {attendanceRecords.map((r) => (
                                <tr key={r.id} className="text-center transition-all hover:bg-blue-50/30">
                                    <td className="p-4 font-semibold text-[#052558] text-sm truncate text-center w-[10%]">
                                        {r.employeeId}
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="font-bold text-[#011023] truncate px-2">{r.employeeName}</div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="text-xs text-gray-500">{r.contact}</div>
                                        <div className="font-medium text-sm lowercase mt-1">{r.email || '—'}</div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold  uppercase tracking-wide ${getRoleBadge(r.role)}`}>
                                            {r.role}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="text-sm font-semibold text-gray-600">
                                            {formatDate(r.checkIn)}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="text-sm font-semibold text-gray-600">
                                            {formatDate(r.checkOut)}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`px-3 py-1 rounded-xl text-[11px] font-bold border uppercase tracking-wide ${getStatusBadge(r.status)}`}>
                                            {r.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <button
                                                onClick={() => handleViewDetails(r)}
                                                className="text-gray-400 hover:text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition-colors"
                                                title="View Details"
                                            >
                                                <Eye size={17} />
                                            </button>
                                            <button
                                                onClick={() => setDeleteModal({ open: true, record: r })}
                                                className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                                                title="Delete Record"
                                            >
                                                <Trash2 size={17} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* View Details Modal */}
            {isViewModalOpen && selectedRecord && createPortal(
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#011023]/60 backdrop-blur-sm"
                    onClick={() => setIsViewModalOpen(false)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-[#e6f0fa] flex justify-between items-center bg-gradient-to-r from-blue-50/50 to-white">
                            <div>
                                <h3 className="text-xl uppercase font-bold text-[#052558]">Attendance Details</h3>
                                <p className="text-sm text-gray-500 uppercase mt-1">ID: <span className="font-semibold text-gray-700">{selectedRecord.employeeId}</span></p>
                            </div>
                            <button
                                onClick={() => setIsViewModalOpen(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 space-y-6 hide-scrollbar uppercase">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Employee Info */}
                                <div className="space-y-2">
                                    <h4 className="text-sm font-bold text-gray-400 tracking-wider flex items-center gap-2">Staff Info</h4>
                                    <div className="bg-blue-50/30 pt-4 pb-4 rounded-xl space-y-2 border border-blue-50">
                                        <p className="text-sm flex"><span className="text-gray-500 w-28 shrink-0">Name:</span> <span className="font-bold text-[#011023] truncate">{selectedRecord.employeeName}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-28 shrink-0">Role:</span> <span className="font-bold text-[#052558]">{selectedRecord.role}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-28 shrink-0">Contact:</span> <span className="font-bold text-[#052558]">{selectedRecord.contact}</span></p>
                                    </div>
                                </div>

                                {/* Status Info */}
                                <div className="space-y-2">
                                    <h4 className="text-sm font-bold text-gray-400 tracking-wider flex items-center gap-2">Presence Details</h4>
                                    <div className="bg-blue-50/30 pt-4 pb-4 rounded-xl space-y-2 border border-blue-50">
                                        <p className="text-sm flex"><span className="text-gray-500 w-28 shrink-0">Status:</span> <span className={`font-bold ${selectedRecord.status === 'Present' ? 'text-emerald-600' : 'text-red-500'}`}>{selectedRecord.status}</span></p>
                                        <div className="flex flex-col gap-1">
                                            <p className="text-sm flex"><span className="text-gray-500 w-28 shrink-0">Check-in:</span> <span className="font-bold text-gray-800">{formatDate(selectedRecord.checkIn)}</span></p>
                                            <p className="text-sm flex"><span className="text-gray-500 w-28 shrink-0">Check-out:</span> <span className="font-bold text-gray-800">{formatDate(selectedRecord.checkOut)}</span></p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Delete Confirmation Modal */}
            {deleteModal.open && createPortal(
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-[#011023]/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6 text-center space-y-4">
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-[#052558] uppercase">Delete Record?</h3>
                                <p className="text-gray-500 text-sm">
                                    Are you sure you want to remove the attendance record for <span className="font-bold text-gray-700">{deleteModal.record?.employeeName}</span>? This action cannot be undone.
                                </p>
                            </div>
                        </div>
                        <div className="flex p-4 gap-3 bg-gray-50/50">
                            <button
                                onClick={() => setDeleteModal({ open: false, record: null })}
                                className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors uppercase text-xs"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteRecord}
                                className="flex-1 px-4 py-2.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-lg shadow-red-200 transition-all uppercase text-xs"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default Attendance;
