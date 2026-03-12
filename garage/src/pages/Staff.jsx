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
                <div className="overflow-x-hidden overflow-y-auto text-center h-[860px] relative">
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
                            ) : staffMembers.map((staff) => (
                                <tr key={staff._id} className="hover:bg-blue-50/30 transition-all duration-300">
                                    <td className="p-4">
                                        <div className="font-bold text-[#011023] tracking-wider">{staff.employeeId || '—'}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3 justify-center">
                                            <div className="text-left">
                                                <p className="font-bold text-[#011023] text-sm uppercase truncate max-w-[140px] leading-tight">{staff.name}</p>
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
                                        <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-lg uppercase tracking-wider ${staff.shift === 'Morning' ? 'bg-orange-50 text-orange-600' : 'bg-indigo-50 text-indigo-600'}`}>
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
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* View Details Modal */}
            {isViewModalOpen && selectedStaff && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#011023]/60 backdrop-blur-sm">
                    <div className="bg-white rounded-[2rem] w-full max-w-4xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 relative">
                        {/* Decorative Background Elements */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-50/50 rounded-full -ml-24 -mb-24 blur-3xl opacity-50" />

                        {/* Modal Header */}
                        <div className="relative p-8 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50/40 to-transparent">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-[#052558] text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-blue-900/10">
                                    {selectedStaff.name?.charAt(0) || 'U'}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-[#011023] tracking-tight truncate max-w-[400px]">
                                        {selectedStaff.name}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-lg uppercase tracking-wider ${getRoleBadge(selectedStaff.role)}`}>
                                            {formatRole(selectedStaff.role)}
                                        </span>
                                        <span className="text-[11px] font-mono text-gray-400">ID: {selectedStaff.employeeId || '—'}</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setIsViewModalOpen(false)} className="p-2.5 hover:bg-white rounded-xl transition-all border border-transparent hover:border-gray-200">
                                <X size={20} className="text-gray-400 hover:text-gray-600" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="relative p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Column 1: Employment Details */}
                            <div className="space-y-6">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Employment Information</h4>
                                
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5 text-blue-600">
                                            <Mail size={12} /> Contact Information
                                        </p>
                                        <div className="space-y-1.5">
                                            <p className="text-sm font-bold text-[#011023]">{selectedStaff.email || '—'}</p>
                                            <p className="text-sm font-medium text-gray-500">{selectedStaff.phone || '—'}</p>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5 text-emerald-600">
                                            <Calendar size={12} /> Join Date & Status
                                        </p>
                                        <div className="space-y-1.5">
                                            <p className="text-sm font-bold text-[#011023] uppercase">
                                                {formatDate(selectedStaff.createdAt)}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wide ${selectedStaff.isVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {selectedStaff.isVerified ? 'Verified' : 'Pending Verification'}
                                                </span>
                                                <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wide ${selectedStaff.shift === 'Morning' ? 'bg-orange-100 text-orange-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                                    {selectedStaff.shift || 'Morning'}
                                                </span>
                                            </div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Salary Type: <span className="text-[#011023]">{selectedStaff.salaryType || 'Monthly'}</span></p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Column 2: Documents & Address */}
                            <div className="space-y-6">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Documentation & Location</h4>
                                
                                <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100/50 space-y-4">
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5 text-orange-600">
                                            <CreditCard size={12} /> Legal Documents
                                        </p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">PAN Card</p>
                                                <p className="text-xs font-bold text-[#011023] uppercase">{selectedStaff.panCard || '—'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Aadhar Card</p>
                                                <p className="text-xs font-bold text-[#011023] uppercase">{selectedStaff.adharCard || '—'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Voter ID</p>
                                                <p className="text-xs font-bold text-[#011023] uppercase">{selectedStaff.voterId || '—'}</p>
                                            </div>
                                            <div className="col-span-2">
                                                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Agreement</p>
                                                <p className="text-xs font-bold text-[#011023] uppercase">{selectedStaff.agreement || '—'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-gray-200/50">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5 text-emerald-600">
                                            <MapPin size={12} /> Residential Address
                                        </p>
                                        <div className="text-sm font-medium text-gray-600 leading-relaxed uppercase">
                                            {selectedStaff.address || 'No Address Provided'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
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
                        <div className="p-6 space-y-4 uppercase overflow-y-auto max-h-[70vh]">
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">Full Name</label>
                                    <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none"/>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">Phone Number</label>
                                    <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none"/>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">Email Address</label>
                                    <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none lowercase"/>
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
                                    <input value={form.panCard} onChange={e => setForm({ ...form, panCard: formatPAN(e.target.value) })} className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none" maxLength={10}/>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">Aadhar Card Number</label>
                                    <input value={form.adharCard} onChange={e => setForm({ ...form, adharCard: formatAadhar(e.target.value) })} className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none" maxLength={14}/>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#011023] mb-1.5">Voter ID</label>
                                    <input value={form.voterId} onChange={e => setForm({ ...form, voterId: formatVoter(e.target.value) })} className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none" maxLength={10}/>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-[#011023] mb-1.5">Residential Address</label>
                                <textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full uppercase px-4 font-semibold text-xs py-2.5 bg-white/50 border border-white/60 rounded-xl transition-all outline-none h-16 resize-none"/>
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
                    <div className="absolute inset-0 bg-[#011023]/60 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)} />
                    <div className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-white/50 animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100/50 flex items-center justify-between bg-red-50/50 text-center flex-col gap-4">
                             <div className="w-16 h-16 rounded-3xl bg-red-100 flex items-center justify-center shadow-inner">
                                <Trash2 size={24} className="text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-xl uppercase font-black text-[#011023]">Remove Member</h3>
                                <p className="text-xs text-red-500 font-bold uppercase tracking-widest mt-1">Permanent Removal</p>
                            </div>
                        </div>

                        <div className="p-8 text-center uppercase tracking-tight">
                            <h4 className="text-lg font-bold text-[#011023] mb-2">{employeeToDelete.name}</h4>
                            <p className="text-gray-500 text-xs leading-relaxed">
                                Are you sure you want to permanently delete this account? All performance records and credentials will be lost.
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

export default Staff;
