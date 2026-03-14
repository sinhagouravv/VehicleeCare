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
                const storedUser = localStorage.getItem('garageUser');
                if (!storedUser) return;
                const user = JSON.parse(storedUser);

                const res = await fetch(`http://localhost:5001/api/bookings/garage/${user.id}`);
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

                        // Robust amount extraction
                        const pAmt = b.payment?.amount;
                        const sPrice = b.service?.price;
                        const rawAmount = pAmt !== undefined && pAmt !== null ? pAmt : (sPrice || '0');
                        const amount = parseFloat(String(rawAmount).replace(/[^0-9.]/g, '')) || 0;
                        
                        // Count as spent if Completed, Paid, or has a valid Payment ID
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
                console.error('Failed to fetch garage customers', error);
            } finally {
                setLoading(false);
                setLastRefreshed(new Date());
            }
        };

        fetchCustomers();
        const timer = setInterval(fetchCustomers, 5000);
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
            // Local filtering for immediate feedback
            setCustomers(prev => prev.filter(c => c.id !== customerToDelete.id));
            setFilteredCustomers(prev => prev.filter(c => c.id !== customerToDelete.id));
            setIsDeleteModalOpen(false);
            setCustomerToDelete(null);
        } catch (error) {
            console.error("Failed to delete customer", error);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-extrabold uppercase text-[#011023] tracking-tight">Customers</h1>
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
                                <th className="p-4.5 font-bold text-center w-[11%]">Customer ID</th>
                                <th className="p-4.5 font-bold text-center w-[12%]">Customer</th>
                                <th className="p-4.5 font-bold text-center w-[16%]">Contact</th>
                                <th className="p-4.5 font-bold text-center w-[36%]">Vehicle</th>
                                <th className="p-4.5 font-bold text-center w-[9%]">Amount</th>
                                <th className="p-4.5 font-bold text-center w-[11%]">Last Visit</th>
                                <th className="p-4.5 font-bold text-center w-[8%]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y uppercase text-[12px] divide-[#e6f0fa]">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-sm text-gray-500">Loading customers...</td>
                                </tr>
                            ) : filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-sm text-gray-500">No customers found.</td>
                                </tr>
                            ) : filteredCustomers.map((customer) => (
                                <tr key={customer.id} className="text-center hover:bg-blue-50/30 transition-all duration-300">
                                    {/* Customer ID */}
                                    <td className="p-4 text-center w-[11%]">
                                        <span className="font-semibold text-[#052558] text-sm">
                                            {customer.userId || customer.id?.substring(0, 10).toUpperCase()}
                                        </span>
                                    </td>

                                    {/* Customer */}
                                    <td className="p-4 text-center w-[12%]">
                                        <div className="flex items-center justify-center gap-2">
                                            <span className="font-semibold text-sm text-[#011023] truncate" title={customer.name}>
                                                {customer.name}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Contact */}
                                    <td className="p-4 text-center w-[16%]">
                                        <div className="text-xs text-gray-500 mt-0.5">{customer.phone}</div>
                                        <div className="font-medium text-gray-700 text-sm lowercase">{customer.email}</div>
                                    </td>

                                    {/* Vehicle */}
                                    <td className="p-4 text-center w-[36%]">
                                        <div className="flex flex-wrap justify-center gap-1.5">
                                            {customer.vehicleObjects && customer.vehicleObjects.length > 0
                                                ? customer.vehicleObjects.map((v, i) => {
                                                    const ft = v.fuelType || '';
                                                    const isEV = ft.includes('ev') || ft.includes('electric') || v.label.toLowerCase().includes(' ev') || v.label.toLowerCase().includes('ioniq') || v.label.toLowerCase().endsWith(' ev6') || v.label.toLowerCase().endsWith(' ev3');
                                                    const isDiesel = ft.includes('diesel');
                                                    const cls = isEV
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                        : isDiesel
                                                        ? 'bg-orange-50 text-orange-700 border-orange-100'
                                                        : 'bg-blue-50 text-blue-700 border-blue-100';
                                                    return (
                                                        <span key={i} className={`px-2.5 py-1 text-[11px] font-semibold border rounded-lg whitespace-nowrap ${cls}`}>
                                                            {v.label}
                                                        </span>
                                                    );
                                                })
                                                : <span className="text-sm text-gray-400">—</span>
                                            }
                                        </div>
                                    </td>

                                    {/* Amount */}
                                    <td className="p-4 text-center w-[9%]">
                                        <span className="text-sm font-bold text-[#011023]">
                                            ₹{customer.totalSpent.toLocaleString()}
                                        </span>
                                    </td>

                                    {/* Last Visit */}
                                    <td className="p-4 text-center w-[11%]">
                                        <span className="text-sm font-semibold text-gray-600">{customer.lastVisit}</span>
                                    </td>

                                    {/* Actions */}
                                    <td className="p-4 text-center w-[8%]">
                                        <div className="flex items-center justify-center gap-1">
                                            <button
                                                onClick={() => handleViewDetails(customer)}
                                                className="text-gray-400 hover:text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition-colors"
                                                title="View Details"
                                            >
                                                <Eye size={17} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(customer)}
                                                className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                                                title="Delete Customer"
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
            {isViewModalOpen && selectedCustomer && createPortal(
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#011023]/60 backdrop-blur-sm"
                    onClick={() => setIsViewModalOpen(false)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-[#e6f0fa] flex justify-between items-center bg-gradient-to-r from-blue-50/50 to-white">
                            <div className="flex items-center gap-3">
                                <div>
                                    <h3 className="text-xl uppercase font-bold text-[#052558]">{selectedCustomer.name}</h3>
                                    <p className="text-sm text-gray-500 mt-0.5">ID: <span className="font-semibold text-gray-700">{selectedCustomer.userId}</span></p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsViewModalOpen(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 space-y-5 hide-scrollbar">
                            {/* Contact & Stats row */}
                            <div className="flex gap-4">
                                {/* Contact */}
                                <div className="space-y-2 w-[40%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Contact</h4>
                                    <div className="bg-blue-50/30 p-4 rounded-xl uppercase space-y-2 border border-blue-50">
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Email:</span> <span className="font-semibold text-gray-800 truncate lowercase">{selectedCustomer.email}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Phone:</span> <span className="font-semibold text-gray-800">{selectedCustomer.phone}</span></p>
                                    </div>
                                </div>

                                {/* Total Booking */}
                                <div className="space-y-2 w-[18%]">
                                    <h4 className="text-sm font-bold text-center text-gray-400 uppercase tracking-wider">Total Booking</h4>
                                    <div className="bg-blue-50/30 p-4 rounded-xl border border-blue-50 h-[76px] flex items-center justify-center">
                                        <p className="text-lg font-bold text-[#011023]">{selectedCustomer.bookingCount}</p>
                                    </div>
                                </div>

                                {/* Total Spent */}
                                <div className="space-y-2 w-[18%]">
                                    <h4 className="text-sm font-bold text-center text-gray-400 uppercase tracking-wider">Total Spent</h4>
                                    <div className="bg-blue-50/30 p-4 rounded-xl border border-blue-50 h-[76px] flex items-center justify-center">
                                        <p className="text-lg font-bold text-[#011023]">₹{selectedCustomer.totalSpent.toLocaleString()}</p>
                                    </div>
                                </div>

                                {/* Last Visit */}
                                <div className="space-y-2 w-[20%]">
                                    <h4 className="text-sm font-bold text-center text-gray-400 uppercase tracking-wider">Last Visit</h4>
                                    <div className="bg-blue-50/30 p-4 rounded-xl border border-blue-50 h-[76px] flex items-center justify-center">
                                        <p className="text-lg font-bold text-center text-[#011023]">{selectedCustomer.lastVisit}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Vehicle & Bookings */}
                            <div className="flex gap-4">
                                <div className="w-full space-y-2">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Vehicles</h4>
                                    <div className="bg-[#f4f9ff] p-4 rounded-xl border border-blue-50/50">
                                        <div className="flex flex-wrap uppercase gap-3">
                                            {selectedCustomer.vehicleObjects && selectedCustomer.vehicleObjects.length > 0
                                                ? selectedCustomer.vehicleObjects.map((v, i) => {
                                                    const ft = v.fuelType || '';
                                                    const isEV = ft.includes('ev') || ft.includes('electric') || v.label.toLowerCase().includes(' ev') || v.label.toLowerCase().includes('ioniq') || v.label.toLowerCase().endsWith(' ev6') || v.label.toLowerCase().endsWith(' ev3');
                                                    const isDiesel = ft.includes('diesel');
                                                    const cls = isEV
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                        : isDiesel
                                                        ? 'bg-orange-50 text-orange-700 border-orange-100'
                                                        : 'bg-blue-50 text-blue-700 border-blue-100';
                                                    return (
                                                        <span key={i} className={`px-2.5 py-1.5 text-[12px] font-bold border rounded-lg shadow-sm whitespace-nowrap ${cls}`}>
                                                            {v.label}
                                                        </span>
                                                    );
                                                })
                                                : <span className="text-sm text-gray-400">—</span>
                                            }
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
            {isDeleteModalOpen && customerToDelete && createPortal(
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#011023]/60 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)} />
                    <div className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-white/50 animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100/50 flex items-center justify-between bg-red-50/50 text-center flex-col gap-4">
                            <div>
                                <h3 className="text-xl uppercase mt-3 font-black text-[#011023]">Remove Customer</h3>
                                <p className="text-xs text-red-500 font-bold uppercase tracking-widest mt-1">Permanent Removal</p>
                            </div>
                        </div>

                        <div className="p-3 text-center uppercase tracking-tight">
                            <h4 className="text-lg font-bold text-[#011023] mb-2">{customerToDelete.name}</h4>
                            <p className="text-gray-500 text-xs leading-relaxed">
                                Are you sure you want to permanently delete this customer from your directory? This action cannot be undone.
                            </p>
                        </div>

                        <div className="p-6 bg-gray-50 flex gap-3">
                            <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-3 text-xs font-bold text-gray-400 hover:bg-white rounded-2xl border-2 border-transparent hover:border-gray-200 transition-all uppercase">CANCEL</button>
                            <button 
                                onClick={handleDelete} 
                                disabled={deleting}
                                className="flex-1 py-3 bg-red-600 text-white font-black rounded-2xl shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all text-xs uppercase disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {deleting ? <><Loader2 size={16} className="animate-spin" /> REMOVING...</> : 'CONFIRM DELETE'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default Customers;
