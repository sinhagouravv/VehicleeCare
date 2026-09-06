import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const ADMIN_PAGES = [
    { name: 'Dashboard', path: '/' },
    { name: 'Analytics', path: '/analytics' },
    { name: 'Payments', path: '/payments' },
    { name: 'Services', path: '/services' },
    { name: 'Bookings', path: '/bookings' },
    { name: 'Users', path: '/users' },
    { name: 'Employees', path: '/employees' },
    { name: 'Garages', path: '/garages' },
    { name: 'Charging Stations', path: '/charging-stations' },
    { name: 'Bugs', path: '/bug' },
    { name: 'Remarks', path: '/remarks' },
    { name: 'Requests', path: '/request' },
    { name: 'Messages', path: '/messages' },
    { name: 'Reviews', path: '/reviews' },
    { name: 'Notifications', path: '/notifications' },
    { name: 'Settings', path: '/settings' },
    { name: 'Business', path: '/business' },
    { name: 'Parking', path: '/parking' },
    { name: 'Store', path: '/store' },
    { name: 'Upload Documents', path: '/upload-documents' }
];

const matchesPrefix = (text, query) => {
    if (!text || !query) return false;
    const t = String(text).trim().toLowerCase();
    const q = String(query).trim().toLowerCase();
    if (!q) return false;

    if (t.startsWith(q)) return true;

    const tClean = t.replace(/-/g, '');
    const qClean = q.replace(/-/g, '');
    if (tClean.startsWith(qClean)) return true;

    const words = t.split(/[\s_()/-]+/);
    if (words.some(w => w.startsWith(q))) return true;

    const numPart = tClean.replace(/^[a-z]+/i, '');
    if (numPart && numPart.startsWith(qClean)) return true;

    return false;
};

const Header = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [dbResults, setDbResults] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [isExpanded, setIsExpanded] = useState(false);

    const wrapperRef = useRef(null);
    const inputRef = useRef(null);
    const navSourceRef = useRef('keyboard');
    const pendingArrowDownRef = useRef(false);
    const pendingArrowUpRef = useRef(false);
    const navigate = useNavigate();
    const location = useLocation();

    const filteredPages = ADMIN_PAGES.filter(page =>
        matchesPrefix(page.name, searchTerm)
    );

    const filteredDbResults = dbResults.filter(result =>
        matchesPrefix(result.id, searchTerm)
    );

    const allResults = [...filteredPages, ...filteredDbResults];

    // Reset selection index when search query changes
    useEffect(() => {
        setSelectedIndex(-1);
        pendingArrowDownRef.current = false;
        pendingArrowUpRef.current = false;
        navSourceRef.current = 'keyboard';
    }, [searchTerm]);

    // Handle pending arrow selection when results load
    useEffect(() => {
        if (allResults.length > 0) {
            if (pendingArrowDownRef.current) {
                setSelectedIndex(0);
                pendingArrowDownRef.current = false;
            } else if (pendingArrowUpRef.current) {
                setSelectedIndex(allResults.length - 1);
                pendingArrowUpRef.current = false;
            }
        }
    }, [allResults.length]);

    // Ensure selectedIndex stays within bounds if allResults length shrinks
    useEffect(() => {
        if (selectedIndex >= allResults.length && allResults.length > 0) {
            setSelectedIndex(allResults.length - 1);
        }
    }, [allResults.length, selectedIndex]);

    // Scroll highlighted item into view smoothly
    useEffect(() => {
        if (selectedIndex >= 0) {
            const el = document.getElementById(`search-item-${selectedIndex}`);
            if (el) el.scrollIntoView({ block: 'nearest' });
        }
    }, [selectedIndex]);

    const mousePosRef = useRef({ x: -1, y: -1 });

    const handleKeyDown = (e) => {
        const isArrowDown = e.key === 'ArrowDown' || e.key === 'Down' || e.code === 'ArrowDown';
        const isArrowUp = e.key === 'ArrowUp' || e.key === 'Up' || e.code === 'ArrowUp';

        if (isArrowDown) {
            e.preventDefault();
            e.stopPropagation();
            navSourceRef.current = 'keyboard';
            if (!isOpen) {
                setIsOpen(true);
            }
            if (allResults.length === 0) {
                pendingArrowDownRef.current = true;
                pendingArrowUpRef.current = false;
                return;
            }
            setSelectedIndex(prev => (prev < 0 || prev >= allResults.length - 1 ? 0 : prev + 1));
        } else if (isArrowUp) {
            e.preventDefault();
            e.stopPropagation();
            navSourceRef.current = 'keyboard';
            if (!isOpen) {
                setIsOpen(true);
            }
            if (allResults.length === 0) {
                pendingArrowUpRef.current = true;
                pendingArrowDownRef.current = false;
                return;
            }
            setSelectedIndex(prev => (prev <= 0 ? allResults.length - 1 : prev - 1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            if (selectedIndex >= 0 && selectedIndex < allResults.length) {
                const item = allResults[selectedIndex];
                handleSelect(item.path, item.id);
            } else if (allResults.length > 0) {
                const first = allResults[0];
                handleSelect(first.path, first.id);
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            setIsOpen(false);
        }
    };

    const handleItemMouseMove = (e, index) => {
        if (mousePosRef.current.x === e.clientX && mousePosRef.current.y === e.clientY) {
            return;
        }
        mousePosRef.current = { x: e.clientX, y: e.clientY };
        navSourceRef.current = 'mouse';
        setSelectedIndex(index);
    };

    const handleItemMouseEnter = (e, index) => {
        if (mousePosRef.current.x === e.clientX && mousePosRef.current.y === e.clientY) {
            return;
        }
        mousePosRef.current = { x: e.clientX, y: e.clientY };
        navSourceRef.current = 'mouse';
        setSelectedIndex(index);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
                if (!searchTerm.trim()) {
                    setIsExpanded(false);
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [searchTerm]);

    // Debounced Search API
    useEffect(() => {
        const fetchDbResults = async () => {
            if (!searchTerm.trim()) {
                setDbResults([]);
                return;
            }
            setIsSearching(true);
            try {
                const res = await fetch(`http://localhost:5001/api/search?q=${encodeURIComponent(searchTerm)}`);
                if (res.ok) {
                    const data = await res.json();
                    setDbResults(data.data || []);
                }
            } catch (err) {
                console.error("Search API failed:", err);
            } finally {
                setIsSearching(false);
            }
        };

        const timer = setTimeout(fetchDbResults, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleSelect = (path, id = null) => {
        let targetPath = path;
        let navState = { highlightId: id };

        const modalRoutes = ['/bug', '/remarks', '/upload-documents', '/request'];

        if (modalRoutes.includes(path)) {
            if (path === '/bug') navState.openBugModal = true;
            else if (path === '/remarks') navState.openRemarkModal = true;
            else if (path === '/upload-documents') navState.openDocumentModal = true;
            else if (path === '/request') navState.openRequestModal = true;

            if (modalRoutes.includes(location.pathname)) {
                targetPath = '/';
            } else {
                targetPath = location.pathname;
            }
        }

        navigate(targetPath, { state: navState });
        setSearchTerm('');
        setIsOpen(false);
        setIsExpanded(false);
    };

    return (
        <header className="h-20 bg-white border-b border-[#e2e8f0] flex items-center sticky top-0 z-50 shadow-[0_4px_24px_rgba(5,37,88,0.02)] px-8">
            <div className="w-full max-w-[92rem] mx-auto flex items-center justify-end">
                {/* Search Bar */}
                <div ref={wrapperRef} className={`relative flex items-center transition-all duration-300 ease-out ${isExpanded ? 'w-[18rem] sm:w-[21rem]' : 'w-10'}`}>
                    {!isExpanded ? (
                        <button
                            type="button"
                            onClick={() => {
                                setIsExpanded(true);
                                setIsOpen(true);
                                setTimeout(() => {
                                    if (inputRef.current) inputRef.current.focus();
                                }, 50);
                            }}
                            className="w-10 h-10 rounded-full border border-blue-200 text-[#527FB0] hover:bg-blue-50 hover:text-blue-500 bg-white/80 backdrop-blur-md shadow-sm hover:shadow-md hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer transition-all duration-300"
                            title="Search"
                        >
                            <Search size={18} />
                        </button>
                    ) : (
                        <div className="relative w-full flex items-center">
                            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" />
                            
                            <input
                                ref={inputRef}
                                id="global-search-input"
                                type="text"
                                autoComplete="off"
                                autoCorrect="off"
                                autoCapitalize="off"
                                spellCheck={false}
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setIsOpen(true);
                                }}
                                onFocus={() => {
                                    setIsOpen(true);
                                }}
                                onKeyDown={handleKeyDown}
                                className={`w-full h-10 pl-10 ${searchTerm ? 'pr-9' : 'pr-4'} bg-white uppercase border border-gray-200 rounded-3xl focus:outline-none focus:bg-white focus:border-blue-200 focus:ring-1 focus:ring-blue-500/10 transition-all duration-300 text-sm font-semibold text-[#011023] placeholder-gray-400 shadow-xs`}
                            />

                            {searchTerm && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchTerm('');
                                        setIsOpen(false);
                                        if (inputRef.current) inputRef.current.focus();
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200/60 transition-colors z-10 cursor-pointer"
                                    title="Clear search"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    )}

                    {/* Dropdown Results */}
                    {isExpanded && isOpen && (searchTerm.trim() || isSearching) && (
                        <div 
                            onMouseLeave={() => {
                                navSourceRef.current = 'mouse';
                                setSelectedIndex(-1);
                            }}
                            className="absolute top-full left-0 w-[20rem] sm:w-[24.5rem] mt-2.5 rounded-2xl bg-white border border-blue-100 shadow-[0_12px_40px_-8px_rgba(5,37,88,0.18)] overflow-hidden z-50 max-h-[38rem] max-h-[90vh] overflow-y-auto hide-scrollbar animate-in fade-in slide-in-from-top-2 duration-200"
                        >

                            {/* Navigation Matches */}
                            {filteredPages.length > 0 && (
                                <div>
                                    <h4 className="sticky top-0 z-20 px-4 py-2.5 text-xs font-bold text-gray-400 uppercase tracking-widest bg-[#f8fafc] border-b border-gray-200/80 shadow-xs">Pages</h4>
                                    <div className="py-0 divide-y divide-gray-100">
                                        {filteredPages.map((page, index) => (
                                            <button
                                                key={`page-${index}`}
                                                id={`search-item-${index}`}
                                                onMouseDown={(e) => e.preventDefault()}
                                                onClick={() => handleSelect(page.path)}
                                                onMouseEnter={(e) => handleItemMouseEnter(e, index)}
                                                onMouseMove={(e) => handleItemMouseMove(e, index)}
                                                className={`w-full text-left px-4 py-2 text-sm font-medium transition-all flex items-center justify-between group cursor-pointer ${
                                                    selectedIndex === index ? 'bg-blue-100/70 text-[#052558] font-bold' : 'text-[#011023] hover:bg-blue-50'
                                                }`}
                                            >
                                                <span>Go to <span className="font-bold uppercase">{page.name}</span></span>
                                                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10.5px] bg-white px-2 py-0.75 rounded-full shadow-sm border border-blue-100 text-blue-500 font-semibold uppercase tracking-wider">Navigate</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Database Results */}
                            {(filteredDbResults.length > 0 || isSearching) && (
                                <div>
                                    <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-2 bg-[#f8fafc] border-b border-gray-200/80 shadow-xs">
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Top Results</h4>
                                        {isSearching && <Loader2 size={12} className="animate-spin text-blue-400" />}
                                    </div>

                                    <div className="py-0 divide-y divide-gray-100">
                                        {filteredDbResults.map((result, idx) => {
                                            const globalIdx = filteredPages.length + idx;
                                            const isSelected = selectedIndex === globalIdx;
                                            return (
                                                <button
                                                    key={`db-${idx}`}
                                                    id={`search-item-${globalIdx}`}
                                                    onMouseDown={(e) => e.preventDefault()}
                                                    onClick={() => handleSelect(result.path, result.id)}
                                                    onMouseEnter={(e) => handleItemMouseEnter(e, globalIdx)}
                                                    onMouseMove={(e) => handleItemMouseMove(e, globalIdx)}
                                                    className={`w-full text-left px-4 py-2 transition-all flex items-center justify-between group cursor-pointer ${
                                                        isSelected 
                                                            ? 'bg-emerald-100/70 text-[#011023]' 
                                                            : 'hover:bg-emerald-50/70'
                                                    }`}
                                                >
                                                    {/* Left Part: 70% Width (ID + Name) */}
                                                    <div className="w-[70%] pr-2 flex flex-col justify-center min-w-0">
                                                        <span className="font-semibold text-[#011023] tracking-wide text-[12.5px] truncate">{result.id}</span>
                                                        <span className="font-medium text-xs text-gray-600 truncate opacity-80 uppercase group-hover:opacity-100">{result.name}</span>
                                                    </div>

                                                    {/* Right Part: 30% Width (Type Badge) */}
                                                    <div className="w-[30%] flex items-center justify-end">
                                                        <span className="inline-block text-center text-[10px] font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-100/70 px-2.5 py-0.75 rounded-full shadow-2xs border border-emerald-200/60 truncate max-w-full">
                                                            {result.type}
                                                        </span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {!isSearching && filteredPages.length === 0 && filteredDbResults.length === 0 && (
                                <div className="px-4 py-6 text-sm text-gray-500 text-center">
                                    No results found for "<span className="font-semibold text-gray-700">{searchTerm}</span>"
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Profile Icon */}
                <div className="ml-4 flex items-center justify-center w-10 h-10 rounded-full border border-blue-200 text-[#527FB0] hover:bg-blue-50 hover:text-blue-500 bg-white/80 backdrop-blur-md transition-all shadow-sm hover:shadow-md cursor-pointer hover:scale-105 active:scale-95 duration-300 group">
                    <span className="text-[#052558] group-hover:text-blue-500 transition-colors text-sm font-bold uppercase tracking-wider">A</span>
                </div>
            </div>
        </header>
    );
};

export default Header;
