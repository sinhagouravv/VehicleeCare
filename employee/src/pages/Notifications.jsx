import React from 'react';

const Notifications = () => {
    return (
        <div className="space-y-6 max-w-[92rem] mx-auto text-semibold uppercase">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-extrabold uppercase text-[#011023] tracking-tight">Notifications</h1>
            </div>
            
            <div className="bg-white/70 backdrop-blur-md transform-gpu border border-white p-6 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] min-h-[500px] flex items-center justify-center">
                <p className="text-gray-400 font-medium tracking-widest ">Notifications module coming soon...</p>
            </div>
        </div>
    );
};

export default Notifications;
