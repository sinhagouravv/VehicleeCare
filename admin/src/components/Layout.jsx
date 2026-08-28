import React, { useState, useEffect, useRef, useCallback } from 'react';
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

    const [hasNewRemark, setHasNewRemark] = useState(false);
    const [hasNewBug, setHasNewBug] = useState(false);
    const [modalHighlightId, setModalHighlightId] = useState(null);

    const latestRemarkCountRef = useRef(0);
    const latestBugCountRef = useRef(0);
    const isRemarkModalOpenRef = useRef(isRemarkModalOpen);
    const isBugModalOpenRef = useRef(isBugModalOpen);

    const location = useLocation();

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    useEffect(() => {
        if (location.state?.openBugModal) {
            setIsBugModalOpen(true);
            setIsRemarkModalOpen(false);
            setModalHighlightId(location.state.highlightId || null);
        } else if (location.state?.openRemarkModal) {
            setIsRemarkModalOpen(true);
            setIsBugModalOpen(false);
            setModalHighlightId(location.state.highlightId || null);
        }
    }, [location.state]);

    useEffect(() => {
        isRemarkModalOpenRef.current = isRemarkModalOpen;
        if (isRemarkModalOpen || location.pathname === '/remarks') {
            setHasNewRemark(false);
            localStorage.setItem('lastSeenRemarkCount', String(latestRemarkCountRef.current));
        }
    }, [isRemarkModalOpen, location.pathname]);

    useEffect(() => {
        isBugModalOpenRef.current = isBugModalOpen;
        if (isBugModalOpen || location.pathname === '/bug') {
            setHasNewBug(false);
            localStorage.setItem('lastSeenBugCount', String(latestBugCountRef.current));
        }
    }, [isBugModalOpen, location.pathname]);

    useEffect(() => {
        setIsBugModalOpen(false);
        setIsRemarkModalOpen(false);
        setModalHighlightId(null);
    }, [location.pathname]);

    const checkNewItems = useCallback(async () => {
        try {
            const remRes = await fetch('http://localhost:5001/api/remarks');
            const remData = await remRes.json();
            if (remData.success && Array.isArray(remData.data)) {
                const count = remData.data.length;
                latestRemarkCountRef.current = count;
                const savedLastSeen = localStorage.getItem('lastSeenRemarkCount');
                if (savedLastSeen === null) {
                    localStorage.setItem('lastSeenRemarkCount', String(count));
                } else {
                    const lastSeen = parseInt(savedLastSeen, 10);
                    const isViewing = isRemarkModalOpenRef.current || location.pathname === '/remarks';
                    if (count > lastSeen && !isViewing) {
                        setHasNewRemark(true);
                    } else if (isViewing) {
                        localStorage.setItem('lastSeenRemarkCount', String(count));
                        setHasNewRemark(false);
                    }
                }
            }
        } catch (err) {
            // ignore fetch errors
        }

        try {
            const bugRes = await fetch('http://localhost:5001/api/bugs');
            const bugData = await bugRes.json();
            if (bugData.success && Array.isArray(bugData.data)) {
                const count = bugData.data.length;
                latestBugCountRef.current = count;
                const savedLastSeen = localStorage.getItem('lastSeenBugCount');
                if (savedLastSeen === null) {
                    localStorage.setItem('lastSeenBugCount', String(count));
                } else {
                    const lastSeen = parseInt(savedLastSeen, 10);
                    const isViewing = isBugModalOpenRef.current || location.pathname === '/bug';
                    if (count > lastSeen && !isViewing) {
                        setHasNewBug(true);
                    } else if (isViewing) {
                        localStorage.setItem('lastSeenBugCount', String(count));
                        setHasNewBug(false);
                    }
                }
            }
        } catch (err) {
            // ignore fetch errors
        }
    }, [location.pathname]);

    useEffect(() => {
        checkNewItems();
        const interval = setInterval(checkNewItems, 3000);
        return () => clearInterval(interval);
    }, [checkNewItems]);

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
                    if (!isRemarkModalOpen) {
                        setHasNewRemark(false);
                        localStorage.setItem('lastSeenRemarkCount', String(latestRemarkCountRef.current));
                    }
                    setIsRemarkModalOpen(prev => !prev);
                }}
                className={`fixed bottom-[6.6rem] right-9 z-50 p-3 rounded-full border transition-all shadow-sm hover:shadow-md cursor-pointer hover:scale-105 active:scale-95 duration-300 group ${
                    isRemarkModalOpen 
                        ? 'bg-blue-500 text-white border-blue-600 shadow-md' 
                        : 'border-blue-200 text-[#527FB0] hover:bg-blue-50 hover:text-blue-500 bg-white/80 backdrop-blur-md'
                }`}
            >
                <MessageSquare size={24} className="group-hover:scale-110 transition-transform duration-300" />
                {hasNewRemark && !isRemarkModalOpen && (
                    <span className="absolute -top-0.25 -right-1 flex h-3 w-3">
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600 ring-2 ring-white"></span>
                    </span>
                )}
            </button>

            {/* Bug Button */}
            <button
                type="button"
                onClick={() => {
                    setIsRemarkModalOpen(false);
                    if (!isBugModalOpen) {
                        setHasNewBug(false);
                        localStorage.setItem('lastSeenBugCount', String(latestBugCountRef.current));
                    }
                    setIsBugModalOpen(prev => !prev);
                }}
                className={`fixed bottom-9 right-9 z-50 p-3 rounded-full border transition-all shadow-sm hover:shadow-md cursor-pointer hover:scale-105 active:scale-95 duration-300 group ${
                    isBugModalOpen 
                        ? 'bg-blue-500 text-white border-blue-500 shadow-md' 
                        : 'border-blue-200 text-[#527FB0] hover:bg-blue-50 hover:text-blue-500 bg-white/80 backdrop-blur-md'
                }`}
            >
                <Bug size={24} className="group-hover:scale-110 transition-transform duration-300" />
                {hasNewBug && !isBugModalOpen && (
                    <span className="absolute -top-0.25 -right-1 flex h-3 w-3">
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600 ring-2 ring-white"></span>
                    </span>
                )}
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
                            <RemarkModal isModal onClose={() => { setIsRemarkModalOpen(false); setModalHighlightId(null); }} highlightId={modalHighlightId} />
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
                        onClick={() => { setIsBugModalOpen(false); setModalHighlightId(null); }}
                    />

                    {/* Modal Container */}
                    <div className={`fixed top-0 bottom-0 right-0 z-30 flex items-center justify-center p-6 transition-all duration-300 pointer-events-none ${isSidebarCollapsed ? 'left-[0.5rem]' : 'left-[16.75rem]'}`}>
                        <div className="bg-white border border-[#cbd5e1] rounded-3xl shadow-xl w-full max-w-[101rem] h-[93.75vh] overflow-hidden relative z-10 p-6 flex flex-col animate-in zoom-in duration-200 pointer-events-auto">
                            <BugModal isModal onClose={() => { setIsBugModalOpen(false); setModalHighlightId(null); }} highlightId={modalHighlightId} />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Layout;
