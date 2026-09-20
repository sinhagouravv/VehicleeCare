import React, { useState, useEffect, useRef } from 'react';
import { CircleAlert, Flame, Pin, AlertTriangle, Tag, X } from 'lucide-react';
import { useFilter } from '../context/FilterContext';

export const LABEL_PRESETS = [
    { name: 'HIGH PRIORITY', label: 'High Priority', icon: CircleAlert, color: 'text-red-500 fill-red-100' },
    { name: 'URGENT', label: 'Urgent', icon: Flame, color: 'text-amber-400 fill-amber-400' },
    { name: 'FOLLOW UP', label: 'Follow Up', icon: Pin, color: 'text-blue-400' },
    { name: 'IMPORTANT', label: 'Important', icon: AlertTriangle, color: 'text-purple-400' },
];

export const stripEmoji = (str) => {
    if (!str) return '';
    return str.replace(/[\u{1F300}-\u{1F9FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F1E6}-\u{1F1FF}]|🏷️|⭐|⚡|📌|❗|✅|🚨|🔍/gu, '').trim();
};

export const renderLabelIcon = (labelStr, size = 16) => {
    const clean = stripEmoji(labelStr);
    if (!clean) return <Tag size={size} className="text-indigo-500 shrink-0" />;
    const upper = clean.toUpperCase();
    if (upper.includes('HIGH') || upper.includes('PRIORITY') || upper.includes('STAR')) return <CircleAlert size={size} className="text-red-500 fill-red-100 shrink-0" />;
    if (upper.includes('URGENT') || upper.includes('FAST') || upper.includes('ZAP')) return <Flame size={size} className="fill-amber-400 text-amber-500 shrink-0" />;
    if (upper.includes('FOLLOW') || upper.includes('PIN') || upper.includes('LATER')) return <Pin size={size} className="text-blue-500 fill-blue-100 shrink-0" />;
    if (upper.includes('IMPORTANT') || upper.includes('ALERT')) return <AlertTriangle size={size} className="text-purple-600 fill-purple-100 shrink-0" />;
    return <Tag size={size} className="text-indigo-500 shrink-0" />;
};

export const LABEL_FILTER_GROUP = {
    id: 'label',
    label: 'Row Label',
    defaultValue: 'all',
    options: [
        { label: 'All', value: 'all' },
        { label: 'High Priority', value: 'HIGH PRIORITY' },
        { label: 'Urgent', value: 'URGENT' },
        { label: 'Follow Up', value: 'FOLLOW UP' },
        { label: 'Important', value: 'IMPORTANT' },
    ]
};

export const useRowLabels = (storageKey = 'notifications_row_labels') => {
    const { isLabelMode } = useFilter();
    const [rowLabels, setRowLabels] = useState(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    });

    const [activeLabelRowId, setActiveLabelRowId] = useState(null);
    const labelPopupRef = useRef(null);

    useEffect(() => {
        if (!isLabelMode) {
            const timer = setTimeout(() => setActiveLabelRowId(null), 0);
            return () => clearTimeout(timer);
        }
    }, [isLabelMode]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (activeLabelRowId && labelPopupRef.current && !labelPopupRef.current.contains(e.target)) {
                setActiveLabelRowId(null);
            }
        };
        if (activeLabelRowId) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [activeLabelRowId]);

    const handleSaveRowLabel = (rowId, labelText) => {
        setRowLabels((prev) => {
            const next = { ...prev };
            const cleanText = stripEmoji(labelText).toUpperCase();
            if (!cleanText) {
                delete next[rowId];
            } else {
                next[rowId] = cleanText;
            }
            try {
                localStorage.setItem(storageKey, JSON.stringify(next));
            } catch {
                // ignore storage error
            }
            return next;
        });
        setActiveLabelRowId(null);
    };

    const toggleRowLabelSelector = (rowId, e) => {
        if (e) e.stopPropagation();
        setActiveLabelRowId(prev => prev === rowId ? null : rowId);
    };

    return {
        rowLabels,
        activeLabelRowId,
        setActiveLabelRowId,
        toggleRowLabelSelector,
        handleSaveRowLabel,
        labelPopupRef,
        isLabelMode
    };
};

export const FloatingLabelSelector = ({ 
    rowId, 
    currentLabel, 
    onSaveLabel, 
    labelPopupRef, 
    topClass = "-top-10",
    positionClass = "left-1/2 -translate-x-1/2"
}) => {
    return (
        <div 
            ref={labelPopupRef}
            onClick={(e) => e.stopPropagation()}
            className={`absolute ${positionClass} ${topClass} z-50 bg-white/95 border border-indigo-100 rounded-full px-2 py-1 flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150`}
        >
            {LABEL_PRESETS.map((preset) => {
                const IconComp = preset.icon;
                const isSelected = currentLabel === preset.name;
                return (
                    <button
                        key={preset.name}
                        type="button"
                        onClick={() => onSaveLabel(rowId, preset.name)}
                        className={`transition-all cursor-pointer hover:scale-110 active:scale-95 p-0.5 ${
                            isSelected ? 'scale-110 opacity-100' : 'opacity-70 hover:opacity-100'
                        }`}
                    >
                        <IconComp size={17} className={preset.color} />
                    </button>
                );
            })}
            {Boolean(currentLabel) && (
                <button
                    type="button"
                    onClick={() => onSaveLabel(rowId, '')}
                    className="text-rose-400 hover:text-rose-600 transition-all cursor-pointer hover:scale-115 active:scale-95 border-l border-slate-200 pl-1 -ml-1"
                >
                    <X size={17} />
                </button>
            )}
        </div>
    );
};
