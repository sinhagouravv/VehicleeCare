import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { UserRoundPlus, X, Loader2 } from 'lucide-react';
import { useAlert } from '../context/AlertContext';

const AddEmployeeButton = ({ isMenuOpen = true, onModalToggle }) => {
    const { triggerAlert } = useAlert();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const buttonRef = useRef(null);

    const [form, setForm] = useState({
        name: '',
        phone: '',
        email: '',
        category: '',
        role: '',
        employmentType: '',
        shift: '',
        salaryType: '',
        address: '',
        garageId: 'GARAGE-01'
    });

    const handleOpenModal = () => {
        setIsAddModalOpen(true);
        if (onModalToggle) onModalToggle(true);
    };

    const handleCloseAddModal = () => {
        setIsAddModalOpen(false);
        setForm({
            name: '',
            phone: '',
            email: '',
            category: '',
            role: '',
            employmentType: '',
            shift: '',
            salaryType: '',
            address: '',
            garageId: 'GARAGE-01'
        });
        if (onModalToggle) onModalToggle(false);
    };

    const handleCategoryChange = (selectedCategory) => {
        setForm({
            ...form,
            category: selectedCategory,
            role: ''
        });
    };

    const handleSave = async () => {
        if (!form.name.trim()) return triggerAlert('Full Name is required', 'error');
        if (!form.phone.trim()) return triggerAlert('Phone Number is required', 'error');
        if (!form.email.trim()) return triggerAlert('Email Address is required', 'error');
        if (!form.employmentType) return triggerAlert('Employment Type is required', 'error');
        if (!form.category) return triggerAlert('Department is required', 'error');
        if (!form.role) return triggerAlert('Designation is required', 'error');

        setSaving(true);
        try {
            const res = await fetch('https://vehicleecare.onrender.com/api/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            const data = await res.json();
            if (res.ok && data.success) {
                triggerAlert('Employee added successfully!', 'success');
                handleCloseAddModal();
            } else {
                throw new Error(data.message || 'Failed to add employee');
            }
        } catch (err) {
            console.error('Error adding employee:', err);
            triggerAlert(err.message || 'Failed to add employee', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <button
                ref={buttonRef}
                onClick={handleOpenModal}
                className={`fixed bottom-[33.45rem] right-9 z-50 p-3 rounded-full border flex items-center justify-center transition-all duration-300 ease-out shadow-sm hover:shadow-md cursor-pointer hover:scale-105 active:scale-95 group ${
                    isMenuOpen
                        ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                        : 'opacity-0 scale-90 translate-y-4 pointer-events-none'
                } ${
                    isAddModalOpen
                        ? 'bg-blue-500 text-white border-blue-600 shadow-md'
                        : 'border-blue-200 text-[#527FB0] hover:bg-blue-50 hover:text-blue-500 bg-white/80 backdrop-blur-md'
                }`}
            >
                <UserRoundPlus size={24} className="group-hover:scale-110 transition-transform duration-300" />
            </button>

            {/* Add Employee Modal matching Staff.jsx */}
            {isAddModalOpen && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#011023]/10 backdrop-blur-sm" onClick={handleCloseAddModal} />
                    <div className="bg-white border border-[#cbd5e1] rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden relative z-10 p-6 space-y-6 animate-in zoom-in duration-200">
                        {/* Form Header */}
                        <div className="flex justify-between items-center pb-2">
                            <h3 className="text-xl font-bold text-[#011023] uppercase tracking-wide flex items-center gap-2">
                                Add New Employee
                            </h3>
                            <button
                                onClick={handleCloseAddModal}
                                className="text-gray-400 hover:text-[#011023] rounded-full transition-colors cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="space-y-4 uppercase overflow-y-auto max-h-[70vh] hide-scrollbar text-left">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Full Name</label>
                                    <input autoComplete="off" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] uppercase rounded-xl focus:outline-none focus:bg-white focus:border-[#a5b4fc] transition-all font-semibold font-sans text-xs text-[#011023]" />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Phone Number</label>
                                    <input autoComplete="off" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] uppercase rounded-xl focus:outline-none focus:bg-white focus:border-[#a5b4fc] transition-all font-semibold font-sans text-xs text-[#011023]" />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Email Address</label>
                                    <input autoComplete="off" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] lowercase rounded-xl focus:outline-none focus:bg-white focus:border-[#a5b4fc] transition-all font-semibold font-sans text-xs text-[#011023]" />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Employment Type</label>
                                    <select
                                        value={form.employmentType}
                                        onChange={e => setForm({ ...form, employmentType: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] uppercase rounded-xl focus:outline-none focus:bg-white focus:border-[#a5b4fc] transition-all font-semibold font-sans text-xs text-[#011023] appearance-none cursor-pointer"
                                    >
                                        <option value=""></option>
                                        <option value="Intern">INTERN</option>
                                        <option value="Full Time">FULL TIME</option>
                                        <option value="Part Time">PART TIME</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">DEPARTMENT</label>
                                    <select
                                        value={form.category}
                                        onChange={e => handleCategoryChange(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] uppercase rounded-xl focus:outline-none focus:bg-white focus:border-[#a5b4fc] transition-all font-semibold font-sans text-xs text-[#011023] appearance-none cursor-pointer"
                                    >
                                        <option value=""></option>
                                        <option value="Developer">DEVELOPER</option>
                                        <option value="Tester">TESTER</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">DESIGNATION</label>
                                    <select
                                        value={form.role}
                                        onChange={e => setForm({ ...form, role: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] uppercase rounded-xl focus:outline-none focus:bg-white focus:border-[#a5b4fc] transition-all font-semibold font-sans text-xs text-[#011023] appearance-none cursor-pointer"
                                    >
                                        <option value=""></option>
                                        {form.category === 'Developer' && (
                                            <>
                                                <option value="SDEI">SDE I</option>
                                                <option value="SDEII">SDE II</option>
                                                <option value="SDEIII">SDE III</option>
                                                <option value="Junior">JUNIOR</option>
                                                <option value="Senior">SENIOR</option>
                                                <option value="Associate">ASSOCIATE</option>
                                            </>
                                        )}
                                        {form.category === 'Tester' && (
                                            <>
                                                <option value="QA I">QA I</option>
                                                <option value="QA II">QA II</option>
                                                <option value="QA III">QA III</option>
                                                <option value="Senior QA">SENIOR QA</option>
                                            </>
                                        )}
                                    </select>
                                </div>
                                
                            </div>

                            {/* <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Shift</label>
                                    <select value={form.shift} onChange={e => setForm({ ...form, shift: e.target.value })} className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] uppercase rounded-xl focus:outline-none focus:bg-white focus:border-[#a5b4fc] transition-all font-semibold font-sans text-xs text-[#011023] appearance-none cursor-pointer">
                                        <option value=""></option>
                                        <option value="Morning">MORNING</option>
                                        <option value="Evening">EVENING</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Salary Type</label>
                                    <select value={form.salaryType} onChange={e => setForm({ ...form, salaryType: e.target.value })} className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] uppercase rounded-xl focus:outline-none focus:bg-white focus:border-[#a5b4fc] transition-all font-semibold font-sans text-xs text-[#011023] appearance-none cursor-pointer">
                                        <option value=""></option>
                                        <option value="Monthly">MONTHLY</option>
                                        <option value="Weekly">WEEKLY</option>
                                        <option value="Daily">DAILY</option>
                                        <option value="Hourly">HOURLY</option>
                                    </select>
                                </div>
                            </div> */}

                            <div className="space-y-2">
                                <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Residential Address</label>
                                <textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] uppercase rounded-xl focus:outline-none focus:bg-white focus:border-[#a5b4fc] transition-all font-semibold font-sans text-xs text-[#011023] h-16 resize-none" />
                            </div>
                        </div>

                        {/* Action Buttons (50-50) */}
                        <div className="flex items-center gap-3 pt-2 w-full">
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 py-1.5 bg-[#e0e7ff] border border-[#a5b4fc] text-[#3730a3] rounded-xl text-sm font-semibold uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" /> ADDING...
                                    </>
                                ) : (
                                    'ADD EMPLOYEE'
                                )}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default AddEmployeeButton;
