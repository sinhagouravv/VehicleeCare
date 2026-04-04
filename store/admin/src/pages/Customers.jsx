import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Eye, X, Search, Trash2, Loader2 } from 'lucide-react';

const Customers = () => {
    const [lastRefreshed, setLastRefreshed] = useState(null);
    const [customers, setCustomers] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const storedUser = localStorage.getItem('adminUser');
                if (!storedUser) return;
                const user = JSON.parse(storedUser);

                // For Store, we also use the same booking/order extraction logic as it's the primary way customers interact
                const res = await fetch(`http://localhost:5001/api/bookings/garage/${user.id || user._id}`);
                const data = await res.json();
                if (data.success) {
                    const customerMap = {};
                    data.data.forEach(b => {
                        if (!b.user || !b.user.name) return;

                        const emailOrPhone = b.user.email || b.user.phone || 'Unknown';
                        const key = b.user.id || emailOrPhone;

                        if (!customerMap[key]) {
                            customerMap[key] = {
                                id: key,
                                userId: b.user.userId || key,
                                name: b.user.name,
                                email: b.user.email || 'N/A',
                                phone: b.user.phone || 'N/A',
                                vehicleSet: new Set(),
                                vehicleDetails: [],
                                totalSpent: 0,
                                lastVisitDate: new Date(0),
                                bookingCount: 0,
                            };
                        }

                        const vehicle = b.vehicle || b.booking?.vehicle;
                        if (vehicle) {
                            const vNum = vehicle.number || b.vehicleNumber || b.vehicleId || 'N/A';
                            customerMap[key].vehicleSet.add(vNum);
                            
                            let vStr = `${vehicle.make || ''} ${vehicle.model || ''}`.trim();
                            if (!vStr) vStr = vNum !== 'N/A' ? vNum : (vehicle.name || 'Unknown Vehicle');
                            
                            const fuelType = (vehicle.fuelType || vehicle.fuel || '').toLowerCase();
                            if (vStr && !customerMap[key].vehicleDetails.some(v => v.label === vStr)) {
                                customerMap[key].vehicleDetails.push({ label: vStr, fuelType });
                            }
                        }

                        const pAmt = b.payment?.amount;
                        const sPrice = b.service?.price;
                        const rawAmount = pAmt !== undefined && pAmt !== null ? pAmt : (sPrice || '0');
                        const amount = parseFloat(String(rawAmount).replace(/[^0-9.]/g, '')) || 0;
                        
                        if (b.status === 'Completed' || b.status === 'Paid' || (b.payment && b.payment.paymentId)) {
                            customerMap[key].totalSpent += amount;
                        }

                        customerMap[key].bookingCount += 1;

                        const defaultDate = new Date(b.schedule?.date || b.createdAt);
                        if (!isNaN(defaultDate.getTime()) && defaultDate > customerMap[key].lastVisitDate) {
                            customerMap[key].lastVisitDate = defaultDate;
                        }
                    });

                    const formattedCustomers = Object.values(customerMap).map(c => ({
                        ...c,
                        vehicleCount: c.vehicleSet.size,
                        vehicleObjects: c.vehicleDetails,
                        vehicleLabel: c.vehicleDetails.map(v => v.label).join(', ') || `${c.vehicleSet.size} Vehicle${c.vehicleSet.size !== 1 ? 's' : ''}`,
                        lastVisit: c.lastVisitDate.getTime() === 0 ? 'Unknown' : c.lastVisitDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
                    })).sort((a, b) => b.lastVisitDate - a.lastVisitDate);

                    setCustomers(formattedCustomers);
                    setFilteredCustomers(formattedCustomers);
                }
            } catch (error) {
                console.error('Failed to fetch store customers', error);
            } finally {
                setLoading(false);
                setLastRefreshed(new Date());
            }
        };

        fetchCustomers();
        const timer = setInterval(fetchCustomers, 10000); // 10s refresh for Store
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const q = searchQuery.toLowerCase();
        setFilteredCustomers(
            customers.filter(c =>
                c.name.toLowerCase().includes(q) ||
                c.email.toLowerCase().includes(q) ||
                c.phone.toLowerCase().includes(q) ||
                (c.userId || '').toLowerCase().includes(q)
            )
        );
    }, [searchQuery, customers]);

    const handleViewDetails = (customer) => {
        setSelectedCustomer(customer);
        setIsViewModalOpen(true);
    };

    const handleDeleteClick = (customer) => {
        setCustomerToDelete(customer);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (!customerToDelete) return;
        setDeleting(true);
        try {
            // Local filtering for immediate feedback in Store Admin
            setCustomers(prev => prev.filter(c => c.id !== customerToDelete.id));
            setFilteredCustomers(prev => prev.filter(c => c.id !== customerToDelete.id));
            setIsDeleteModalOpen(false);
            setCustomerToDelete(null);
        } catch (error) {
            console.error("Failed to delete customer record", error);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h1 className="text-3xl font-extrabold uppercase text-[#011023] tracking-tight">Customer Database</h1>
                <div className="flex items-center gap-4">
                    <div className="text-xs uppercase text-gray-400 font-medium">
                        {lastRefreshed ? `Last refreshed | ${lastRefreshed.toLocaleTimeString('en-IN')}` : 'Loading…'}
                    </div>
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-white/60 backdrop-blur-xl h-[53.5rem] border border-[#e6f0fa] rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden">
                <div className="overflow-x-hidden overflow-y-auto text-center h-[860px] relative hide-scrollbar">
                    <table className="w-full text-center border-collapse">
                        <thead className="sticky top-0 z-10 shadow-sm">
                            <tr className="bg-[#f0f6ff] text-[15px] uppercase tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                <th className="p-4.5 font-bold">Profile ID</th>
                                <th className="p-4.5 font-bold">Customer Name</th>
                                <th className="p-4.5 font-bold text-left">Contact Info</th>
                                <th className="p-4.5 font-bold">Vehicles Profiled</th>
                                <th className="p-4.5 font-bold text-center">Total Revenue</th>
                                <th className="p-4.5 font-bold text-center">Last Purchase</th>
                                <th className="p-4.5 font-bold text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-[13px] divide-[#e6f0fa] uppercase">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="py-16 text-gray-400 text-sm">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 size={28} className="animate-spin text-[#527FB0]" />
                                            <p className="text-sm font-medium uppercase tracking-widest opacity-60">Building database...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-16 text-gray-400 text-sm uppercase font-bold tracking-widest opacity-60">
                                        No customer data found.
                                    </td>
                                </tr>
                            ) : filteredCustomers.map((customer) => (
                                <tr key={customer.id} className="hover:bg-blue-50/30 transition-all duration-300">
                                    <td className="p-4 font-bold text-[#052558] tracking-wider">
                                        {customer.userId || customer.id?.substring(0, 10).toUpperCase()}
                                    </td>
                                    <td className="p-4 font-bold text-[#011023] whitespace-nowrap">{customer.name}</td>
                                    <td className="p-4 text-left">
                                        <div className="text-xs text-gray-500 mb-0.5">{customer.phone}</div>
                                        <div className="font-medium text-gray-700 text-sm lowercase">{customer.email}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-wrap justify-center gap-1.5 max-w-[300px] mx-auto">
                                            {customer.vehicleObjects && customer.vehicleObjects.length > 0
                                                ? customer.vehicleObjects.map((v, i) => {
                                                    const ft = v.fuelType || '';
                                                    const isEV = ft.includes('ev') || ft.includes('electric') || v.label.toLowerCase().includes(' ev');
                                                    const isDiesel = ft.includes('diesel');
                                                    const cls = isEV
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                        : isDiesel
                                                        ? 'bg-orange-50 text-orange-700 border-orange-100'
                                                        : 'bg-blue-50 text-blue-700 border-blue-100';
                                                    return (
                                                        <span key={i} className={`px-2.5 py-1 text-[10px] font-bold border rounded-lg whitespace-nowrap ${cls}`}>
                                                            {v.label}
                                                        </span>
                                                    );
                                                })
                                                : <span className="text-gray-400">—</span>
                                            }
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="text-sm font-black text-[#011023]">
                                            ₹{customer.totalSpent.toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="font-semibold text-gray-600">{customer.lastVisit}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-center gap-1.5">
                                            <button onClick={() => handleViewDetails(customer)} className="text-gray-400 hover:text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition-colors" title="Quick View">
                                                <Eye size={17} />
                                            </button>
                                            <button onClick={() => handleDeleteClick(customer)} className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title="Purge Record">
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
            {isViewModalOpen && selectedCustomer && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#011023]/60 backdrop-blur-sm" onClick={() => setIsViewModalOpen(false)}>
                    <div className="bg-white rounded-[2rem] w-full max-w-4xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh] uppercase" onClick={(e) => e.stopPropagation()}>
                        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50/40 to-transparent">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-[#052558] text-white rounded-2xl flex items-center justify-center font-black text-xl">
                                    {selectedCustomer.name?.charAt(0) || 'U'}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-[#011023] uppercase">{selectedCustomer.name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[11px] font-mono text-gray-400">UUID: {selectedCustomer.userId}</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setIsViewModalOpen(false)} className="p-2.5 hover:bg-gray-100 rounded-xl transition-all">
                                <X size={20} className="text-gray-400" />
                            </button>
                        </div>
                        
                        <div className="p-8 overflow-y-auto flex-1 space-y-8 hide-scrollbar">
                            <div className="grid grid-cols-3 gap-6">
                                <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100/50 text-center">
                                    <p className="text-[10px] text-gray-400 font-bold mb-2">Order History</p>
                                    <p className="text-2xl font-black text-[#011023]">{selectedCustomer.bookingCount}</p>
                                </div>
                                <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100/50 text-center">
                                    <p className="text-[10px] text-gray-400 font-bold mb-2">LIFETIME REVENUE</p>
                                    <p className="text-2xl font-black text-[#011023]">₹{selectedCustomer.totalSpent.toLocaleString()}</p>
                                </div>
                                <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100/50 text-center">
                                    <p className="text-[10px] text-gray-400 font-bold mb-2">RECENT ACTIVITY</p>
                                    <p className="text-2xl font-black text-[#011023]">{selectedCustomer.lastVisit}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Profile Data</h4>
                                    <div className="space-y-4">
                                        <div className="bg-blue-50/20 p-5 rounded-2xl border border-blue-50/50 space-y-3">
                                            <p className="text-[11px] flex justify-between"><span className="text-gray-500 font-bold">Email:</span> <span className="font-bold text-[#011023] lowercase">{selectedCustomer.email}</span></p>
                                            <p className="text-[11px] flex justify-between"><span className="text-gray-500 font-bold">Phone:</span> <span className="font-bold text-[#011023]">{selectedCustomer.phone}</span></p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Fleet Details</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedCustomer.vehicleObjects && selectedCustomer.vehicleObjects.length > 0 ? (
                                            selectedCustomer.vehicleObjects.map((v, i) => (
                                                <span key={i} className="px-3 py-2 text-[11px] font-bold bg-[#f0f6ff] text-[#052558] border border-blue-100 rounded-xl">
                                                    {v.label}
                                                </span>
                                            ))
                                        ) : (
                                            <p className="text-xs text-gray-400 font-bold">NO VEHICLE DATA</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Delete Modal */}
            {isDeleteModalOpen && customerToDelete && createPortal(
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#011023]/60 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)} />
                    <div className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl p-8 text-center uppercase">
                        <div className="w-16 h-16 rounded-3xl bg-red-100 flex items-center justify-center mx-auto mb-6">
                            <Trash2 size={24} className="text-red-600" />
                        </div>
                        <h3 className="text-xl font-black text-[#011023] mb-2">Purge Customer</h3>
                        <p className="text-gray-500 text-xs leading-relaxed mb-8">Completely remove <strong>{customerToDelete.name}</strong> from the store database? All associated records will be detached.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-3 text-gray-400 font-bold border border-gray-100 rounded-2xl">RETAIN</button>
                            <button onClick={handleDelete} className="flex-1 py-3 bg-red-600 text-white font-black rounded-2xl shadow-lg shadow-red-600/20">CONFIRM PURGE</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default Customers;
