import React from 'react';
import { useOutletContext } from 'react-router-dom';

const Settings = () => {
    const outletContext = useOutletContext();
    const isSidebarCollapsed = outletContext?.isSidebarCollapsed ?? true;
    return (
        <div className={`space-y-6 ${isSidebarCollapsed ? 'max-w-[92rem]' : 'max-w-[81.75rem]'} mx-auto transition-all duration-300`}>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold uppercase text-[#011023] tracking-tight">Settings</h1>
            </div>
            
            <div className="bg-white/70 backdrop-blur-md transform-gpu border border-white p-6 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] min-h-[500px] flex items-center justify-center">
                <p className="text-gray-400 font-medium">Settings module coming soon...</p>
            </div>
        </div>
    );
};

export default Settings;
