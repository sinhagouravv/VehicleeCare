import React, { useRef, useEffect } from 'react';
import { ArrowUpDown, X, RotateCcw } from 'lucide-react';
import { useFilter } from '../context/FilterContext';

const SortButton = ({ isMenuOpen = true }) => {
    const {
        filterConfig,
        isSortOpen,
        setIsSortOpen,
        isFilterOpen: _isFilterOpen,
        setIsFilterOpen,
        isLabelMode: _isLabelMode,
        setIsLabelMode,
        activeFilters,
        setFilterValue,
        resultsCount
    } = useFilter();

    const popupRef = useRef(null);
    const buttonRef = useRef(null);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                isSortOpen &&
                popupRef.current &&
                !popupRef.current.contains(e.target) &&
                buttonRef.current &&
                !buttonRef.current.contains(e.target)
            ) {
                setIsSortOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isSortOpen, setIsSortOpen]);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isSortOpen) {
                setIsSortOpen(false);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isSortOpen, setIsSortOpen]);

    const handleOpenToggle = () => {
        if (!isSortOpen) {
            setIsFilterOpen(false);
            setIsLabelMode(false);
        }
        setIsSortOpen(!isSortOpen);
    };

    const currentSortOrder = activeFilters.sortOrder || 'latest';
    const currentTimeRange = activeFilters.timeRange || 'all';

    const hasActiveSort = Boolean(filterConfig?.hasSort && (currentSortOrder !== 'latest' || currentTimeRange !== 'all'));

    const resetSort = () => {
        setFilterValue('sortOrder', 'latest');
        setFilterValue('timeRange', 'all');
    };

    const sortGroups = [
        {
            id: 'sortOrder',
            label: 'Sort Order',
            options: [
                { label: 'Latest to Oldest', value: 'latest' },
                { label: 'Oldest to Latest', value: 'oldest' }
            ]
        },
        {
            id: 'timeRange',
            label: 'Time Period',
            options: [
                { label: 'All Time', value: 'all' },
                { label: 'Last Week', value: 'week' },
                { label: 'Last Month', value: 'month' }
            ]
        }
    ];

    return (
        <>
            {/* Floating Sort Button placed right above Filter button */}
            <button
                ref={buttonRef}
                onClick={handleOpenToggle}
                className={`fixed bottom-[25.65rem] right-9 z-50 p-3 rounded-full border flex items-center justify-center transition-all duration-300 ease-out shadow-sm hover:shadow-md cursor-pointer hover:scale-105 active:scale-95 group ${
                    isMenuOpen
                        ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                        : 'opacity-0 scale-90 translate-y-4 pointer-events-none'
                } ${
                    isSortOpen
                        ? 'bg-blue-500 text-white border-blue-600 shadow-md'
                        : hasActiveSort
                        ? 'bg-blue-50/80 border-blue-400 text-blue-600'
                        : 'border-blue-200 text-[#527FB0] hover:bg-blue-50 hover:text-blue-500 bg-white/80 backdrop-blur-md'
                }`}
            >
                <ArrowUpDown size={24} className="group-hover:scale-110 transition-transform duration-300" />
                {hasActiveSort && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600 ring-2 ring-white"></span>
                    </span>
                )}
            </button>

            {/* Floating Sort Popover */}
            {isSortOpen && (
                <div
                    ref={popupRef}
                    className="fixed bottom-[21.75rem] right-24 z-50 w-max max-w-[calc(100vw-7.5rem)] bg-white/95 backdrop-blur-2xl border border-blue-100/80 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] overflow-hidden p-5 space-y-4 animate-in fade-in zoom-in-95 duration-200"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100 gap-6">
                        <div className="flex items-center gap-2">
                            <ArrowUpDown size={18} className="text-[#052558]" />
                            <h4 className="text-[13px] font-bold text-[#011023] uppercase tracking-wider whitespace-nowrap">
                                Sort & Timeframe
                            </h4>
                        </div>
                        <div className="flex items-center gap-2">
                            {hasActiveSort && (
                                <button
                                    onClick={resetSort}
                                    className="flex items-center gap-1 text-[11px] font-bold uppercase text-blue-600 hover:text-blue-800 transition-colors cursor-pointer whitespace-nowrap"
                                    title="Reset sorting"
                                >
                                    <RotateCcw size={12} />
                                    Reset
                                </button>
                            )}
                            <button
                                onClick={() => setIsSortOpen(false)}
                                className="p-1 text-gray-400 hover:text-gray-700 rounded-full transition-colors cursor-pointer"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    {!filterConfig || !filterConfig.hasSort ? (
                        <div className="py-6 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            No sorting options for this page
                        </div>
                    ) : (
                        <div className="space-y-3.5 max-h-[60vh] overflow-y-auto hide-scrollbar p-1">
                            {sortGroups.map((group) => {
                                const currentValue = activeFilters[group.id] || (group.id === 'sortOrder' ? 'latest' : 'all');
                                return (
                                    <div key={group.id} className="space-y-2">
                                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                                            {group.label}
                                        </label>
                                        <div className="flex flex-nowrap gap-1.5 whitespace-nowrap overflow-x-auto hide-scrollbar">
                                            {group.options.map((opt) => {
                                                const isSelected = currentValue === opt.value;
                                                return (
                                                    <button
                                                        key={opt.value}
                                                        type="button"
                                                        onClick={() => setFilterValue(group.id, opt.value)}
                                                        className={`px-3 py-1.25 rounded-full text-xs uppercase font-bold border transition-all cursor-pointer whitespace-nowrap ${
                                                            isSelected
                                                                ? 'bg-[#e0e7ff] border-[#a5b4fc] text-[#3730a3]'
                                                                : 'bg-[#f1f5f9] border-[#cbd5e1] text-[#475569] hover:bg-slate-100'
                                                        }`}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Footer */}
                    {filterConfig && filterConfig.hasSort && resultsCount !== null && (
                        <div className="pt-3 border-t border-gray-200 flex items-center justify-between text-[12.5px] font-bold uppercase text-gray-600">
                            <span className="px-1">Results</span>
                            <span className="text-[#052558] px-2">
                                {resultsCount} {resultsCount === 1 ? 'item' : 'items'}
                            </span>
                        </div>
                    )}
                </div>
            )}
        </>
    );
};

export default SortButton;
