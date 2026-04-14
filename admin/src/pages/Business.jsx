import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Search, Eye, Check, X, RefreshCw, Briefcase, Zap, MapPin, Car, Trash2, Loader2 } from 'lucide-react';

const Business = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const [refreshing, setRefreshing] = useState(false);
    const [lastRefreshed, setLastRefreshed] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [requestToDelete, setRequestToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const fetchRequests = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            else setRefreshing(true);
            const res = await fetch('http://localhost:5001/api/business-requests');
            const result = await res.json();
            if (result.success && result.data) {
                setRequests(result.data);
                setLastRefreshed(new Date());
            }
        } catch (err) {
            console.error("Error fetching business requests:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchRequests();
        // Poll every 5 seconds for new requests
        const interval = setInterval(() => fetchRequests(true), 5000);
        return () => clearInterval(interval);
    }, [fetchRequests]);

    const handleUpdateStatus = async (id, status) => {
        try {
            const res = await fetch(`http://localhost:5001/api/business-requests/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            const data = await res.json();
            if (data.success) {
                setRequests(requests.map(r => r._id === id ? { ...data.data, displayId: r.displayId } : r));
                if (selectedRequest && selectedRequest._id === id) {
                    setSelectedRequest(prev => ({ ...prev, status }));
                }
            } else {
                alert("Failed to update status.");
            }
        } catch (err) {
            console.error("Error updating status:", err);
            alert("Error updating status.");
        }
    };
    const confirmDeleteRequest = async () => {
        if (!requestToDelete) return;
        setDeleting(true);
        try {
            const res = await fetch(`http://localhost:5001/api/business-requests/${requestToDelete}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (data.success) {
                setRequests(prev => prev.filter(r => r._id !== requestToDelete));
                if (selectedRequest && selectedRequest._id === requestToDelete) {
                    setIsViewModalOpen(false);
                    setSelectedRequest(null);
                }
                setIsDeleteModalOpen(false);
                setRequestToDelete(null);
            } else {
                alert('Failed to delete request.');
            }
        } catch (err) {
            console.error('Error deleting business request:', err);
            alert('Error deleting request.');
        } finally {
            setDeleting(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Approved': return 'bg-emerald-100 text-emerald-700';
            case 'Pending': return 'bg-amber-100 text-amber-700';
            case 'Rejected': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getCategoryIcon = (category) => {
        switch (category) {
            case 'garage': return <Briefcase size={16} className="text-orange-500" />;
            case 'charging': return <Zap size={16} className="text-emerald-500" />;
            case 'parking': return <MapPin size={16} className="text-purple-500" />;
            case 'store': return <Car size={16} className="text-blue-500" />;
            default: return <Briefcase size={16} className="text-gray-500" />;
        }
    };

    const getCategoryName = (category) => {
        switch (category) {
            case 'garage': return 'Service Garage';
            case 'charging': return 'Charging Station';
            case 'parking': return 'Parking Lot';
            case 'store': return 'Parts Store';
            default: return category;
        }
    };

    const handleViewDetails = (request) => {
        setSelectedRequest(request);
        setIsViewModalOpen(true);
    };

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-[#011023] uppercase tracking-tight">Business Requests</h1>
                <div className="flex items-center gap-2 text-xs uppercase text-gray-400 font-medium self-center">
                    {/* {refreshing && <span className="w-1.5 h-1.5 rounded-full bg-[#527FB0] animate-pulse inline-block" />} */}
                    {lastRefreshed
                        ? `Last refreshed | ${lastRefreshed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | ${lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`
                        : 'Loading…'}
                </div>
            </div>

            {/* Main Content Table */}
            <div className="bg-white/60 backdrop-blur-xl max-h-[55rem] border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden">
                <div className="overflow-x-hidden overflow-y-auto h-[860px] relative">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 z-10 shadow-sm">
                            <tr className="bg-[#f0f6ff] text-[15px] uppercase text-center tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                <th className="p-4.5 font-bold text-center w-[12%]">Request ID</th>
                                <th className="p-4.5 font-bold text-center w-[18%]">Business Name</th>
                                <th className="p-4.5 font-bold text-center w-[12%]">Category</th>
                                <th className="p-4.5 font-bold text-center w-[18%]">Contact</th>
                                <th className="p-4.5 font-bold text-center w-[15%]">Date</th>
                                <th className="p-4.5 font-bold text-center w-[8%]">Status</th>
                                <th className="p-4.5 font-bold text-center w-[10%]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y uppercase text-[12px] divide-[#e6f0fa]">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-sm text-gray-500">
                                        Loading business requests...
                                    </td>
                                </tr>
                            ) : requests.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-sm text-gray-500">
                                        No business requests found.
                                    </td>
                                </tr>
                            ) : requests.map((req) => (
                                <tr key={req._id} className="hover:bg-blue-50/30 text-center mt-2 transition-colors">
                                    <td className="p-4 font-semibold text-[#052558] text-sm text-center w-[12%]">
                                        {req.displayId}
                                    </td>
                                    <td className="p-4 text-center w-[18%]">
                                        <div className="font-semibold text-[#011023] text-sm">{req.businessName}</div>
                                        <div className="text-xs text-gray-500 mt-1">{req.district}, {req.state}</div>
                                    </td>
                                    <td className="p-4 text-center w-[10%]">
                                        <div className="flex items-center text-sm font-semibold justify-center gap-2">
                                            {(req.businessCategory)}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center w-[15%]">
                                        <div className="font-semibold text-sm text-gray-800">{req.ownerName}</div>
                                        <div className="text-xs text-gray-500 lowercase mt-0.5">{req.email}</div>
                                    </td>
                                    <td className="p-4 text-center w-[20%] text-sm whitespace-nowrap ">
                                        <span className="font-semibold text-gray-800">
                                            {new Date(req.createdAt).toLocaleDateString('en-IN', {
                                                day: '2-digit', month: 'short', year: 'numeric'
                                            })}
                                        </span>
                                        <span className="mx-1 text-gray-500">|</span>
                                        <span className="font-semibold text-gray-800">
                                            {new Date(req.createdAt).toLocaleTimeString('en-IN', {
                                                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
                                            })}
                                        </span>
                                    </td>

                                    <td className="p-4 text-center w-[10%]">
                                        <span className={`inline-block px-3 py-1 text-xs text-center font-semibold rounded-full border border-transparent ${getStatusColor(req.status)}`}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center w-[10%]">
                                        <div className="flex items-center justify-center gap-2">
                                            <button onClick={() => handleViewDetails(req)} className="text-gray-400 hover:text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition-colors">
                                                <Eye size={18} />
                                            </button>

                                            {req.status === 'Pending' && (
                                                <>
                                                    <button onClick={() => handleUpdateStatus(req._id, 'Approved')} className="text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 p-1.5 rounded-lg transition-colors">
                                                        <Check size={18} />
                                                    </button>
                                                    <button onClick={() => handleUpdateStatus(req._id, 'Rejected')} className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors">
                                                        <X size={18} />
                                                    </button>
                                                </>
                                            )}
                                            {req.status !== 'Pending' && (
                                                <button onClick={() => { setRequestToDelete(req._id); setIsDeleteModalOpen(true); }} className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors">
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* View Details Modal */}
            {isViewModalOpen && selectedRequest && createPortal(
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#011023]/10 backdrop-blur-sm transition-all duration-300"
                    onClick={() => setIsViewModalOpen(false)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-6 flex justify-between items-center bg-gradient-to-r from-blue-50/50 to-white">
                            <div>
                                <h3 className="text-xl uppercase font-bold text-[#052558]">Business Request</h3>
                                <p className="text-sm text-gray-500 mt-1">ID: <span className="font-semibold text-gray-700">{selectedRequest.displayId}</span></p>
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
                            <div className="flex flex-col md:flex-row gap-6 w-full">
                                {/* Owner Info */}
                                <div className="space-y-2 w-full md:w-[50%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Owner Info</h4>
                                    <div className="bg-blue-50/30 pt-4 rounded-xl uppercase space-y-2 border border-blue-50">
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Name:</span> <span className="font-semibold text-[#011023] truncate">{selectedRequest.ownerName || '—'}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Phone:</span> <span className="font-semibold text-gray-800 truncate">{selectedRequest.phone || '—'}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Email:</span> <span className="font-semibold text-gray-800 truncate">{selectedRequest.email || '—'}</span></p>
                                    </div>
                                </div>

                                {/* Business Info */}
                                <div className="space-y-2 w-full md:w-[42%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Business Info</h4>
                                    <div className="bg-blue-50/30 pt-4 rounded-xl uppercase space-y-2 border border-blue-50 min-h-[110px]">
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Name:</span> <span className="font-semibold ml-2 text-[#011023] truncate">{selectedRequest.businessName || '—'}</span></p>
                                        <p className="text-sm flex items-center"><span className="text-gray-500 w-16 shrink-0">Type:</span>
                                            <span className="ml-2 text-xs font-bold text-gray-700">{getCategoryName(selectedRequest.businessCategory) || '—'}</span>
                                        </p>
                                        <p className="text-sm flex items-center"><span className="text-gray-500 w-16 shrink-0">Status:</span>
                                            <span className={`ml-2 inline-block px-3 py-0.5 text-[10px] font-bold uppercase rounded-full ${getStatusColor(selectedRequest.status)}`}>
                                                {selectedRequest.status}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Location Archive */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Location Archive</h4>
                                <div className="bg-white border border-[#e6f0fa] p-5 rounded-xl shadow-sm uppercase flex gap-4">
                                    <div className="w-[60%]">
                                        <p className="text-xs font-bold text-gray-400 tracking-tight mb-1">Geographic Allocation</p>
                                        <h5 className="font-bold text-[#052558] text-[15.5px]">{selectedRequest.address || 'No Address Provided'}</h5>
                                    </div>
                                    <div className="w-[40%] border-l border-[#e6f0fa] pl-4">
                                        <p className="text-xs font-bold text-gray-400 tracking-tight mb-1">Region</p>
                                        <h5 className="font-bold text-[#052558] text-[14px]">{selectedRequest.district ? `${selectedRequest.district}, ${selectedRequest.state}` : selectedRequest.state || '—'}</h5>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            {selectedRequest.status === 'Pending' && (
                                <div className="border-t border-slate-100 pt-4 flex justify-end gap-3 uppercase">
                                    <button
                                        onClick={() => { handleUpdateStatus(selectedRequest._id, 'Rejected'); setIsViewModalOpen(false); }}
                                        className="px-6 py-2.5 rounded-xl text-sm font-black text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                                    >
                                        Reject Request
                                    </button>
                                    <button
                                        onClick={() => { handleUpdateStatus(selectedRequest._id, 'Approved'); setIsViewModalOpen(false); }}
                                        className="px-6 py-2.5 rounded-xl text-sm font-black text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all"
                                    >
                                        Approve Partnership
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && createPortal(
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#011023]/10 backdrop-blur-sm transition-all duration-300"
                    onClick={() => { setIsDeleteModalOpen(false); setRequestToDelete(null); }}
                >
                    <div 
                        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-8 text-center uppercase space-y-4">
                            <h3 className="text-2xl font-bold text-[#011023] uppercase tracking-tighter mb-9">Delete Request</h3>
                            <p className="text-[13px] text-gray-500 font-medium leading-relaxed">
                                This will permanently remove the business request from <span className="text-[#052558] font-bold uppercase">{requests.find(r => r._id === requestToDelete)?.businessName}</span>. 
                                This action <span className="text-rose-600 font-bold uppercase">cannot be undone</span>.
                            </p>
                        </div>
                        <div className="p-2 bg-gray-50/80 border-t border-gray-100 grid grid-cols-2 gap-3 pb-8 px-8">
                            <button 
                                onClick={() => { setIsDeleteModalOpen(false); setRequestToDelete(null); }}
                                className="px-4 py-3.5 bg-white border border-gray-200 text-gray-400 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-white hover:text-gray-600 transition-all shadow-sm active:scale-95"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmDeleteRequest}
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
        </div>
    );
};

export default Business;