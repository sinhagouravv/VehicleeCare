import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import FilterButton from './FilterButton';
import SortButton from './SortButton';
import LabelButton from './LabelButton';
import AddEmployeeButton from './AddEmployeeButton';
import { Bug, MessageSquare, UploadCloud, ClipboardPen, Plus } from 'lucide-react';
import BugModal from '../pages/Bug';
import RemarkModal from '../pages/Remark';
import UploadDocumentsModal from '../pages/UploadDocuments';
import RequestModal from '../pages/Request';

const Layout = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
    const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
    const [isBugModalOpen, setIsBugModalOpen] = useState(false);
    const [isRemarkModalOpen, setIsRemarkModalOpen] = useState(false);
    const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

    const [hasNewRemark, setHasNewRemark] = useState(false);
    const [hasNewBug, setHasNewBug] = useState(false);
    const [hasNewDocument, setHasNewDocument] = useState(false);
    const [hasNewRequest, setHasNewRequest] = useState(false);
    const [modalHighlightId, setModalHighlightId] = useState(null);

    const latestRemarkCountRef = useRef(0);
    const latestBugCountRef = useRef(0);
    const latestDocCountRef = useRef(0);
    const latestRequestCountRef = useRef(0);
    const isRemarkModalOpenRef = useRef(isRemarkModalOpen);
    const isBugModalOpenRef = useRef(isBugModalOpen);
    const isDocumentModalOpenRef = useRef(isDocumentModalOpen);
    const isRequestModalOpenRef = useRef(isRequestModalOpen);

    const location = useLocation();
    const navigate = useNavigate();

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    useEffect(() => {
        if (location.state?.openBugModal) {
            setIsBugModalOpen(true);
            setIsRemarkModalOpen(false);
            setIsDocumentModalOpen(false);
            setIsRequestModalOpen(false);
            setModalHighlightId(location.state.highlightId || null);
            window.history.replaceState({}, document.title);
        } else if (location.state?.openRemarkModal) {
            setIsRemarkModalOpen(true);
            setIsBugModalOpen(false);
            setIsDocumentModalOpen(false);
            setIsRequestModalOpen(false);
            setModalHighlightId(location.state.highlightId || null);
            window.history.replaceState({}, document.title);
        } else if (location.state?.openDocumentModal) {
            setIsDocumentModalOpen(true);
            setIsBugModalOpen(false);
            setIsRemarkModalOpen(false);
            setIsRequestModalOpen(false);
            setModalHighlightId(location.state.highlightId || null);
            window.history.replaceState({}, document.title);
        } else if (location.state?.openRequestModal) {
            setIsRequestModalOpen(true);
            setIsBugModalOpen(false);
            setIsRemarkModalOpen(false);
            setIsDocumentModalOpen(false);
            setModalHighlightId(location.state.highlightId || null);
            window.history.replaceState({}, document.title);
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
        isDocumentModalOpenRef.current = isDocumentModalOpen;
        if (isDocumentModalOpen || location.pathname === '/upload-documents') {
            setHasNewDocument(false);
            localStorage.setItem('lastSeenDocumentCount', String(latestDocCountRef.current));
        }
    }, [isDocumentModalOpen, location.pathname]);

    useEffect(() => {
        isRequestModalOpenRef.current = isRequestModalOpen;
        if (isRequestModalOpen || location.pathname === '/request') {
            setHasNewRequest(false);
            localStorage.setItem('lastSeenRequestCount', String(latestRequestCountRef.current));
        }
    }, [isRequestModalOpen, location.pathname]);

    useEffect(() => {
        if (!location.state?.openBugModal && !location.state?.openRemarkModal && !location.state?.openDocumentModal && !location.state?.openRequestModal) {
            setIsBugModalOpen(false);
            setIsRemarkModalOpen(false);
            setIsDocumentModalOpen(false);
            setIsRequestModalOpen(false);
            setModalHighlightId(null);
        }
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

        try {
            const reqRes = await fetch('http://localhost:5001/api/requests');
            const reqData = await reqRes.json();
            if (reqData.success && Array.isArray(reqData.data)) {
                const count = reqData.data.length;
                latestRequestCountRef.current = count;
                const savedLastSeen = localStorage.getItem('lastSeenRequestCount');
                if (savedLastSeen === null) {
                    localStorage.setItem('lastSeenRequestCount', String(count));
                } else {
                    const lastSeen = parseInt(savedLastSeen, 10);
                    const isViewing = isRequestModalOpenRef.current || location.pathname === '/request';
                    if (count > lastSeen && !isViewing) {
                        setHasNewRequest(true);
                    } else if (isViewing) {
                        localStorage.setItem('lastSeenRequestCount', String(count));
                        setHasNewRequest(false);
                    }
                }
            }
        } catch (err) {
            // ignore fetch errors
        }

        try {
            const [empRes, garRes] = await Promise.all([
                fetch('http://localhost:5001/api/employees'),
                fetch('http://localhost:5001/api/garages')
            ]);
            const empData = await empRes.json();
            const garData = await garRes.json();

            let docCount = 0;
            if (empData.success && Array.isArray(empData.data)) {
                empData.data.forEach(emp => {
                    ['panCard', 'adharCard', 'voterId', 'drivingLicense', 'agreement', 'signature'].forEach(k => {
                        const fileUrl = emp[k];
                        if (fileUrl && typeof fileUrl === 'string' && (fileUrl.startsWith('http://') || fileUrl.startsWith('https://'))) {
                            docCount++;
                        }
                    });
                });
            }
            if (garData.success && Array.isArray(garData.data)) {
                garData.data.forEach(gar => {
                    ['panCard', 'adharCard', 'voterId', 'tradeLicense', 'agreement', 'signature', 'gstCert'].forEach(k => {
                        const fileUrl = gar[k];
                        if (fileUrl && typeof fileUrl === 'string' && (fileUrl.startsWith('http://') || fileUrl.startsWith('https://'))) {
                            docCount++;
                        }
                    });
                });
            }

            latestDocCountRef.current = docCount;
            const savedLastSeen = localStorage.getItem('lastSeenDocumentCount');
            if (savedLastSeen === null) {
                localStorage.setItem('lastSeenDocumentCount', String(docCount));
            } else {
                const lastSeen = parseInt(savedLastSeen, 10);
                const isViewing = isDocumentModalOpenRef.current || location.pathname === '/upload-documents';
                if (docCount > lastSeen && !isViewing) {
                    setHasNewDocument(true);
                } else if (isViewing) {
                    localStorage.setItem('lastSeenDocumentCount', String(docCount));
                    setHasNewDocument(false);
                }
            }
        } catch (err) {
            // ignore fetch errors
        }
    }, [location.pathname]);

    // Close speed dial tools menu on route change
    useEffect(() => {
        setIsToolsMenuOpen(false);
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
            {/* Plus (+) Toggle Button (5th position from bottom / 3rd position from top of tools stack) */}
            <button
                type="button"
                onClick={() => setIsToolsMenuOpen(prev => !prev)}
                className={`fixed bottom-[17.85rem] right-9 z-50 p-3 rounded-full border transition-all shadow-sm hover:shadow-md cursor-pointer hover:scale-105 active:scale-95 duration-300 group ${
                    isToolsMenuOpen 
                        ? 'bg-blue-500 text-white border-blue-600 shadow-md' 
                        : 'border-blue-200 text-[#527FB0] hover:bg-blue-50 hover:text-blue-500 bg-[#fafbfc]'
                }`}
            >
                <Plus size={24} className={`transition-transform duration-300 ${isToolsMenuOpen ? 'rotate-45' : 'group-hover:scale-110'}`} />
            </button>

            {/* Filter, Sort, Label & Add Employee Buttons (Smooth Expand / Collapse Upwards) */}
            <FilterButton isMenuOpen={isToolsMenuOpen} />
            <SortButton isMenuOpen={isToolsMenuOpen} />
            <LabelButton isMenuOpen={isToolsMenuOpen} />
            <AddEmployeeButton isMenuOpen={isToolsMenuOpen} />

            {/* Remark Button (4th position from top) */}
            <button
                type="button"
                onClick={() => {
                    setIsBugModalOpen(false);
                    setIsDocumentModalOpen(false);
                    setIsRequestModalOpen(false);
                    setModalHighlightId(null);
                    if (!isRemarkModalOpen) {
                        setHasNewRemark(false);
                        localStorage.setItem('lastSeenRemarkCount', String(latestRemarkCountRef.current));
                    }
                    setIsRemarkModalOpen(prev => !prev);
                }}
                className={`fixed bottom-[13.95rem] right-9 z-50 p-3 rounded-full border transition-all shadow-sm hover:shadow-md cursor-pointer hover:scale-105 active:scale-95 duration-300 group ${
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

            {/* Request Button (5th position from top) */}
            <button
                type="button"
                onClick={() => {
                    setIsBugModalOpen(false);
                    setIsRemarkModalOpen(false);
                    setIsDocumentModalOpen(false);
                    setModalHighlightId(null);
                    if (!isRequestModalOpen) {
                        setHasNewRequest(false);
                        localStorage.setItem('lastSeenRequestCount', String(latestRequestCountRef.current));
                    }
                    setIsRequestModalOpen(prev => !prev);
                }}
                className={`fixed bottom-[10.05rem] right-9 z-50 p-3 rounded-full border transition-all shadow-sm hover:shadow-md cursor-pointer hover:scale-105 active:scale-95 duration-300 group ${
                    isRequestModalOpen 
                        ? 'bg-blue-500 text-white border-blue-600 shadow-md' 
                        : 'border-blue-200 text-[#527FB0] hover:bg-blue-50 hover:text-blue-500 bg-white/80 backdrop-blur-md'
                }`}
            >
                <ClipboardPen size={24} className="group-hover:scale-110 transition-transform duration-300" />
                {hasNewRequest && !isRequestModalOpen && (
                    <span className="absolute -top-0.25 -right-1 flex h-3 w-3">
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600 ring-2 ring-white"></span>
                    </span>
                )}
            </button>

            {/* Document Button (6th position from top) */}
            <button
                type="button"
                onClick={() => {
                    setIsBugModalOpen(false);
                    setIsRemarkModalOpen(false);
                    setIsRequestModalOpen(false);
                    setModalHighlightId(null);
                    if (!isDocumentModalOpen) {
                        setHasNewDocument(false);
                        localStorage.setItem('lastSeenDocumentCount', String(latestDocCountRef.current));
                    }
                    setIsDocumentModalOpen(prev => !prev);
                }}
                className={`fixed bottom-[6.15rem] right-9 z-50 p-3 rounded-full border transition-all shadow-sm hover:shadow-md cursor-pointer hover:scale-105 active:scale-95 duration-300 group ${
                    isDocumentModalOpen 
                        ? 'bg-blue-500 text-white border-blue-600 shadow-md' 
                        : 'border-blue-200 text-[#527FB0] hover:bg-blue-50 hover:text-blue-500 bg-white/80 backdrop-blur-md'
                }`}
            >
                <UploadCloud size={24} className="group-hover:scale-110 transition-transform duration-300" />
                {hasNewDocument && !isDocumentModalOpen && (
                    <span className="absolute -top-0.25 -right-1 flex h-3 w-3">
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600 ring-2 ring-white"></span>
                    </span>
                )}
            </button>

            {/* Bug Button (7th position from top) */}
            <button
                type="button"
                onClick={() => {
                    setIsRemarkModalOpen(false);
                    setIsDocumentModalOpen(false);
                    setIsRequestModalOpen(false);
                    setModalHighlightId(null);
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

            {/* Request Pop-up Modal Container & Backdrop */}
            {isRequestModalOpen && (
                <>
                    <div 
                        className="fixed inset-y-0 left-0 right-1 bg-[#011023]/1 backdrop-blur-sm z-25 transition-all duration-300 animate-in fade-in duration-200 cursor-pointer"
                        onClick={() => { setIsRequestModalOpen(false); setModalHighlightId(null); }}
                    />

                    <div className={`fixed top-0 bottom-0 right-0 z-30 flex items-center justify-center p-6 transition-all duration-300 pointer-events-none ${isSidebarCollapsed ? 'left-[0.5rem]' : 'left-[16.75rem]'}`}>
                        <div className="bg-white border border-[#cbd5e1] rounded-3xl shadow-xl w-full max-w-[101rem] h-[93.75vh] overflow-hidden relative z-10 p-6 flex flex-col animate-in zoom-in duration-200 pointer-events-auto">
                            <RequestModal isModal onClose={() => { setIsRequestModalOpen(false); setModalHighlightId(null); }} highlightId={modalHighlightId} />
                        </div>
                    </div>
                </>
            )}

            {/* Document Pop-up Modal Container & Backdrop */}
            {isDocumentModalOpen && (
                <>
                    <div 
                        className="fixed inset-y-0 left-0 right-1 bg-[#011023]/1 backdrop-blur-sm z-25 transition-all duration-300 animate-in fade-in duration-200 cursor-pointer"
                        onClick={() => { setIsDocumentModalOpen(false); setModalHighlightId(null); }}
                    />

                    <div className={`fixed top-0 bottom-0 right-0 z-30 flex items-center justify-center p-6 transition-all duration-300 pointer-events-none ${isSidebarCollapsed ? 'left-[0.5rem]' : 'left-[16.75rem]'}`}>
                        <div className="bg-white border border-[#cbd5e1] rounded-3xl shadow-xl w-full max-w-[101rem] h-[93.75vh] overflow-hidden relative z-10 p-6 flex flex-col animate-in zoom-in duration-200 pointer-events-auto">
                            <UploadDocumentsModal isModal onClose={() => { setIsDocumentModalOpen(false); setModalHighlightId(null); }} highlightId={modalHighlightId} />
                        </div>
                    </div>
                </>
            )}

            {/* Remark Pop-up Modal Container & Backdrop */}
            {isRemarkModalOpen && (
                <>
                    <div 
                        className="fixed inset-y-0 left-0 right-1 bg-[#011023]/1 backdrop-blur-sm z-25 transition-all duration-300 animate-in fade-in duration-200 cursor-pointer"
                        onClick={() => { setIsRemarkModalOpen(false); setModalHighlightId(null); }}
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
