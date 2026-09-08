import React, { useRef, useEffect } from 'react';
import { SlidersHorizontal, X, RotateCcw } from 'lucide-react';
import { useFilter } from '../context/FilterContext';

const FilterButton = () => {
    const {
        filterConfig,
        isFilterOpen,
        setIsFilterOpen,
        isSortOpen: _isSortOpen,
        setIsSortOpen,
        isLabelMode: _isLabelMode,
        setIsLabelMode,
        activeFilters,
        setFilterValue,
        resetFilters,
        hasActiveFilters,
        resultsCount
    } = useFilter();

    const popupRef = useRef(null);
    const buttonRef = useRef(null);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                isFilterOpen &&
                popupRef.current &&
                !popupRef.current.contains(e.target) &&
                buttonRef.current &&
                !buttonRef.current.contains(e.target)
            ) {
                setIsFilterOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isFilterOpen, setIsFilterOpen]);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isFilterOpen) {
                setIsFilterOpen(false);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isFilterOpen, setIsFilterOpen]);

    const handleOpenToggle = () => {
        if (!isFilterOpen) {
            setIsSortOpen(false);
            setIsLabelMode(false);
        }
        setIsFilterOpen(!isFilterOpen);
    };

    return (
        <>
            {/* Floating Filter Button placed right above Upload Cloud icon */}
            <button
                ref={buttonRef}
                onClick={handleOpenToggle}
                className={`fixed bottom-[10.05rem] right-9 z-50 p-3 rounded-full border flex items-center justify-center transition-all shadow-sm hover:shadow-md cursor-pointer hover:scale-105 active:scale-95 duration-300 group ${
                    isFilterOpen
                        ? 'bg-blue-500 text-white border-blue-600 shadow-md'
                        : hasActiveFilters
                        ? 'bg-blue-50/80 border-blue-400 text-blue-600'
                        : 'border-blue-200 text-[#527FB0] hover:bg-blue-50 hover:text-blue-500 bg-white/80 backdrop-blur-md'
                }`}
            >
                <SlidersHorizontal size={24} className="group-hover:scale-110 transition-transform duration-300" />
                {hasActiveFilters && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600 ring-2 ring-white"></span>
                    </span>
                )}
            </button>

            {/* Floating Filter Popover */}
            {isFilterOpen && (
                <div
                    ref={popupRef}
                    className="fixed bottom-[10.05rem] right-24 z-50 w-max max-w-[calc(100vw-7.5rem)] bg-white/95 backdrop-blur-2xl border border-blue-100/80 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] overflow-hidden p-5 space-y-4 animate-in fade-in zoom-in-95 duration-200"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100 gap-6">
                        <div className="flex items-center gap-2">
                            <SlidersHorizontal size={18} className="text-[#052558]" />
                            <h4 className="text-[13px] font-bold text-[#011023] uppercase tracking-wider whitespace-nowrap">
                                {filterConfig?.title || 'Filter Options'}
                            </h4>
                        </div>
                        <div className="flex items-center gap-2">
                            {hasActiveFilters && (
                                <button
                                    onClick={resetFilters}
                                    className="flex items-center gap-1 text-[11px] font-bold uppercase text-blue-600 hover:text-blue-800 transition-colors cursor-pointer whitespace-nowrap"
                                    title="Reset all filters"
                                >
                                    <RotateCcw size={12} />
                                    Reset
                                </button>
                            )}
                            <button
                                onClick={() => setIsFilterOpen(false)}
                                className="p-1 text-gray-400 hover:text-gray-700 rounded-full transition-colors cursor-pointer"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    {!filterConfig || !filterConfig.groups || filterConfig.groups.length === 0 ? (
                        <div className="py-6 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            No filter options for this page
                        </div>
                    ) : (
                        <div className="space-y-3.5 max-h-[60vh] overflow-y-auto hide-scrollbar p-1">
                            {filterConfig.groups.map((group) => {
                                const currentValue = activeFilters[group.id] ?? group.defaultValue ?? 'all';
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
                    {filterConfig && filterConfig.groups && filterConfig.groups.length > 0 && resultsCount !== null && (
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

export default FilterButton;
