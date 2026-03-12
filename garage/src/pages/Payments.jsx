import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Eye, Download, X, Search, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const Payments = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [lastRefreshed, setLastRefreshed] = useState(null);

    const fetchPayments = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const storedUser = localStorage.getItem('garageUser');
            if (!storedUser) return;
            const user = JSON.parse(storedUser);

            const res = await fetch(`http://localhost:5001/api/payments/garage/${user.id}`);
            const result = await res.json();
            if (result.success && result.data) {
                setPayments(result.data);
                setLastRefreshed(new Date());
            }
        } catch (err) {
            console.error("Error fetching garage payments:", err);
        } finally {
            setLoading(false);
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

    const handleViewDetails = (payment) => {
        setSelectedPayment(payment);
        setIsViewModalOpen(true);
    };

    const handleDownloadInvoice = (payment) => {
        try {
            const doc = new jsPDF();
            const primaryColor = [5, 37, 88];
            const textColor = [100, 100, 100];

            doc.setFontSize(22);
            doc.setTextColor(...primaryColor);
            doc.text("VehicleeCare Payment Receipt", 105, 20, null, null, "center");

            doc.setFontSize(11);
            doc.setTextColor(...textColor);
            doc.text(`Payment ID: ${payment.paymentId}`, 14, 40);
            doc.text(`Transaction ID: ${payment.transactionId || 'N/A'}`, 14, 47);
            doc.text(`Date: ${new Date(payment.date).toLocaleString('en-IN')}`, 14, 54);
            doc.text(`Type: ${payment.type}`, 14, 61);
            doc.text(`Status: ${payment.status}`, 14, 68);

            doc.setFontSize(14);
            doc.setTextColor(...primaryColor);
            doc.text("User Details", 14, 83);
            doc.setFontSize(11);
            doc.setTextColor(...textColor);
            doc.text(`Name: ${getCustomerName(payment)}`, 14, 91);
            doc.text(`User ID: ${payment.user?.userId || 'N/A'}`, 14, 98);

            const tableBody = [
                ["Detail", payment.type === 'Subscription' ? 'Subscription Payment' : (payment.booking?.service?.title || 'Service Payment')],
                ["Amount", `Rs. ${payment.amount}`],
                ["Method", payment.method]
            ];

            autoTable(doc, {
                startY: 110,
                head: [['Description', 'Value']],
                body: tableBody,
                theme: 'grid',
                headStyles: { fillColor: primaryColor, textColor: [255, 255, 255] },
                styles: { fontSize: 11, cellPadding: 6 }
            });

            const finalY = doc.lastAutoTable.finalY + 20;
            doc.setFontSize(14);
            doc.setTextColor(...primaryColor);
            doc.text(`Total Paid: Rs. ${payment.amount}`, 195, finalY, { align: 'right' });

            doc.save(`Invoice_${payment.paymentId}.pdf`);
        } catch (err) {
            console.error("Error generating PDF:", err);
            alert("Failed to generate invoice.");
        }
    };

    const getCustomerName = (payment) => {
        if (payment.type === 'Subscription') {
            return payment.business?.businessName || payment.user?.name || 'Unknown Vendor';
        }
        return payment.user?.name || 'Unknown';
    };

    // Derived states for stats
    const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const inflowThisMonth = payments
        .filter(p => new Date(p.date).getMonth() === new Date().getMonth())
        .reduce((sum, p) => sum + (p.amount || 0), 0);
    const expensesThisMonth = 0;

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-extrabold text-[#011023] uppercase tracking-tight">Payments</h1>
                <div className="flex items-center gap-2 text-xs uppercase text-gray-400 font-medium self-center">
                    {lastRefreshed
                        ? `Last refreshed | ${lastRefreshed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | ${lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`
                        : 'Loading…'}
                </div>
            </div>

            {/* Main Content Table (Glassmorphism) */}
            <div className="bg-white/60 backdrop-blur-xl h-[53.5rem] border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 z-10 shadow-sm">
                            <tr className="bg-[#f0f6ff] text-[15px] uppercase text-center tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                <th className="px-6 py-4.5 font-bold text-center w-[12%]">Payment ID</th>
                                <th className="px-6 py-4.5 font-bold text-center w-[10%]">Booking ID</th>
                                <th className="px-6 py-4.5 font-bold text-center w-[14%]">User</th>
                                {/* <th className="px-6 py-4.5 font-bold text-center w-[9%]">User Type</th> */}
                                {/* <th className="px-6 py-4.5 font-bold text-center w-[14%]">Details</th> */}
                                <th className="px-6 py-4.5 font-bold text-center w-[14%]">Date</th>
                                <th className="px-6 py-4.5 font-bold text-center w-[7%]">Amount</th>
                                <th className="px-6 py-4.5 font-bold text-center w-[7%]">Method</th>
                                <th className="px-6 py-4.5 font-bold text-center w-[7%]">Status</th>
                                <th className="px-6 py-4.5 font-bold text-center w-[6%]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y uppercase text-[12px] divide-[#e6f0fa]">
                            {loading ? (
                                <tr>
                                    <td colSpan="10" className="p-8 text-center text-sm text-gray-500">
                                        Loading payments...
                                    </td>
                                </tr>
                            ) : payments.length === 0 ? (
                                <tr>
                                    <td colSpan="10" className="p-8 text-center text-sm text-gray-500">
                                        No payment records found.
                                    </td>
                                </tr>
                            ) : payments.map((payment) => {
                                const rowId = payment.paymentId || payment._id;
                                return (
                                    <tr key={payment._id} className="text-center hover:bg-blue-50/30 transition-all duration-300">
                                        <td className="p-4 font-semibold text-[#052558] text-sm truncate text-center w-[12%]" title={payment.paymentId || payment._id}>
                                            {payment.paymentId || payment._id.substring(0, 8).toUpperCase()}
                                        </td>
                                        <td className="p-4 text-center w-[10%]">
                                            <span className="font-semibold text-[#052558] text-sm">
                                                {payment.type === 'Booking' ? (payment.booking?.bookingId || '—') : '—'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center w-[14%]">
                                            <div className="font-bold text-[#011023]">{getCustomerName(payment)}</div>
                                            <div className="text-xs text-gray-500 font-mono tracking-wide">{payment.user?.userId || ''}</div>
                                        </td>
                                        {/* <td className="p-4 text-center w-[9%]">
                                            <span className={`inline-block px-3 py-1 text-[10px] text-center font-bold rounded-full border border-transparent ${payment.type === 'Subscription' ? 'bg-orange-100 text-orange-700' : 'bg-cyan-100 text-cyan-700'}`}>
                                                {payment.type === 'Subscription' ? 'Vendor' : 'Customer'}
                                            </span>
                                        </td> */}
                                        {/* <td className="p-4 text-center w-[14%]">
                                            <div className="font-semibold text-gray-800 text-sm">
                                                {payment.type === 'Subscription' ? 'Subscription' : (payment.booking?.service?.title || 'Service')}
                                            </div>
                                        </td> */}
                                        <td className="p-4 text-center w-[14%]">
                                            <span className="text-sm text-gray-600 whitespace-nowrap">
                                                {new Date(payment.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                {' '}
                                                {new Date(payment.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center w-[7%]">
                                            <span className="text-sm font-bold text-gray-800">
                                                ₹{payment.amount?.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center w-[7%]">
                                            <span className="text-sm text-gray-600 whitespace-nowrap">{payment.method}</span>
                                        </td>
                                        <td className="p-4 text-center w-[7%]">
                                            <span className={`inline-block px-3 py-1 text-[10px] text-center font-bold rounded-full border border-transparent ${getStatusColor(payment.status)}`}>
                                                {payment.status || 'Pending'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center w-[6%]">
                                            <div className="flex justify-center gap-1.5">
                                                <button onClick={() => handleViewDetails(payment)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Details">
                                                    <Eye size={18} />
                                                </button>
                                                <button onClick={() => handleDownloadInvoice(payment)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Download Invoice">
                                                    <Download size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* View Details Modal */}
            {isViewModalOpen && selectedPayment && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#011023]/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <div>
                                <h3 className="text-xl font-bold text-[#011023]">Payment Details</h3>
                                <p className="text-sm text-gray-500 font-mono mt-1">{selectedPayment.paymentId}</p>
                            </div>
                            <button onClick={() => setIsViewModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>
                        <div className="p-8 space-y-8 max-h-[80vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-[#052558] uppercase tracking-widest border-b pb-2">Customer & User</h4>
                                    <div className="space-y-1">
                                        <p className="text-sm font-semibold text-gray-900">{getCustomerName(selectedPayment)}</p>
                                        <p className="text-xs text-gray-500 font-mono uppercase tracking-tight">{selectedPayment.user?.userId || 'N/A'}</p>
                                        <p className="text-xs text-gray-500">{selectedPayment.user?.email || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-[#052558] uppercase tracking-widest border-b pb-2">Payment Status</h4>
                                    <div className="flex flex-col gap-2">
                                        <span className={`px-3 py-1 text-xs font-bold rounded-full w-fit ${getStatusColor(selectedPayment.status)}`}>
                                            {selectedPayment.status}
                                        </span>
                                        <p className="text-xs text-gray-400 font-medium ">Method: {selectedPayment.method}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-[#052558] uppercase tracking-widest border-b pb-2">Transaction Details</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-gray-50 rounded-2xl">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Transaction ID</p>
                                        <p className="text-sm text-gray-700 font-mono">{selectedPayment.transactionId || 'N/A'}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-2xl">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Payment Type</p>
                                        <p className="text-sm text-gray-700 font-bold">{selectedPayment.type}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-2xl">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Date & Time</p>
                                        <p className="text-sm text-gray-700 font-medium">
                                            {new Date(selectedPayment.date).toLocaleString('en-IN', {
                                                day: '2-digit', month: 'short', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit', hour12: true
                                            })}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-2xl">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Amount Paid</p>
                                        <p className="text-lg font-black text-[#011023]">₹{selectedPayment.amount?.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default Payments;
