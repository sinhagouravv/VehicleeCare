import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Eye, X, Trash2, Loader2 } from 'lucide-react';
import useHighlight from '../hooks/useHighlight';
import { TableSkeleton } from '../components/Skeleton';

const Vehicles = () => {
    const [lastRefreshed, setLastRefreshed] = useState(null);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [vehicleToDelete, setVehicleToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const highlightedRow = useHighlight(vehicles);

    const fetchVehicles = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const storedUser = localStorage.getItem('garageUser');
            if (!storedUser) return;
            const user = JSON.parse(storedUser);

            const res = await fetch(`http://localhost:5001/api/bookings/garage/${user.id}`);
            const data = await res.json();
            if (data.success) {
                const vehicleMap = {};

                data.data.forEach(b => {
                    if (!b.vehicle || !b.vehicle.number) return;

                    const plate = b.vehicle.number;

                    // Use createdAt for precise timing and sorting, as it captures the actual visit/record time
                    const visitDate = new Date(b.createdAt || b.updatedAt || Date.now());

                    // Aggregate the latest data for each unique vehicle (by license plate)
                    if (!vehicleMap[plate] || visitDate > vehicleMap[plate].lastVisitDate) {
                        vehicleMap[plate] = {
                            id: plate,
                            customerId: b.user?.userId || b.user?.id || '—',
                            ownerName: b.user?.name || 'Unknown',
                            bookingId: b.bookingId || b._id?.substring(0, 8).toUpperCase(),
                            brand: b.vehicle.make || '—',
                            model: b.vehicle.model || '—',
                            number: b.vehicle.number,
                            year: b.vehicle.year || '—',
                            type: b.vehicle.type || '—',
                            transmission: b.vehicle.transmission || '—',
                            lastVisitDate: visitDate,
                            lastService: b.service?.title || b.service?.name || '',
                            serviceHistory: [],
                        };
                    }
                });

                const formattedVehicles = Object.values(vehicleMap).sort((a, b) => b.lastVisitDate - a.lastVisitDate);
                setVehicles(formattedVehicles);
                setLastRefreshed(new Date());
            }
        } catch (error) {
            console.error("Failed to fetch garage vehicles", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchVehicles();
        const timer = setInterval(() => fetchVehicles(true), 5000);
        return () => clearInterval(timer);
    }, [fetchVehicles]);

    const handleViewDetails = (vehicle) => {
        setSelectedVehicle(vehicle);
        setIsViewModalOpen(true);
    };

    const confirmDeleteVehicle = () => {
        if (!vehicleToDelete) return;
        setDeleting(true);
        // Local state filtering for immediate UI feedback as per pattern
        setTimeout(() => {
            setVehicles(prev => prev.filter(v => v.id !== vehicleToDelete.id));
            setIsDeleteModalOpen(false);
            setVehicleToDelete(null);
            setDeleting(false);
        }, 500); // Small delay for visual feedback
    };

    const formatDate = (date) => {
        if (!date || isNaN(date.getTime())) return '—';
        const d = new Date(date);
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

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto h-[calc(100vh-9.25rem)] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold uppercase text-[#011023] tracking-tight">Vehicles</h1>
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
                                <th className="p-4.5 font-bold text-center w-[10%]">Customer Id</th>
                                <th className="p-4.5 font-bold text-center w-[13%]">Customer</th>
                                <th className="p-4.5 font-bold text-center w-[9%]">Booking ID</th>
                                <th className="p-4.5 font-bold text-center w-[11.5%]">Brand</th>
                                <th className="p-4.5 font-bold text-center w-[11.5%]">Model</th>
                                <th className="p-4.5 font-bold text-center w-[7%]">Number</th>
                                <th className="p-4.5 font-bold text-center w-[15%]">Other Details</th>
                                <th className="p-4.5 font-bold text-center w-[14%]">Visit At</th>
                                <th className="p-4.5 font-bold text-center w-[7%]">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y uppercase text-[12px] divide-[#e6f0fa]">
                            {loading ? (
                                <TableSkeleton rows={15} cols={9} />
                            ) : vehicles.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="p-8 text-center text-sm text-gray-500">No vehicles found.</td>
                                </tr>
                            ) : vehicles.map((v) => (
                                <tr 
                                    key={v.id} 
                                    id={`row-${v.id}`}
                                    className={`text-center transition-all duration-1000 ${
                                        highlightedRow === v.id 
                                            ? 'bg-emerald-100/60 rounded-2xl relative z-20 scale-[1.01]' 
                                            : 'hover:bg-blue-50/30'
                                    }`}
                                >
                                    <td className="p-3.25 font-semibold text-[#052558] text-sm truncate text-center" title={v.customerId}>
                                        {v.customerId}
                                    </td>
                                    <td className="p-3.25 text-center">
                                        <div className="font-semibold text-[13.5px] truncate px-2" title={v.ownerName}>{v.ownerName}</div>
                                    </td>
                                    <td className="p-3.25 text-center">
                                        <div className="font-semibold text-[13.5px] truncate px-1" title={v.bookingId}>{v.bookingId}</div>
                                    </td>
                                    <td className="p-3.25 text-center font-semibold text-[13.5px]">
                                        {v.brand}
                                    </td>
                                    <td className="p-3.25 text-center font-semibold text-[13.5px]">
                                        {v.model}
                                    </td>
                                    <td className="p-3.25 text-center">
                                        <span className="bg-[#fef3c7] text-[#92400e] font-semibold px-3 py-1 rounded-xl text-[12px] uppercase tracking-wide">
                                            {v.number}
                                        </span>
                                    </td>
                                    <td className="p-3.25 text-center">
                                        <div className="grid grid-cols-2 gap-2 items-center">
                                            <div className="flex justify-end">
                                                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full font-semibold border border-emerald-100">{v.type}</span>
                                            </div>
                                            <div className="flex justify-start">
                                                <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full font-semibold border border-purple-100">{v.transmission}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-3.25 text-center ">
                                        <span className="text-sm font-semibold text-gray-600">
                                            {formatDate(v.lastVisitDate)}
                                        </span>
                                    </td>
                                    <td className="p-3.25 text-center">
                                        <div className="flex items-center justify-center gap-4">
                                            <button
                                                onClick={() => handleViewDetails(v)}
                                                className="text-gray-400 hover:text-blue-500 transition-colors"
                                            >
                                                <Eye size={17} />
                                            </button>
                                            <button
                                                onClick={() => { setVehicleToDelete(v); setIsDeleteModalOpen(true); }}
                                                className="text-gray-400 hover:text-red-500 transition-colors"
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
            {isViewModalOpen && selectedVehicle && createPortal(
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
                                <h3 className="text-xl uppercase font-bold text-[#052558]">Vehicle Details</h3>
                                <p className="text-sm text-gray-500 uppercase mt-1">Plate: <span className="font-semibold text-gray-700">{selectedVehicle.number}</span></p>
                            </div>
                            <button
                                onClick={() => setIsViewModalOpen(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 space-y-8 hide-scrollbar uppercase">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Owner Info */}
                                <div className="space-y-2">
                                    <h4 className="text-sm font-bold text-gray-400 tracking-wider flex items-center gap-2">Owner Info</h4>
                                    <div className="pt-4 rounded-xl space-y-2">
                                        <p className="text-sm flex"><span className="text-gray-500 w-24 shrink-0">Name:</span> <span className="font-bold text-[#011023] truncate">{selectedVehicle.ownerName}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-24 shrink-0">Cust ID:</span> <span className="font-bold text-gray-800 truncate">{selectedVehicle.customerId}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-24 shrink-0">Booking ID:</span> <span className="font-bold text-[#052558] truncate">{selectedVehicle.bookingId}</span></p>
                                    </div>
                                </div>

                                {/* Vehicle Specs */}
                                <div className="space-y-2">
                                    <h4 className="text-sm font-bold text-gray-400 tracking-wider flex items-center gap-2">Specifications</h4>
                                    <div className="pt-4 rounded-xl space-y-2">
                                        <p className="text-sm flex"><span className="text-gray-500 w-24 shrink-0">Brand:</span> <span className="font-bold text-[#011023]">{selectedVehicle.brand}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-24 shrink-0">Model:</span> <span className="font-bold text-gray-800">{selectedVehicle.model}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-24 shrink-0">Trans:</span> <span className="font-bold text-gray-800">{selectedVehicle.transmission}</span></p>
                                    </div>
                                </div>

                                {/* Quick Stats */}
                                <div className="space-y-2">
                                    <h4 className="text-sm font-bold text-gray-400 tracking-wider flex items-center gap-2">Overview</h4>
                                    <div className="pt-4 rounded-xl space-y-2">
                                        <p className="text-sm flex"><span className="text-gray-500 w-24 shrink-0">Year:</span> <span className="font-bold text-[#011023]">{selectedVehicle.year}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-24 shrink-0">Body Type:</span> <span className="font-bold text-gray-800">{selectedVehicle.type}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-24 shrink-0">Last Visit:</span> <span className="font-bold text-gray-800">{formatDate(selectedVehicle.lastVisitDate).split('|')[0]}</span></p>
                                    </div>
                                </div>
                            </div>

                            {/* History Placeholder */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-gray-400 tracking-wider flex items-center gap-2">Service</h4>
                                <div className="bg-blue-50/30 border border-blue-50 pt-1 pb-3 rounded-xl">
                                    <p className="text-[#052558] font-bold text-sm">{selectedVehicle.lastService}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && createPortal(
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#011023]/30 backdrop-blur-sm transition-all duration-300"
                    onClick={() => { setIsDeleteModalOpen(false); setVehicleToDelete(null); }}
                >
                    <div 
                        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-8 text-center uppercase space-y-4">
                            <h3 className="text-2xl font-bold text-[#011023] uppercase tracking-tighter mb-9">Remove Vehicle</h3>
                            <p className="text-[13px] text-gray-500 font-medium leading-relaxed">
                                This will permanently remove the vehicle <span className="text-[#052558] font-bold uppercase">{vehicleToDelete?.brand} {vehicleToDelete?.model}</span> from the record.
                                This action <span className="text-rose-600 font-bold uppercase">cannot be undone</span>.
                            </p>
                        </div>
                        <div className="p-2 bg-gray-50/80 border-t border-gray-100 grid grid-cols-2 gap-3 pb-8 px-8">
                            <button 
                                onClick={() => { setIsDeleteModalOpen(false); setVehicleToDelete(null); }}
                                className="px-4 py-3.5 bg-white border border-gray-200 text-gray-400 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-white hover:text-gray-600 transition-all shadow-sm active:scale-95"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmDeleteVehicle}
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

export default Vehicles;
