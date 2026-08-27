import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import FilterButton from './FilterButton';
import SortButton from './SortButton';
import LabelButton from './LabelButton';
import { Bug, MessageSquare } from 'lucide-react';
import BugModal from '../pages/Bug';
import RemarkModal from '../pages/Remark';

const Layout = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
    const [isBugModalOpen, setIsBugModalOpen] = useState(false);
    const [isRemarkModalOpen, setIsRemarkModalOpen] = useState(false);
    const location = useLocation();

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    useEffect(() => {
        setIsBugModalOpen(false);
        setIsRemarkModalOpen(false);
    }, [location.pathname]);

    return (
        <div className="min-h-screen bg-[#fafbfc] flex text-[#011023] font-sans">
            {/* Ambient Background Elements */}
            <div className="fixed top-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-300/5 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="fixed bottom-[-10%] right-[-5%] w-[30%] h-[50%] bg-blue-400/5 rounded-full blur-[150px] pointer-events-none"></div>

            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />

            <div className={`flex-1 flex flex-col relative z-10 h-screen overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'ml-[5.5rem]' : 'ml-[16.75rem]'}`}>
                <Header />
                <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <Outlet />
                </main>
            </div>

            {/* Floating Action Buttons & Panels */}
            <FilterButton />
            <SortButton />
            <LabelButton />

            {/* Remark Button */}
            <button
                type="button"
                onClick={() => {
                    setIsBugModalOpen(false);
                    setIsRemarkModalOpen(prev => !prev);
                }}
                className={`fixed bottom-[6.6rem] right-9 z-50 p-3 rounded-full border transition-all shadow-sm hover:shadow-md cursor-pointer hover:scale-105 active:scale-95 duration-300 group ${
                    isRemarkModalOpen 
                        ? 'bg-blue-500 text-white border-blue-600 shadow-md' 
                        : 'border-blue-200 text-[#527FB0] hover:bg-blue-50 hover:text-blue-500 bg-white/80 backdrop-blur-md'
                }`}
            >
                <MessageSquare size={24} className="group-hover:scale-110 transition-transform duration-300" />
            </button>

            {/* Bug Button */}
            <button
                type="button"
                onClick={() => {
                    setIsRemarkModalOpen(false);
                    setIsBugModalOpen(prev => !prev);
                }}
                className={`fixed bottom-9 right-9 z-50 p-3 rounded-full border transition-all shadow-sm hover:shadow-md cursor-pointer hover:scale-105 active:scale-95 duration-300 group ${
                    isBugModalOpen 
                        ? 'bg-blue-500 text-white border-blue-500 shadow-md' 
                        : 'border-blue-200 text-[#527FB0] hover:bg-blue-50 hover:text-blue-500 bg-white/80 backdrop-blur-md'
                }`}
            >
                <Bug size={24} className="group-hover:scale-110 transition-transform duration-300" />
            </button>

            {/* Remark Pop-up Modal Container & Backdrop */}
            {isRemarkModalOpen && (
                <>
                    <div 
                        className="fixed inset-y-0 left-0 right-1 bg-[#011023]/1 backdrop-blur-sm z-25 transition-all duration-300 animate-in fade-in duration-200 cursor-pointer"
                        onClick={() => setIsRemarkModalOpen(false)}
                    />

                    <div className={`fixed top-0 bottom-0 right-0 z-30 flex items-center justify-center p-6 transition-all duration-300 pointer-events-none ${isSidebarCollapsed ? 'left-[0.5rem]' : 'left-[16.75rem]'}`}>
                        <div className="bg-white border border-[#cbd5e1] rounded-3xl shadow-xl w-full max-w-[101rem] h-[93.75vh] overflow-hidden relative z-10 p-6 flex flex-col animate-in zoom-in duration-200 pointer-events-auto">
                            <RemarkModal isModal onClose={() => setIsRemarkModalOpen(false)} />
                        </div>
                    </div>
                </>
            )}

            {/* Bug Pop-up Modal Container & Backdrop */}
            {isBugModalOpen && (
                <>
                    {/* Backdrop Blur covering Sidebar (left-0), Top, and Bottom, stopping before right action buttons (right-28) */}
                    <div 
                        className="fixed inset-y-0 left-0 right-1 bg-[#011023]/1 backdrop-blur-sm z-25 transition-all duration-300 animate-in fade-in duration-200 cursor-pointer"
                        onClick={() => setIsBugModalOpen(false)}
                    />

                    {/* Modal Container */}
                    <div className={`fixed top-0 bottom-0 right-0 z-30 flex items-center justify-center p-6 transition-all duration-300 pointer-events-none ${isSidebarCollapsed ? 'left-[0.5rem]' : 'left-[16.75rem]'}`}>
                        <div className="bg-white border border-[#cbd5e1] rounded-3xl shadow-xl w-full max-w-[101rem] h-[93.75vh] overflow-hidden relative z-10 p-6 flex flex-col animate-in zoom-in duration-200 pointer-events-auto">
                            <BugModal isModal onClose={() => setIsBugModalOpen(false)} />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Layout;
