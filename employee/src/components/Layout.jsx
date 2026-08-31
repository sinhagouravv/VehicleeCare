import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import FilterButton from './FilterButton';
import SortButton from './SortButton';
import LabelButton from './LabelButton';
import { Bug, X, Send, Loader2, UploadCloud } from 'lucide-react';
import { useAlert } from '../context/AlertContext';
import UploadDocuments from '../pages/UploadDocuments';

const Layout = () => {
    const { triggerAlert } = useAlert();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
    const [isBugModalOpen, setIsBugModalOpen] = useState(false);
    const [isUploadDocModalOpen, setIsUploadDocModalOpen] = useState(false);
    const [bugTitle, setBugTitle] = useState('');
    const [bugDesc, setBugDesc] = useState('');
    const [bugSeverity, setBugSeverity] = useState('');
    const [isSubmittingBug, setIsSubmittingBug] = useState(false);

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    const handleBugSubmit = async (e) => {
        e.preventDefault();
        if (!bugTitle.trim()) {
            triggerAlert('Please enter the bug subject title', 'error');
            return;
        }
        if (!bugDesc.trim()) {
            triggerAlert('Please describe the bug before submitting', 'error');
            return;
        }

        setIsSubmittingBug(true);
        try {
            const storedUser = localStorage.getItem('employeeUser');
            const user = storedUser ? JSON.parse(storedUser) : { id: 'E001', name: 'Unknown Employee' };

            const res = await fetch('http://localhost:5001/api/bugs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reporterId: user.employeeId || user.id || user._id || 'E001',
                    reporterName: user.name || 'Employee Portal User',
                    portal: 'employee',
                    title: bugTitle,
                    description: bugDesc,
                    severity: bugSeverity
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                triggerAlert('Bug reported successfully! Thank you for your feedback.', 'success');
                setBugTitle('');
                setBugDesc('');
                setBugSeverity('');
                setIsBugModalOpen(false);
            } else {
                triggerAlert(data.message || 'Failed to submit bug report.', 'error');
            }
        } catch (error) {
            console.error('Error reporting bug:', error);
            triggerAlert('Network error. Failed to connect to server.', 'error');
        } finally {
            setIsSubmittingBug(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#fafbfc] flex text-[#011023] font-sans">
            {/* Ambient Background Elements */}
            <div className="fixed top-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-50/5 rounded-full blur-3xl opacity-10 transform-gpu pointer-events-none"></div>
            <div className="fixed bottom-[-10%] right-[-5%] w-[30%] h-[50%] bg-emerald-50/5 rounded-full blur-3xl opacity-10 transform-gpu pointer-events-none"></div>

            {/* Sidebar */}
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />

            {/* Main Content Area */}
            <div className={`flex-1 flex flex-col relative z-10 h-screen overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'ml-[5.5rem]' : 'ml-[16.75rem]'}`}>
                <Header />
                <main className="flex-1 overflow-y-auto p-8 hide-scrollbar relative">
                    {/* Content Outlet */}
                    <div className="relative z-10 w-full h-full border border-transparent">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Floating Label Button */}
            <LabelButton />

            {/* Floating Sort Button & Panel */}
            <SortButton />

            {/* Floating Filter Button & Panel */}
            <FilterButton />

            {/* Floating Upload Documents Button */}
            <button
                onClick={() => setIsUploadDocModalOpen(true)}
                className="fixed bottom-[6.15rem] right-9 z-50 p-3 rounded-full bg-white/80 backdrop-blur-md border border-blue-200 flex items-center justify-center text-[#527FB0] hover:bg-blue-50 hover:text-blue-500 transition-all shadow-sm hover:shadow-md cursor-pointer hover:scale-105 active:scale-95 duration-300 group">
                <UploadCloud size={24} className="group-hover:scale-110 transition-transform duration-300" />
            </button>

            {/* Floating Bug Report Button */}
            <button
                onClick={() => setIsBugModalOpen(true)}
                className="fixed bottom-9 right-9 z-50 p-3 rounded-full bg-blue-0 border border-blue-200 flex items-center justify-center text-[#527FB0] hover:bg-blue-50 hover:text-blue-500 transition-all shadow-sm hover:shadow-md cursor-pointer hover:scale-105 active:scale-95 duration-300 group"
            >
                <Bug size={24} className="group-hover:scale-110 transition-transform duration-300" />
            </button>

            {/* Upload Documents Modal */}
            {isUploadDocModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center">
                    <div className="absolute inset-0  bg-[#011023]/10 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsUploadDocModalOpen(false)} />
                    <div className="bg-white/95 backdrop-blur-2xl border border-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto hide-scrollbar relative z-10 p-5 space-y-4 animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="flex justify-start items-center">
                            <h3 className="text-xl font-bold text-[#011023] uppercase tracking-wide">
                                Upload Documents
                            </h3>
                        </div>

                        {/* Modal Body: UploadDocuments Component */}
                        <div className="pt-1">
                            <UploadDocuments />
                        </div>
                    </div>
                </div>
            )}

            {/* Bug Report Modal */}
            {isBugModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#011023]/10 backdrop-blur-sm" onClick={() => { setIsBugModalOpen(false); setBugTitle(''); setBugDesc(''); setBugSeverity(''); }} />
                    <div className="bg-white border border-[#cbd5e1] rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden relative z-10 p-6 space-y-6 animate-in zoom-in duration-200">
                        {/* Form Header */}
                        <div className="flex justify-between items-center pb-2">
                            <h3 className="text-xl font-bold text-[#011023] uppercase tracking-wide flex items-center gap-2">
                                Report a Bug
                            </h3>
                            <button
                                onClick={() => { setIsBugModalOpen(false); setBugTitle(''); setBugDesc(''); setBugSeverity(''); }}
                                className="p-2 text-gray-400 hover:text-[#011023] hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleBugSubmit} className="space-y-4.5 text-left">
                            <div className="space-y-2">
                                <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Subject</label>
                                <input
                                    type="text"
                                    value={bugTitle}
                                    onChange={(e) => setBugTitle(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] uppercase rounded-xl focus:outline-none focus:bg-white focus:border-[#a5b4fc] transition-all font-semibold normal-case text-sm text-[#011023]"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-semibold text-[#011023] uppercase tracking-wider">Description</label>
                                <textarea
                                    rows="4"
                                    value={bugDesc}
                                    onChange={(e) => setBugDesc(e.target.value)}
                                    className="w-full px-4 py-3 bg-[#f8fafc] border border-[#cbd5e1] rounded-xl focus:outline-none focus:bg-white focus:border-[#a5b4fc] transition-all font-semibold normal-case text-sm text-[#011023] resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmittingBug}
                                className="w-full py-2 bg-[#e0e7ff] border border-[#a5b4fc] text-[#3730a3] rounded-xl text-sm font-bold uppercase tracking-wider transition-all  shadow-sm mt-4 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isSubmittingBug ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" /> SUBMITTING...
                                    </>
                                ) : (
                                    <>
                                        <Send size={14} /> SUBMIT REPORT
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Layout;
