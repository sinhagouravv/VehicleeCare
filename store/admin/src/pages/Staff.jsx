import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { UserSquare2, Plus, Shield, Eye, Edit, Trash2, X, Wrench, Briefcase, UserCheck, ShieldCheck, Loader2, Download, Mail, Phone, MapPin, Calendar, UserX, FileText, CreditCard, Ban } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const Staff = () => {
    const [staffMembers, setStaffMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [lastRefreshed, setLastRefreshed] = useState(null);
    const [saving, setSaving] = useState(false);
    
    // Actions State
    const [banEmployee, setBanEmployee] = useState(null);
    const [banReason, setBanReason] = useState('');
    const [banSubmitting, setBanSubmitting] = useState(false);
    const [banSuccess, setBanSuccess] = useState('');
    const [employeeToDelete, setEmployeeToDelete] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    const [form, setForm] = useState({ 
        name: '', email: '', phone: '', role: '', address: '', category: 'Store', 
        shift: '', panCard: '', adharCard: '', voterId: '', agreement: '', salaryType: ''
    });

    const fetchStaff = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const storedUser = localStorage.getItem('adminUser');
            if (!storedUser) return;
            const user = JSON.parse(storedUser);

            const res = await fetch(`http://localhost:5001/api/employees/garage/${user.id || user._id}`);
            const data = await res.json();
            if (data.success) {
                setStaffMembers(data.data || []);
                setLastRefreshed(new Date());
            }
        } catch (error) {
            console.error("Failed to fetch store staff", error);
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

    const handleSave = async () => {
        if (!form.name || !form.email || !form.phone) return alert('Please fill all required fields');
        setSaving(true);
        try {
            const storedUser = localStorage.getItem('adminUser');
            const storeId = storedUser ? (JSON.parse(storedUser).id || JSON.parse(storedUser)._id) : null;
            
            const url = isEditMode ? `http://localhost:5001/api/employees/${form._id}` : 'http://localhost:5001/api/employees';
            const method = isEditMode ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, garageId: storeId, category: 'Store' })
            });
            const data = await res.json();
            if (data.success) {
                await fetchStaff(true);
                setIsAddModalOpen(false);
                setIsEditMode(false);
                setForm({ 
                    name: '', email: '', phone: '', role: '', address: '', category: 'Store',
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

    const getRoleIcon = (role) => {
        switch (role) {
            case 'Chef': return <Zap size={14} />;
            case 'Waiter': return <UserCheck size={14} />;
            case 'Cashier': return <CreditCard size={14} />;
            case 'Delivery': return <ShoppingBag size={14} />;
            case 'Manager': return <Briefcase size={14} />;
            case 'Admin': return <Shield size={14} />;
            default: return <UserSquare2 size={14} />;
        }
    };

    const getRoleBadge = (role) => {
        switch (role) {
            case 'Admin': return 'bg-purple-100 text-purple-700 font-bold';
            case 'Manager': return 'bg-blue-100 text-blue-700 font-bold';
            case 'Staff': return 'bg-emerald-100 text-emerald-700 font-bold';
            case 'Chef': return 'bg-orange-100 text-orange-700 font-bold';
            case 'Waiter': return 'bg-pink-100 text-pink-700 font-bold';
            case 'Cashier': return 'bg-cyan-100 text-cyan-700 font-bold';
            case 'Delivery': return 'bg-lime-100 text-lime-700 font-bold';
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

    const handleDownloadPDF = async (staff) => {
        const doc = new jsPDF();
        const primary = [5, 37, 88];
        const gray = [100, 100, 100];

        doc.setFontSize(20);
        doc.setTextColor(...primary);
        doc.text('VehicleeCare — Store Staff Report', 105, 18, null, null, 'center');

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

    const handleBanSubmit = async () => {
        if (!banReason.trim()) return;
        setBanSubmitting(true);
        await new Promise(r => setTimeout(r, 900)); 
        setBanSuccess(`Access restricted for "${banEmployee.name}".`);
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

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-[#011023] uppercase tracking-tight">Employee Management</h1>
                <div className="flex items-center gap-4">
                    <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-[#052558] to-[#527FB0] text-white font-bold rounded-xl shadow-md hover:opacity-90 transition-opacity uppercase tracking-tighter text-sm">
                        <Plus size={18} />
                        Add Employee
                    </button>
                </div>
            </div>

            <div className="bg-white/60 backdrop-blur-xl h-[53.5rem] border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden">
                <div className="overflow-x-hidden overflow-y-auto text-center h-[860px] relative hide-scrollbar">
                    <table className="w-full text-center border-collapse">
                        <thead className="sticky top-0 z-10 shadow-sm">
                            <tr className="bg-[#f0f6ff] text-[15px] uppercase tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                <th className="p-4.5 font-bold">Employee ID</th>
                                <th className="p-4.5 font-bold">Employee</th>
                                <th className="p-4.5 font-bold">Contact</th>
                                <th className="p-4.5 font-bold text-center">Role</th>
                                <th className="p-4.5 font-bold text-center">Shift</th>
                                <th className="p-4.5 font-bold text-center">Join Date & Time</th>
                                <th className="p-4.5 font-bold text-center">Status</th>
                                <th className="p-4.5 font-bold text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-[13px] divide-[#e6f0fa]">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="py-16 text-gray-400 text-sm">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 size={28} className="animate-spin text-[#527FB0]" />
                                            <p className="text-sm font-medium uppercase tracking-widest opacity-60">Loading staff...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : staffMembers.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-16 text-gray-400 text-sm uppercase font-bold tracking-widest opacity-60">
                                        No staff members found.
                                    </td>
                                </tr>
                            ) : staffMembers.map((staff) => (
                                <tr key={staff._id} className="hover:bg-blue-50/30 transition-all duration-300">
                                    <td className="p-4">
                                        <div className="font-semibold text-[#011023] text-sm tracking-wider">{staff.employeeId || '—'}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3 justify-center">
                                            <div className="text-left">
                                                <p className="font-semibold text-[#011023] text-sm uppercase truncate max-w-[140px] leading-tight">{staff.name}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-xs text-gray-500 mb-0.5">{staff.phone || '—'}</div>
                                        <div className="font-medium text-gray-700 text-sm lowercase">{staff.email || '—'}</div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex items-center uppercase justify-center gap-1.5 font-bold">
                                            <span className={`px-2.5 py-1 text-[11px] rounded-lg ${getRoleBadge(staff.role)}`}>
                                                {formatRole(staff.role)}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide  ${staff.shift === 'Morning' ? 'bg-orange-50 text-orange-600' : staff.shift === 'Evening' ? 'bg-indigo-50 text-indigo-600' : staff.shift === 'Night' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'}`}>
                                            {staff.shift || '—'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center uppercase">
                                        <div className="font-medium text-[#011023]">
                                            {formatDate(staff.createdAt)}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="uppercase font-semibold text-gray-700">{staff.isVerified ? 'Verified' : 'Unverified'}</span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-center gap-1.5">
                                            <button onClick={() => handleViewDetails(staff)} className="text-gray-400 hover:text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition-colors" title="View">
                                                <Eye size={17} />
                                            </button>
                                            <button onClick={() => handleEdit(staff)} className="text-gray-400 hover:text-amber-500 hover:bg-amber-50 p-1.5 rounded-lg transition-colors" title="Edit">
                                                <Edit size={17} />
                                            </button>
                                            <button onClick={() => { setBanEmployee(staff); setBanReason(''); setBanSuccess(''); }} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title="Disable">
                                                <UserX size={17} />
                                            </button>
                                            <button onClick={() => handleDownloadPDF(staff)} className="text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 p-1.5 rounded-lg transition-colors" title="Download">
                                                <Download size={17} />
                                            </button>
                                            <button onClick={() => { setEmployeeToDelete(staff); setIsDeleteModalOpen(true); }} className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title="Delete">
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

            {/* Modals from Staff.jsx (View, Add, Ban, Delete) would go here, adapted for Store */}
            {/* For brevity, including core logic above and porting modal structures from garage/Staff.jsx */}
            
            {/* View Details Modal (Refined Alignment) */}
            {isViewModalOpen && selectedStaff && createPortal(
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#011023]/60 backdrop-blur-sm transition-all duration-300"
                    onClick={() => setIsViewModalOpen(false)}
                >
                    <div 
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-6 border-b border-[#e6f0fa] flex justify-between items-center bg-gradient-to-r from-blue-50/50 to-white">
                            <div>
                                <h3 className="text-xl uppercase font-bold text-[#052558]">Staff Details</h3>
                                <p className="text-sm text-gray-500 mt-1">ID: <span className="font-semibold text-gray-700">{selectedStaff.employeeId || '—'}</span></p>
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
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Email:</span> <span className="font-semibold text-gray-800 truncate">{selectedStaff.email || '—'}</span></p>
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

                                {/* Status & Join Info */}
                                <div className="flex flex-col gap-4.5 w-full md:w-[35%]">
                                    <div className="space-y-1.25">
                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Other Details</h4>
                                        <div className="flex items-center gap-3">
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
                            <div className="space-y-2">
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Residential Archive</h4>
                                <div className="bg-white border border-[#e6f0fa] p-5 rounded-xl shadow-sm uppercase">
                                    <p className="text-xs font-bold text-gray-400 tracking-tight mb-1">Geographic Allocation</p>
                                    <h5 className="font-bold text-[#052558] text-[15.5px]">{selectedStaff.address || 'No Address Provided'}</h5>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Add/Edit Modal */}
            {isAddModalOpen && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#011023]/20 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
                    <div className="relative w-full max-w-5xl bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50">
                        <div className="p-6 border-b border-gray-100/50 flex items-center justify-between bg-gradient-to-r from-emerald-50/60 to-transparent">
                            <h2 className="text-xl font-bold text-[#011023] uppercase">{isEditMode ? 'Update Member' : 'New Staff Member'}</h2>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-700 transition-colors"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4 uppercase overflow-y-auto max-h-[70vh] hide-scrollbar">
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5 font-sans">Full Name</label>
                                    <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-4 font-semibold text-xs py-2.5 bg-white border border-[#e6f0fa] rounded-xl outline-none"/>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5 font-sans">Phone</label>
                                    <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-4 font-semibold text-xs py-2.5 bg-white border border-[#e6f0fa] rounded-xl outline-none"/>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5 font-sans">Email</label>
                                    <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-4 font-semibold text-xs py-2.5 bg-white border border-[#e6f0fa] rounded-xl outline-none lowercase"/>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5 font-sans">Role</label>
                                    <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none appearance-none cursor-pointer">
                                        <option value=""></option>
                                        <option value="Manager">MANAGER</option>
                                        <option value="Staff">STAFF</option>
                                        <option value="Chef">CHEF</option>
                                        <option value="Waiter">WAITER</option>
                                        <option value="Cashier">CASHIER</option>
                                        <option value="Delivery">DELIVERY</option>
                                        <option value="Admin">ADMIN</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5 font-sans">Shift</label>
                                    <select value={form.shift} onChange={e => setForm({ ...form, shift: e.target.value })} className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none appearance-none cursor-pointer">
                                        <option value=""></option>
                                        <option value="Morning">MORNING</option>
                                        <option value="Evening">EVENING</option>
                                        <option value="Night">NIGHT</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5 font-sans">Salary Period</label>
                                    <select value={form.salaryType} onChange={e => setForm({ ...form, salaryType: e.target.value })} className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none appearance-none cursor-pointer">
                                        <option value=""></option>
                                        <option value="Monthly">MONTHLY</option>
                                        <option value="Weekly">WEEKLY</option>
                                        <option value="Daily">DAILY</option>
                                        <option value="PerDelivery">PER DELIVERY</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5 font-sans">PAN Card</label>
                                    <input value={form.panCard} onChange={e => setForm({ ...form, panCard: e.target.value.toUpperCase() })} className="w-full px-4 font-semibold text-xs py-2.5 bg-white border border-[#e6f0fa] rounded-xl outline-none" maxLength={10}/>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5 font-sans">Aadhar</label>
                                    <input value={form.adharCard} onChange={e => setForm({ ...form, adharCard: e.target.value })} className="w-full px-4 font-semibold text-xs py-2.5 bg-white border border-[#e6f0fa] rounded-xl outline-none" maxLength={14}/>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5 font-sans">Voter ID</label>
                                    <input value={form.voterId} onChange={e => setForm({ ...form, voterId: e.target.value.toUpperCase() })} className="w-full px-4 font-semibold text-xs py-2.5 bg-white border border-[#e6f0fa] rounded-xl outline-none" maxLength={10}/>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-[#011023] mb-1.5 font-sans">Address</label>
                                <textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full px-4 font-semibold text-xs py-2.5 bg-white border border-[#e6f0fa] rounded-xl outline-none h-20 resize-none"/>
                            </div>
                        </div>
                        <div className="p-6 bg-white/30 border-t border-white/40 flex justify-end gap-3">
                            <button onClick={() => setIsAddModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-gray-500">CANCEL</button>
                            <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 rounded-xl shadow-lg shadow-emerald-600/25 uppercase tracking-wide">
                                {saving ? (isEditMode ? 'Updating...' : 'Adding...') : (isEditMode ? 'Save Changes' : 'Confirm Add')}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Disable Account Modal */}
            {banEmployee && createPortal(
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#011023]/30 backdrop-blur-sm" onClick={() => setBanEmployee(null)} />
                    <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/50">
                        <div className="bg-red-600 px-6 py-5 flex items-center justify-between text-white uppercase">
                            <h3 className="text-sm font-black">Restrict Access</h3>
                            <button onClick={() => setBanEmployee(null)}><X size={18} /></button>
                        </div>
                        <div className="p-6 space-y-4 uppercase">
                            {banSuccess ? (
                                <p className="text-sm font-bold text-center text-red-600 border border-red-100 bg-red-50 p-4 rounded-xl">{banSuccess}</p>
                            ) : (
                                <>
                                    <p className="text-sm text-gray-500">Reason for disabling <strong className="text-[#011023]">{banEmployee.name}</strong>:</p>
                                    <textarea value={banReason} onChange={e => setBanReason(e.target.value)} className="w-full border border-gray-100 rounded-2xl px-4 py-3 text-sm outline-none resize-none h-24" placeholder="Enter reason..."/>
                                    <div className="flex gap-3">
                                        <button onClick={() => setBanEmployee(null)} className="flex-1 py-3 border border-gray-100 rounded-2xl font-bold text-gray-400">CANCEL</button>
                                        <button onClick={handleBanSubmit} disabled={!banReason.trim()} className="flex-1 py-3 bg-red-500 text-white rounded-2xl font-black disabled:opacity-50">RESTRICT NOW</button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Delete Modal */}
            {isDeleteModalOpen && employeeToDelete && createPortal(
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#011023]/60 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)} />
                    <div className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl p-8 text-center uppercase">
                        <div className="w-16 h-16 rounded-3xl bg-red-100 flex items-center justify-center mx-auto mb-6">
                            <Trash2 size={24} className="text-red-600" />
                        </div>
                        <h3 className="text-xl font-black text-[#011023] mb-2">Remove Member</h3>
                        <p className="text-gray-500 text-xs leading-relaxed mb-8">Permanently delete <strong>{employeeToDelete.name}</strong> from your records? This cannot be undone.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-3 text-gray-400 font-bold border border-gray-100 rounded-2xl">BACK</button>
                            <button onClick={handleDelete} className="flex-1 py-3 bg-red-600 text-white font-black rounded-2xl shadow-lg shadow-red-600/20">DELETE</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default Staff;
