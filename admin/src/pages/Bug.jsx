import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Bug as BugIcon, Check, Clock, Trash2, X, Loader2, Eye, MessageSquare } from 'lucide-react';
import useHighlight from '../hooks/useHighlight';
import { TableSkeleton } from '../components/Skeleton';

const Bug = () => {
    const [bugs, setBugs] = useState([]);
    const highlightedRow = useHighlight(bugs);
    const [loading, setLoading] = useState(true);
    const [lastRefreshed, setLastRefreshed] = useState(null);



    // Modal states
    const [selectedBug, setSelectedBug] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [bugToDelete, setBugToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [updatingId, setUpdatingId] = useState(null);

    const fetchBugs = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const res = await fetch('http://localhost:5001/api/bugs');
            const result = await res.json();
            if (result.success && result.data) {
                setBugs(result.data);
                setLastRefreshed(new Date());
            }
        } catch (err) {
            console.error("Error fetching bugs:", err);
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBugs();
        const interval = setInterval(() => fetchBugs(true), 5000);
        return () => clearInterval(interval);
    }, [fetchBugs]);

    const handleUpdateStatus = async (id, status) => {
        setUpdatingId(id);
        try {
            const res = await fetch(`http://localhost:5001/api/bugs/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            const data = await res.json();
            if (data.success) {
                setBugs(prev => prev.map(b => b._id === id ? { ...b, status } : b));
                if (selectedBug && selectedBug._id === id) {
                    setSelectedBug(prev => ({ ...prev, status }));
                }
            } else {
                alert(data.message || "Failed to update bug status.");
            }
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Network error. Failed to update status.");
        } finally {
            setUpdatingId(null);
        }
    };

    const handleDeleteBug = async () => {
        if (!bugToDelete) return;
        setDeleting(true);
        try {
            const res = await fetch(`http://localhost:5001/api/bugs/${bugToDelete._id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                setBugs(prev => prev.filter(b => b._id !== bugToDelete._id));
                setIsDeleteModalOpen(false);
                setBugToDelete(null);
            } else {
                alert(data.message || "Failed to delete bug report.");
            }
        } catch (error) {
            console.error("Error deleting bug:", error);
            alert("Network error. Failed to delete bug.");
        } finally {
            setDeleting(false);
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'Critical': return 'bg-rose-100 text-rose-800 border-rose-200';
            case 'High': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'Low': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Resolved':
            case 'Delivered': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'Completed': return 'bg-teal-100 text-teal-800 border-teal-200';
            case 'In Service': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
            case 'In Progress': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'Pending': return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'Cancelled': return 'bg-rose-100 text-rose-800 border-rose-200';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getPortalColor = (portal) => {
        switch (portal) {
            case 'employee': return 'bg-purple-100 text-purple-700';
            case 'admin': return 'bg-blue-100 text-blue-700';
            case 'app': return 'bg-pink-100 text-pink-600';
            case 'customer app': return 'bg-teal-100 text-teal-600';
            case 'business': return 'bg-indigo-100 text-indigo-700';
            case 'frontend': return 'bg-fuchsia-100 text-fuchsia-700';
            case 'garage':
            default: return 'bg-orange-100 text-orange-700';
        }
    };

    const getPortalLabel = (portal) => {
        switch (portal) {
            case 'employee': return 'employee web';
            case 'app': return 'employee app';
            case 'garage': return 'garage website';
            case 'customer app': return 'customer app';
            case 'business': return 'business web';
            case 'frontend': return 'customer web';
            default: return portal;
        }
    };

    const formatSubmittedAt = (dateString) => {
        if (!dateString) return '—';
        const date = new Date(dateString);
        const day = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        const time = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
        return `${day}, ${time.toLowerCase()}`;
    };



    return (
        <div className="space-y-6 max-w-[92rem] mx-auto h-[calc(100vh-9.25rem)] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold uppercase text-[#011023] tracking-tight flex items-center gap-3">
                    Bug Tracker
                </h1>
                <div className="flex items-center gap-2 text-xs uppercase text-gray-400 font-medium self-center">
                    {/* {refreshing && <span className="w-1.5 h-1.5 rounded-full bg-[#527FB0] animate-pulse inline-block" />} */}
                    {lastRefreshed
                        ? `Last refreshed | ${lastRefreshed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | ${lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`
                        : 'Loading…'}
                </div>
            </div>


            {/* Main Content List */}
            <div className="bg-white border border-[#e9f2fb] rounded-2xl shadow-[0_1px_2.5px_0_rgba(0,0,0,0.07)] flex-1 min-h-0 overflow-hidden flex flex-col">
                <div className="overflow-x-hidden overflow-y-auto text-center flex-1 relative hide-scrollbar">
                    <table className="w-full text-center border-collapse table-fixed">
                        <thead className="sticky top-0 z-10 shadow-sm">
                            <tr className="bg-[#f0f6ff] text-[15px] uppercase tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                <th className="p-4.5 font-bold text-center w-[9%]">Bug ID</th>
                                <th className="p-4.5 font-bold text-center w-[12%]">Portal</th>
                                <th className="p-4.5 font-bold text-center w-[10%]">Reporter ID</th>
                                <th className="p-4.5 font-bold text-center w-[30%]">Bug Subject</th>
                                <th className="p-4.5 font-bold text-center w-[16%]">Reported At</th>
                                <th className="p-4.5 font-bold text-center w-[8%]">Severity</th>
                                <th className="p-4.5 font-bold text-center w-[8%]">Status</th>
                                <th className="p-4.5 font-bold text-center w-[8%]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-[13px] divide-[#e6f0fa] uppercase font-semibold text-gray-700">
                            {loading && bugs.length === 0 ? (
                                <TableSkeleton rows={15} cols={8} />
                            ) : bugs.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-gray-400 font-bold">No bug reports have been submitted yet.</td>
                                </tr>
                            ) : (
                                bugs.map((bug) => (
                                    <tr 
                                        key={bug._id} 
                                        className={`hover:bg-white/50 transition-colors border-b border-[#e6f0fa] group ${
                                            highlightedRow === bug ? 'bg-emerald-50/50' : ''
                                        }`}
                                    >
                                        <td className="p-4 font-semibold text-[#052558] text-sm text-center w-[10%]">{bug.bugId}</td>
                                        <td className="p-4 text-center w-[12%]">
                                            <span className={`inline-block px-3 py-3 text-xs font-semibold rounded-full ${getPortalColor(bug.portal)}`}>
                                                {getPortalLabel(bug.portal)}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm font-semibold text-[#052558] text-center w-[12%]">{bug.reporterId}</td>
                                        <td className="p-4 text-center font-semibold text-[#011023] truncate max-w-[280px] uppercase w-[28%]">{bug.title}</td>
                                        <td className="p-4 text-center whitespace-nowrap text-sm text-gray-800 font-semibold w-[18%]">
                                            {new Date(bug.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | {new Date(bug.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                                        </td>
                                        <td className="p-4 text-center w-[8%]">
                                            <span className={`inline-block px-3 py-1 text-xs text-center font-semibold rounded-full border border-transparent ${getSeverityColor(bug.severity)}`}>
                                                {bug.severity}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center w-[8%]">
                                            <span className={`inline-block px-3 py-1 text-xs text-center font-semibold rounded-full border border-transparent ${getStatusColor(bug.status)}`}>
                                                {bug.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center w-[4%]" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-center gap-4">
                                                <button
                                                    onClick={() => {
                                                        setSelectedBug(bug);
                                                        setIsViewModalOpen(true);
                                                    }}
                                                    className="text-gray-400 hover:text-blue-500 cursor-pointer"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                {bug.status !== 'Resolved' && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(bug._id, 'Resolved')}
                                                        disabled={updatingId === bug._id}
                                                        className="text-gray-400 hover:text-emerald-500 cursor-pointer disabled:opacity-50"
                                                    >
                                                        <Check size={18} className="stroke-[2]" />
                                                    </button>
                                                )}
                                                {bug.status === 'Resolved' && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedBug(bug);
                                                            setIsViewModalOpen(true);
                                                        }}
                                                        className="text-gray-400 hover:text-emerald-500 cursor-pointer"
                                                    >
                                                        <MessageSquare size={18} />
                                                    </button>
                                                )}
                                                {/* <button
                                                    onClick={() => {
                                                        setBugToDelete(bug);
                                                        setIsDeleteModalOpen(true);
                                                    }}
                                                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                                                    title="Delete Report"
                                                >
                                                    <Trash2 size={18} />
                                                </button> */}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* View Details Modal */}
            {isViewModalOpen && selectedBug && createPortal(
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#011023]/10 backdrop-blur-sm"
                    onClick={() => setIsViewModalOpen(false)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-[#e6f0fa] flex justify-between items-center bg-gradient-to-r from-blue-50/50 to-white">
                            <div>
                                <h3 className="text-xl uppercase font-bold text-[#052558]">Bug Details</h3>
                                <p className="text-sm text-gray-500 mt-1">ID: <span className="font-semibold text-gray-700">{selectedBug.bugId}</span></p>
                            </div>
                            <button
                                onClick={() => setIsViewModalOpen(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            {/* Info Grid */}
                            <div className="flex flex-col md:flex-row gap-6 w-full text-left">
                                <div className="space-y-4 w-full md:w-[37%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Reporter Info</h4>
                                    <div className="pt-4 rounded-xl uppercase space-y-2">
                                        <p className="text-sm flex"><span className="text-gray-500 w-24 shrink-0 font-medium">Name:</span> <span className="font-semibold text-[#011023] truncate" title={selectedBug.reporterName}>{selectedBug.reporterName || 'N/A'}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-24 shrink-0 font-medium">ID:</span> <span className="font-semibold text-gray-800 truncate">{selectedBug.reporterId || 'N/A'}</span></p>
                                    </div>
                                </div>
                                <div className="space-y-4 w-full md:w-[23%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Issue Meta</h4>
                                    <div className="pt-4 rounded-xl uppercase space-y-2">
                                        <div className="text-sm flex items-center"><span className="text-gray-500 w-20 shrink-0 font-medium">Severity</span> <span className={`inline-block px-3 py-1 text-xs text-center font-semibold rounded-full border border-transparent ${getSeverityColor(selectedBug.severity)}`}>{selectedBug.severity}</span></div>
                                        <div className="text-sm flex items-center"><span className="text-gray-500 w-20 shrink-0 font-medium">Status</span> <span className={`inline-block px-3 py-1 text-xs text-center font-semibold rounded-full border border-transparent ${getStatusColor(selectedBug.status)}`}>{selectedBug.status}</span></div>
                                    </div>
                                </div>
                                <div className="space-y-4 w-full md:w-[37%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Timeline</h4>
                                    <div className="pt-4 rounded-xl uppercase space-y-2">
                                        <p className="text-sm flex items-center"><span className="text-gray-500 w-24 shrink-0 font-medium">Portal:</span> <span className={`inline-block px-3 py-1 text-xs font-semibold ml-3.5 rounded-full ${getPortalColor(selectedBug.portal)}`}>{getPortalLabel(selectedBug.portal)}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-28 shrink-0 uppercase font-medium">Reported On:</span> <span className="font-bold text-gray-600 text-sm">{formatSubmittedAt(selectedBug.createdAt)}</span></p>
                                    </div>
                                </div>
                            </div>

                            {/* Bug Subject & Description */}
                            <div className="space-y-4 text-left"> 
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Bug Subject</h4>
                                <div className="bg-white border border-[#e6f0fa] p-4 rounded-xl shadow-sm">
                                    <h5 className="font-bold text-[#052558] uppercase text-[15.5px]">{selectedBug.title}</h5>
                                </div>
                            </div>

                            <div className="space-y-4 text-left"> 
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Detailed Description / Steps to Reproduce</h4>
                                <div className="bg-gray-50 border border-[#e6f0fa] p-5 rounded-xl">
                                    <p className="text-sm text-gray-700 leading-relaxed font-semibold">{selectedBug.description}</p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>,
                document.body
            )}

            {/* Confirm Delete Modal */}
            {isDeleteModalOpen && bugToDelete && createPortal(
                <div className="fixed inset-0 bg-[#011023]/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white border border-[#e6f0fa] rounded-3xl max-w-sm w-full shadow-2xl p-8 space-y-6 text-center transform-gpu transition-all">
                        <BugIcon size={44} className="mx-auto text-red-500 animate-pulse" />
                        <div>
                            <h3 className="text-lg font-black text-[#011023] uppercase">Delete Bug Report?</h3>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">This will permanently delete bug report {bugToDelete.bugId}. This action is irreversible.</p>
                        </div>

                        <div className="flex gap-3">
                            <button 
                                onClick={handleDeleteBug}
                                disabled={deleting}
                                className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-red-600 transition-all flex items-center justify-center gap-1.5"
                            >
                                {deleting ? <Loader2 size={12} className="animate-spin" /> : 'Yes, Delete'}
                            </button>
                            <button 
                                onClick={() => {
                                    setIsDeleteModalOpen(false);
                                    setBugToDelete(null);
                                }}
                                disabled={deleting}
                                className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-gray-200 transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default Bug;
