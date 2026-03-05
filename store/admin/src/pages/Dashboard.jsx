import React, { useState, useEffect } from 'react';

const Dashboard = () => {
    const [lastRefreshed, setLastRefreshed] = useState(null);

    useEffect(() => {
        setLastRefreshed(new Date());
        const interval = setInterval(() => {
            setLastRefreshed(new Date());
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full max-w-[92rem] mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-[#011023] uppercase tracking-tight">Dashboard</h1>
                <div className="flex items-center gap-2 text-xs uppercase text-gray-400 font-medium self-center">
                    {lastRefreshed
                        ? `Last refreshed | ${lastRefreshed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | ${lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`
                        : 'Loading…'}
                </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#e6f0fa]">
                <p className="text-gray-600">Welcome to the Store Admin Dashboard.</p>
            </div>
        </div>
    );
};

export default Dashboard;
