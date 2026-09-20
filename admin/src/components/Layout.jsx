import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import FilterButton from './FilterButton';
import SortButton from './SortButton';
import LabelButton from './LabelButton';
import AddEmployeeButton from './AddEmployeeButton';
import { Bug, MessageSquare, UploadCloud, ClipboardPen, Plus, Mail, Code2 } from 'lucide-react';
import BugModal from '../pages/Bug';
import RemarkModal from '../pages/Remark';
import UploadDocumentsModal from '../pages/UploadDocuments';
import RequestModal from '../pages/Request';
import GuestWelcomeModal from './GuestWelcomeModal';
import GuestAdminDetailsModal from './GuestAdminDetailsModal';
import DeveloperRequestsModal from './DeveloperRequestsModal';
import MailModal from './MailModal';
import useGuestSessionTimeout from '../hooks/useGuestSessionTimeout';
import useMultiTabAuthSync from '../hooks/useMultiTabAuthSync';
import { isGuestUser } from '../hooks/useGuestGuard';
import { fetchGuestCount } from '../utils/guestCounter';

const Layout = () => {
    useGuestSessionTimeout();
    useMultiTabAuthSync();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
    const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
    const [isBugModalOpen, setIsBugModalOpen] = useState(false);
    const [isRemarkModalOpen, setIsRemarkModalOpen] = useState(false);
    const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [isGuestAdminModalOpen, setIsGuestAdminModalOpen] = useState(false);
    const [isDevRequestsModalOpen, setIsDevRequestsModalOpen] = useState(false);
    const [isMailModalOpen, setIsMailModalOpen] = useState(false);
    const [guestCount, setGuestCount] = useState(() => {
        const cached = localStorage.getItem('lastGuestCount');
        return cached !== null && !isNaN(Number(cached)) ? Number(cached) : null;
    });
    const [isGuestCountLoading, setIsGuestCountLoading] = useState(() => {
        return localStorage.getItem('lastGuestCount') === null;
    });

    // Guest Logins counter polling
    useEffect(() => {
        let isMounted = true;
        const loadCount = async () => {
            const count = await fetchGuestCount();
            if (isMounted) {
                latestGuestCountRef.current = count;
                setGuestCount(count);
                setIsGuestCountLoading(false);
                localStorage.setItem('lastGuestCount', String(count));

                // Notify dot if new logins since last seen
                const savedLastSeen = localStorage.getItem('lastSeenGuestCount');
                if (savedLastSeen === null) {
                    // First ever load — save as seen so no dot on fresh install
                    localStorage.setItem('lastSeenGuestCount', String(count));
                } else if (!isGuestAdminModalOpenRef.current) {
                    const lastSeen = parseInt(savedLastSeen, 10);
                    if (count > lastSeen) {
                        setHasNewGuest(true);
                    }
                }
            }
        };
        loadCount();
        const interval = setInterval(loadCount, 8000);
        const handleCountUpdated = () => loadCount();
        window.addEventListener('guestCountUpdated', handleCountUpdated);
        return () => {
            isMounted = false;
            clearInterval(interval);
            window.removeEventListener('guestCountUpdated', handleCountUpdated);
        };
    }, []);

    const [hasNewRemark, setHasNewRemark] = useState(false);
    const [hasNewBug, setHasNewBug] = useState(false);
    const [hasNewDocument, setHasNewDocument] = useState(false);
    const [hasNewRequest, setHasNewRequest] = useState(false);
    const [hasNewGuest, setHasNewGuest] = useState(false);
    const [modalHighlightId, setModalHighlightId] = useState(null);

    const latestRemarkCountRef = useRef(0);
    const latestBugCountRef = useRef(0);
    const latestDocCountRef = useRef(0);
    const latestRequestCountRef = useRef(0);
    const latestGuestCountRef = useRef(0);
    const isGuestAdminModalOpenRef = useRef(isGuestAdminModalOpen);
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
            setIsGuestAdminModalOpen(false);
            setModalHighlightId(location.state.highlightId || null);
            window.history.replaceState({}, document.title);
        } else if (location.state?.openRemarkModal) {
            setIsRemarkModalOpen(true);
            setIsBugModalOpen(false);
            setIsDocumentModalOpen(false);
            setIsRequestModalOpen(false);
            setIsGuestAdminModalOpen(false);
            setModalHighlightId(location.state.highlightId || null);
            window.history.replaceState({}, document.title);
        } else if (location.state?.openDocumentModal) {
            setIsDocumentModalOpen(true);
            setIsBugModalOpen(false);
            setIsRemarkModalOpen(false);
            setIsRequestModalOpen(false);
            setIsGuestAdminModalOpen(false);
            setModalHighlightId(location.state.highlightId || null);
            window.history.replaceState({}, document.title);
        } else if (location.state?.openRequestModal) {
            setIsRequestModalOpen(true);
            setIsBugModalOpen(false);
            setIsRemarkModalOpen(false);
            setIsDocumentModalOpen(false);
            setIsGuestAdminModalOpen(false);
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

    // Clear guest dot when panel is opened
    useEffect(() => {
        isGuestAdminModalOpenRef.current = isGuestAdminModalOpen;
        if (isGuestAdminModalOpen) {
            setHasNewGuest(false);
            localStorage.setItem('lastSeenGuestCount', String(latestGuestCountRef.current));
        }
    }, [isGuestAdminModalOpen]);

    useEffect(() => {
        if (!location.state?.openBugModal && !location.state?.openRemarkModal && !location.state?.openDocumentModal && !location.state?.openRequestModal) {
            setIsBugModalOpen(false);
            setIsRemarkModalOpen(false);
            setIsDocumentModalOpen(false);
            setIsRequestModalOpen(false);
            setIsGuestAdminModalOpen(false);
            setIsDevRequestsModalOpen(false);
            setModalHighlightId(null);
        }
    }, [location.pathname]);

    const checkNewItems = useCallback(async () => {
        try {
            const remRes = await fetch('https://vehicleecare.onrender.com/api/remarks');
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
            const bugRes = await fetch('https://vehicleecare.onrender.com/api/bugs');
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
            const reqRes = await fetch('https://vehicleecare.onrender.com/api/requests');
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
                fetch('https://vehicleecare.onrender.com/api/employees'),
                fetch('https://vehicleecare.onrender.com/api/garages')
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

    const isAnyModalOpen = isBugModalOpen || isRemarkModalOpen || isDocumentModalOpen || isRequestModalOpen || isGuestAdminModalOpen || isDevRequestsModalOpen || isMailModalOpen;

    return (
        <div className="min-h-screen bg-[#fafbfc] flex text-[#011023] font-sans">
            <GuestWelcomeModal />
            {/* Ambient Background Elements */}
            <div className="fixed top-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-300/5 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="fixed bottom-[-10%] right-[-5%] w-[30%] h-[50%] bg-blue-400/5 rounded-full blur-[150px] pointer-events-none"></div>

            {/* Background Blur Overlay for Full App Container when Popup Modal is Open */}
            {isAnyModalOpen && (
                <div 
                    className="fixed inset-0 bg-[#011023]/1 backdrop-blur-1 z-20 pointer-events-none transition-all duration-300"
                />
            )}

            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />

            <div className={`flex-1 flex flex-col relative z-10 h-screen overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'ml-[5.5rem]' : 'ml-[15.75rem]'}`}>
                <Header isSidebarCollapsed={isSidebarCollapsed} />
                <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <Outlet context={{ isSidebarCollapsed }} />
                </main>
            </div>

            {/* Guest Logins Counter — stacked letter pill, top of right button column */}
            {!isGuestUser() && (
                <div 
                    onClick={() => {
                        setIsBugModalOpen(false);
                        setIsRemarkModalOpen(false);
                        setIsDocumentModalOpen(false);
                        setIsRequestModalOpen(false);
                        setIsDevRequestsModalOpen(false);
                        setIsMailModalOpen(false);
                        setModalHighlightId(null);
                        setIsGuestAdminModalOpen(prev => !prev);
                    }}
                    className={`fixed ${isAnyModalOpen ? 'top-[2.25rem]' : 'top-[7.25rem]'} right-9 z-40 flex flex-col items-center py-2.5 px-3 gap-0.5 border rounded-full select-none cursor-pointer transition-all duration-500 ease-in-out group shadow-xs hover:shadow-md ${
                        isGuestAdminModalOpen 
                            ? 'bg-blue-500 text-white border-blue-600 shadow-md' 
                            : 'border-blue-200 hover:border-blue-300 text-gray-600 hover:text-[#052558] bg-white/80 hover:bg-white backdrop-blur-sm'
                    }`}
                >
                    {/* New guest login dot — only shows when there are unseen new logins */}
                    {hasNewGuest && !isGuestAdminModalOpen && (
                        <span className="absolute -top-0.25 -right-1 flex h-3 w-3">
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600 ring-2 ring-white"></span>
                        </span>
                    )}
                    {['GC'].map((letter) => (
                        <span key={letter} className={`text-sm font-bold border-b pb-2.5 uppercase mt-1 mb-1 leading-tight transition-colors duration-500 ease-in-out ${
                            isGuestAdminModalOpen ? 'border-white text-white' : 'border-gray-500 group-hover:border-blue-500'
                        }`}>
                            {letter}
                        </span>
                    ))}
                    <span className={`min-w-6 h-6 flex items-center justify-center text-sm font-semibold transition-colors duration-500 ease-in-out ${
                        isGuestAdminModalOpen ? 'text-white' : 'text-[#052558]'}`}>
                        {guestCount === null || isGuestCountLoading ? (
                            <span className={`w-3.5 h-3.5 rounded-sm animate-pulse ${
                                isGuestAdminModalOpen ? 'bg-white/70' : 'bg-slate-300'
                            }`} />
                        ) : (
                            guestCount > 99 ? (
                                <span className="relative leading-none">99<span className="absolute -top-1 -right-1.5 text-[11px] font-semibold leading-none">+</span></span>
                            ) : guestCount
                        )}
                    </span>
                </div>
            )}

            {/* Mail Button — positioned directly under the Guest Logins Counter pill */}
            {!isGuestUser() && (
                <button
                    type="button"
                    onClick={() => {
                        setIsBugModalOpen(false);
                        setIsRemarkModalOpen(false);
                        setIsDocumentModalOpen(false);
                        setIsRequestModalOpen(false);
                        setIsGuestAdminModalOpen(false);
                        setIsDevRequestsModalOpen(false);
                        setModalHighlightId(null);
                        setIsMailModalOpen(prev => !prev);
                    }}
                    title="Sent Emails (User, Employee, Customer)"
                    className={`fixed ${isAnyModalOpen ? 'top-[8.15rem]' : 'top-[13.15rem]'} right-9 z-40 p-3 rounded-full border transition-all duration-500 ease-in-out shadow-sm hover:shadow-md cursor-pointer group ${
                        isMailModalOpen 
                            ? 'bg-blue-500 text-white border-blue-600 shadow-md' 
                            : 'border-blue-200 text-gray-600 hover:bg-blue-50 hover:text-blue-500 bg-white/80 backdrop-blur-md'
                    }`}
                >
                    <Mail size={24} className="font-semibold"/>
                </button>
            )}

            {/* Developer Requests Button (Leave, Meeting, Overtime) — positioned directly under the Mail button */}
            {!isGuestUser() && (
                <button
                    type="button"
                    onClick={() => {
                        setIsBugModalOpen(false);
                        setIsRemarkModalOpen(false);
                        setIsDocumentModalOpen(false);
                        setIsRequestModalOpen(false);
                        setIsGuestAdminModalOpen(false);
                        setIsMailModalOpen(false);
                        setModalHighlightId(null);
                        setIsDevRequestsModalOpen(prev => !prev);
                    }}
                    title="Developer Requests (Leave, Meeting, Overtime)"
                    className={`fixed ${isAnyModalOpen ? 'top-[12.05rem]' : 'top-[17.05rem]'} right-9 z-40 p-3 rounded-full border transition-all duration-500 ease-in-out shadow-sm hover:shadow-md cursor-pointer group ${
                        isDevRequestsModalOpen 
                            ? 'bg-blue-500 text-white border-blue-600 shadow-md' 
                            : 'border-blue-200 text-gray-600 hover:bg-blue-50 hover:text-blue-500 bg-white/80 backdrop-blur-md'
                    }`}
                >
                    <Code2 size={24} className="font-semibold"/>
                </button>
            )}

            {/* Floating Action Buttons & Panels */}
            {/* Plus (+) Toggle Button (5th position from bottom / 3rd position from top of tools stack) */}
            <button
                type="button"
                onClick={() => setIsToolsMenuOpen(prev => !prev)}
                className={`fixed bottom-[17.85rem] right-9 z-50 p-3 rounded-full border transition-all shadow-sm hover:shadow-md cursor-pointer duration-300 group ${
                    isToolsMenuOpen 
                        ? 'bg-blue-500 text-white border-blue-600 shadow-md' 
                        : 'border-blue-200 text-gray-600  hover:bg-blue-50 hover:text-blue-500 bg-[#fafbfc]'
                }`}
            >
                <Plus size={24} className={`transition-transform duration-300 ${isToolsMenuOpen ? 'rotate-45' : ''}`} />
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
                    setIsGuestAdminModalOpen(false);
                    setIsDevRequestsModalOpen(false);
                    setIsMailModalOpen(false);
                    setModalHighlightId(null);
                    if (!isRemarkModalOpen) {
                        setHasNewRemark(false);
                        localStorage.setItem('lastSeenRemarkCount', String(latestRemarkCountRef.current));
                    }
                    setIsRemarkModalOpen(prev => !prev);
                }}
                className={`fixed bottom-[13.95rem] right-9 z-50 p-3 rounded-full border transition-all shadow-sm hover:shadow-md cursor-pointer duration-300 group ${
                    isRemarkModalOpen 
                        ? 'bg-blue-500 text-white border-blue-600 shadow-md' 
                        : 'border-blue-200 text-gray-600 hover:bg-blue-50 hover:text-blue-500 bg-white/80 backdrop-blur-md'
                }`}
            >
                <MessageSquare size={24} className="transition-transform duration-300" />
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
                    setIsGuestAdminModalOpen(false);
                    setIsDevRequestsModalOpen(false);
                    setIsMailModalOpen(false);
                    setModalHighlightId(null);
                    if (!isRequestModalOpen) {
                        setHasNewRequest(false);
                        localStorage.setItem('lastSeenRequestCount', String(latestRequestCountRef.current));
                    }
                    setIsRequestModalOpen(prev => !prev);
                }}
                className={`fixed bottom-[10.05rem] right-9 z-50 p-3 rounded-full border transition-all shadow-sm hover:shadow-md cursor-pointer duration-300 group ${
                    isRequestModalOpen 
                        ? 'bg-blue-500 text-white border-blue-600 shadow-md' 
                        : 'border-blue-200 text-gray-600 hover:bg-blue-50 hover:text-blue-500 bg-white/80 backdrop-blur-md'
                }`}
            >
                <ClipboardPen size={24} className="transition-transform duration-300" />
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
                    setIsGuestAdminModalOpen(false);
                    setIsDevRequestsModalOpen(false);
                    setIsMailModalOpen(false);
                    setModalHighlightId(null);
                    if (!isDocumentModalOpen) {
                        setHasNewDocument(false);
                        localStorage.setItem('lastSeenDocumentCount', String(latestDocCountRef.current));
                    }
                    setIsDocumentModalOpen(prev => !prev);
                }}
                className={`fixed bottom-[6.15rem] right-9 z-50 p-3 rounded-full border transition-all shadow-sm hover:shadow-md cursor-pointer duration-300 group ${
                    isDocumentModalOpen 
                        ? 'bg-blue-500 text-white border-blue-600 shadow-md' 
                        : 'border-blue-200 text-gray-600 hover:bg-blue-50 hover:text-blue-500 bg-white/80 backdrop-blur-md'
                }`}
            >
                <UploadCloud size={24} className="transition-transform duration-300" />
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
                    setIsGuestAdminModalOpen(false);
                    setIsDevRequestsModalOpen(false);
                    setIsMailModalOpen(false);
                    setModalHighlightId(null);
                    if (!isBugModalOpen) {
                        setHasNewBug(false);
                        localStorage.setItem('lastSeenBugCount', String(latestBugCountRef.current));
                    }
                    setIsBugModalOpen(prev => !prev);
                }}
                className={`fixed bottom-9 right-9 z-50 p-3 rounded-full border transition-all shadow-sm hover:shadow-sm cursor-pointer duration-300 group ${
                    isBugModalOpen 
                        ? 'bg-blue-500 text-white border-blue-500 shadow-md' 
                        : 'border-blue-200 text-text-gray-500 hover:bg-blue-50 hover:text-blue-500 bg-white/80 backdrop-blur-md'
                }`}
            >
                <Bug size={24} className="transition-transform duration-300" />
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

                    <div className={`fixed top-0 bottom-0 right-0 z-30 flex items-center justify-center p-6 transition-all duration-300 pointer-events-none ${isSidebarCollapsed ? 'left-[0.5rem]' : 'left-[15.75rem]'}`}>
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

                    <div className={`fixed top-0 bottom-0 right-0 z-30 flex items-center justify-center p-6 transition-all duration-300 pointer-events-none ${isSidebarCollapsed ? 'left-[0.5rem]' : 'left-[15.75rem]'}`}>
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

                    <div className={`fixed top-0 bottom-0 right-0 z-30 flex items-center justify-center p-6 transition-all duration-300 pointer-events-none ${isSidebarCollapsed ? 'left-[0.5rem]' : 'left-[15.75rem]'}`}>
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
                    <div className={`fixed top-0 bottom-0 right-0 z-30 flex items-center justify-center p-6 transition-all duration-300 pointer-events-none ${isSidebarCollapsed ? 'left-[0.5rem]' : 'left-[15.75rem]'}`}>
                        <div className="bg-white border border-[#cbd5e1] rounded-3xl shadow-xl w-full max-w-[101rem] h-[93.75vh] overflow-hidden relative z-10 p-6 flex flex-col animate-in zoom-in duration-200 pointer-events-auto">
                            <BugModal isModal onClose={() => { setIsBugModalOpen(false); setModalHighlightId(null); }} highlightId={modalHighlightId} />
                        </div>
                    </div>
                </>
            )}

            {/* Guest Admin Details Modal */}
            <GuestAdminDetailsModal 
                isOpen={isGuestAdminModalOpen} 
                onClose={() => setIsGuestAdminModalOpen(false)} 
                guestCount={guestCount} 
                isSidebarCollapsed={isSidebarCollapsed}
            />

            {/* Developer Requests Modal (Leave, Meeting, Overtime) */}
            <DeveloperRequestsModal 
                isOpen={isDevRequestsModalOpen} 
                onClose={() => setIsDevRequestsModalOpen(false)} 
                isSidebarCollapsed={isSidebarCollapsed}
            />

            {/* Sent Emails Modal (User, Employee, Customer) */}
            <MailModal 
                isOpen={isMailModalOpen} 
                onClose={() => setIsMailModalOpen(false)} 
                isSidebarCollapsed={isSidebarCollapsed}
            />
        </div>
    );
};

export default Layout;
