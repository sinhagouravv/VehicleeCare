import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Eye, Download, X, RefreshCw } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import useHighlight from '../hooks/useHighlight';
import { TableSkeleton, SkeletonBlock } from '../components/Skeleton';
import { useFilter } from '../context/FilterContext';
import { useRowLabels, FloatingLabelSelector, renderLabelIcon, stripEmoji, LABEL_FILTER_GROUP } from '../components/RowLabel';

const Payments = () => {
    const [payments, setPayments] = useState([]);
    const highlightedRow = useHighlight(payments);
    const [loading, setLoading] = useState(true);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const [_refreshing, setRefreshing] = useState(false);
    const [lastRefreshed, setLastRefreshed] = useState(null);

    // Filter, Sort & Row Label States
    const [filterStatus, setFilterStatus] = useState('All');
    const [labelFilter, setLabelFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState('latest');
    const [timeRange, setTimeRange] = useState('all');

    const { setFilterConfig, setResultsCount } = useFilter();
    const { rowLabels, activeLabelRowId, setActiveLabelRowId, handleSaveRowLabel, labelPopupRef, isLabelMode } = useRowLabels('admin_payments_labels');

    // Register filter options
    useEffect(() => {
        setFilterConfig({
            title: 'Filter Payments',
            hasSort: true,
            groups: [
                LABEL_FILTER_GROUP,
                {
                    id: 'status',
                    label: 'Payment Status',
                    defaultValue: 'all',
                    options: [
                        { label: 'All', value: 'all' },
                        { label: 'Completed', value: 'Completed' },
                        { label: 'Pending', value: 'Pending' },
                        { label: 'Partially Paid', value: 'Partially Paid' },
                        { label: 'Failed', value: 'Failed' },
                        { label: 'Refunded', value: 'Refunded' },
                    ]
                }
            ],
            initialValues: {
                status: filterStatus === 'All' ? 'all' : filterStatus,
                label: labelFilter,
                sortOrder,
                timeRange
            },
            onChange: (newValues) => {
                if (newValues.status !== undefined) {
                    setFilterStatus(newValues.status === 'all' ? 'All' : newValues.status);
                }
                if (newValues.label !== undefined) setLabelFilter(newValues.label);
                if (newValues.sortOrder !== undefined) setSortOrder(newValues.sortOrder);
                if (newValues.timeRange !== undefined) setTimeRange(newValues.timeRange);
            },
            onReset: () => {
                setFilterStatus('All');
                setLabelFilter('all');
                setSortOrder('latest');
                setTimeRange('all');
            }
        });
        return () => setFilterConfig(null);
    }, [setFilterConfig, filterStatus, labelFilter, sortOrder, timeRange]);

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

    const handleDownloadInvoice = (payment) => {
        try {
            const doc = new jsPDF();
            const primaryColor = [5, 37, 88];
            const textColor = [100, 100, 100];

            // Header
            doc.setFontSize(22);
            doc.setTextColor(...primaryColor);
            doc.text("VehicleeCare Payment Receipt", 105, 20, null, null, "center");

            // Info Details
            doc.setFontSize(11);
            doc.setTextColor(...textColor);
            doc.text(`Payment ID: ${payment.paymentId}`, 14, 40);
            doc.text(`Transaction ID: ${payment.transactionId || 'N/A'}`, 14, 47);
            doc.text(`Date: ${new Date(payment.date).toLocaleString('en-IN')}`, 14, 54);
            doc.text(`Type: ${payment.type}`, 14, 61);
            doc.text(`Status: ${payment.status}`, 14, 68);

            // User Details
            doc.setFontSize(14);
            doc.setTextColor(...primaryColor);
            doc.text("User Details", 14, 83);
            doc.setFontSize(11);
            doc.setTextColor(...textColor);
            doc.text(`Name: ${getCustomerName(payment)}`, 14, 91);
            doc.text(`User ID: ${payment.user?.userId || 'N/A'}`, 14, 98);

            // Payment Details Table
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

    const _getVehicleString = (payment) => {
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

    const filteredPayments = React.useMemo(() => {
        return payments.filter(p => {
            if (filterStatus !== 'All' && p.status?.toLowerCase() !== filterStatus.toLowerCase()) {
                return false;
            }
            if (labelFilter !== 'all') {
                const label = rowLabels[p._id];
                if (!label || label.toUpperCase() !== labelFilter.toUpperCase()) {
                    return false;
                }
            }
            if (timeRange !== 'all') {
                const itemDate = p.date ? new Date(p.date) : (p.createdAt ? new Date(p.createdAt) : null);
                if (itemDate && !isNaN(itemDate.getTime())) {
                    const now = new Date();
                    const diffDays = Math.ceil(Math.abs(now - itemDate) / (1000 * 60 * 60 * 24));
                    if (timeRange === 'week' && diffDays > 7) return false;
                    if (timeRange === 'month' && diffDays > 30) return false;
                }
            }
            return true;
        }).sort((a, b) => {
            const dateA = a.date ? new Date(a.date).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
            const dateB = b.date ? new Date(b.date).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
            if (dateA !== dateB && dateA > 0 && dateB > 0) {
                return sortOrder === 'latest' ? dateB - dateA : dateA - dateB;
            }
            const idA = String(a.paymentId || a._id || '');
            const idB = String(b.paymentId || b._id || '');
            return sortOrder === 'latest' ? idB.localeCompare(idA) : idA.localeCompare(idB);
        });
    }, [payments, filterStatus, labelFilter, timeRange, sortOrder, rowLabels]);

    useEffect(() => {
        setResultsCount(filteredPayments.length);
    }, [filteredPayments.length, setResultsCount]);

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto h-[calc(100vh-9rem)] flex flex-col">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-[#011023] uppercase tracking-tight">Payments</h1>
                <div className="flex items-center gap-2 text-xs uppercase text-gray-400 font-medium self-center">
                    {!lastRefreshed ? (
                        <SkeletonBlock className="h-4 w-64 bg-slate-200/80 rounded-md" />
                    ) : (
                        `Last refreshed | ${lastRefreshed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | ${lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`
                    )}
                </div>
            </div>

            {/* Main Content Table */}
            <div className="bg-white border border-[#e9f2fb] rounded-2xl shadow-[0_1px_2.5px_0_rgba(0,0,0,0.07)] flex-1 min-h-0 overflow-hidden flex flex-col">
                <div className="overflow-x-hidden overflow-y-auto text-center flex-1 relative hide-scrollbar">
                    <table className="w-full text-center border-collapse table-fixed">
                        <thead className="sticky top-0 z-10 shadow-sm">
                            <tr className="bg-[#f0f6ff] text-[15px] uppercase text-center tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                <th className="p-4.5 font-bold text-center w-[9.5%]">Payment ID</th>
                                <th className="p-4.5 font-bold text-center w-[8%]">Category</th>
                                <th className="p-4.5 font-bold text-center w-[10%]">Type</th>
                                <th className="p-4.5 font-bold text-center w-[7%]">ID</th>
                                <th className="p-4.5 font-bold text-center w-[10%]">User</th>
                                <th className="p-4.5 font-bold text-center w-[9%]">User Type</th>
                                <th className="p-4.5 font-bold text-center w-[9%]">Paid At</th>
                                <th className="p-4.5 font-bold text-center w-[7%]">Amount</th>
                                <th className="p-4.5 font-bold text-center w-[8.5%]">Method</th>
                                <th className="p-4.5 font-bold text-center w-[8%]">Status</th>
                                <th className="p-4.5 font-bold text-center w-[7%]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y uppercase text-[12px] divide-[#e6f0fa]">
                            {loading ? (
                                <TableSkeleton rows={15} cols={11} />
                            ) : filteredPayments.length === 0 ? (
                                <tr>
                                    <td colSpan="11" className="p-8 text-center text-sm text-gray-500">
                                        No payments found.
                                    </td>
                                </tr>
                            ) : filteredPayments.map((payment) => {
                                const rowId = payment.paymentId || payment._id;
                                return (
                                    <tr 
                                        key={payment._id} 
                                        id={`row-${rowId}`} 
                                        onClick={(e) => {
                                            if (isLabelMode) {
                                                e.stopPropagation();
                                                setActiveLabelRowId(prev => prev === payment._id ? null : payment._id);
                                            }
                                        }}
                                        className={`text-center mt-2 transition-all duration-1000 ${
                                            isLabelMode ? 'cursor-pointer hover:bg-blue-50/60' : 'hover:bg-blue-50/30'
                                        } ${highlightedRow === rowId ? 'bg-emerald-100/60 rounded-2xl relative z-20 scale-[1.01]' : ''}`}
                                    >
                                        <td className="p-4 relative font-semibold text-[#052558] text-sm text-center">
                                            <div className="relative flex items-center justify-center w-full">
                                                {Boolean(rowLabels[payment._id]) && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveLabelRowId(prev => prev === payment._id ? null : payment._id);
                                                        }}
                                                        className="absolute -left-1.5 top-1/2 -translate-y-1/2 cursor-pointer hover:scale-115 transition-transform active:scale-95 p-0.5"
                                                        title={`Label: ${stripEmoji(rowLabels[payment._id] || 'Add label')}`}
                                                    >
                                                        {renderLabelIcon(rowLabels[payment._id], 16)}
                                                    </button>
                                                )}

                                                {activeLabelRowId === payment._id && (
                                                    <FloatingLabelSelector 
                                                        rowId={payment._id}
                                                        currentLabel={rowLabels[payment._id]}
                                                        onSaveLabel={handleSaveRowLabel}
                                                        labelPopupRef={labelPopupRef}
                                                        positionClass="-left-4"
                                                    />
                                                )}
                                                <span>{payment.paymentId || payment._id.substring(0, 8).toUpperCase()}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            {payment.type === 'Subscription' ? (
                                                <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-fuchsia-100 text-fuchsia-700">
                                                    Business
                                                </span>
                                            ) : payment.booking ? (
                                                <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${payment.booking.store ? 'bg-purple-100 text-purple-700' : payment.booking.parking ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                                    {payment.booking.store ? 'Store' : payment.booking.parking ? 'Parking' : 'Garage'}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">—</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-block px-3 py-1 text-xs text-center font-semibold rounded-full border border-transparent ${getTypeColor(payment.type)}`}>
                                                {payment.type || 'Booking'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex justify-center items-center">
                                                <span className="font-semibold text-sm text-center">
                                                    {payment.type === 'Booking' ? (payment.booking?.bookingId || '—') : '—'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="font-semibold text-[13px] text-center">{getCustomerName(payment)}</div>
                                            <div className="text-xs text-gray-500 text-center">{payment.user?.userId || ''}</div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-block px-3 py-1 text-xs text-center font-semibold rounded-full border border-transparent ${payment.type === 'Subscription' ? 'bg-orange-100 text-orange-700' : 'bg-cyan-100 text-cyan-700'}`}>
                                                {payment.type === 'Subscription' ? 'Vendor' : 'Customer'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="text-sm font-semibold whitespace-nowrap text-center">
                                                {new Date(payment.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} <br></br> 
                                                {' '}
                                                {new Date(payment.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="text-sm font-semibold text-gray-800 text-center">
                                                ₹{payment.amount}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="text-sm font-semibold whitespace-nowrap text-center">
                                                {payment.method?.toLowerCase().includes('cash on delivery') ? 'COD' : payment.method}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex justify-center items-center">
                                                <span className={`inline-block px-3 py-1 text-xs text-center font-semibold rounded-full border border-transparent ${getStatusColor(payment.status)}`}>
                                                    {payment.status || 'Pending'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex justify-center gap-1.5">
                                                <button
                                                    onClick={() => handleViewDetails(payment)}
                                                    className="text-gray-400 hover:text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition-colors"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDownloadInvoice(payment)}
                                                    className="text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 p-1.5 rounded-lg transition-colors" 
                                                >
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
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#011023]/10 backdrop-blur-sm"
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

                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            {/* Top Row */}
                            <div className="flex flex-col md:flex-row gap-4 w-full">
                                {/* Customer Info */}
                                <div className="space-y-3 w-full md:w-[42%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Customer Info</h4>
                                    <div className="p-4 rounded-xl uppercase space-y-2">
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Name:</span> <span className="font-semibold text-[#011023] truncate">{getCustomerName(selectedPayment)}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">ID:</span> <span className="font-semibold text-gray-800">{selectedPayment.user?.userId || 'N/A'}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Email:</span> <span className="font-semibold text-gray-800 truncate">{selectedPayment.user?.email || 'N/A'}</span></p>
                                    </div>
                                </div>

                                {/* Category */}
                                <div className="space-y-3 w-full md:w-[15%]">
                                    <h4 className="text-sm font-bold text-center text-gray-400 uppercase tracking-wider">Category</h4>
                                    <div className="p-4 rounded-xl uppercase h-[81px] flex items-center justify-center">
                                        {selectedPayment.type === 'Subscription' ? (
                                            <span className="inline-block px-3 py-1 text-xs font-bold rounded-full bg-fuchsia-100 text-fuchsia-700">Business</span>
                                        ) : selectedPayment.booking ? (
                                            <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${selectedPayment.booking.store ? 'bg-purple-100 text-purple-700' : selectedPayment.booking.parking ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                                {selectedPayment.booking.store ? 'Store' : selectedPayment.booking.parking ? 'Parking' : 'Garage'}
                                            </span>
                                        ) : <span className="text-gray-400">—</span>}
                                    </div>
                                </div>

                                {/* Status */}
                                <div className="space-y-3 w-full md:w-[12%]">
                                    <h4 className="text-sm font-bold text-center text-gray-400 uppercase tracking-wider">Status</h4>
                                    <div className="p-4 rounded-xl uppercase h-[81px] flex items-center justify-center">
                                        <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${getStatusColor(selectedPayment.status)}`}>
                                            {selectedPayment.status}
                                        </span>
                                    </div>
                                </div>

                                {/* Method */}
                                <div className="space-y-3 w-full md:w-[16%]">
                                    <h4 className="text-sm font-bold text-center text-gray-400 uppercase tracking-wider">Method</h4>
                                    <div className="p-4 rounded-xl uppercase h-[81px] flex items-center justify-center">
                                        <p className="text-sm font-semibold text-center text-gray-700">
                                            {selectedPayment.method?.toLowerCase().includes('cash on delivery') ? 'COD' : selectedPayment.method}
                                        </p>
                                    </div>
                                </div>

                                {/* Amount */}
                                <div className="space-y-3 w-full md:w-[10%]">
                                    <h4 className="text-sm font-bold text-center text-gray-400 uppercase tracking-wider">Amount</h4>
                                    <div className="p-4 rounded-xl h-[81px] flex items-center justify-center">
                                        <p className="text-base font-bold text-center text-[#011023]">₹{selectedPayment.amount?.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Transaction Details */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Transaction Details</h4>
                                <div className="bg-white border border-[#e6f0fa] p-2 rounded-xl shadow-sm">
                                    <div className="flex gap-4">
                                        <div className="rounded-xl px-4 py-2 flex-[2]">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Transaction ID</p>
                                            <p className="text-sm text-[#011023] font-semibold">{selectedPayment.transactionId || 'N/A'}</p>
                                        </div>
                                        <div className="rounded-xl px-4 py-2 flex-[1]">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Payment ID</p>
                                            <p className="text-sm text-[#011023] font-semibold">{selectedPayment.paymentId || 'N/A'}</p>
                                        </div>
                                        <div className="rounded-xl px-4 py-2 flex-[1]">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Booking ID</p>
                                            <p className="text-sm text-[#011023] font-semibold">{selectedPayment.type === 'Booking' ? (selectedPayment.booking?.bookingId || '—') : '—'}</p>
                                        </div>
                                        <div className="rounded-xl px-4 py-2 flex-[2]">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Paid At</p>
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
