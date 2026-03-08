import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, AlertCircle, Clock, Search, CalendarCheck } from 'lucide-react';

const Notifications = () => {
    const [lastRefreshed, setLastRefreshed] = useState(null);

    useEffect(() => {
        const timer = setInterval(() => {
            setLastRefreshed(new Date());
        }, 5000);
        setLastRefreshed(new Date());
        return () => clearInterval(timer);
    }, []);

    // Mock Data
    const notifications = [
        { id: 1, title: "New Booking Request", message: "Rahul S. requested a General Service for Hyundai Creta (MH01CD4567).", time: "10 mins ago", type: "booking", isNew: true },
        { id: 2, title: "Payment Received", message: "Payment of ₹4,200 received from Michael C. for Invoice #INV-8905.", time: "1 hour ago", type: "payment", isNew: true },
        { id: 3, title: "Service Reminder", message: "Honda City (MH02AB1234) is due for collection at 04:00 PM today.", time: "3 hours ago", type: "reminder", isNew: false },
        { id: 4, title: "System Update", message: "Garage panel will be undergoing maintenance tonight from 12 AM to 2 AM.", time: "Yesterday", type: "system", isNew: false },
        { id: 5, title: "Customer Review", message: "Sarah J. left a 5-star review for your garage.", time: "Oct 24, 2023", type: "review", isNew: false },
    ];

    const getIcon = (type) => {
        switch (type) {
            case 'booking': return <div className="p-2 bg-blue-100 text-blue-600 rounded-full"><CalendarCheck size={20} /></div>;
            case 'payment': return <div className="p-2 bg-emerald-100 text-emerald-600 rounded-full"><CheckCircle size={20} /></div>;
            case 'reminder': return <div className="p-2 bg-amber-100 text-amber-600 rounded-full"><Clock size={20} /></div>;
            case 'system': return <div className="p-2 bg-gray-100 text-gray-600 rounded-full"><AlertCircle size={20} /></div>;
            case 'review': return <div className="p-2 bg-purple-100 text-purple-600 rounded-full"><CheckCircle size={20} /></div>;
            default: return <div className="p-2 bg-blue-100 text-blue-600 rounded-full"><Bell size={20} /></div>;
        }
    };

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto ">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <h1 className="text-3xl font-extrabold text-[#011023] tracking-tight flex items-center gap-3">
                        Notifications
                        <span className="flex items-center justify-center w-8 h-8 bg-red-100 text-red-600 text-sm rounded-full">2</span>
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-xs uppercase text-gray-400 font-medium self-center">
                        {lastRefreshed
                            ? `Last refreshed | ${lastRefreshed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | ${lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`
                            : 'Loading…'}
                    </div>
                </div>
            </div>

            <div className="bg-white/70 backdrop-blur-md transform-gpu border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden">
                <div className="p-4 border-b border-[#e6f0fa] flex gap-4 bg-white/40 justify-between items-center">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search notifications..."
                            className="w-full pl-9 pr-4 py-2 bg-white border border-blue-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#527FB0]/30 text-sm font-medium text-[#011023] placeholder-gray-400"
                        />
                    </div>
                    <select className="px-4 py-2 bg-white border border-blue-100 rounded-lg text-sm font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#527FB0]/30 cursor-pointer">
                        <option>All Types</option>
                        <option>Bookings</option>
                        <option>Payments</option>
                        <option>System</option>
                    </select>
                </div>

                <div className="divide-y divide-blue-50/50">
                    {notifications.map((notif) => (
                        <div
                            key={notif.id}
                            className={`p-5 flex items-start gap-4 transition-colors hover:bg-blue-50/30 cursor-pointer ${notif.isNew ? 'bg-blue-50/50' : ''}`}
                        >
                            {getIcon(notif.type)}
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className={`text-sm ${notif.isNew ? 'font-black text-[#011023]' : 'font-bold text-gray-700'}`}>
                                        {notif.title}
                                    </h4>
                                    <span className="text-xs font-semibold text-gray-400 whitespace-nowrap ml-4">
                                        {notif.time}
                                    </span>
                                </div>
                                <p className={`text-sm ${notif.isNew ? 'text-gray-600 font-medium' : 'text-gray-500'}`}>
                                    {notif.message}
                                </p>
                            </div>
                            {notif.isNew && (
                                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Notifications;
