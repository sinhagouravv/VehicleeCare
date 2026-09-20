import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Eye, X, Search, Trash2, Loader2, Download, MessageSquare, Check, Send } from 'lucide-react';
import { jsPDF } from 'jspdf';
import useHighlight from '../hooks/useHighlight';
import { TableSkeleton, SkeletonBlock } from '../components/Skeleton';
import { useFilter } from '../context/FilterContext';
import { useRowLabels, FloatingLabelSelector, renderLabelIcon, stripEmoji, LABEL_FILTER_GROUP } from '../components/RowLabel';
import useGuestGuard from '../hooks/useGuestGuard';
import { useAlert } from '../context/AlertContext';
import API_BASE_URL from '../config/api';

// Module-level cache for instant 0ms page revisits
let cachedCustomers = null;
let cachedGarageId = null;
let cachedTimestamp = 0;

const getFuelBadgeClass = (v) => {
    const ft = (v?.fuelType || v?.fuel || '').toLowerCase();
    const lbl = (v?.label || v?.make || '').toLowerCase();

    const isEV = ft.includes('ev') || ft.includes('electric') || lbl.includes(' ev') || lbl.includes('ioniq') || lbl.endsWith(' ev6') || lbl.endsWith(' ev3') || lbl.includes('nexon ev') || lbl.includes('tigor ev') || lbl.includes('tiago ev') || lbl.includes('zs ev') || lbl.includes('e-tron') || lbl.includes('taycan') || lbl.includes('i4') || lbl.includes('ix');
    if (isEV) return 'bg-emerald-50 text-emerald-700 border-emerald-200';

    const isDiesel = ft.includes('diesel') || lbl.includes('diesel') || lbl.includes('tdci') || lbl.includes('crdi') || lbl.includes('ddis') || lbl.includes('mhawk') || lbl.includes('dci') || lbl.includes('tdi');
    if (isDiesel) return 'bg-orange-50 text-orange-700 border-orange-200';

    const isCNG = ft.includes('cng') || lbl.includes('cng');
    if (isCNG) return 'bg-purple-50 text-purple-700 border-purple-200';

    const isHybrid = ft.includes('hybrid') || lbl.includes('hybrid');
    if (isHybrid) return 'bg-teal-50 text-teal-700 border-teal-200';

    return 'bg-blue-50 text-blue-700 border-blue-200';
};

const Customers = () => {
    const outletContext = useOutletContext();
    const isSidebarCollapsed = outletContext?.isSidebarCollapsed ?? true;
    const { isGuest, guardGuestAction, maskEmail, maskPhone, isRealValue } = useGuestGuard();
    const { triggerAlert } = useAlert();
    const [lastRefreshed, setLastRefreshed] = useState(() => cachedTimestamp ? new Date(cachedTimestamp) : null);
    const [customers, setCustomers] = useState(() => {
        try {
            const storedUser = localStorage.getItem('garageUser');
            if (storedUser) {
                const user = JSON.parse(storedUser);
                const garageId = user.garageId || user.id;
                if (cachedGarageId === garageId && Array.isArray(cachedCustomers)) {
                    return cachedCustomers;
                }
            }
        } catch (e) {}
        return [];
    });
    const [filteredCustomers, setFilteredCustomers] = useState(() => {
        try {
            const storedUser = localStorage.getItem('garageUser');
            if (storedUser) {
                const user = JSON.parse(storedUser);
                const garageId = user.garageId || user.id;
                if (cachedGarageId === garageId && Array.isArray(cachedCustomers)) {
                    return cachedCustomers;
                }
            }
        } catch (e) {}
        return [];
    });
    const [loading, setLoading] = useState(() => {
        try {
            const storedUser = localStorage.getItem('garageUser');
            if (storedUser) {
                const user = JSON.parse(storedUser);
                const garageId = user.garageId || user.id;
                if (cachedGarageId === garageId && Array.isArray(cachedCustomers)) {
                    return false;
                }
            }
        } catch (e) {}
        return true;
    });
    const [searchQuery, _setSearchQuery] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const isFetchingRef = useRef(false);

    // Remark states
    const [isRemarkModalOpen, setIsRemarkModalOpen] = useState(false);
    const [selectedRemarkCustomer, setSelectedRemarkCustomer] = useState(null);
    const [remarkText, setRemarkText] = useState('');
    const [isSubmittingRemark, setIsSubmittingRemark] = useState(false);
    
    // Row label and Filter states
    const [labelFilter, setLabelFilter] = useState('all');
    const { setFilterConfig, setResultsCount } = useFilter();
    const { rowLabels, activeLabelRowId, setActiveLabelRowId, handleSaveRowLabel, labelPopupRef, isLabelMode } = useRowLabels('garage_customers_row_labels');

    const highlightedRow = useHighlight(filteredCustomers);

    useEffect(() => {
        setFilterConfig({
            title: 'Filter Customers',
            groups: [
                LABEL_FILTER_GROUP
            ],
            initialValues: {
                label: 'all'
            },
            onChange: (newValues) => {
                if (newValues.label !== undefined) setLabelFilter(newValues.label);
            },
            onReset: () => {
                setLabelFilter('all');
            }
        });

        return () => {
            setFilterConfig(null);
            setResultsCount(null);
        };
    }, [setFilterConfig, setResultsCount]);

    const fetchCustomers = useCallback(async (silent = false) => {
        // Prevent concurrent duplicate requests
        if (isFetchingRef.current) return;
        isFetchingRef.current = true;
        try {
            const storedUser = localStorage.getItem('garageUser');
            if (!storedUser) return;
            const user = JSON.parse(storedUser);
            const garageId = user.garageId || user.id;
            if (!garageId) return;

            if (!silent && (!cachedCustomers || cachedCustomers.length === 0)) {
                setLoading(true);
            }

            const res = await fetch(`${API_BASE_URL}/api/bookings/garage/${garageId}`);
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

                // Update module-level cache
                cachedCustomers = formattedCustomers;
                cachedGarageId = garageId;
                cachedTimestamp = Date.now();

                setCustomers(formattedCustomers);
                setLastRefreshed(new Date());
            }
        } catch (error) {
            console.error('Failed to fetch garage customers', error);
        } finally {
            isFetchingRef.current = false;
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCustomers();

        // Guest mode: never run polling loop — data is read-only
        if (isGuest) return;

        // Normal mode: poll every 30s (not 5s), with in-flight guard
        const timer = setInterval(() => fetchCustomers(true), 30000);
        return () => clearInterval(timer);
    }, [fetchCustomers, isGuest]);

    useEffect(() => {
        const q = searchQuery.toLowerCase();
        const filtered = customers.filter(c => {
            const rowId = c.userId || c.id;
            if (labelFilter && labelFilter !== 'all') {
                const itemLabel = rowLabels[rowId];
                if (!itemLabel || itemLabel.toUpperCase() !== labelFilter.toUpperCase()) return false;
            }
            return (
                c.name.toLowerCase().includes(q) ||
                c.email.toLowerCase().includes(q) ||
                c.phone.toLowerCase().includes(q) ||
                (c.userId || '').toLowerCase().includes(q)
            );
        });
        setFilteredCustomers(filtered);
        if (setResultsCount) setResultsCount(filtered.length);
    }, [searchQuery, customers, labelFilter, rowLabels, setResultsCount]);

    const handleViewDetails = (customer) => {
        setSelectedCustomer(customer);
        setIsViewModalOpen(true);
    };

    const handleDownloadCustomer = (customer) => {
        if (guardGuestAction()) return;
        try {
            const doc = new jsPDF();
            const primaryColor = [5, 37, 88];
            const textColor = [100, 100, 100];

            doc.setFontSize(20);
            doc.setTextColor(...primaryColor);
            doc.text("VehicleeCare - Customer Details", 105, 20, null, null, "center");

            doc.setFontSize(11);
            doc.setTextColor(...textColor);
            doc.text(`Customer ID: ${customer.userId || '—'}`, 14, 38);
            doc.text(`Customer Name: ${customer.name || 'Unknown'}`, 14, 45);
            doc.text(`Email: ${customer.email || '—'}`, 14, 52);
            doc.text(`Phone: ${customer.phone || '—'}`, 14, 59);

            doc.text(`Total Orders: ${customer.totalOrders || 0}`, 14, 72);
            doc.text(`Total Spent: Rs. ${customer.totalSpent || 0}`, 14, 79);
            doc.text(`Last Visit: ${customer.lastVisit || '—'}`, 14, 86);

            if (customer.vehicles && customer.vehicles.length > 0) {
                doc.setFontSize(14);
                doc.setTextColor(...primaryColor);
                doc.text("Vehicles", 14, 101);
                doc.setFontSize(11);
                doc.setTextColor(...textColor);
                customer.vehicles.forEach((v, idx) => {
                    const vText = `${idx + 1}. ${v.label || v.make || ''} ${v.model || ''} (${v.number || v.regNumber || 'N/A'}) - ${v.fuelType || 'N/A'}`;
                    doc.text(vText, 14, 109 + (idx * 7));
                });
            }

            doc.save(`Customer_${customer.userId || 'Details'}.pdf`);
        } catch (err) {
            console.error("Failed to generate PDF", err);
        }
    };

    const _handleDeleteClick = (customer) => {
        if (guardGuestAction()) return;
        setCustomerToDelete(customer);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (guardGuestAction()) return;
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

    const handleOpenRemarkModal = (customer) => {
        setSelectedRemarkCustomer(customer);
        setRemarkText(customer.garageRemark || customer.employeeRemark || customer.remark || '');
        setIsRemarkModalOpen(true);
    };

    const handleRemarkSubmit = async (e) => {
        e.preventDefault();
        if (guardGuestAction()) return;
        if (!selectedRemarkCustomer) return;
        if (!remarkText || !remarkText.trim()) {
            triggerAlert('Please fill out all the required field', 'error');
            return;
        }
        setIsSubmittingRemark(true);
        try {
            let garageName = 'Garage';
            let garageId = 'GARAGE';
            let garageRole = 'Garage Owner';
            const storedGarage = localStorage.getItem('garageUser');
            if (storedGarage) {
                try {
                    const u = JSON.parse(storedGarage);
                    garageName = u.name || u.garageName || garageName;
                    garageId = u.garageId || u.userId || u._id || garageId;
                    garageRole = u.role || garageRole;
                } catch (_) {}
            }

            const refId = selectedRemarkCustomer.userId || selectedRemarkCustomer.id || 'CUSTOMER';
            const targetId = selectedRemarkCustomer.name || '—';
            const targetRole = 'Customer';

            const remarkRes = await fetch(`${API_BASE_URL}/api/remarks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    referenceId: refId,
                    bookingId: refId,
                    bookingMongoId: selectedRemarkCustomer.id,
                    reporterId: garageId,
                    reporterName: garageName,
                    remarkerRole: garageRole,
                    remarkedRole: targetRole,
                    role: targetRole,
                    customerDetails: targetId,
                    remark: remarkText,
                    status: 'Active'
                })
            });
            const remarkData = await remarkRes.json();
            const createdRemarkId = remarkData.data?.remarkId;

            setCustomers(prev => prev.map(c => (c.id === selectedRemarkCustomer.id || c.userId === selectedRemarkCustomer.userId) ? { ...c, garageRemark: remarkText, remarkId: createdRemarkId } : c));
            setFilteredCustomers(prev => prev.map(c => (c.id === selectedRemarkCustomer.id || c.userId === selectedRemarkCustomer.userId) ? { ...c, garageRemark: remarkText, remarkId: createdRemarkId } : c));
            triggerAlert('Remark submitted successfully!', 'success');
        } catch (err) {
            console.error('[Customers] Error submitting remark:', err);
            triggerAlert('Failed to submit remark.', 'error');
        } finally {
            setIsSubmittingRemark(false);
            setIsRemarkModalOpen(false);
            setSelectedRemarkCustomer(null);
            setRemarkText('');
        }
    };

    return (
        <div className={`space-y-6 ${isSidebarCollapsed ? 'max-w-[92rem]' : 'max-w-[81.75rem]'} mx-auto h-[calc(100vh-9.25rem)] flex flex-col transition-all duration-300`}>
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold uppercase text-[#011023] tracking-tight">Customers</h1>
                <div className="flex items-center gap-2 text-xs uppercase text-gray-400 font-medium self-center">
                    {!lastRefreshed ? (
                        <SkeletonBlock className="h-4 w-64 bg-slate-200/80 rounded-md" />
                    ) : (
                        `Last refreshed | ${lastRefreshed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | ${lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`
                    )}
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-white border border-[#e9f2fb] rounded-2xl shadow-[0_1px_2.5px_0_rgba(0,0,0,0.07)] flex-1 min-h-0 overflow-hidden flex flex-col">
                <div className="overflow-x-hidden overflow-y-auto text-center flex-1 relative hide-scrollbar">
                    <table className="w-full text-center border-collapse table-fixed">
                        <thead className="sticky top-0 z-10 shadow-sm">
                            <tr className="bg-[#f0f6ff] text-[15px] uppercase text-center tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                <th className="p-4.5 font-bold text-center w-[10.5%]">Customer ID</th>
                                <th className="p-4.5 font-bold text-center w-[11%]">Customer</th>
                                <th className="p-4.5 font-bold text-center w-[16%]">Contact</th>
                                <th className={`p-4.5 font-bold text-center transition-all duration-300 ${isSidebarCollapsed ? 'w-[34%]' : 'w-[24%]'}`}>Vehicle</th>
                                <th className="p-4.5 font-bold text-center w-[8%]">Amount</th>
                                <th className="p-4.5 font-bold text-center w-[8.5%]">Last Visit</th>
                                <th className="p-4.5 font-bold text-center w-[8.5%]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y uppercase text-[12px] divide-[#e6f0fa]">
                            {loading ? (
                                <TableSkeleton rows={15} cols={7} />
                            ) : filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-sm text-gray-500">No customers found.</td>
                                </tr>
                            ) : filteredCustomers.map((customer) => {
                                const rowId = customer.userId || customer.id;
                                return (
                                    <tr 
                                        key={customer.id} 
                                        id={`row-${rowId}`}
                                        onClick={() => {
                                            if (isLabelMode) {
                                                setActiveLabelRowId(prev => prev === rowId ? null : rowId);
                                            }
                                        }}
                                        className={`text-center cursor-pointer transition-all duration-1000 ${
                                            activeLabelRowId === rowId
                                                ? 'relative z-40 bg-blue-50/50'
                                                : highlightedRow === rowId 
                                                ? 'bg-emerald-100/60 rounded-2xl relative z-20 scale-[1.01]' 
                                                : 'hover:bg-blue-50/30'
                                        }`}
                                    >
                                    {/* Customer ID */}
                                    <td className="p-4 text-center w-[11%] relative font-semibold text-[#052558] text-sm">
                                        <div className="relative flex items-center justify-center w-full">
                                            {Boolean(rowLabels[rowId]) && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveLabelRowId(prev => prev === rowId ? null : rowId);
                                                    }}
                                                    className="absolute -left-1.5 top-1/2 -translate-y-1/2 cursor-pointer hover:scale-115 transition-transform active:scale-95 p-0.5"
                                                >
                                                    {renderLabelIcon(rowLabels[rowId], 16)}
                                                </button>
                                            )}

                                            {activeLabelRowId === rowId && (
                                                <FloatingLabelSelector 
                                                    rowId={rowId}
                                                    currentLabel={rowLabels[rowId]}
                                                    onSaveLabel={handleSaveRowLabel}
                                                    labelPopupRef={labelPopupRef}
                                                    topClass="-top-10"
                                                    positionClass="-left-4"
                                                />
                                            )}
                                            <span className="truncate">{customer.userId || customer.id?.substring(0, 10).toUpperCase()}</span>
                                        </div>
                                    </td>

                                    {/* Customer */}
                                    <td className="p-4 text-center w-[12%]">
                                        <div className="flex items-center justify-center gap-2">
                                            <span className="font-semibold text-sm text-[#011023] truncate">
                                                {customer.name}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Contact */}
                                    <td className="p-4 text-center w-[16%]">
                                        <div className={`font-medium text-[#052558] text-sm lowercase ${isGuest && isRealValue(customer.email) ? 'blur-sm select-none pointer-events-none' : ''}`}>{maskEmail(customer.email)}</div>
                                        <div className={`text-xs text-gray-500 mt-0.5 ${isGuest && isRealValue(customer.phone) ? 'blur-sm select-none pointer-events-none' : ''}`}>{maskPhone(customer.phone)}</div>
                                    </td>

                                    {/* Vehicle */}
                                    <td className="p-4 text-center w-[36%]">
                                        <div className="flex flex-wrap justify-center gap-1.5 max-h-[58px] overflow-hidden">
                                            {customer.vehicleObjects && customer.vehicleObjects.length > 0
                                                ? customer.vehicleObjects.map((v, i) => (
                                                    <span key={i} className={`px-2.5 py-1 text-xs font-semibold border rounded-full whitespace-nowrap ${getFuelBadgeClass(v)}`}>
                                                        {v.label}
                                                    </span>
                                                ))
                                                : <span className="text-sm text-gray-400">—</span>
                                            }
                                        </div>
                                    </td>

                                    {/* Amount */}
                                    <td className="p-4 text-center w-[9%]">
                                        <span className="text-sm font-semibold text-[#011023]">
                                            ₹{customer.totalSpent.toLocaleString()}
                                        </span>
                                    </td>

                                    {/* Last Visit */}
                                    <td className="p-4 text-center">
                                        <span className="text-sm font-semibold text-[#052558]">{customer.lastVisit}</span>
                                    </td>

                                    {/* Actions */}
                                    <td className="p-4 text-center w-[8%]">
                                        <div className="flex items-center justify-center gap-3.5">
                                            <button
                                                onClick={() => handleViewDetails(customer)}
                                                className="text-gray-400 hover:text-blue-500 transition-colors"
                                                title="View Customer Details"
                                            >
                                                <Eye size={17} />
                                            </button>
                                            <button
                                                onClick={() => handleDownloadCustomer(customer)}
                                                className="text-gray-400 hover:text-emerald-500 transition-colors"
                                                title="Download Customer Details"
                                            >
                                                <Download size={17} />
                                            </button>
                                            <button
                                                onClick={() => handleOpenRemarkModal(customer)}
                                                className="text-gray-400 hover:text-purple-500 transition-colors"
                                                title="Remarks"
                                            >
                                                <MessageSquare size={17} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* View Details Modal */}
            {isViewModalOpen && selectedCustomer && createPortal(
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#011023]/10 backdrop-blur-sm"
                    onClick={() => setIsViewModalOpen(false)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]"
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
                                    <div className="pt-4 rounded-xl uppercase space-y-2 border border-blue-50">
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Email:</span> <span className={`font-semibold text-gray-800 truncate ${isGuest && isRealValue(selectedCustomer.email) ? 'blur-sm select-none pointer-events-none' : ''}`}>{maskEmail(selectedCustomer.email)}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Phone:</span> <span className={`font-semibold text-gray-800 ${isGuest && isRealValue(selectedCustomer.phone) ? 'blur-sm select-none pointer-events-none' : ''}`}>{maskPhone(selectedCustomer.phone)}</span></p>
                                    </div>
                                </div>

                                {/* Total Booking */}
                                <div className="space-y-2 w-[18%]">
                                    <h4 className="text-sm font-bold text-center text-gray-400 uppercase tracking-wider">Total Booking</h4>
                                    <div className="p-4 rounded-xl border border-blue-50 h-[76px] flex items-center justify-center">
                                        <p className="text-lg font-semibold text-[#011023]">{selectedCustomer.bookingCount}</p>
                                    </div>
                                </div>

                                {/* Total Spent */}
                                <div className="space-y-2 w-[20%]">
                                    <h4 className="text-sm font-bold text-center text-gray-400 uppercase tracking-wider">Total Spent</h4>
                                    <div className="p-4 rounded-xl border border-blue-50 h-[76px] flex items-center justify-center">
                                        <p className="text-lg font-semibold text-[#011023]">₹{selectedCustomer.totalSpent.toLocaleString()}</p>
                                    </div>
                                </div>

                                {/* Last Visit */}
                                <div className="space-y-2 w-[18%]">
                                    <h4 className="text-sm font-bold text-center text-gray-400 uppercase tracking-wider">Last Visit</h4>
                                    <div className="p-4 rounded-xl border border-blue-50 h-[76px] flex items-center justify-center">
                                        <p className="text-lg font-semibold text-center uppercase text-[#011023]">{selectedCustomer.lastVisit}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Vehicle & Bookings */}
                            <div className="flex gap-4">
                                <div className="w-full space-y-2">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Vehicles</h4>
                                    <div className="pt-2 rounded-xl">
                                        <div className="flex flex-wrap uppercase gap-2.5">
                                            {selectedCustomer.vehicleObjects && selectedCustomer.vehicleObjects.length > 0
                                                ? (() => {
                                                    const hasManyVehicles = selectedCustomer.vehicleObjects.length > 5;
                                                    return selectedCustomer.vehicleObjects.map((v, i) => (
                                                        <span 
                                                            key={i} 
                                                            className={`flex items-center justify-center text-center px-3.5 py-1.5 text-[12px] font-bold border rounded-full whitespace-nowrap min-w-max ${hasManyVehicles ? 'flex-1 max-w-[280px]' : 'flex-none'} ${getFuelBadgeClass(v)}`}
                                                        >
                                                            {v.label}
                                                        </span>
                                                    ));
                                                })()
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
                    <div className="absolute inset-0 bg-[#011023]/10 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)} />
                    <div className="relative w-full max-w-xl bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-white/50 animate-in fade-in zoom-in duration-200">
                        <div className="p-2 mt-7 mb-1 border-b border-gray-100/50 flex items-center justify-between bg-red-50/50 text-center flex-col gap-4">
                            <div>
                                <h3 className="text-2xl uppercase font-bold text-[#011023]">Remove Customer</h3>
                            </div>
                        </div>

                        <div className="p-5 text-center uppercase tracking-tight">
                            <h4 className="font-bold text-[#011023] mb-5">{customerToDelete.name}</h4>
                            <p className="text-gray-500 text-xs leading-relaxed">
                                Are you sure you want to permanently delete this customer from your <br /> directory. This action <span className="text-rose-600 font-bold uppercase">cannot be undone</span>.
                            </p>
                        </div>

                        <div className="p-2 bg-gray-50/80 border-t border-gray-100 grid grid-cols-2 gap-3 pb-8 px-8">
                            <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-3.5 bg-white border border-gray-200 text-gray-400 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-white hover:text-gray-600 transition-all shadow-sm active:scale-95">CANCEL</button>
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="px-4 py-3.5 bg-rose-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-0"
                                >
                                {deleting ? <><Loader2 size={16} className="animate-spin" /> REMOVING...</> : 'REMOVE'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {isRemarkModalOpen && selectedRemarkCustomer && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#011023]/10 backdrop-blur-sm" onClick={() => { setIsRemarkModalOpen(false); setSelectedRemarkCustomer(null); setRemarkText(''); }} />
                    <div className="bg-white border border-[#cbd5e1] rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden relative z-10 p-6 space-y-6 animate-in zoom-in duration-200">
                        {/* Form Header */}
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                            <div className="flex flex-col items-start text-left">
                                <h3 className="text-xl font-bold text-[#011023] uppercase tracking-wide flex items-center gap-2">
                                    Customer Remark
                                </h3>
                                {selectedRemarkCustomer.remarkId && (
                                    <p className="flex items-center text-sm uppercase gap-2 mt-0.5">
                                        ID: <span className="text-sm font-semibold text-gray-700 uppercase">{selectedRemarkCustomer.remarkId}</span>
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => { setIsRemarkModalOpen(false); setSelectedRemarkCustomer(null); setRemarkText(''); }}
                                className="text-gray-400 hover:text-[#011023] hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Customer Info Header Details */}
                        <div className="flex w-full items-center justify-between gap-4">
                            <div className="flex flex-col items-start justify-center text-left">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Customer ID</p>
                                <p className="text-sm font-semibold text-[#011023] uppercase">{selectedRemarkCustomer.userId || selectedRemarkCustomer.id?.substring(0, 10)}</p>
                            </div>
                            <div className="flex flex-col items-center justify-center text-center">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Role</p>
                                <p className="text-sm font-semibold text-gray-800 uppercase">
                                    Customer
                                </p>
                            </div>
                            <div className="flex flex-col items-center justify-center text-center">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Details</p>
                                <p className="text-sm font-semibold text-gray-800 uppercase truncate max-w-[120px]">
                                    {selectedRemarkCustomer.name || '—'}
                                </p>
                            </div>
                            <div className="flex flex-col items-center justify-center text-center">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Status</p>
                                <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full uppercase border bg-emerald-100 text-emerald-800 border-emerald-200">
                                    Active
                                </span>
                            </div>
                        </div>

                        {/* Remark Textarea Form */}
                        {(() => {
                            const hasExistingRemark = Boolean(selectedRemarkCustomer.garageRemark || selectedRemarkCustomer.employeeRemark);
                            return (
                                <form onSubmit={handleRemarkSubmit} className="space-y-4.5 text-left">
                                    <div className="space-y-2">
                                        <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Remark</label>
                                        <textarea
                                            rows="4"
                                            disabled={hasExistingRemark}
                                            value={remarkText}
                                            onChange={(e) => setRemarkText(e.target.value)}
                                            className="w-full px-4 py-3 bg-[#f8fafc] uppercase border border-[#cbd5e1] rounded-xl focus:outline-none focus:bg-white focus:border-[#a5b4fc] transition-all font-semibold text-sm text-[#011023] resize-none disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmittingRemark || hasExistingRemark}
                                        className={`w-full py-2 border rounded-xl text-sm font-semibold uppercase tracking-wider transition-all shadow-sm mt-4 flex items-center justify-center gap-2 ${
                                            hasExistingRemark 
                                                ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed' 
                                                : 'bg-[#e0e7ff] border-[#a5b4fc] text-[#3730a3] hover:bg-[#c7d2fe] cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed'
                                        }`}
                                    >
                                        {isSubmittingRemark ? (
                                            <>
                                                <Loader2 size={14} className="animate-spin" /> Submitting REMARK...
                                            </>
                                        ) : hasExistingRemark ? (
                                            <>
                                                <Check size={14} /> REMARK SUBMITTED
                                            </>
                                        ) : (
                                            <>
                                                <Send size={14} /> Submit REMARK
                                            </>
                                        )}
                                    </button>
                                </form>
                            );
                        })()}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default Customers;
