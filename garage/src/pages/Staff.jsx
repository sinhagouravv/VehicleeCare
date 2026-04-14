import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { UserSquare2, Plus, Shield, Eye, Edit, Trash2, X, Wrench, Briefcase, UserCheck, ShieldCheck, Loader2, Download, Mail, Phone, MapPin, Calendar, UserX, FileText, CreditCard, Ban } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import useHighlight from '../hooks/useHighlight';

const Staff = () => {
    const [staffMembers, setStaffMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [lastRefreshed, setLastRefreshed] = useState(null);
    const [saving, setSaving] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [serviceHistory, setServiceHistory] = useState([]);

    // Actions State
    const [banEmployee, setBanEmployee] = useState(null);
    const [banReason, setBanReason] = useState('');
    const [banSubmitting, setBanSubmitting] = useState(false);
    const [banSuccess, setBanSuccess] = useState('');
    const [employeeToDelete, setEmployeeToDelete] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [copySuccess, setCopySuccess] = useState('');

    const highlightedRow = useHighlight(staffMembers);

    const [form, setForm] = useState({
        name: '', email: '', phone: '', role: '', address: '', category: 'Garage',
        shift: '', panCard: '', adharCard: '', voterId: '', agreement: '', salaryType: ''
    });

    const fetchStaff = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const storedUser = localStorage.getItem('garageUser');
            if (!storedUser) return;
            const user = JSON.parse(storedUser);

            const res = await fetch(`http://localhost:5001/api/employees/garage/${user.id}`);
            const data = await res.json();
            if (data.success) {
                setStaffMembers(data.data || []);
                setLastRefreshed(new Date());
            }
        } catch (error) {
            console.error("Failed to fetch garage staff", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStaff();
        const interval = setInterval(() => fetchStaff(true), 10000); // Refresh every 10s
        return () => clearInterval(interval);
    }, [fetchStaff]);

    const handleViewDetails = (staff) => {
        setSelectedStaff(staff);
        setIsViewModalOpen(true);
    };

    const fetchServiceHistory = async (staffId) => {
        setIsHistoryModalOpen(true);
        try {
            const res = await fetch(`http://localhost:5001/api/bookings/employee/${staffId}`);
            const data = await res.json();
            if (data.success) {
                setServiceHistory(data.data || []);
            }
        } catch (error) {
            console.error("Error fetching service history:", error);
        }
    };

    const handleSave = async () => {
        if (!form.name || !form.email || !form.phone) return alert('Please fill all required fields');
        setSaving(true);
        try {
            const storedUser = localStorage.getItem('garageUser');
            const garageId = storedUser ? JSON.parse(storedUser).id : null;

            const url = isEditMode ? `http://localhost:5001/api/employees/${form._id}` : 'http://localhost:5001/api/employees';
            const method = isEditMode ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, garageId })
            });
            const data = await res.json();
            if (data.success) {
                await fetchStaff(true);
                setIsAddModalOpen(false);
                setIsEditMode(false);
                setForm({
                    name: '', email: '', phone: '', role: '', address: '', category: 'Garage',
                    shift: '', panCard: '', adharCard: '', voterId: '', agreement: '', salaryType: ''
                });
            } else {
                alert(data.message || 'Failed to process employee');
            }
        } catch (error) {
            console.error("Error processing employee:", error);
            alert('Error processing employee');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (staff) => {
        setForm({ ...staff });
        setIsEditMode(true);
        setIsAddModalOpen(true);
    };

    const getRoleBadge = (role) => {
        switch (role) {
            case 'Admin': return 'bg-purple-100 text-purple-700 font-bold';
            case 'Manager': return 'bg-blue-100 text-blue-700 font-bold';
            case 'Mechanic': return 'bg-emerald-100 text-emerald-700 font-bold';
            case 'Technician': return 'bg-amber-100 text-amber-700 font-bold';
            case 'Support': return 'bg-indigo-100 text-indigo-700 font-bold';
            default: return 'bg-gray-100 text-gray-700 font-bold';
        }
    };

    const formatRole = (role) => {
        return role || 'Employee';
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

    const getRoleIcon = (role) => {
        switch (role) {
            case 'Mechanic': return <Wrench size={14} />;
            case 'Manager': return <Briefcase size={14} />;
            case 'Technician': return <ShieldCheck size={14} />;
            case 'Support': return <UserCheck size={14} />;
            case 'Admin': return <Shield size={14} />;
            default: return <UserSquare2 size={14} />;
        }
    };

    const formatAadhar = (val) => {
        const digits = val.replace(/\D/g, '').slice(0, 12);
        return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
    };

    const formatPAN = (val) => {
        return val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 10);
    };

    const formatVoter = (val) => {
        return val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 10);
    };

    // ── Download PDF ───────────────────────────────────────────
    const handleDownloadPDF = async (staff) => {
        const doc = new jsPDF();
        const primary = [5, 37, 88];
        const gray = [100, 100, 100];

        doc.setFontSize(20);
        doc.setTextColor(...primary);
        doc.text('VehicleeCare — Staff Report', 105, 18, null, null, 'center');

        doc.setFontSize(11);
        doc.setTextColor(...gray);
        doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 14, 28);

        doc.setFontSize(13);
        doc.setTextColor(...primary);
        doc.text('Employee Details', 14, 40);

        autoTable(doc, {
            startY: 44,
            body: [
                ['Employee ID', staff.employeeId || '—'],
                ['Full Name', staff.name || '—'],
                ['Email', staff.email || '—'],
                ['Phone', staff.phone || '—'],
                ['Shift', staff.shift || '—'],
                ['Salary Type', staff.salaryType || '—'],
                ['Role', formatRole(staff.role)],
                ['PAN Card', staff.panCard || '—'],
                ['Aadhar Card', staff.adharCard || '—'],
                ['Voter ID', staff.voterId || '—'],
                ['Joined', formatDate(staff.createdAt)],
            ],
            theme: 'grid',
            headStyles: { fillColor: primary },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } },
            styles: { fontSize: 10, cellPadding: 4 },
        });

        doc.save(`Staff_${staff.employeeId || staff._id}_Report.pdf`);
    };

    // ── Ban/Disable Staff ───────────────────────────────────────────────
    // ── Body Scroll Lock ──────────────────────────────────────
    useEffect(() => {
        if (isAddModalOpen || selectedStaff || banEmployee || isHistoryModalOpen || isDeleteModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isAddModalOpen, selectedStaff, banEmployee, isHistoryModalOpen, isDeleteModalOpen]);

    const handleBanSubmit = async () => {
        if (!banReason.trim()) return;
        setBanSubmitting(true);
        // Simulate API call for now (matches admin panel behavior)
        await new Promise(r => setTimeout(r, 900));
        setBanSuccess(`Access restricted for "${banEmployee.name}".`);
        setBanSubmitting(false);
        setTimeout(() => {
            setBanEmployee(null);
            setBanReason('');
            setBanSuccess('');
        }, 2000);
    };

    // ── Delete Staff ───────────────────────────────────────────────────
    const handleDelete = async () => {
        if (!employeeToDelete) return;
        setDeleting(true);
        try {
            const res = await fetch(`http://localhost:5001/api/employees/${employeeToDelete._id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                setStaffMembers(prev => prev.filter(emp => emp._id !== employeeToDelete._id));
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

    const handleCopy = (text, type) => {
        navigator.clipboard.writeText(text);
        setCopySuccess(type);
        setTimeout(() => setCopySuccess(''), 2000);
    };

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-[#011023] uppercase tracking-tight">Employee Management</h1>
                <div className="flex items-center gap-4">
                    <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-[#052558] to-[#527FB0] text-white font-bold rounded-xl shadow-md hover:opacity-90 transition-opacity uppercase tracking-tighter text-sm">
                        <Plus size={18} />
                        Add Employee
                    </button>
                </div>
            </div>

            {/* Main Content Table (Glassmorphism) */}
            <div className="bg-white/60 backdrop-blur-xl h-[53.5rem] border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden">
                <div className="overflow-x-hidden overflow-y-auto text-center h-[860px] relative hide-scrollbar">
                    <table className="w-full text-center border-collapse">
                        <thead className="sticky top-0 z-10 shadow-sm">
                            <tr className="bg-[#f0f6ff] text-[15px] uppercase tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                <th className="p-4.5 font-bold w-[10%]">Employee ID</th>
                                <th className="p-4.5 font-bold w-[15%]">Employee</th>
                                <th className="p-4.5 font-bold w-[18%]">Contact</th>
                                <th className="p-4.5 font-bold w-[8%]">Role</th>
                                <th className="p-4.5 font-bold w-[8%]">Shift</th>
                                <th className="p-4.5 font-bold w-[15%]">Join Date & Time</th>
                                <th className="p-4.5 font-bold w-[8%]">Status</th>
                                <th className="p-4.5 font-bold w-[12%]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-[13px] divide-[#e6f0fa]">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="py-16 text-gray-400 text-sm">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 size={28} className="animate-spin text-[#527FB0]" />
                                            <p className="text-sm font-medium uppercase tracking-widest opacity-60">Loading records...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : staffMembers.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-16 text-gray-400 text-sm uppercase font-bold tracking-widest opacity-60">
                                        No staff members found.
                                    </td>
                                </tr>
                            ) : staffMembers.map((staff) => {
                                const rowId = staff.employeeId || staff._id;
                                return (
                                    <tr 
                                        key={staff._id} 
                                        id={`row-${rowId}`}
                                        className={`transition-all duration-1000 ${
                                            highlightedRow === rowId 
                                                ? 'bg-emerald-100/60 rounded-2xl relative z-20 scale-[1.01]' 
                                                : 'hover:bg-blue-50/30'
                                        }`}
                                    >
                                    <td className="p-4">
                                        <div className="font-semibold text-[#011023] text-sm tracking-wider">{staff.employeeId || '—'}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3 justify-center text-center">
                                            <p className="font-semibold text-[#011023] text-sm uppercase leading-tight">{staff.name}</p>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="text-xs font-semibold text-gray-500">{staff.phone || '—'}</div>
                                        <div className="font-medium lowercase text-sm mt-1">{staff.email || 'No email'}</div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex items-center uppercase justify-center gap-1.5 font-bold">
                                            <span className={`px-2.5 py-1 text-xs rounded-lg ${getRoleBadge(staff.role)}`}>
                                                {formatRole(staff.role)}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wide  ${staff.shift === 'Morning' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-purple-50 text-purple-600 border-purple-1000'}`}>
                                            {staff.shift || '—'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center uppercase">
                                        <div className="font-semibold text-[#011023]">
                                            {formatDate(staff.createdAt)}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="uppercase font-semibold text-gray-700">{staff.isVerified ? 'Verified' : 'Unverified'}</span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-center gap-1.5">
                                            <button onClick={() => handleViewDetails(staff)} className="text-gray-400 hover:text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition-colors" title="View Staff">
                                                <Eye size={17} />
                                            </button>

                                            <button onClick={() => handleEdit(staff)} className="text-gray-400 hover:text-amber-500 hover:bg-amber-50 p-1.5 rounded-lg transition-colors" title="Edit Staff">
                                                <Edit size={17} />
                                            </button>
                                            <button onClick={() => { setBanEmployee(staff); setBanReason(''); setBanSuccess(''); }} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title="Disable Staff">
                                                <UserX size={17} />
                                            </button>
                                            <button onClick={() => handleDownloadPDF(staff)} className="text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 p-1.5 rounded-lg transition-colors" title="Download Report">
                                                <Download size={17} />
                                            </button>
                                            <button onClick={() => { setEmployeeToDelete(staff); setIsDeleteModalOpen(true); }} className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title="Delete Staff">
                                                <Trash2 size={17} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* View Details Modal (MyBookings Alignment) */}
            {isViewModalOpen && selectedStaff && createPortal(
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#011023]/20 backdrop-blur-sm transition-all duration-300"
                    onClick={() => setIsViewModalOpen(false)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-6 flex justify-between items-center bg-gradient-to-r from-blue-50/50 to-white">
                            <div>
                                <h3 className="text-xl uppercase font-bold text-[#052558]">Staff Details</h3>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <p className="text-sm text-gray-500">ID: <span className="font-semibold text-gray-700">{selectedStaff.employeeId || '—'}</span></p>
                                    <button onClick={() => fetchServiceHistory(selectedStaff._id)} className="text-gray-400 p-1.5 rounded-lg transition-colors hover:text-blue-600 hover:bg-blue-50" title="Working Details">
                                        <Eye size={17} />
                                    </button>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsViewModalOpen(false)}
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
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Name:</span> <span className="font-semibold text-[#011023] truncate">{selectedStaff.name || '—'}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Phone:</span> <span className="font-semibold text-gray-800 truncate">{selectedStaff.phone || '—'}</span></p>
                                        <p className="text-sm flex pb-4"><span className="text-gray-500 w-16 shrink-0">Email:</span> <span className="font-semibold text-gray-800 truncate ">{selectedStaff.email || '—'}</span></p>
                                    </div>
                                </div>

                                {/* Employment Info */}
                                <div className="space-y-2 w-full md:w-[22%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Employment Info</h4>
                                    <div className="bg-blue-50/30 pt-4 rounded-xl uppercase space-y-2 border border-blue-50 min-h-[110px]">
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Role:</span> <span className="font-semibold ml-2 text-[#011023]">{formatRole(selectedStaff.role)}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Shift:</span> <span className="font-semibold ml-2 text-gray-800">{selectedStaff.shift || '—'}</span></p>
                                        <p className="text-sm flex pb-4"><span className="text-gray-500 w-16 shrink-0">Salary:</span> <span className="font-semibold ml-2 text-gray-800">{selectedStaff.salaryType || 'Monthly'}</span></p>
                                    </div>
                                </div>

                                {/* Payment & Status (Other Details) */}
                                <div className="flex flex-col gap-4.5 w-full md:w-[35%]">
                                    <div className="space-y-1.25">
                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Other Details</h4>
                                        <div className="flex items-center  gap-3">
                                            <h4 className="text-sm font-bold text-gray-400 uppercase mt-5 tracking-wider w-24">Status</h4>
                                            <div className="flex uppercase items-center gap-2">
                                                <span className={`px-2.5 py-1 ml-3 mt-4 text-[10px] font-black rounded-lg uppercase tracking-wider ${selectedStaff.isVerified ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-orange-50 text-orange-600 border border-orange-100'}`}>
                                                    {selectedStaff.isVerified ? 'Verified' : 'Pending'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider w-24">Agreement</h4>
                                            <span className="px-2.5 py-1 ml-3 text-[10px] font-black bg-blue-50 text-blue-600 rounded-lg uppercase tracking-wider border border-blue-100">
                                                Completed
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider w-24">Joined At</h4>
                                            <span className="text-xs ml-3 font-bold text-gray-600 uppercase">
                                                {formatDate(selectedStaff.createdAt, true)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Service Details (Legal Documentation style) */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Legal Documentation</h4>
                                <div className="bg-white border border-[#e6f0fa] p-6 rounded-xl shadow-sm">
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">PAN Card Number</p>
                                            <p className="text-[14px] font-bold text-[#052558] uppercase tracking-wider">{selectedStaff.panCard || '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Adhar Protocol</p>
                                            <p className="text-[14px] font-bold text-[#052558] uppercase tracking-wider">{selectedStaff.adharCard || '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Voter ID Registry</p>
                                            <p className="text-[14px] font-bold text-[#052558] uppercase tracking-wider">{selectedStaff.voterId || '—'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Residential Archive (Full Width) */}
                            <div className="space-y-2 ">
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Residential Archive</h4>
                                <div className="bg-white border border-[#e6f0fa] p-5 rounded-xl shadow-sm uppercase">
                                    <p className="text-xs font-bold text-gray-400 tracking-tight mb-1">Geographic Allocation</p>
                                    <h5 className="font-bold text-[#052558] text-[15.5px]">{selectedStaff.address || 'No Address Provided'}</h5>
                                    {/* <p className="text-sm text-gray-500 mt-1 uppercase">Physical Deployment Address Registry</p> */}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer - Actions */}

                    </div>
                </div>,
                document.body
            )}

            {/* Add Employee Modal */}
            {isAddModalOpen && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#011023]/20 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
                    <div className="relative w-full max-w-5xl bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50 animate-in fade-in zoom-in duration-200">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100/50 flex items-center justify-between bg-gradient-to-r from-emerald-50/60 to-transparent">
                            <div className="flex uppercase items-center gap-3">
                                <div>
                                    <h2 className="text-xl font-bold text-[#011023]">{isEditMode ? 'Update Employee' : 'Add New Employee'}</h2>
                                    <p className="text-xs text-gray-500 font-medium mt-0.5">{isEditMode ? 'Update existing credentials' : 'Register a new staff member'}</p>
                                </div>
                            </div>
                            <button onClick={() => { setIsAddModalOpen(false); setIsEditMode(false); }} className="p-2 hover:bg-white/80 rounded-full transition-colors text-gray-400 hover:text-gray-700">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-4 uppercase overflow-y-auto max-h-[70vh] hide-scrollbar">
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">Full Name</label>
                                    <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">Phone Number</label>
                                    <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">Email Address</label>
                                    <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none lowercase" />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">Role</label>
                                    <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none appearance-none cursor-pointer">
                                        <option value=""></option>
                                        <option value="Mechanic">MECHANIC</option>
                                        <option value="Manager">MANAGER</option>
                                        <option value="Technician">TECHNICIAN</option>
                                        <option value="Support">SUPPORT</option>
                                        <option value="Admin">ADMIN</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">Shift</label>
                                    <select value={form.shift} onChange={e => setForm({ ...form, shift: e.target.value })} className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none appearance-none cursor-pointer">
                                        <option value=""></option>
                                        <option value="Morning">MORNING</option>
                                        <option value="Evening">EVENING</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">Salary Type</label>
                                    <select value={form.salaryType} onChange={e => setForm({ ...form, salaryType: e.target.value })} className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none appearance-none cursor-pointer">
                                        <option value=""></option>
                                        <option value="Monthly">MONTHLY</option>
                                        <option value="Weekly">WEEKLY</option>
                                        <option value="Daily">DAILY</option>
                                        <option value="Hourly">HOURLY</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">PAN Card Number</label>
                                    <input value={form.panCard} onChange={e => setForm({ ...form, panCard: formatPAN(e.target.value) })} className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none" maxLength={10} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">Aadhar Card Number</label>
                                    <input value={form.adharCard} onChange={e => setForm({ ...form, adharCard: formatAadhar(e.target.value) })} className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none" maxLength={14} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">Voter ID</label>
                                    <input value={form.voterId} onChange={e => setForm({ ...form, voterId: formatVoter(e.target.value) })} className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none" maxLength={10} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-[#011023] mb-1.5">Residential Address</label>
                                <textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none h-16 resize-none" />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-white/30 border-t border-white/40 flex justify-end gap-3">
                            <button onClick={() => { setIsAddModalOpen(false); setIsEditMode(false); }} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-white/60 rounded-xl transition-all">Cancel</button>
                            <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-lg hover:shadow-emerald-600/25 disabled:opacity-60">
                                {saving ? (isEditMode ? 'Updating...' : 'Adding...') : (isEditMode ? 'Update Employee' : 'Add Employee')}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Disable Staff Modal */}
            {banEmployee && createPortal(
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#011023]/30 backdrop-blur-sm" onClick={() => setBanEmployee(null)} />
                    <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/50">
                        <div className="bg-gradient-to-r from-red-600 to-red-500 px-6 py-5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                                    <Ban size={18} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-white uppercase tracking-wide">Disable Account</h3>
                                    <p className="text-xs text-white/60 mt-0.5">{banEmployee.name}</p>
                                </div>
                            </div>
                            <button onClick={() => setBanEmployee(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all">
                                <X size={15} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {banSuccess ? (
                                <div className="flex flex-col items-center gap-3 py-4">
                                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                        <UserX size={22} className="text-red-500" />
                                    </div>
                                    <p className="text-sm font-bold text-[#011023] text-center uppercase tracking-tight">{banSuccess}</p>
                                </div>
                            ) : (
                                <>
                                    <p className="text-[13.5px] uppercase text-gray-500">Provide a reason for disabling <strong className="text-[#011023]">{banEmployee.name}</strong>. Access will be revoked immediately.</p>
                                    <div>
                                        <label className="text-[11px] text-gray-400 uppercase font-bold tracking-widest block mb-2">Reason</label>
                                        <textarea
                                            rows={3}
                                            value={banReason}
                                            onChange={e => setBanReason(e.target.value)}
                                            className="w-full border-2 border-gray-100 uppercase focus:border-red-200 bg-gray-50/50 rounded-2xl px-4 py-3 text-sm text-[#011023] placeholder-gray-300 outline-none resize-none transition-all"
                                        />
                                    </div>
                                    <div className="flex gap-3 pt-1">
                                        <button onClick={() => setBanEmployee(null)} className="flex-1 py-3 rounded-2xl border-2 border-gray-100 text-sm font-bold text-gray-400 hover:bg-gray-50 transition-all">CANCEL</button>
                                        <button
                                            onClick={handleBanSubmit}
                                            disabled={!banReason.trim() || banSubmitting}
                                            className="flex-1 py-3 rounded-2xl bg-red-500 text-white text-sm font-black uppercase tracking-wide hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {banSubmitting ? <><Loader2 size={13} className="animate-spin" /> DISABLING...</> : <><UserX size={13} /> DISABLE NOW</>}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && employeeToDelete && createPortal(
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#011023]/30 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)} />
                    <div className="relative w-full max-w-xl bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-white/50 animate-in fade-in zoom-in duration-200">
                        <div className="p-2 mt-7 mb-1 border-b border-gray-100/50 flex items-center justify-between bg-red-50/50 text-center flex-col gap-4">
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
                                    <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Total Records: <span className="text-[#011023] font-black">{serviceHistory.length}</span></p>
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

export default Staff;
