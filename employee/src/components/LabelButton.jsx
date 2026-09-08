import React, { useRef, useEffect, useState } from 'react';
import { Tag, X } from 'lucide-react';
import { useFilter } from '../context/FilterContext';

const LabelButton = () => {
    const {
        filterConfig,
        isLabelMode,
        setIsLabelMode,
        isSortOpen,
        setIsSortOpen,
        isFilterOpen,
        setIsFilterOpen,
        resultsCount
    } = useFilter();

    const [isInfoOpen, setIsInfoOpen] = useState(false);
    const popupRef = useRef(null);
    const buttonRef = useRef(null);

    const hasLabelableContent = Boolean(filterConfig && (resultsCount === null || resultsCount > 0));

    // Close popover on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                isInfoOpen &&
                popupRef.current &&
                !popupRef.current.contains(e.target) &&
                buttonRef.current &&
                !buttonRef.current.contains(e.target)
            ) {
                setIsInfoOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isInfoOpen]);

    // Close popover or turn off label mode on Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (isInfoOpen) setIsInfoOpen(false);
                if (isLabelMode) setIsLabelMode(false);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isInfoOpen, isLabelMode, setIsLabelMode]);

    // Turn off Label Mode when clicking anywhere outside the table or label button
    useEffect(() => {
        const handleClickOutsideTable = (e) => {
            if (!isLabelMode) return;
            const isTableClick = e.target.closest('table') || e.target.closest('tr') || e.target.closest('td');
            const isLabelButtonClick = buttonRef.current && buttonRef.current.contains(e.target);

            if (!isTableClick && !isLabelButtonClick) {
                setIsLabelMode(false);
            }
        };

        if (isLabelMode) {
            document.addEventListener('mousedown', handleClickOutsideTable);
        }
        return () => document.removeEventListener('mousedown', handleClickOutsideTable);
    }, [isLabelMode, setIsLabelMode]);

    const handleToggle = () => {
        // If there's no filterConfig or no items on this page, show the info popover
        if (!hasLabelableContent) {
            setIsLabelMode(false);
            setIsFilterOpen(false);
            setIsSortOpen(false);
            setIsInfoOpen(!isInfoOpen);
            return;
        }

        setIsInfoOpen(false);
        if (!isLabelMode) {
            // Close filter and sort popups if opening label mode
            setIsFilterOpen(false);
            setIsSortOpen(false);
        }
        setIsLabelMode(!isLabelMode);
    };

    return (
        <>
            <button
                ref={buttonRef}
                onClick={handleToggle}
                className={`fixed bottom-[17.85rem] right-9 z-50 p-3 rounded-full border flex items-center justify-center transition-all shadow-sm hover:shadow-md cursor-pointer hover:scale-105 active:scale-95 duration-300 group ${
                    isLabelMode || isInfoOpen
                        ? 'bg-blue-500 text-white border-blue-600 shadow-md'
                        : 'border-blue-200 text-[#527FB0] hover:bg-blue-50 hover:text-blue-500 bg-white/80 backdrop-blur-md'
                }`}
            >
                <Tag size={24} className="group-hover:scale-110 transition-transform duration-300" />
            </button>

            {/* Floating Info Popover when nothing to label */}
            {isInfoOpen && (
                <div
                    ref={popupRef}
                    className="fixed bottom-[17.85rem] right-24 z-50 w-max max-w-[calc(100vw-7.5rem)] bg-white/95 backdrop-blur-2xl border border-blue-100/80 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] overflow-hidden p-5 space-y-3 animate-in fade-in zoom-in-95 duration-200"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100 gap-6">
                        <div className="flex items-center gap-2">
                            <Tag size={18} className="text-[#052558]" />
                            <h4 className="text-[13px] font-bold text-[#011023] uppercase tracking-wider whitespace-nowrap">
                                Row Labeling
                            </h4>
                        </div>
                        <button
                            onClick={() => setIsInfoOpen(false)}
                            className="p-1 text-gray-400 hover:text-gray-700 rounded-full transition-colors cursor-pointer"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="py-4 px-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Nothing to label on this page
                    </div>
                </div>
            )}
        </>
    );
};

export default LabelButton;
