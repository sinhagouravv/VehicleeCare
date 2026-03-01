import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Eye, X, RefreshCw } from 'lucide-react';

const Payments = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const [refreshing, setRefreshing] = useState(false);
    const [lastRefreshed, setLastRefreshed] = useState(null);

    const fetchPayments = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            else setRefreshing(true);
            const res = await fetch('http://localhost:5001/api/payments/all');
            const result = await res.json();
            if (result.success && result.data) {
                setPayments(result.data);
                setLastRefreshed(new Date());
            }
        } catch (err) {
            console.error("Error fetching payments:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchPayments();
        const interval = setInterval(() => fetchPayments(true), 5000);
        return () => clearInterval(interval);
    }, [fetchPayments]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed': return 'bg-emerald-100 text-emerald-700';
            case 'Pending': return 'bg-amber-100 text-amber-700';
            case 'Partially Paid': return 'bg-blue-100 text-blue-700';
            case 'Failed': return 'bg-red-100 text-red-700';
            case 'Refunded': return 'bg-gray-100 text-gray-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'Subscription': return 'bg-purple-100 text-purple-700';
            case 'Booking': return 'bg-teal-100 text-teal-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const handleViewDetails = (payment) => {
        setSelectedPayment(payment);
        setIsViewModalOpen(true);
    };

    const getVehicleString = (payment) => {
        const v = payment.booking?.vehicle;
        if (!v) return '';
        return `${v.year || ''} ${v.make || ''} ${v.model || ''}`.trim();
    };

    const getCustomerName = (payment) => {
        if (payment.type === 'Subscription') {
            return payment.business?.businessName || payment.user?.name || 'Unknown Vendor';
        }
        return payment.user?.name || 'Unknown';
    };

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-[#011023] uppercase tracking-tight">Manage Payments</h1>
                <div className="flex items-center gap-2 text-xs uppercase text-gray-400 font-medium self-center">
                    {lastRefreshed
                        ? `Last refreshed | ${lastRefreshed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | ${lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`
                        : 'Loading…'}
                </div>
            </div>

            {/* Main Content Table (Glassmorphism) */}
            <div className="bg-white/60 backdrop-blur-xl max-h-[55rem] border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden">
                <div className="overflow-x-hidden overflow-y-auto h-[860px] relative">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 z-10 shadow-sm">
                            <tr className="bg-[#f0f6ff] text-[15px] uppercase text-center tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                <th className="p-4.5 font-bold text-center w-[12%]">Payment ID</th>
                                <th className="p-4.5 font-bold text-center w-[10%]">Type</th>
                                <th className="p-4.5 font-bold text-center w-[12%]">User</th>
                                <th className="p-4.5 font-bold text-center w-[11%]">User Type</th>
                                <th className="p-4.5 font-bold text-center w-[18%]">Details</th>
                                <th className="p-4.5 font-bold text-center w-[15%]">Date</th>
                                <th className="p-4.5 font-bold text-center w-[9%]">Amount</th>
                                <th className="p-4.5 font-bold text-center w-[10%]">Method</th>
                                <th className="p-4.5 font-bold text-center w-[10%]">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y uppercase text-[12px] divide-[#e6f0fa]">
                            {loading ? (
                                <tr>
                                    <td colSpan="9" className="p-8 text-center text-sm text-gray-500">
                                        Server is not running. Kindly start the server.
                                    </td>
                                </tr>
                            ) : payments.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="p-8 text-center text-sm text-gray-500">
                                        No payments found.
                                    </td>
                                </tr>
                            ) : payments.map((payment) => (
                                <tr key={payment._id} className="hover:bg-blue-50/30 text-center mt-2 transition-colors">
                                    <td className="p-4 font-semibold text-[#052558] text-sm truncate text-center w-[12%]" title={payment.paymentId || payment._id}>
                                        {payment.paymentId || payment._id.substring(0, 8).toUpperCase()}
                                    </td>
                                    <td className="p-4 text-center w-[10%]">
                                        <span className={`inline-block px-3 py-1 text-xs text-center font-bold rounded-full border border-transparent ${getTypeColor(payment.type)}`}>
                                            {payment.type || 'Booking'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center w-[18%]">
                                        <div className="font-bold text-[#011023]">{getCustomerName(payment)}</div>
                                        <div className="text-xs text-gray-500 font-mono tracking-wide">{payment.user?.userId || ''}</div>
                                    </td>
                                    <td className="p-4 text-center w-[8%]">
                                        <span className={`inline-block px-3 py-1 text-xs text-center font-bold rounded-full border border-transparent ${payment.type === 'Subscription' ? 'bg-orange-100 text-orange-700' : 'bg-cyan-100 text-cyan-700'}`}>
                                            {payment.type === 'Subscription' ? 'Vendor' : 'Customer'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center w-[18%]">
                                        {payment.type === 'Subscription' ? (
                                            <div className="font-semibold text-gray-800 text-sm">Subscription Plan</div>
                                        ) : (
                                            <div className="font-semibold text-gray-800 text-sm">
                                                {(() => {
                                                    const title = (payment.booking?.service?.title || '').toLowerCase();
                                                    if (title.includes('parking')) return 'Parking';
                                                    if (title.includes('charging') || title.includes('station')) return 'Station';
                                                    if (title.includes('store') || title.includes('product') || title.includes('purchase')) return 'Store';
                                                    return 'Service';
                                                })()}
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4 text-center w-[15%]">
                                        <span className="text-sm text-gray-600 whitespace-nowrap">
                                            {new Date(payment.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            {' '}
                                            {new Date(payment.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center w-[9%]">
                                        <span className="text-sm font-bold text-gray-800">
                                            ₹{payment.amount}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center w-[8%]">
                                        <span className="text-sm text-gray-600 whitespace-nowrap">{payment.method}</span>
                                    </td>
                                    <td className="p-4 text-center w-[8%]">
                                        <span className={`inline-block px-3 py-1 text-xs text-center font-bold rounded-full border border-transparent ${getStatusColor(payment.status)}`}>
                                            {payment.status || 'Pending'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Payments;
