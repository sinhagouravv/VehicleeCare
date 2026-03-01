import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Search, Eye, Check, X, RefreshCw, Briefcase, Zap, MapPin, Car } from 'lucide-react';

const Business = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const [refreshing, setRefreshing] = useState(false);
    const [lastRefreshed, setLastRefreshed] = useState(null);

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
                                <th className="p-4.5 font-bold text-center w-[10%]">Category</th>
                                <th className="p-4.5 font-bold text-center w-[15%]">Contact</th>
                                <th className="p-4.5 font-bold text-center w-[20%]">Date</th>
                                <th className="p-4.5 font-bold text-center w-[13%]">Status</th>
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
                                    <td className="p-4 font-semibold tracking-widest text-[#052558] text-sm text-center w-[12%]">
                                        {req.displayId}
                                    </td>
                                    <td className="p-4 text-center w-[18%]">
                                        <div className="font-bold text-[#011023] text-sm">{req.businessName}</div>
                                        <div className="text-xs text-gray-500 mt-1">{req.district}, {req.state}</div>
                                    </td>
                                    <td className="p-4 text-center w-[10%]">
                                        <div className="flex items-center justify-center gap-2">
                                            {(req.businessCategory)}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center w-[15%]">
                                        <div className="font-semibold text-gray-800">{req.ownerName}</div>
                                        <div className="text-xs text-gray-500 lowercase mt-0.5">{req.email}</div>
                                    </td>
                                    <td className="p-4 text-center w-[20%] whitespace-nowrap ">
                                        <span className="font-semibold text-gray-800">
                                            {new Date(req.createdAt).toLocaleDateString('en-IN', {
                                                day: '2-digit', month: 'short', year: 'numeric'
                                            })}
                                        </span>
                                        <span className="mx-3 text-gray-500">|</span>
                                        <span className="text-xs font-semibold text-gray-800">
                                            {new Date(req.createdAt).toLocaleTimeString('en-IN', {
                                                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
                                            })}
                                        </span>
                                    </td>

                                    <td className="p-4 text-center w-[10%]">
                                        <span className={`inline-block px-3 py-1 text-xs text-center font-bold rounded-full border border-transparent ${getStatusColor(req.status)}`}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center w-[10%]">
                                        <div className="flex items-center justify-center gap-2">
                                            <button onClick={() => handleViewDetails(req)} className="text-gray-400 hover:text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition-colors" title="View Details">
                                                <Eye size={18} />
                                            </button>

                                            {req.status === 'Pending' && (
                                                <>
                                                    <button onClick={() => handleUpdateStatus(req._id, 'Approved')} className="text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 p-1.5 rounded-lg transition-colors" title="Approve Request">
                                                        <Check size={18} />
                                                    </button>
                                                    <button onClick={() => handleUpdateStatus(req._id, 'Rejected')} className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title="Reject Request">
                                                        <X size={18} />
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

            {/* View Details Modal */}
            {isViewModalOpen && selectedRequest && createPortal(
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#011023]/60 backdrop-blur-sm"
                    onClick={() => setIsViewModalOpen(false)}
                >
                    <div
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] border border-white/50"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-[#e6f0fa] flex justify-between items-center bg-gradient-to-r from-blue-50/50 to-white">
                            <div>
                                <h3 className="text-xl font-black text-[#052558] uppercase">Business Request</h3>
                                <p className="text-sm text-gray-500 mt-1 uppercase font-bold tracking-widest">ID: <span className="text-gray-700">{selectedRequest.displayId}</span></p>
                            </div>
                            <button
                                onClick={() => setIsViewModalOpen(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto flex-1 space-y-8">

                            {/* Header Overview */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200">
                                        {getCategoryIcon(selectedRequest.businessCategory)}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-[#011023] uppercase">{selectedRequest.businessName}</h2>
                                        <p className="text-sm text-gray-500 font-bold uppercase">{getCategoryName(selectedRequest.businessCategory)}</p>
                                    </div>
                                </div>
                                <span className={`px-4 py-1.5 text-sm font-black uppercase tracking-wider rounded-full ${getStatusColor(selectedRequest.status)}`}>
                                    {selectedRequest.status}
                                </span>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-6 uppercase">
                                {/* Owner Details */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-gray-400 tracking-wider">Owner Details</h4>
                                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                                        <div>
                                            <div className="text-xs text-gray-500 font-bold mb-1 tracking-widest">Name</div>
                                            <div className="font-bold text-[#011023]">{selectedRequest.ownerName}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500 font-bold mb-1 tracking-widest">Phone</div>
                                            <div className="font-bold text-[#011023]">{selectedRequest.phone}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500 font-bold mb-1 tracking-widest">Email</div>
                                            <div className="font-bold text-[#011023] normal-case">{selectedRequest.email}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Location Details */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-gray-400 tracking-wider">Location & Registration</h4>
                                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                                        <div>
                                            <div className="text-xs text-gray-500 font-bold mb-1 tracking-widest">State / District</div>
                                            <div className="font-bold text-[#011023]">{selectedRequest.district}, {selectedRequest.state}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500 font-bold mb-1 tracking-widest">Full Address</div>
                                            <div className="font-bold text-[#011023]">{selectedRequest.address}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500 font-bold mb-1 tracking-widest">Tax / GST Number</div>
                                            <div className="font-bold text-[#011023] tracking-widest">{selectedRequest.taxId || 'NOT PROVIDED'}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            {selectedRequest.status === 'Pending' && (
                                <div className="border-t border-slate-100 pt-6 flex justify-end gap-3 uppercase">
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
        </div>
    );
};

export default Business;