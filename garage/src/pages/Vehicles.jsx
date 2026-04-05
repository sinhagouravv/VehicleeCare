import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Eye, X, Trash2 } from 'lucide-react';
import useHighlight from '../hooks/useHighlight';

const Vehicles = () => {
    const [lastRefreshed, setLastRefreshed] = useState(null);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ open: false, vehicle: null });
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

    const handleDeleteVehicle = () => {
        if (!deleteModal.vehicle) return;
        // Local state filtering for immediate UI feedback as per pattern
        setVehicles(prev => prev.filter(v => v.id !== deleteModal.vehicle.id));
        setDeleteModal({ open: false, vehicle: null });
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
        <div className="space-y-6 max-w-[92rem] mx-auto">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-[#011023] uppercase tracking-tight">Vehicles Directory</h1>
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
                                <th className="p-4.5 font-bold text-center w-[11%]">Customer Id</th>
                                <th className="p-4.5 font-bold text-center w-[10%]">Customer</th>
                                <th className="p-4.5 font-bold text-center w-[7%]">Booking ID</th>
                                <th className="p-4.5 font-bold text-center w-[10%]">Brand</th>
                                <th className="p-4.5 font-bold text-center w-[9%]">Model</th>
                                <th className="p-4.5 font-bold text-center w-[9%]">Number</th>
                                <th className="p-4.5 font-bold text-center w-[22%]">Other Details</th>
                                <th className="p-4.5 font-bold text-center w-[12%]">Visit At</th>
                                <th className="p-4.5 font-bold text-center w-[10%]">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y uppercase text-[12px] divide-[#e6f0fa]">
                            {loading ? (
                                <tr>
                                    <td colSpan="9" className="p-8 text-center text-sm text-gray-500">Loading vehicles...</td>
                                </tr>
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
                                    <td className="p-4 font-semibold text-[#052558] text-sm truncate text-center w-[11%]" title={v.customerId}>
                                        {v.customerId}
                                    </td>
                                    <td className="p-4 text-center w-[10%]">
                                        <div className="font-bold text-[#011023] truncate px-2" title={v.ownerName}>{v.ownerName}</div>
                                    </td>
                                    <td className="p-4 text-center w-[10%]">
                                        <div className="font-bold text-[#052558] truncate px-1" title={v.bookingId}>{v.bookingId}</div>
                                    </td>
                                    <td className="p-4 text-center w-[10%] font-bold text-[#011023]">
                                        {v.brand}
                                    </td>
                                    <td className="p-4 text-center w-[9%] font-bold text-[#0f172a]">
                                        {v.model}
                                    </td>
                                    <td className="p-4 text-center w-[9%]">
                                        <span className="bg-[#fef3c7] text-[#92400e] font-bold px-3 py-1 rounded-xl text-[12px] uppercase tracking-wide">
                                            {v.number}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center w-[19%]">
                                        <div className="flex flex-wrap justify-center gap-1.5">
                                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md font-bold border border-blue-100">{v.year}</span>
                                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md font-bold border border-emerald-100">{v.type}</span>
                                            <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded-md font-bold border border-purple-100">{v.transmission}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center w-[15%]">
                                        <span className="text-sm font-semibold text-gray-600">
                                            {formatDate(v.lastVisitDate)}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center w-[11%]">
                                        <div className="flex items-center justify-center gap-1">
                                            <button
                                                onClick={() => handleViewDetails(v)}
                                                className="text-gray-400 hover:text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition-colors"
                                                title="View Details"
                                            >
                                                <Eye size={17} />
                                            </button>
                                            <button
                                                onClick={() => setDeleteModal({ open: true, vehicle: v })}
                                                className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                                                title="Delete Vehicle"
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
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#011023]/60 backdrop-blur-sm"
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
                                    <div className="bg-blue-50/30 pt-4 rounded-xl space-y-2 border border-blue-50">
                                        <p className="text-sm flex"><span className="text-gray-500 w-24 shrink-0">Name:</span> <span className="font-bold text-[#011023] truncate">{selectedVehicle.ownerName}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-24 shrink-0">Cust ID:</span> <span className="font-bold text-gray-800 truncate">{selectedVehicle.customerId}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-24 shrink-0">Booking ID:</span> <span className="font-bold text-[#052558] truncate">{selectedVehicle.bookingId}</span></p>
                                    </div>
                                </div>

                                {/* Vehicle Specs */}
                                <div className="space-y-2">
                                    <h4 className="text-sm font-bold text-gray-400 tracking-wider flex items-center gap-2">Specifications</h4>
                                    <div className="bg-blue-50/30 pt-4 rounded-xl space-y-2 border border-blue-50">
                                        <p className="text-sm flex"><span className="text-gray-500 w-24 shrink-0">Brand:</span> <span className="font-bold text-[#011023]">{selectedVehicle.brand}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-24 shrink-0">Model:</span> <span className="font-bold text-gray-800">{selectedVehicle.model}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-24 shrink-0">Trans:</span> <span className="font-bold text-gray-800">{selectedVehicle.transmission}</span></p>
                                    </div>
                                </div>

                                {/* Quick Stats */}
                                <div className="space-y-2">
                                    <h4 className="text-sm font-bold text-gray-400 tracking-wider flex items-center gap-2">Overview</h4>
                                    <div className="bg-blue-50/30 pt-4 rounded-xl space-y-2 border border-blue-50">
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
            {deleteModal.open && createPortal(
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-[#011023]/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6 text-center space-y-4">
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-[#052558] uppercase">Delete Vehicle?</h3>
                                <p className="text-gray-500 text-sm">
                                    Are you sure you want to remove <span className="font-bold text-gray-700">{deleteModal.vehicle?.number}</span> from the directory? This action cannot be undone.
                                </p>
                            </div>
                        </div>
                        <div className="flex p-4 gap-3 bg-gray-50/50">
                            <button
                                onClick={() => setDeleteModal({ open: false, vehicle: null })}
                                className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors uppercase text-xs"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteVehicle}
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

export default Vehicles;

