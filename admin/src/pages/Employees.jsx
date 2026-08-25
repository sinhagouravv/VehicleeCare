import React, { useState, useEffect, useCallback } from 'react';
import { Eye, Download, UserX, Loader2, X, User, Mail, Phone, MapPin, Calendar, ShieldCheck, Clipboard, Ban, Wrench, Briefcase, UserCheck, UserSquare2, Shield, Trash2, CreditCard, Zap, ShoppingBag } from 'lucide-react';
import { createPortal } from 'react-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import useHighlight from '../hooks/useHighlight';
import { TableSkeleton, SkeletonBlock } from '../components/Skeleton';
import { useFilter } from '../context/FilterContext';
import { useRowLabels, FloatingLabelSelector, renderLabelIcon, stripEmoji, LABEL_FILTER_GROUP } from '../components/RowLabel';

const Employees = () => {
    const [employees, setEmployees] = useState([]);
    const highlightedRow = useHighlight(employees);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modals
    const [viewEmployee, setViewEmployee] = useState(null);
    const [serviceHistory, setServiceHistory] = useState([]);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [_loadingBookings, setLoadingBookings] = useState(false);
    const [banEmployee, setBanEmployee] = useState(null);
    const [banReason, setBanReason] = useState('');
    const [banSubmitting, setBanSubmitting] = useState(false);
    const [banSuccess, setBanSuccess] = useState('');
    const [employeeToDelete, setEmployeeToDelete] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [lastRefreshed, setLastRefreshed] = useState(null);

    // Filter, Sort & Row Label States
    const [filterCategory, setFilterCategory] = useState('all');
    const [labelFilter, setLabelFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState('latest');
    const [timeRange, setTimeRange] = useState('all');

    const { setFilterConfig, setResultsCount } = useFilter();
    const { rowLabels, activeLabelRowId, setActiveLabelRowId, handleSaveRowLabel, labelPopupRef, isLabelMode } = useRowLabels('admin_employees_labels');

    // Register filter options
    useEffect(() => {
        setFilterConfig({
            title: 'Filter Employees',
            hasSort: true,
            groups: [
                LABEL_FILTER_GROUP,
                {
                    id: 'category',
                    label: 'Employee Category',
                    defaultValue: 'all',
                    options: [
                        { label: 'All', value: 'all' },
                        { label: 'Garage', value: 'Garage' },
                        { label: 'Station', value: 'Station' },
                        { label: 'Parking', value: 'Parking' },
                        { label: 'Store', value: 'Store' },
                    ]
                }
            ],
            initialValues: {
                category: filterCategory,
                label: labelFilter,
                sortOrder,
                timeRange
            },
            onChange: (newValues) => {
                if (newValues.category !== undefined) setFilterCategory(newValues.category);
                if (newValues.label !== undefined) setLabelFilter(newValues.label);
                if (newValues.sortOrder !== undefined) setSortOrder(newValues.sortOrder);
                if (newValues.timeRange !== undefined) setTimeRange(newValues.timeRange);
            },
            onReset: () => {
                setFilterCategory('all');
                setLabelFilter('all');
                setSortOrder('latest');
                setTimeRange('all');
            }
        });
        return () => setFilterConfig(null);
    }, [setFilterConfig, filterCategory, labelFilter, sortOrder, timeRange]);

    const fetchEmployees = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const res = await fetch('http://localhost:5001/api/employees');
            if (!res.ok) throw new Error('Failed to fetch employees');
            const data = await res.json();
            setEmployees(data.data || []);
            setLastRefreshed(new Date());
        } catch (err) {
            console.error(err);
            if (!silent) setError('Failed to load employees. Is the backend running?');
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEmployees();
        const interval = setInterval(() => fetchEmployees(true), 5000);
        return () => clearInterval(interval);
    }, [fetchEmployees]);

    const getRoleBadge = (role) => {
        switch (role) {
            case 'Admin': return 'bg-purple-100 text-purple-700 font-bold';
            case 'Manager': return 'bg-blue-100 text-blue-700 font-bold';
            case 'Staff': return 'bg-emerald-100 text-emerald-700 font-bold';
            case 'Mechanic': return 'bg-emerald-100 text-emerald-700 font-bold';
            case 'Technician': return 'bg-amber-100 text-amber-700 font-bold';
            case 'Support': return 'bg-indigo-100 text-indigo-700 font-bold';
            case 'Chef': return 'bg-orange-100 text-orange-700 font-bold';
            case 'Waiter': return 'bg-pink-100 text-pink-700 font-bold';
            case 'Cashier': return 'bg-cyan-100 text-cyan-700 font-bold';
            case 'Delivery': return 'bg-lime-100 text-lime-700 font-bold';
            default: return 'bg-gray-100 text-gray-700 font-bold';
        }
    };

    const _getShiftBadge = (shift) => {
        switch (shift) {
            case 'Morning': return 'bg-orange-50 text-orange-600';
            case 'Evening': return 'bg-indigo-50 text-indigo-600';
            case 'Night': return 'bg-purple-100 text-purple-700';
            default: return 'bg-gray-50 text-gray-400';
        }
    };

    const formatRole = (role) => {
        return role || 'Employee';
    };

    const _getRoleIcon = (role) => {
        switch (role) {
            case 'Chef': return <Zap size={14} />;
            case 'Waiter': return <UserCheck size={14} />;
            case 'Cashier': return <CreditCard size={14} />;
            case 'Delivery': return <ShoppingBag size={14} />;
            case 'Mechanic': return <Wrench size={14} />;
            case 'Manager': return <Briefcase size={14} />;
            case 'Technician': return <ShieldCheck size={14} />;
            case 'Support': return <UserCheck size={14} />;
            case 'Admin': return <Shield size={14} />;
            default: return <UserSquare2 size={14} />;
        }
    };

    const formatDate = (dateStr, includeTime = true) => {
        if (!dateStr) return '—';
        const date = new Date(dateStr);
        const day = date.toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
        if (!includeTime) return day;
        const time = date.toLocaleTimeString('en-IN', {
            hour: '2-digit', minute: '2-digit', hour12: true
        });
        return `${day} | ${time}`;
    };

    // ── Open View Modal ────────────────────────────────────────
    const handleViewEmployee = (employee) => {
        setViewEmployee(employee);
    };

    const fetchServiceHistory = async (employeeId) => {
        setServiceHistory([]);
        setLoadingBookings(true);
        setIsHistoryModalOpen(true);
        try {
            const res = await fetch(`http://localhost:5001/api/bookings/employee/${employeeId}`);
            if (res.ok) {
                const data = await res.json();
                setServiceHistory(data.data || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingBookings(false);
        }
    };

    // ── Download PDF ───────────────────────────────────────────
    const handleDownloadPDF = async (employee) => {
        const doc = new jsPDF();
        const primary = [5, 37, 88];
        const gray = [100, 100, 100];

        doc.setFontSize(20);
        doc.setTextColor(...primary);
        doc.text('VehicleeCare — Employee Report', 105, 18, null, null, 'center');

        doc.setFontSize(11);
        doc.setTextColor(...gray);
        doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 14, 28);

        doc.setFontSize(13);
        doc.setTextColor(...primary);
        doc.text('Employee Details', 14, 40);

        autoTable(doc, {
            startY: 44,
            body: [
                ['Employee ID', employee.userId || employee.employeeId || '—'],
                ['Full Name', employee.name || '—'],
                ['Email', employee.email || '—'],
                ['Phone', employee.phone || '—'],
                ['Address', employee.address || '—'],
                ['Category', employee.category || 'System'],
                ['Role', formatRole(employee.role)],
                ['Verification', employee.isVerified ? 'Verified' : 'Unverified'],
                ['Joined', formatDate(employee.createdAt)],
            ],
            theme: 'grid',
            headStyles: { fillColor: primary },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } },
            styles: { fontSize: 10, cellPadding: 4 },
        });

        // Fetch bookings
        try {
            const res = await fetch(`http://localhost:5001/api/bookings/employee/${employee._id}`);
            if (res.ok) {
                const data = await res.json();
                const bookings = data.data || [];
                if (bookings.length > 0) {
                    const finalY = doc.lastAutoTable?.finalY || 80;
                    doc.setFontSize(13);
                    doc.setTextColor(...primary);
                    doc.text('Tasks History', 14, finalY + 12);

                    autoTable(doc, {
                        startY: finalY + 17,
                        head: [['Task ID', 'Service', 'Date', 'Status', 'Amount']],
                        body: bookings.map(b => [
                            b.bookingId || b._id?.slice(0, 8),
                            b.service?.title || '—',
                            formatDate(b.createdAt),
                            b.status || 'Pending',
                            `Rs. ${b.payment?.amount || b.service?.price || '—'}`,
                        ]),
                        theme: 'grid',
                        headStyles: { fillColor: primary, textColor: [255, 255, 255] },
                        styles: { fontSize: 9, cellPadding: 3 },
                    });
                }
            }
        } catch { /* skip bookings if fetch fails */ }

        doc.save(`Employee_${employee.userId || employee.employeeId || employee._id}_Report.pdf`);
    };

    // ── Ban/Dismiss Employee ───────────────────────────────────────────────
    // ── Body Scroll Lock ──────────────────────────────────────
    useEffect(() => {
        if (viewEmployee || banEmployee || isHistoryModalOpen || isDeleteModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [viewEmployee, banEmployee, isHistoryModalOpen, isDeleteModalOpen]);

    const handleBanSubmit = async () => {
        if (!banReason.trim()) return;
        setBanSubmitting(true);
        // (Future: POST to /api/employees/:id/ban with banReason)
        await new Promise(r => setTimeout(r, 900)); // Simulated delay
        setBanSuccess(`Employee "${banEmployee.name}" has been disabled.`);
        setBanSubmitting(false);
        setTimeout(() => {
            setBanEmployee(null);
            setBanReason('');
            setBanSuccess('');
        }, 2000);
    };

    const handleDelete = async () => {
        if (!employeeToDelete) return;
        setDeleting(true);
        try {
            const res = await fetch(`http://localhost:5001/api/employees/${employeeToDelete._id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                setEmployees(prev => prev.filter(emp => emp._id !== employeeToDelete._id));
                setIsDeleteModalOpen(false);
                setEmployeeToDelete(null);
            } else {
                alert(data.message || 'Failed to delete employee');
            }
        } catch (error) {
            console.error("Error deleting employee:", error);
            alert('Error deleting employee');
        } finally {
            setDeleting(false);
        }
    };

    const filteredEmployees = React.useMemo(() => {
        return employees.filter(emp => {
            if (filterCategory !== 'all') {
                const empCat = (emp.category || '').toLowerCase();
                if (empCat !== filterCategory.toLowerCase()) return false;
            }
            if (labelFilter !== 'all') {
                const label = rowLabels[emp._id];
                if (!label || label.toUpperCase() !== labelFilter.toUpperCase()) {
                    return false;
                }
            }
            if (timeRange !== 'all') {
                const itemDate = emp.createdAt ? new Date(emp.createdAt) : null;
                if (itemDate && !isNaN(itemDate.getTime())) {
                    const now = new Date();
                    const diffDays = Math.ceil(Math.abs(now - itemDate) / (1000 * 60 * 60 * 24));
                    if (timeRange === 'week' && diffDays > 7) return false;
                    if (timeRange === 'month' && diffDays > 30) return false;
                }
            }
            return true;
        }).sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            if (dateA !== dateB && dateA > 0 && dateB > 0) {
                return sortOrder === 'latest' ? dateB - dateA : dateA - dateB;
            }
            const idA = String(a.empId || a.employeeId || a._id || a.name || '');
            const idB = String(b.empId || b.employeeId || b._id || b.name || '');
            return sortOrder === 'latest' ? idB.localeCompare(idA) : idA.localeCompare(idB);
        });
    }, [employees, filterCategory, labelFilter, timeRange, sortOrder, rowLabels]);

    useEffect(() => {
        setResultsCount(filteredEmployees.length);
    }, [filteredEmployees.length, setResultsCount]);

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto h-[calc(100vh-9.25rem)] flex flex-col">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-[#011023] uppercase tracking-tight">Manage Employees</h1>
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
                            <tr className="bg-[#f0f6ff] text-[15px] uppercase tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                <th className="p-4.5 font-bold text-center w-[10%]">Employee ID</th>
                                <th className="p-4.5 font-bold text-center w-[11%]">Employee</th>
                                <th className="p-4.5 font-bold text-center w-[9%]">Category</th>
                                <th className="p-4.5 font-bold text-center w-[11%]">Category ID</th>
                                <th className="p-4.5 font-bold text-center w-[18%]">Contact</th>
                                <th className="p-4.5 font-bold text-center w-[10%]">Role</th>
                                <th className="p-4.5 font-bold text-center w-[9%]">Joined at</th>
                                <th className="p-4.5 font-bold text-center w-[9%]">Status</th>
                                <th className="p-4.5 font-bold text-center w-[10.5%]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-[13px] divide-[#e6f0fa]">
                            {loading ? (
                                <TableSkeleton rows={15} cols={9} />
                            ) : error ? (
                                <tr>
                                    <td colSpan={9} className="p-8 text-center text-red-400 font-medium">{error}</td>
                                </tr>
                            ) : filteredEmployees.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="py-16 text-gray-400 text-sm text-center">No employees found.</td>
                                </tr>
                            ) : filteredEmployees.map((employee) => {
                                const rowId = employee.userId || employee.employeeId || employee._id;
                                return (
                                    <tr 
                                        key={employee._id} 
                                        id={`row-${rowId}`} 
                                        onClick={(e) => {
                                            if (isLabelMode) {
                                                e.stopPropagation();
                                                setActiveLabelRowId(prev => prev === employee._id ? null : employee._id);
                                            }
                                        }}
                                        className={`transition-all duration-1000 ${
                                            isLabelMode ? 'cursor-pointer hover:bg-blue-50/60' : 'hover:bg-blue-50/30'
                                        } ${highlightedRow === rowId ? 'bg-emerald-100/60 rounded-2xl relative z-20 scale-[1.01]' : ''}`}
                                    >
                                        <td className="p-4 text-center relative font-semibold text-[#052558] text-sm">
                                            <div className="relative flex items-center justify-center w-full">
                                                {Boolean(rowLabels[employee._id]) && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveLabelRowId(prev => prev === employee._id ? null : employee._id);
                                                        }}
                                                        className="absolute -left-1.5 top-1/2 -translate-y-1/2 cursor-pointer hover:scale-115 transition-transform active:scale-95 p-0.5"
                                                        title={`Label: ${stripEmoji(rowLabels[employee._id] || 'Add label')}`}
                                                    >
                                                        {renderLabelIcon(rowLabels[employee._id], 16)}
                                                    </button>
                                                )}

                                                {activeLabelRowId === employee._id && (
                                                    <FloatingLabelSelector 
                                                        rowId={employee._id}
                                                        currentLabel={rowLabels[employee._id]}
                                                        onSaveLabel={handleSaveRowLabel}
                                                        labelPopupRef={labelPopupRef}
                                                        positionClass="-left-4"
                                                    />
                                                )}
                                                <span>{employee.userId || employee.employeeId || '—'}</span>
                                            </div>
                                        </td>
                                            <td className="p-4 text-center">
                                                <div className="font-semibold uppercase text-sm text-center">{employee.name}</div>
                                            </td>
                                             <td className="p-4 text-center">
                                                 <span className={`inline-block px-3 py-1 uppercase text-xs font-semibold rounded-full ${
                                                     employee.category === 'Store' ? 'bg-orange-100 text-orange-700' : 
                                                     employee.category === 'Garage' ? 'bg-emerald-100 text-emerald-700' :
                                                     employee.category === 'Station' ? 'bg-amber-100 text-amber-700' :
                                                     employee.category === 'Parking' ? 'bg-indigo-100 text-indigo-700' :
                                                     'bg-purple-100 text-purple-700'
                                                 }`}>
                                                     {employee.category || 'System'}
                                                 </span>
                                             </td>
                                            <td className="p-4 text-center">
                                                <div className="font-semibold text-sm uppercase text-center">
                                                    {employee.category === 'Garage' ? (employee.garageId || '—') : '—'}
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="text-xs text-gray-500 mt-0.5 text-center">{employee.phone || '—'}</div>
                                                <div className="font-semibold text-gray-700 text-sm text-center">{employee.email}</div>
                                            </td>
                                             <td className="p-4 text-center">
                                                 <span className={`inline-block px-3 py-1 text-xs font-semibold uppercase rounded-full ${getRoleBadge(employee.role)}`}>
                                                     {formatRole(employee.role)}
                                                 </span>
                                             </td>
                                            {/* <td className="p-4 text-center">
                                                <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-lg uppercase tracking-wider ${getShiftBadge(employee.shift)}`}>
                                                    {employee.shift || '—'}
                                                </span>
                                            </td> */}
                                             <td className="p-4 text-center uppercase">
                                                 <div className="flex flex-col items-center justify-center">
                                                     <span className="text-sm font-semibold text-[#011023]">
                                                         {new Date(employee.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                     </span>
                                                     <span className="text-xs text-gray-600">
                                                         {new Date(employee.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                                                     </span>
                                                 </div>
                                             </td>
                                             <td className="p-4 text-center">
                                                 <span className={`inline-block px-3 py-1 text-xs font-semibold uppercase rounded-full ${
                                                     employee.isVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                                 }`}>
                                                     {employee.isVerified ? 'Verified' : 'Unverified'}
                                                 </span>
                                             </td>
                                            <td className="p-4 text-center">
                                                <div className="flex items-center justify-center gap-3.5">
                                                    <button onClick={() => handleViewEmployee(employee)} className="text-gray-400 hover:text-blue-500">
                                                        <Eye size={17} />
                                                    </button>
                                                    <button onClick={() => handleDownloadPDF(employee)} className="text-gray-400 hover:text-emerald-500">
                                                        <Download size={17} />
                                                    </button>
                                                    <button onClick={() => { setBanEmployee(employee); setBanReason(''); setBanSuccess(''); }} className="text-gray-400 hover:text-red-500">
                                                        <UserX size={17} />
                                                    </button>
                                                    <button onClick={() => { setEmployeeToDelete(employee); setIsDeleteModalOpen(true); }} className="text-gray-400 hover:text-red-600">
                                                        <Trash2 size={17} />
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

            {/* VIEW EMPLOYEE MODAL (Refined Alignment) */}
            {viewEmployee && createPortal(
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#011023]/10 backdrop-blur-sm transition-all duration-300"
                    onClick={() => setViewEmployee(null)}
                >
                    <div 
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-6 flex justify-between items-center bg-gradient-to-r from-blue-50/50 to-white">
                             <div>
                                 <h3 className="text-xl uppercase font-bold text-[#052558]">Employee Details</h3>
                                 <div className="flex items-center gap-2 mt-1">
                                     <p className="text-sm text-gray-500">ID: <span className="font-semibold text-gray-700">{viewEmployee.userId || viewEmployee.employeeId || viewEmployee._id?.slice(0, 8)}</span></p>
                                     <button onClick={() => fetchServiceHistory(viewEmployee._id)} className="text-gray-400 p-1.5 rounded-lg transition-colors hover:text-blue-600 hover:bg-blue-50">
                                         <Eye size={17} />
                                     </button>
                                 </div>
                             </div>
                            <button 
                                onClick={() => setViewEmployee(null)} 
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto flex-1 space-y-4 hide-scrollbar">
                            <div className="flex flex-col md:flex-row gap-6 w-full">
                                {/* Personal Info */}
                                <div className="space-y-2 w-full md:w-[42%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Personal Info</h4>
                                    <div className="bg-blue-50/30 pt-4 rounded-xl uppercase space-y-2 border border-blue-50">
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Name:</span> <span className="font-semibold text-[#011023] truncate">{viewEmployee.name || '—'}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Phone:</span> <span className="font-semibold text-gray-800 truncate">{viewEmployee.phone || '—'}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Email:</span> <span className="font-semibold text-gray-800 truncate">{viewEmployee.email || '—'}</span></p>
                                    </div>
                                </div>

                                {/* Employment Info */}
                                <div className="space-y-2 w-full md:w-[22%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Employment Info</h4>
                                    <div className="bg-blue-50/30 pt-4 rounded-xl uppercase space-y-2 border border-blue-50 min-h-[110px]">
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Role:</span> <span className="font-semibold ml-2 text-[#011023]">{formatRole(viewEmployee.role)}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Shift:</span> <span className="font-semibold ml-2 text-gray-800">{viewEmployee.shift || '—'}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Salary:</span> <span className="font-semibold ml-2 text-gray-800">{viewEmployee.salaryType || 'Monthly'}</span></p>
                                    </div>
                                </div>

                                {/* Status & Join Info */}
                                <div className="flex flex-col gap-4.5 w-full md:w-[35%]">
                                    <div className="space-y-1.25">
                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Other Details</h4>
                                        <div className="flex items-center gap-3">
                                            <h4 className="text-sm font-bold text-gray-400 uppercase mt-5 tracking-wider w-24">Status</h4>
                                            <div className="flex uppercase items-center gap-2">
                                                <span className={`px-2 py-0.5 ml-3 mt-4 text-xs font-bold rounded-lg uppercase tracking-wider ${viewEmployee.isVerified ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-orange-50 text-orange-600 border border-orange-100'}`}>
                                                    {viewEmployee.isVerified ? 'Verified' : 'Pending'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider w-24">Category</h4>
                                            <span className="text-xs ml-3 font-bold text-blue-600 border border-blue-100 bg-blue-50 px-2 py-0.5 rounded-lg uppercase">
                                                {viewEmployee.category || 'System'}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider w-24">Joined At</h4>
                                            <span className="text-xs ml-3 font-bold text-gray-600 uppercase">
                                                {formatDate(viewEmployee.createdAt, true)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>



                            {/* Legal Documentation Archive */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Legal Documentation</h4>
                                <div className="bg-white border border-[#e6f0fa] p-6 rounded-xl shadow-sm">
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">PAN Card Number</p>
                                            <p className="text-[14px] font-bold text-[#052558] uppercase tracking-wider">{viewEmployee.panCard || '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Adhar Protocol</p>
                                            <p className="text-[14px] font-bold text-[#052558] uppercase tracking-wider">{viewEmployee.adharCard || '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Voter ID Registry</p>
                                            <p className="text-[14px] font-bold text-[#052558] uppercase tracking-wider">{viewEmployee.voterId || '—'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Residential Archive */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Residential Archive</h4>
                                <div className="bg-white border border-[#e6f0fa] p-5 rounded-xl shadow-sm uppercase">
                                    <p className="text-xs font-bold text-gray-400 tracking-tight mb-1">Geographic Allocation</p>
                                    <h5 className="font-semibold text-[#052558] text-[15.5px]">{viewEmployee.address || 'No Address Provided'}</h5>
                                    {/* <p className="text-sm text-gray-500 mt-1 uppercase">Physical Deployment Address Registry</p> */}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ── DISABLE EMPLOYEE MODAL ────────────────────────── */}
            {banEmployee && createPortal(
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#052558]/10 backdrop-blur-md animate-in fade-in duration-300" onClick={() => !banSubmitting && setBanEmployee(null)} />
                    
                    <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-white overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Header */}
                        <div className="px-7 py-5 bg-rose-50 border-b border-rose-100 flex items-center justify-center relative">
                            <h3 className="text-xl font-bold text-rose-600 uppercase tracking-wider">Disable Employee Account</h3>
                            <button 
                                onClick={() => setBanEmployee(null)}
                                className="absolute right-7 p-2 text-rose-400 rounded-xl transition-colors"
                                disabled={banSubmitting}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-8 space-y-6">
                            {banSuccess ? (
                                <div className="flex flex-col items-center gap-3 py-10">
                                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center animate-bounce">
                                        <UserX size={32} className="text-red-500" />
                                    </div>
                                    <p className="text-lg font-bold text-[#011023] text-center uppercase tracking-tight">{banSuccess}</p>
                                </div>
                            ) : (
                                <>
                                    <div className="bg-rose-50/50 border border-rose-100 p-3 rounded-2xl">
                                        <p className="text-sm uppercase font-medium text-justify text-rose-700 leading-relaxed">
                                            Are you sure you want to disable <span className="font-bold">"{banEmployee.name}"</span>? 
                                            This action will revoke all system access privileges immediately. This action will be documented in the internal audit.
                                        </p>
                                    </div>

                                    <div className="space-y-2 text-left">
                                        <label className="text-[13.5px] font-semibold text-rose-600 uppercase tracking-wider flex items-center justify-center">Please provide a valid and detailed reason for disabling this employee account</label>
                                        <textarea 
                                            value={banReason}
                                            onChange={(e) => setBanReason(e.target.value)}
                                            className="w-full h-32 p-4 bg-white border border-gray-200 mt-3 rounded-2xl text-sm focus:outline-none transition-all resize-none font-medium text-gray-700 shadow-sm"
                                            disabled={banSubmitting}
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        {!banSuccess && (
                            <div className="px-8 pb-6 pt-1 bg-gray-50/50 border-t border-gray-100 flex gap-4">
                                <button 
                                    onClick={() => setBanEmployee(null)}
                                    className="flex-1 px-6 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm"
                                    disabled={banSubmitting}
                                >
                                    Cancel Action
                                </button>
                                <button 
                                    onClick={handleBanSubmit}
                                    disabled={banSubmitting || !banReason.trim()}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-200 disabled:opacity-50 disabled:shadow-none"
                                >
                                    {banSubmitting ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Confirming...
                                        </>
                                    ) : (
                                        <>
                                            Confirm Action
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}

            {/* ── DELETE EMPLOYEE CONFIRMATION MODAL ────────────────── */}
            {isDeleteModalOpen && employeeToDelete && createPortal(
                            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                                <div className="absolute inset-0 bg-[#011023]/10 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)} />
                                <div className="relative w-full max-w-xl bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-white/50 animate-in fade-in zoom-in duration-200">
                                    <div className="p-2 mt-7 mb-1 flex items-center justify-between text-center flex-col gap-4">
                                        <div>
                                            <h3 className="text-2xl uppercase font-bold text-[#011023]">Remove Member</h3>
                                        </div>
                                    </div>
            
                                    <div className="p-5 text-center uppercase tracking-tight">
                                        <h4 className="font-bold text-[#011023] mb-5">{employeeToDelete.name}</h4>
                                        <p className="text-gray-500 text-[13px] leading-relaxed">
                                            Are you sure you want to permanently delete this account? All performance records and credentials will be lost. <br />
                                            This action <span className="text-rose-600 font-bold uppercase">cannot be undone</span>.
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

            {/* Service History Modal */}
            {isHistoryModalOpen && createPortal(
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[#011023]/180 backdrop-blur-sm transition-all duration-300" onClick={() => setIsHistoryModalOpen(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col h-[65vh] animate-in fade-in zoom-in duration-300" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="pr-6 pl-6 pt-6 pb-1 flex justify-between items-center bg-white">
                            <div className="flex items-center gap-4">
                                <div>
                                    <h3 className="text-xl uppercase font-bold text-[#011023] tracking-tight">Service History</h3>
                                    <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Total Records: <span className="text-[#011023] font-bold">{serviceHistory.length}</span></p>
                                </div>
                            </div>
                            <button onClick={() => setIsHistoryModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 overflow-y-auto flex-1 hide-scrollbar">
                            {serviceHistory.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-24 text-center">
                                    <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                                        <Briefcase size={28} className="text-gray-300" />
                                    </div>
                                    <h4 className="text-lg font-bold text-gray-400 uppercase tracking-widest">No Activity Records</h4>
                                    <p className="text-xs text-gray-300 mt-2 uppercase font-medium">This employee hasn't been assigned any bookings yet.</p>
                                </div>
                            ) : (
                                <div className="border border-[#e6f0fa] rounded-2xl overflow-y-auto max-h-[570px] shadow-sm bg-white hide-scrollbar">
                                    <table className="w-full text-center border-collapse">
                                        <thead className="bg-gray-50 text-[12px] uppercase text-gray-400 tracking-widest border-b border-[#e6f0fa] sticky top-0 z-20 shadow-sm">
                                            <tr>
                                                <th className="p-4 px-6 text-center w-[60%]">Booking Details</th>
                                                <th className="p-4 w-[20%]">Schedule</th>
                                                <th className="p-4 text-center px-6 w-[20%]">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#e1ecf8]">
                                            {serviceHistory.map((booking) => (
                                                <tr key={booking._id} className="hover:bg-gray-50/50 transition-all duration-300">
                                                    <td className="p-4 px-6 text-center">
                                                        <div className="text-xs text-[#011023] font-semibold uppercase">{booking.service?.title || 'General Service'}</div>
                                                        <div className="font-semibold text-gray-400 text-[11px] uppercase mt-0.5 tracking-tight">{booking.bookingId || '—'}</div>
                                                    </td>
                                                    <td className="p-4 text-center uppercase">
                                                        <div className="font-semibold text-[#011023] text-xs">{formatDate(booking.schedule?.date, false)}</div>
                                                        <div className="text-[11px] text-gray-400 font-semibold">{booking.schedule?.time || '—'}</div>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <span className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${booking.status === 'Completed' ? 'bg-teal-50 text-teal-600 border border-teal-100' :
                                                                booking.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                                                booking.status === 'In Service' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' :
                                                                booking.status === 'In Progress' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                                                                    booking.status === 'Pending' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                                                        booking.status === 'Cancelled' ? 'bg-red-50 text-red-600 border border-red-100' :
                                                                            'bg-gray-50 text-gray-600 border border-gray-100'
                                                            }`}>
                                                            {booking.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default Employees;
