import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, Check, X, Clock, Eye, Trash2, Calendar, User, FileText } from 'lucide-react';
import useHighlight from '../hooks/useHighlight';
import { TableSkeleton } from '../components/Skeleton';

const Overtime = () => {
    const [overtimes, setOvertimes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastRefreshed, setLastRefreshed] = useState(null);
    const [updatingId, setUpdatingId] = useState(null);
    
    // Modal states
    const [selectedOvertime, setSelectedOvertime] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Action Modal States
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [actionType, setActionType] = useState(''); // 'Approved' or 'Rejected'
    const [actionEmpId, setActionEmpId] = useState('');
    const [actionRemarks, setActionRemarks] = useState('');
    const [actionOvertimeId, setActionOvertimeId] = useState(null);

    const openActionModal = (overtimeId, type) => {
        setActionOvertimeId(overtimeId);
        setActionType(type);
        setActionEmpId('');
        setActionRemarks('');
        setIsActionModalOpen(true);
    };

    const highlightedRow = useHighlight(overtimes);

    const storedUser = JSON.parse(localStorage.getItem('garageUser') || '{}');
    const garageId = storedUser.id || storedUser._id;

    const fetchGarageOvertimes = useCallback(async (silent = false) => {
        if (!garageId) return;
        try {
            if (!silent) setLoading(true);
            const res = await fetch(`http://localhost:5001/api/overtime/garage/${garageId}`);
            const data = await res.json();
            if (data.success) {
                setOvertimes(data.data || []);
                setLastRefreshed(new Date());
            }
        } catch (error) {
            console.error("Failed to fetch garage overtimes:", error);
        } finally {
            setLoading(false);
        }
    }, [garageId]);

    useEffect(() => {
        fetchGarageOvertimes();
        const interval = setInterval(() => fetchGarageOvertimes(true), 5000); // Refresh every 5s
        return () => clearInterval(interval);
    }, [fetchGarageOvertimes]);

    const handleStatusUpdate = async (e) => {
        if (e) e.preventDefault();
        if(!actionEmpId || !actionRemarks) {
            alert('Please fill both Employee ID and Remarks');
            return;
        }

        const words = actionRemarks.trim().split(/\s+/).filter(word => word.length > 0);
        if (words.length < 10) {
            alert('Reason for Action must be at least 10 words long.');
            return;
        }

        setUpdatingId(actionOvertimeId);
        setIsActionModalOpen(false);
        try {
            const res = await fetch(`http://localhost:5001/api/overtime/${actionOvertimeId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: actionType, employeeId: actionEmpId, remarks: actionRemarks })
            });
            const data = await res.json();
            if (data.success) {
                setOvertimes(prev => prev.map(o => o._id === actionOvertimeId ? { ...o, status: actionType } : o));
            } else {
                alert(data.message || "Failed to update status");
            }
        } catch (error) {
            console.error("Error updating overtime status:", error);
            alert("Error updating status");
        } finally {
            setUpdatingId(null);
        }
    };

    const handleDelete = async () => {
        if (!selectedOvertime) return;
        setDeleting(true);
        try {
            const res = await fetch(`http://localhost:5001/api/overtime/${selectedOvertime._id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                setOvertimes(prev => prev.filter(o => o._id !== selectedOvertime._id));
                setIsDeleteModalOpen(false);
                setSelectedOvertime(null);
            } else {
                alert(data.message || "Failed to delete request");
            }
        } catch (error) {
            console.error("Error deleting overtime request:", error);
            alert("Error deleting request");
        } finally {
            setDeleting(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        // Handle DD-MM-YYYY format (stored overtime dates)
        const ddmmyyyy = dateStr.match(/^(\d{2})-(\d{2})-(\d{4})$/);
        if (ddmmyyyy) {
            const [, dd, mm, yyyy] = ddmmyyyy;
            return new Date(`${yyyy}-${mm}-${dd}`).toLocaleDateString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric'
            });
        }
        // Fallback for ISO / YYYY-MM-DD (createdAt etc.)
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleTimeString('en-IN', {
            hour: '2-digit', minute: '2-digit', hour12: true
        });
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Approved': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'Rejected': return 'bg-rose-100 text-rose-800 border-rose-200';
            case 'Pending': return 'bg-amber-100 text-amber-800 border-amber-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto h-[calc(100vh-9.25rem)] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold uppercase text-[#011023] tracking-tight">Overtime Requests</h1>
                <div className="flex items-center gap-2 text-xs uppercase text-gray-400 font-medium self-center">
                    {lastRefreshed
                        ? `Last refreshed | ${lastRefreshed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | ${lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`
                        : <div className="h-3.5 w-70 bg-slate-200 rounded-full animate-pulse" />}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-white border border-[#e9f2fb] rounded-2xl shadow-[0_1px_2.5px_0_rgba(0,0,0,0.07)] flex-1 min-h-0 overflow-hidden flex flex-col">
                <div className="overflow-x-hidden overflow-y-auto text-center flex-1 relative hide-scrollbar">
                    <table className="w-full text-center border-collapse table-fixed">
                        <thead className="sticky top-0 z-10 shadow-sm">
                            <tr className="bg-[#f0f6ff] text-[15px] uppercase tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                <th className="p-4.5 font-bold text-center w-[10%]">Employee ID</th>
                                <th className="p-4.5 font-bold text-center w-[12%]">Date Requested</th>
                                <th className="p-4.5 font-bold text-center w-[8%]">Hours</th>
                                <th className="p-4.5 font-bold text-center w-[35%]">Reason</th>
                                <th className="p-4.5 font-bold text-center w-[13%]">Date Applied</th>
                                <th className="p-4.5 font-bold text-center w-[10%]">Status</th>
                                <th className="p-4.5 font-bold text-center w-[8%]">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-[13px] divide-[#e6f0fa] uppercase">
                            {loading && overtimes.length === 0 ? (
                                <TableSkeleton rows={15} cols={7} />
                            ) : overtimes.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-20 text-gray-400 font-bold tracking-widest opacity-60">
                                        No overtime requests found.
                                    </td>
                                </tr>
                            ) : overtimes.map((overtime) => (
                                <tr 
                                    key={overtime._id} 
                                    id={`row-${overtime._id}`}
                                    className={`transition-all duration-1000 ${highlightedRow === overtime._id ? 'bg-emerald-100/60 rounded-2xl relative z-20 scale-[1.01]' : 'hover:bg-blue-50/30'}`}
                                >
                                    <td className="p-4 font-semibold text-[#011023] text-sm text-center">
                                        {overtime.employeeId}
                                    </td>
                                    <td className="p-4 font-semibold text-sm text-[#011023] text-center">
                                        {formatDate(overtime.date)}
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="font-semibold text-[#011023]">
                                            {overtime.hours} {overtime.hours === 1 ? 'HR' : 'HRS'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <p className="whitespace-normal text-center text-[#011023] font-semibold">
                                            {overtime.reason}
                                        </p>
                                    </td>
                                    <td className="p-4 font-semibold text-sm whitespace-nowrap text-center">
                                        <span className="text-[#011023]">{formatDate(overtime.createdAt)}</span>
                                        <span className="text-gray-800 mx-1.5">|</span>
                                        <span className="text-[#011023]">{formatTime(overtime.createdAt)}</span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`px-3 py-1 rounded-full border text-xs font-semibold tracking-widest ${getStatusStyle(overtime.status)}`}>
                                            {overtime.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-4">
                                            {overtime.status === 'Pending' ? (
                                                <>
                                                    <button 
                                                        onClick={() => { setSelectedOvertime(overtime); setIsViewModalOpen(true); }}
                                                        className="text-gray-400 hover:text-blue-500 transition-colors"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => openActionModal(overtime._id, 'Approved')}
                                                        disabled={updatingId === overtime._id}
                                                        className="text-gray-400 hover:text-emerald-500 transition-colors"
                                                    >
                                                        <Check size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => openActionModal(overtime._id, 'Rejected')}
                                                        disabled={updatingId === overtime._id}
                                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button 
                                                        onClick={() => { setSelectedOvertime(overtime); setIsViewModalOpen(true); }}
                                                        className="text-gray-400 hover:text-blue-500 transition-colors"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => { setSelectedOvertime(overtime); setIsDeleteModalOpen(true); }}
                                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* View Modal */}
            {isViewModalOpen && selectedOvertime && createPortal(
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#011023]/10 backdrop-blur-sm transition-all duration-300"
                    onClick={() => setIsViewModalOpen(false)}
                >
                    <div 
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-6 flex justify-between items-center bg-gradient-to-r from-blue-50/50 to-white">
                            <div>
                                <h3 className="text-xl uppercase font-bold text-[#052558]">Overtime Details</h3>
                            </div>
                            <button
                                onClick={() => setIsViewModalOpen(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto flex-1 space-y-4 hide-scrollbar">
                            <div className="flex flex-col md:flex-row gap-6 mb-7 w-full">
                                {/* Employee Info */}
                                <div className="space-y-1 w-full md:w-[30%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Employee Info</h4>
                                    <div className="bg-blue-50/30 pt-4 rounded-xl uppercase space-y-2 border border-blue-50">
                                        <p className="text-sm flex"><span className="text-gray-500 w-24 shrink-0">Name:</span> <span className="font-semibold text-[#011021] truncate">{selectedOvertime.employeeName}</span></p>
                                        <p className="text-sm text-gray-500"><span className="text-gray-500 w-24 shrink-0">ID:</span> <span className="font-semibold pl-19 text-gray-700">{selectedOvertime.employeeId}</span></p>
                                    </div>
                                </div>

                                {/* Overtime Info */}
                                <div className="space-y-1 w-full md:w-[30%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Overtime Info</h4>
                                    <div className="bg-blue-50/30 pt-4 rounded-xl uppercase space-y-2 border border-blue-50">
                                        <p className="text-sm flex"><span className="text-gray-500 w-24 shrink-0">Date:</span> <span className="font-semibold text-[#011023]">{formatDate(selectedOvertime.date)}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-24 shrink-0">Hours:</span> <span className="font-semibold text-gray-850">{selectedOvertime.hours} {selectedOvertime.hours === 1 ? 'HR' : 'HRS'}</span></p>
                                    </div>
                                </div>

                                {/* Status & Remarks */}
                                <div className="flex flex-col gap-4 w-full md:w-[40%]">
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Status Details</h4>
                                        <div className="space-y-2 mt-4">
                                            <div className="flex items-center gap-6">
                                                <p className="text-sm font-semibold text-gray-500 w-28 shrink-0 uppercase">Status</p>
                                                <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full border border-transparent uppercase ${getStatusStyle(selectedOvertime.status)}`}>
                                                    {selectedOvertime.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <p className="text-sm font-semibold text-gray-500 w-28 shrink-0 uppercase">Date Applied</p>
                                                <span className="text-sm font-semibold text-gray-750 uppercase">
                                                    {selectedOvertime.createdAt ? `${formatDate(selectedOvertime.createdAt)} | ${formatTime(selectedOvertime.createdAt)}` : '—'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Reason for Overtime */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Reason for Overtime</h4>
                                <div className="bg-white p-4 rounded-xl shadow-sm uppercase">
                                    <h5 className="font-semibold text-[#052558] text-[13px] leading-relaxed whitespace-pre-wrap">{selectedOvertime.reason}</h5>
                                </div>
                            </div>

                            {/* Remarks */}
                            {selectedOvertime.remarks && (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Remarks</h4>
                                    <div className="bg-white p-4 rounded-xl shadow-sm uppercase">
                                        <h5 className="font-semibold text-[#052558] text-[13px] leading-relaxed whitespace-pre-wrap">
                                            {selectedOvertime.remarks}
                                        </h5>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && selectedOvertime && createPortal(
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#011023]/10 backdrop-blur-sm transition-all duration-300"
                    onClick={() => setIsDeleteModalOpen(false)}
                >
                    <div 
                        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-8 text-center uppercase space-y-4">
                            <h3 className="text-2xl font-bold text-[#011023] uppercase tracking-tighter mb-9">Delete Request</h3>
                            <p className="text-[13px] text-gray-500 font-medium leading-relaxed">
                                This will permanently remove the overtime record for <span className="text-[#052558] font-bold uppercase">{selectedOvertime.employeeName}</span>. <br/>
                                This action <span className="text-rose-600 font-bold uppercase">cannot be undone</span>.
                            </p>
                        </div>
                        <div className="p-2 bg-gray-50/80 border-t border-gray-100 grid grid-cols-2 gap-3 pb-8 px-8">
                            <button 
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="px-4 py-3.5 bg-white border border-gray-200 text-gray-400 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-white hover:text-gray-600 transition-all shadow-sm active:scale-95"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleDelete}
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

            {/* Action Modal */}
            {isActionModalOpen && createPortal(
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#052558]/10 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => !updatingId && setIsActionModalOpen(false)} />
                    
                    <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-white overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Header */}
                        <div className="px-7 py-5 bg-slate-50 border-b border-slate-100 flex items-center justify-center relative">
                            <h3 className="text-xl font-bold text-[#011023] uppercase tracking-wider">
                                {actionType === 'Approved' ? 'Approve Overtime' : 'Reject Overtime'}
                            </h3>
                            <button 
                                onClick={() => setIsActionModalOpen(false)}
                                className="absolute right-7 p-2 text-slate-400 rounded-xl transition-colors hover:bg-slate-200 hover:text-slate-600"
                                disabled={updatingId === actionOvertimeId}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleStatusUpdate}>
                            {/* Body */}
                            <div className="p-8 space-y-4">
                                <div className="bg-slate-50/50 border border-slate-100 p-1 rounded-2xl">
                                    <p className="text-sm uppercase font-medium text-justify text-slate-700 leading-relaxed">
                                        Please provide employee verification to <span className="font-bold text-[#011023]">{actionType.toLowerCase()}</span> this overtime request. This action will be documented in the internal audit.
                                    </p>
                                </div>

                                <div className="flex gap-2.5 text-left">
                                    <div className="w-[20%]">
                                        <label className="text-[12.5px] font-bold text-gray-500 uppercase tracking-widest flex items-center justify-center mb-2">Employee ID</label>
                                        <input 
                                            type="text" 
                                            required
                                            className="w-full bg-white border border-gray-200 rounded-xl p-2 text-[13px] font-semibold text-[#011023] outline-none transition-all uppercase tracking-wider shadow-sm text-center"
                                            value={actionEmpId}
                                            onChange={e => setActionEmpId(e.target.value)}
                                            disabled={updatingId === actionOvertimeId}
                                        />
                                    </div>
                                    <div className="w-[80%]">
                                        <label className="text-[12.5px] font-bold text-gray-500 uppercase tracking-widest flex items-center justify-center mb-2">Reason for Action</label>
                                        <input 
                                            type="text"
                                            required
                                            className="w-full bg-white border border-gray-200 rounded-xl py-2 px-4 text-[13px] font-semibold uppercase text-[#011023] outline-none transition-all shadow-sm"
                                            value={actionRemarks}
                                            onChange={e => setActionRemarks(e.target.value)}
                                            disabled={updatingId === actionOvertimeId}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-8 pb-6 pt-1 bg-gray-50/50 border-t border-gray-100 flex gap-4">
                                <button 
                                    type="button"
                                    onClick={() => setIsActionModalOpen(false)}
                                    className="flex-1 px-6 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm"
                                    disabled={updatingId === actionOvertimeId}
                                >
                                    Cancel Action
                                </button>
                                <button 
                                    type="submit"
                                    disabled={updatingId === actionOvertimeId || !actionEmpId.trim() || !actionRemarks.trim()}
                                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg disabled:opacity-50 disabled:shadow-none ${actionType === 'Approved' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200/50' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200/50'}`}
                                >
                                    {updatingId === actionOvertimeId ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        'Confirm Action'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default Overtime;
