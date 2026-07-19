import React from 'react';

/**
 * A generic pulsing skeleton block
 */
export const SkeletonBlock = ({ className = "h-4 w-full bg-slate-200 rounded" }) => (
    <div className={`animate-pulse ${className}`} />
);

/**
 * Renders multiple rows of animated table column cells
 */
export const TableSkeleton = ({ rows = 15, cols = 6 }) => {
    return (
        <>
            {[...Array(rows)].map((_, rIdx) => (
                <tr key={rIdx} className="border-b border-[#f0f6fc]">
                    {[...Array(cols)].map((_, cIdx) => (
                        <td key={cIdx} className="p-4.5 text-center">
                            <div className="flex justify-center items-center">
                                <SkeletonBlock 
                                    className={`h-4 bg-slate-200/80 rounded-md ${
                                        cIdx === 0 ? 'w-[40%]' :
                                        cIdx === 2 ? 'w-[75%]' :
                                        'w-[60%]'
                                    }`} 
                                />
                            </div>
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
};

/**
 * Renders a card layout skeleton with header and metrics
 */
export const CardSkeleton = () => (
    <div className="bg-white border border-[#e2e8f0] p-6 rounded-2xl shadow-xs flex flex-col space-y-4">
        <div className="flex justify-between items-center">
            <SkeletonBlock className="h-10 w-10 bg-slate-200 rounded-xl" />
        </div>
        <SkeletonBlock className="h-4 w-[60%] bg-slate-200 rounded" />
        <div className="flex items-baseline gap-2 pt-1">
            <SkeletonBlock className="h-8 w-[40%] bg-slate-200 rounded" />
            <SkeletonBlock className="h-4 w-[15%] bg-slate-200 rounded" />
        </div>
    </div>
);

/**
 * Renders a full details/profile fields form grid skeleton
 */
export const FormSkeleton = ({ fields = 6 }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-xs">
        {[...Array(fields)].map((_, idx) => (
            <div key={idx} className="space-y-2">
                <SkeletonBlock className="h-4 w-[30%] bg-slate-200 rounded" />
                <SkeletonBlock className="h-10 w-full bg-slate-100 rounded-xl" />
            </div>
        ))}
    </div>
);

/**
 * Full page skeleton representing list/grid layouts
 */
export const PageSkeleton = () => (
    <div className="space-y-6 max-w-[92rem] mx-auto h-[calc(100vh-9.25rem)] flex flex-col animate-pulse">
        {/* Header Title */}
        <div className="flex justify-between items-center mb-6">
            <div className="h-8 w-48 bg-slate-200 rounded" />
            <div className="h-4 w-64 bg-slate-200 rounded" />
        </div>
        
        {/* Cards row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
        </div>

        {/* Detailed block */}
        <div className="bg-white flex-1 min-h-0 border border-[#e2e8f0] rounded-2xl p-6 space-y-4 flex flex-col">
            <SkeletonBlock className="h-6 w-32 bg-slate-200 rounded" />
            <div className="space-y-3 flex-1 overflow-hidden">
                <SkeletonBlock className="h-10 w-full bg-slate-100 rounded" />
                <SkeletonBlock className="h-10 w-full bg-slate-100 rounded" />
                <SkeletonBlock className="h-10 w-full bg-slate-100 rounded" />
            </div>
        </div>
    </div>
);
