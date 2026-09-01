import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Eye, Download, X, Search, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import useHighlight from '../hooks/useHighlight';
import { TableSkeleton } from '../components/Skeleton';
import { useFilter } from '../context/FilterContext';
import { useAlert } from '../context/AlertContext';
import { useRowLabels, FloatingLabelSelector, renderLabelIcon, stripEmoji, LABEL_FILTER_GROUP } from '../components/RowLabel';

const Payments = () => {
    const { triggerAlert } = useAlert();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [lastRefreshed, setLastRefreshed] = useState(null);

    // Filter & Sort states
    const [methodFilter, setMethodFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [labelFilter, setLabelFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState('latest');
    const [timeRange, setTimeRange] = useState('all');

    const { setFilterConfig, setResultsCount } = useFilter();
    const { rowLabels, activeLabelRowId, setActiveLabelRowId, handleSaveRowLabel, labelPopupRef, isLabelMode } = useRowLabels('garage_payments_row_labels');

    const getItemDate = (item) => {
        if (!item) return null;
        const fields = [
            item.createdAt,
            item.bookingDate,
            item.date,
            item.timestamp,
            item.startDate,
            item.appliedDate,
            item.scheduledAt,
            item.updatedAt
        ];
        for (const f of fields) {
            if (!f) continue;
            if (f instanceof Date && !isNaN(f.getTime())) return f;
            if (typeof f === 'number') {
                const d = new Date(f);
                if (!isNaN(d.getTime())) return d;
            }
            if (typeof f === 'string') {
                const trimmed = f.trim();
                const ddmmyyyy = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
                if (ddmmyyyy) {
                    const day = parseInt(ddmmyyyy[1], 10);
                    const month = parseInt(ddmmyyyy[2], 10) - 1;
                    const year = parseInt(ddmmyyyy[3], 10);
                    const d = new Date(year, month, day);
                    if (!isNaN(d.getTime())) return d;
                }
                const d = new Date(trimmed);
                if (!isNaN(d.getTime())) return d;
            }
        }
        if (typeof item._id === 'string' && item._id.length === 24 && /^[a-f\d]{24}$/i.test(item._id)) {
            const timestamp = parseInt(item._id.substring(0, 8), 16) * 1000;
            const d = new Date(timestamp);
            if (!isNaN(d.getTime())) return d;
        }
        return null;
    };

    // Register filter options with the floating filter button
    useEffect(() => {
        setFilterConfig({
            title: 'Filter Payments',
            hasSort: true,
            groups: [
                LABEL_FILTER_GROUP,
                {
                    id: 'method',
                    label: 'Method',
                    defaultValue: 'all',
                    options: [
                        { label: 'All', value: 'all' },
                        { label: 'COD', value: 'COD' },
                        { label: 'Net Banking', value: 'Net Banking' },
                    ]
                },
                {
                    id: 'status',
                    label: 'Status',
                    defaultValue: 'all',
                    options: [
                        { label: 'All', value: 'all' },
                        { label: 'Completed', value: 'Completed' },
                        { label: 'Pending', value: 'Pending' },
                        { label: 'Partially Paid', value: 'Partially Paid' }
                    ]
                }
            ],
            initialValues: {
                method: 'all',
                status: 'all',
                label: 'all',
                sortOrder: 'latest',
                timeRange: 'all'
            },
            onChange: (newValues) => {
                if (newValues.method !== undefined) setMethodFilter(newValues.method);
                if (newValues.status !== undefined) setStatusFilter(newValues.status);
                if (newValues.label !== undefined) setLabelFilter(newValues.label);
                if (newValues.sortOrder !== undefined) setSortOrder(newValues.sortOrder);
                if (newValues.timeRange !== undefined) setTimeRange(newValues.timeRange);
            },
            onReset: () => {
                setMethodFilter('all');
                setStatusFilter('all');
                setLabelFilter('all');
                setSortOrder('latest');
                setTimeRange('all');
            }
        });

        return () => {
            setFilterConfig(null);
            setResultsCount(null);
        };
    }, [setFilterConfig, setResultsCount]);

    const filteredPayments = React.useMemo(() => {
        let filtered = payments.filter((p) => {
            if (labelFilter && labelFilter !== 'all') {
                const itemLabel = rowLabels[p._id];
                if (!itemLabel || itemLabel.toUpperCase() !== labelFilter.toUpperCase()) return false;
            }
            if (methodFilter && methodFilter !== 'all') {
                const methodStr = (p.method || '').toLowerCase();
                const targetMethod = methodFilter.toLowerCase();
                if (targetMethod === 'cod') {
                    if (!methodStr.includes('cash on delivery') && !methodStr.includes('cod')) return false;
                } else {
                    if (!methodStr.includes(targetMethod)) return false;
                }
            }
            if (statusFilter && statusFilter !== 'all') {
                const statusStr = (p.status || '').trim().toLowerCase();
                if (statusStr !== statusFilter.trim().toLowerCase()) return false;
            }
            if (timeRange && timeRange !== 'all') {
                const itemDate = getItemDate(p);
                if (itemDate) {
                    const now = new Date();
                    let cutoff;
                    if (timeRange === 'week') {
                        cutoff = new Date();
                        cutoff.setDate(now.getDate() - 7);
                    } else if (timeRange === 'month') {
                        cutoff = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    }
                    if (cutoff) {
                        cutoff.setHours(0, 0, 0, 0);
                        if (itemDate < cutoff) return false;
                    }
                }
            }
            return true;
        });

        return filtered.sort((a, b) => {
            const dateA = getItemDate(a)?.getTime() || 0;
            const dateB = getItemDate(b)?.getTime() || 0;
            if (sortOrder === 'oldest') {
                return dateA - dateB;
            }
            return dateB - dateA;
        });
    }, [payments, methodFilter, statusFilter, labelFilter, rowLabels, sortOrder, timeRange]);

    useEffect(() => {
        if (setResultsCount) {
            setResultsCount(filteredPayments.length);
        }
    }, [filteredPayments.length, setResultsCount]);

    const highlightedRow = useHighlight(filteredPayments);

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
            triggerAlert("Invoice downloaded successfully", "success");
        } catch (err) {
            console.error("Error generating PDF:", err);
            triggerAlert("Failed to generate invoice.", "error");
        }
    };

    const getCustomerName = (payment) => {
        if (payment.type === 'Subscription') {
            return payment.business?.businessName || payment.user?.name || 'Unknown Vendor';
        }
        return payment.user?.name || 'Unknown';
    };

    // Derived states for stats
    const _totalRevenue = React.useMemo(() => {
        return filteredPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
    }, [filteredPayments]);

    const _inflowThisMonth = React.useMemo(() => {
        return filteredPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
    }, [filteredPayments]);

    const _expensesThisMonth = React.useMemo(() => {
        return filteredPayments.reduce((acc, p) => acc + (p.expenses || 0), 0);
    }, [filteredPayments]);

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto h-[calc(100vh-9rem)] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold uppercase text-[#011023] tracking-tight">Payments</h1>
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
                                <th className="px-6 py-4.5 font-bold text-center w-[9%]">Payment ID</th>
                                <th className="px-6 py-4.5 font-bold text-center w-[9%]">Booking ID</th>
                                <th className="px-6 py-4.5 font-bold text-center w-[12%]">User</th>
                                <th className="px-6 py-4.5 font-bold text-center w-[10%]">User ID</th>
                                {/* <th className="px-6 py-4.5 font-bold text-center w-[9%]">User Type</th> */}
                                {/* <th className="px-6 py-4.5 font-bold text-center w-[14%]">Details</th> */}
                                <th className="px-6 py-4.5 font-bold text-center w-[14%]">Paid At</th>
                                <th className="px-6 py-4.5 font-bold text-center w-[7%]">Amount</th>
                                <th className="px-6 py-4.5 font-bold text-center w-[9.5%]">Method</th>
                                <th className="px-6 py-4.5 font-bold text-center w-[9%]">Status</th>
                                <th className="px-6 py-4.5 font-bold text-center w-[7%]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y uppercase text-[12px] divide-[#e6f0fa]">
                            {loading ? (
                                <TableSkeleton rows={15} cols={9} />
                            ) : filteredPayments.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="p-8 text-center text-sm text-gray-500">
                                        No payment records found.
                                    </td>
                                </tr>
                            ) : filteredPayments.map((payment, index) => {
                                const rowId = payment.paymentId || payment._id;
                                return (
                                    <tr 
                                        key={payment._id} 
                                        id={`row-${rowId}`}
                                        onClick={() => {
                                            if (isLabelMode) {
                                                setActiveLabelRowId(prev => prev === payment._id ? null : payment._id);
                                            }
                                        }}
                                        className={`text-center cursor-pointer transition-all duration-1000 ${
                                            activeLabelRowId === payment._id
                                                ? 'relative z-40 bg-blue-50/50'
                                                : highlightedRow === rowId 
                                                ? 'bg-emerald-100/60 rounded-2xl relative z-20 scale-[1.01]' 
                                                : 'hover:bg-blue-50/30'
                                        }`}
                                    >
                                        <td className="p-3.5 font-semibold text-[#052558] text-sm text-center w-[12%] relative">
                                            <div className="relative flex items-center justify-center w-full">
                                                {Boolean(rowLabels[payment._id]) && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveLabelRowId(prev => prev === payment._id ? null : payment._id);
                                                        }}
                                                        className="absolute -left-0.75 top-1/2 -translate-y-1/2 cursor-pointer hover:scale-115 transition-transform active:scale-95 p-0.5"
                                                        title={`Label: ${stripEmoji(rowLabels[payment._id])}`}
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
                                                        topClass={index === 0 ? "top-6" : "-top-8"}
                                                        positionClass="-left-3"
                                                    />
                                                )}
                                                <span className="truncate">{payment.paymentId || payment._id.substring(0, 8).toUpperCase()}</span>
                                            </div>
                                        </td>
                                        <td className="p-3.5 text-center w-[10%]">
                                            <span className="font-semibold text-[#052558] text-sm">
                                                {payment.type === 'Booking' ? (payment.booking?.bookingId || '—') : '—'}
                                            </span>
                                        </td>
                                        <td className="p-3.5 text-center w-[12%]">
                                            <div className="font-semibold text-sm text-[#011023]">{getCustomerName(payment)}</div>
                                        </td>
                                        <td className="p-3.5 text-center w-[10%]">
                                            <div className="text-sm font-semibold uppercase">{payment.user?.userId || '—'}</div>
                                        </td>
                                        <td className="p-3.5 text-center w-[14%]">
                                            <span className="text-sm font-semibold whitespace-nowrap">
                                                {new Date(payment.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | 
                                                {' '}
                                                {new Date(payment.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                            </span>
                                        </td>
                                        <td className="p-3.5 text-center w-[7%]">
                                            <span className="text-sm font-bold text-gray-800">
                                                ₹{payment.amount?.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="p-3.5 text-center w-[9.5%]">
                                            <span className="text-sm font-semibold whitespace-nowrap">
                                                {payment.method?.toLowerCase().includes('cash on delivery') ? 'COD' : payment.method}
                                            </span>
                                        </td>
                                        <td className="p-3.5 text-center w-[9%]">
                                            <span className={`inline-block px-3 py-1 text-xs text-center font-semibold rounded-full border border-transparent ${getStatusColor(payment.status)}`}>
                                                {payment.status || 'Pending'}
                                            </span>
                                        </td>
                                        <td className="p-3.5 text-center w-[7%]">
                                            <div className="flex justify-center gap-4">
                                                <button onClick={() => handleViewDetails(payment)} className="text-gray-400 hover:text-blue-600 transition-colors">
                                                    <Eye size={18} />
                                                </button>
                                                <button onClick={() => handleDownloadInvoice(payment)} className="text-gray-400 hover:text-emerald-600 transition-colors">
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
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#011023]/10 backdrop-blur-sm"
                    onClick={() => setIsViewModalOpen(false)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
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
                            <div className="flex flex-col md:flex-row gap-6 w-full">
                                <div className="space-y-3 w-full md:w-[42%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Customer Info</h4>
                                    <div className="pt-4 pb-2 rounded-xl uppercase space-y-2">
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Name:</span> <span className="font-semibold text-[#011023] truncate">{getCustomerName(selectedPayment)}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">ID:</span> <span className="font-semibold text-gray-800 ">{selectedPayment.user?.userId || 'N/A'}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Email:</span> <span className="font-semibold text-gray-800 truncate ">{selectedPayment.user?.email || 'N/A'}</span></p>
                                    </div>
                                </div>

                                <div className="space-y-3 w-full md:w-[15%]">
                                    <h4 className="text-sm font-bold text-center text-gray-400 uppercase tracking-wider">Amount</h4>
                                    <div className="p-4 rounded-xl h-[81px] flex items-center justify-center">
                                        <p className="text-lg font-semibold text-center text-[#011023]">₹{selectedPayment.amount?.toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="space-y-3 w-full md:w-[20%]">
                                    <h4 className="text-sm text-center font-bold text-gray-400 uppercase tracking-wider">Method</h4>
                                    <div className="p-4 text-center rounded-xl uppercase h-[81px] flex items-center justify-center">
                                        <p className="text-sm font-semibold text-center text-gray-700">{selectedPayment.method?.toLowerCase().includes('cash on delivery') ? 'COD' : selectedPayment.method}</p>
                                    </div>
                                </div>

                                <div className="space-y-3 w-full md:w-[20%]">
                                    <h4 className="text-sm font-bold text-center text-gray-400 uppercase tracking-wider">Status</h4>
                                    <div className="p-4 rounded-xl uppercase h-[81px] flex items-center justify-center">
                                        <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full border border-transparent ${getStatusColor(selectedPayment.status)}`}>
                                            {selectedPayment.status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Transaction Details */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Transaction Details</h4>
                                <div className="">
                                    <div className="flex gap-4">
                                        <div className="rounded-xl px- py-2 flex-[2]">
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
