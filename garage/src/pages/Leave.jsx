import React, { useState } from 'react';
import useHighlight from '../hooks/useHighlight';

const Leave = () => {
    const [lastRefreshed] = useState(new Date());
    const highlightedRow = useHighlight([]); // Ready for data

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-extrabold uppercase text-[#011023] tracking-tight">Leave</h1>
                <div className="flex items-center gap-2 text-xs uppercase text-gray-400 font-medium self-center">
                    {lastRefreshed
                        ? `Last refreshed | ${lastRefreshed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | ${lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`
                        : 'Loading…'}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-white/60 backdrop-blur-xl h-[55rem] border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden flex items-center justify-center">
                <div className="text-center space-y-3">
                    <p className="text-2xl font-bold text-gray-400 uppercase tracking-widest">Under Construction</p>
                    <p className="text-sm text-gray-500 uppercase">Leave management features will be available here soon.</p>
                </div>
            </div>
        </div>
    );
};

export default Leave;
