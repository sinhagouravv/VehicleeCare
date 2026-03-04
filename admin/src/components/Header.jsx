import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
    { name: 'Messages', path: '/messages' },
    { name: 'Reviews', path: '/reviews' },
    { name: 'Notifications', path: '/notifications' },
    { name: 'Settings', path: '/settings' },
    { name: 'Business', path: '/business' },
    { name: 'Parking', path: '/parking' },
    { name: 'Store', path: '/store' }
];

const Header = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [dbResults, setDbResults] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const wrapperRef = useRef(null);
    const navigate = useNavigate();

    const filteredPages = ADMIN_PAGES.filter(page =>
        page.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const allResults = [...filteredPages, ...dbResults];

    useEffect(() => {
        setSelectedIndex(-1);
    }, [searchTerm, isOpen, dbResults]);

    useEffect(() => {
        if (selectedIndex >= 0) {
            const el = document.getElementById(`search-item-${selectedIndex}`);
            if (el) el.scrollIntoView({ block: 'nearest' });
        }
    }, [selectedIndex]);

    const handleKeyDown = (e) => {
        if (!isOpen) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev < allResults.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedIndex >= 0 && selectedIndex < allResults.length) {
                const item = allResults[selectedIndex];
                handleSelect(item.path, item.id);
            } else if (allResults.length > 0) {
                const first = allResults[0];
                handleSelect(first.path, first.id);
            }
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
        navigate(path, { state: { highlightId: id } });
        setSearchTerm('');
        setIsOpen(false);
    };

    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <header className="h-20 bg-white/60 backdrop-blur-xl border-b border-[#e6f0fa] flex items-center sticky top-0 z-10 shadow-[0_4px_24px_rgba(5,37,88,0.02)]">
            <div className="w-full max-w-[92rem] mx-auto flex items-center justify-end">
                {/* Search Bar */}
                <div ref={wrapperRef} className={`relative flex items-center justify-end transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${isExpanded ? 'w-[17rem]' : 'w-9.5'}`}>
                    <div
                        className={`absolute left-0 top-1/2 transform -translate-y-1/2 flex items-center justify-center cursor-pointer z-10 w-10 h-10 transition-all duration-300 rounded-full ${isExpanded ? 'text-gray-500 hover:text-[#527FB0]' : 'text-[#052558] bg-[#e3efff] hover:bg-gray-50 border border-[#e6f0fa] shadow-[0_2px_8px_rgba(5,37,88,0.06)] scale-100 hover:scale-[1.02]'}`}
                        onClick={() => {
                            if (!isExpanded) {
                                setIsExpanded(true);
                                // Focus input after small delay to allow expansion
                                setTimeout(() => {
                                    const input = document.getElementById('global-search-input');
                                    if (input) input.focus();
                                }, 100);
                            } else if (!searchTerm) {
                                setIsExpanded(false);
                            }
                        }}
                    >
                        <Search size={18} />
                    </div>

                    <input
                        id="global-search-input"
                        type="text"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setIsOpen(true);
                        }}
                        onFocus={() => {
                            setIsOpen(true);
                            setIsExpanded(true);
                        }}
                        onBlur={() => {
                            if (!searchTerm) {
                                setIsExpanded(false);
                            }
                        }}
                        onKeyDown={handleKeyDown}
                        // placeholder={isExpanded ? "Search pages, IDs, users..." : ""}
                        className={`w-full pl-10 pr-4 h-10 bg-[#f0f6ff] border border-transparent rounded-[22px] focus:outline-none focus:bg-white focus:border-blue-100 focus:ring-2 focus:ring-[#527FB0]/20 transition-all duration-500 text-sm font-semibold text-[#011023] placeholder-gray-400 ${isExpanded ? 'opacity-100' : 'opacity-0 cursor-pointer'}`}
                    />

                    {/* Dropdown Results */}
                    {isOpen && searchTerm.trim() && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-blue-100 rounded-xl shadow-[0_10px_40px_-10px_rgba(5,37,88,0.15)] overflow-hidden py-2 z-50 max-h-[25rem] overflow-y-auto">

                            {/* Navigation Matches */}
                            {filteredPages.length > 0 && (
                                <div className="mb-2">
                                    <h4 className="px-4 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50">Admin Pages</h4>
                                    {filteredPages.map((page, index) => (
                                        <button
                                            key={`page-${index}`}
                                            id={`search-item-${index}`}
                                            onClick={() => handleSelect(page.path)}
                                            onMouseEnter={() => setSelectedIndex(index)}
                                            className={`w-full text-left px-4 py-2 text-sm font-medium text-[#011023] transition-colors flex items-center justify-between group ${selectedIndex === index ? 'bg-blue-50' : 'hover:bg-blue-50'}`}
                                        >
                                            Go to {page.name}
                                            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-white px-2 py-0.5 rounded shadow-sm border border-blue-100 text-blue-500 font-bold uppercase tracking-wider">Navigate</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Database Results */}
                            {searchTerm.trim().length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between px-4 py-1.5 bg-gray-50/50">
                                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Top Results</h4>
                                        {isSearching && <Loader2 size={12} className="animate-spin text-blue-400" />}
                                    </div>

                                    {!isSearching && dbResults.length === 0 && (
                                        <div className="px-4 py-4 text-sm text-gray-500 text-center flex flex-col items-center gap-1 opacity-70">
                                            <span>No matches found.</span>
                                        </div>
                                    )}

                                    {dbResults.map((result, idx) => (
                                        <button
                                            key={`db-${idx}`}
                                            id={`search-item-${filteredPages.length + idx}`}
                                            onClick={() => handleSelect(result.path, result.id)}
                                            onMouseEnter={() => setSelectedIndex(filteredPages.length + idx)}
                                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors border-l-[3px] group ${selectedIndex === filteredPages.length + idx ? 'bg-emerald-50 border-emerald-500' : 'hover:bg-emerald-50 border-transparent hover:border-emerald-500'}`}
                                        >
                                            <div className="flex items-center justify-between mb-0.5">
                                                <span className="font-bold text-[#011023] tracking-wide text-xs">{result.id}</span>
                                                <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-100/50 px-1.5 py-0.5 rounded shadow-sm">{result.type}</span>
                                            </div>
                                            <div className="flex items-center justify-between opacity-80 group-hover:opacity-100">
                                                <span className="font-medium text-gray-600 truncate mr-2">{result.name}</span>
                                                <span className="text-xs text-gray-400 truncate text-right">{result.subtitle}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {!isSearching && filteredPages.length === 0 && dbResults.length === 0 && (
                                <div className="px-4 py-6 text-sm text-gray-500 text-center">
                                    No results found for "{searchTerm}"
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Profile Icon */}
                <div className="ml-4 flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-tr from-[#052558] to-[#527FB0] shadow-md cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-300">
                    <span className="text-white text-sm font-black tracking-wider">A</span>
                </div>
            </div>
        </header>
    );
};

export default Header;
