import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Eye, Download, X, Search, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import useHighlight from '../hooks/useHighlight';

const Payments = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [lastRefreshed, setLastRefreshed] = useState(null);
    const highlightedRow = useHighlight(payments);

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
                <h1 className="text-3xl font-bold text-[#011023] uppercase tracking-tight">Payments</h1>
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
                                <th className="px-6 py-4.5 font-bold text-center w-[12%]">User</th>
                                <th className="px-6 py-4.5 font-bold text-center w-[10%]">User ID</th>
                                {/* <th className="px-6 py-4.5 font-bold text-center w-[9%]">User Type</th> */}
                                {/* <th className="px-6 py-4.5 font-bold text-center w-[14%]">Details</th> */}
                                <th className="px-6 py-4.5 font-bold text-center w-[14%]">Paid At</th>
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
                                    <tr 
                                        key={payment._id} 
                                        id={`row-${rowId}`}
                                        className={`text-center transition-all duration-1000 ${
                                            highlightedRow === rowId 
                                                ? 'bg-emerald-100/60 rounded-2xl relative z-20 scale-[1.01]' 
                                                : 'hover:bg-blue-50/30'
                                        }`}
                                    >
                                        <td className="p-4 font-semibold text-[#052558] text-sm truncate text-center w-[12%]" title={payment.paymentId || payment._id}>
                                            {payment.paymentId || payment._id.substring(0, 8).toUpperCase()}
                                        </td>
                                        <td className="p-4 text-center w-[10%]">
                                            <span className="font-semibold text-[#052558] text-sm">
                                                {payment.type === 'Booking' ? (payment.booking?.bookingId || '—') : '—'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center w-[12%]">
                                            <div className="font-semibold text-sm text-[#011023]">{getCustomerName(payment)}</div>
                                        </td>
                                        <td className="p-4 text-center w-[10%]">
                                            <div className="text-sm font-semibold uppercase">{payment.user?.userId || '—'}</div>
                                        </td>
                                        <td className="p-4 text-center w-[14%]">
                                            <span className="text-sm font-semibold whitespace-nowrap">
                                                {new Date(payment.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | 
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
                                            <span className="text-sm font-semibold whitespace-nowrap">{payment.method}</span>
                                        </td>
                                        <td className="p-4 text-center w-[7%]">
                                            <span className={`inline-block px-3 py-1 text-xs text-center font-semibold rounded-full border border-transparent ${getStatusColor(payment.status)}`}>
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

            {isViewModalOpen && selectedPayment && createPortal(
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#011023]/20 backdrop-blur-sm"
                    onClick={() => setIsViewModalOpen(false)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-[#e6f0fa] flex justify-between items-center bg-gradient-to-r from-blue-50/50 to-white">
                            <div>
                                <h3 className="text-xl uppercase font-bold text-[#052558]">Payment Details</h3>
                                <p className="text-sm text-gray-500 mt-1">ID: <span className="font-semibold text-gray-700">{selectedPayment.paymentId}</span></p>
                            </div>
                            <button
                                onClick={() => setIsViewModalOpen(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 space-y-6 hide-scrollbar">
                            {/* Top Row */}
                            <div className="flex flex-col md:flex-row gap-6 w-full">
                                {/* Customer Info */}
                                <div className="space-y-3 w-full md:w-[40%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Customer Info</h4>
                                    <div className="bg-blue-50/30 p-4 rounded-xl uppercase space-y-2 border border-blue-50">
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Name:</span> <span className="font-semibold text-[#011023] truncate">{getCustomerName(selectedPayment)}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">ID:</span> <span className="font-semibold text-gray-800 ">{selectedPayment.user?.userId || 'N/A'}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Email:</span> <span className="font-semibold text-gray-800 truncate lowercase">{selectedPayment.user?.email || 'N/A'}</span></p>
                                    </div>
                                </div>

                                {/* Payment Status */}
                                <div className="space-y-3 w-full md:w-[15%]">
                                    <h4 className="text-sm font-bold text-center text-gray-400 uppercase tracking-wider">Status</h4>
                                    <div className="bg-blue-50/30 p-4 rounded-xl uppercase space-y-3 border border-blue-50 h-[81px] flex items-center">
                                        <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${getStatusColor(selectedPayment.status)}`}>
                                            {selectedPayment.status}
                                        </span>
                                    </div>
                                </div>

                                {/* Method */}
                                <div className="space-y-3 w-full md:w-[20%]">
                                    <h4 className="text-sm text-center font-bold text-gray-400 uppercase tracking-wider">Method</h4>
                                    <div className="bg-blue-50/30 p-4 text-center rounded-xl uppercase border border-blue-50 h-[81px] flex items-center justify-center">
                                        <p className="text-sm font-semibold text-center text-gray-700">{selectedPayment.method}</p>
                                    </div>
                                </div>

                                {/* Amount */}
                                <div className="space-y-3 w-full md:w-[20%]">
                                    <h4 className="text-sm font-bold text-center text-gray-400 uppercase tracking-wider">Amount</h4>
                                    <div className="bg-blue-50/30 p-4 rounded-xl border border-blue-50 h-[81px] flex items-center justify-center">
                                        <p className="text-xl font-bold text-center text-[#011023]">₹{selectedPayment.amount?.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Transaction Details */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Transaction Details</h4>
                                <div className="bg-white border border-[#e6f0fa] p-5 rounded-xl shadow-sm">
                                    <div className="flex gap-4">
                                        <div className="bg-[#f4f9ff] rounded-xl px-4 py-3 flex-[2]">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Transaction ID</p>
                                            <p className="text-sm text-[#011023] font-semibold">{selectedPayment.transactionId || 'N/A'}</p>
                                        </div>
                                        <div className="bg-[#f4f9ff] rounded-xl px-4 py-3 flex-[1]">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Payment ID</p>
                                            <p className="text-sm text-[#011023] font-semibold">{selectedPayment.paymentId || 'N/A'}</p>
                                        </div>
                                        <div className="bg-[#f4f9ff] rounded-xl px-4 py-3 flex-[1]">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Booking ID</p>
                                            <p className="text-sm text-[#011023] font-semibold">{selectedPayment.type === 'Booking' ? (selectedPayment.booking?.bookingId || '—') : '—'}</p>
                                        </div>
                                        <div className="bg-[#f4f9ff] rounded-xl px-4 py-3 flex-[2]">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Paid At</p>
                                            <p className="text-sm text-[#011023] font-semibold">
                                                {new Date(selectedPayment.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | {new Date(selectedPayment.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                            </p>
                                        </div>
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
