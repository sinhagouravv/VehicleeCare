import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Bell, UserPlus, CalendarCheck, MessageSquare, Star, Zap, Warehouse, Loader2, CheckCheck, Trash2 } from 'lucide-react';

const EVENT_MAPPING = {
    user_registered: { type: 'User', category: 'Website', color: 'bg-blue-100 text-blue-700', typeColor: 'bg-indigo-100 text-indigo-700' },
    booking_created: { type: 'Booking', category: 'Garage', color: 'bg-emerald-100 text-emerald-700', typeColor: 'bg-sky-100 text-sky-700' },
    message_received: { type: 'Message', category: 'Website', color: 'bg-blue-100 text-blue-700', typeColor: 'bg-fuchsia-100 text-fuchsia-700' },
    review_submitted: { type: 'Review', category: 'Garage', color: 'bg-emerald-100 text-emerald-700', typeColor: 'bg-amber-100 text-amber-700' },
    garage_added: { type: 'Garage', category: 'Admin', color: 'bg-orange-100 text-orange-700', typeColor: 'bg-teal-100 text-teal-700' },
    charging_station_added: { type: 'Charging', category: 'Admin', color: 'bg-orange-100 text-orange-700', typeColor: 'bg-teal-100 text-teal-700' },
    employee_added: { type: 'Employee', category: 'Garage', color: 'bg-emerald-100 text-emerald-700', typeColor: 'bg-teal-100 text-teal-700' },
};

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [users, setUsers] = useState([]); // Added for smart ID mapping
    const [loading, setLoading] = useState(true);
    const [lastRefreshed, setLastRefreshed] = useState(null);
    const [unread, setUnread] = useState(0);

    const fetchNotifications = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            
            const storedUser = localStorage.getItem('garageUser');
            let garageId = null;
            if (storedUser) {
                const user = JSON.parse(storedUser);
                garageId = user.id;
            }

            const res = await fetch('http://localhost:5001/api/notifications');
            const data = await res.json();
            
            let allNotifs = data.data || [];
            
            // Filter notifications for this garage ONLY
            // 1. Must be 'booking_created'
            // 2. Must match the garage's ID in meta
            const garageNotifs = allNotifs.filter(n => 
                n.eventType === 'booking_created' && n.meta?.garageId === garageId
            );

            setNotifications(garageNotifs);
            setUnread(garageNotifs.filter(n => !n.isRead).length);
            setLastRefreshed(new Date());

            // Also fetch users to build the name-to-ID map
            const userRes = await fetch('http://localhost:5001/api/users');
            if (userRes.ok) {
                const userData = await userRes.json();
                setUsers(userData.data || []);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(() => fetchNotifications(true), 5000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const markRead = async (id) => {
        await fetch(`http://localhost:5001/api/notifications/${id}/read`, { method: 'PATCH' });
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        setUnread(prev => Math.max(0, prev - 1));
    };

    const deleteNotif = async (id) => {
        if (!window.confirm("Delete this notification?")) return;
        await fetch(`http://localhost:5001/api/notifications/${id}`, { method: 'DELETE' });
        const deleted = notifications.find(n => n._id === id);
        setNotifications(prev => prev.filter(n => n._id !== id));
        if (deleted && !deleted.isRead) setUnread(prev => Math.max(0, prev - 1));
    };

    // Build a map of Name -> userId from all users AND notifications to fill in gaps
    const nameToUserIdMap = useMemo(() => {
        const map = {};
        
        // 1. Fill from the full user database (highest priority source)
        users.forEach(u => {
            if (u.name && u.userId) {
                map[u.name.trim().toUpperCase()] = u.userId;
            }
        });

        // 2. Supplement from notifications (for vendors or others)
        notifications.forEach(n => {
            const name = (n.meta?.userName || n.meta?.name || n.message.split(' (')[0].split(' booked')[0]).trim().toUpperCase();
            if (name && n.meta?.displayUserId && n.meta.displayUserId !== 'GUEST') {
                map[name] = n.meta.displayUserId;
            }
        });

        return map;
    }, [users, notifications]);

    const getDisplayUserId = (notif) => {
        if (notif.eventType === 'message_received') return 'GUEST';
        if (notif.eventType === 'employee_added') return notif.meta?.employeeId || 'EMP-N/A';
        if (notif.eventType === 'garage_added') return notif.meta?.garageId || 'GAR-N/A';
        
        // 1. Direct hit from meta
        if (notif.meta?.displayUserId && notif.meta.displayUserId !== 'GUEST') return notif.meta.displayUserId;
        
        // 2. Try map lookup by name
        const name = (notif.meta?.userName || notif.meta?.name || notif.message.split(' (')[0].split(' booked')[0]).trim().toUpperCase();
        if (nameToUserIdMap[name]) return nameToUserIdMap[name];

        // 3. Fallback to legacy userId if it looks like a custom ID (e.g. 65...)
        if (notif.meta?.userId && notif.meta.userId.length < 15 && (notif.meta.userId.startsWith('65') || notif.meta.userId.startsWith('75'))) {
            return notif.meta.userId;
        }

        return 'GUEST';
    };

    const getMapping = (notif) => {
        let mapping = { ...EVENT_MAPPING[notif.eventType] } || { type: 'Event', category: 'System', color: 'bg-gray-50 text-gray-600' };
        
        // Refine based on meta
        if (notif.eventType === 'message_received' && notif.meta?.type === 'business') {
            mapping.category = 'Business';
            mapping.color = 'bg-purple-100 text-purple-700';
            mapping.typeColor = 'bg-fuchsia-100 text-fuchsia-700';
        }
        if (notif.eventType === 'review_submitted' && notif.meta?.reviewType === 'Business') {
            mapping.category = 'Business';
            mapping.color = 'bg-purple-100 text-purple-700';
            mapping.typeColor = 'bg-amber-100 text-amber-700';
        }

        return mapping;
    };

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <h1 className="text-3xl font-extrabold text-[#011023] uppercase tracking-tight flex items-center gap-3">
                        Notifications
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

            {/* Main Content Table (Glassmorphism) */}
            <div className="bg-white/60 backdrop-blur-xl max-h-[55rem] border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden">
                <div className="overflow-x-hidden overflow-y-auto h-[860px] relative">
                    <table className="w-full text-center border-collapse">
                        <thead className="sticky top-0 z-10 shadow-sm">
                            <tr className="bg-[#f0f6ff] text-[15px] uppercase tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                <th className="p-4.5 font-bold" style={{ width: '10%' }}>Type</th>
                                <th className="p-4.5 font-bold" style={{ width: '10%' }}>Person</th>
                                <th className="p-4.5 font-bold" style={{ width: '45%' }}>Content</th>
                                <th className="p-4.5 font-bold" style={{ width: '10%' }}>Received On</th>
                                <th className="p-4.5 font-bold" style={{ width: '7%' }}>Status</th>
                                <th className="p-4.5 font-bold" style={{ width: '7%' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-[13px] divide-[#e6f0fa]">
                            {loading && notifications.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-20 text-center">
                                        <div className="flex flex-col items-center gap-3 text-gray-400">
                                            <Loader2 size={26} className="animate-spin text-[#527FB0]" />
                                            <p className="text-sm font-medium">Loading notifications...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : notifications.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-20 text-center text-gray-300">
                                        <div className="flex flex-col items-center gap-3">
                                            <Bell size={40} />
                                            <p className="text-sm font-semibold uppercase">No notifications yet</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                notifications.map((notif) => {
                                    const mapping = getMapping(notif);
                                    return (
                                        <tr 
                                            key={notif._id} 
                                            onClick={() => !notif.isRead && markRead(notif._id)}
                                            className={`transition-all duration-300 group cursor-pointer ${notif.isRead ? 'hover:bg-white/50' : 'bg-blue-50/40 hover:bg-blue-50/60'}`}
                                        >
                                            <td className="p-4.5">
                                                <span className={`px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${mapping.typeColor || 'bg-gray-100 text-gray-700'}`}>
                                                    {mapping.type}
                                                </span>
                                            </td>
                                            <td className="p-4.5">
                                                <div className="flex flex-col items-center justify-center">
                                                    <span className="font-bold text-[#011023] uppercase text-[13px] truncate max-w-[120px]">
                                                        {notif.meta?.userName || notif.meta?.name || notif.message.split(' (')[0].split(' booked')[0] || 'N/A'}
                                                    </span>
                                                    <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-tight">
                                                        {getDisplayUserId(notif)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4.5">
                                                <p className={`text-sm text-center uppercase ${notif.isRead ? 'text-gray-500 font-semibold' : 'text-[#011023] font-bold'}`}>
                                                    {notif.eventType === 'booking_created' 
                                                        ? notif.message.replace(/^.*booked/i, 'Booked') 
                                                        : notif.eventType === 'employee_added'
                                                        ? `A new employee, ${notif.meta?.name || 'Staff Member'}, has been added to the ${notif.meta?.garageName || 'Garage'} ${notif.meta?.garageId || 'ID'} for ${notif.meta?.role || 'Staff'} role.`
                                                        : notif.eventType === 'user_registered'
                                                        ? `A new ${notif.meta?.role === 'vendor' ? 'business ' : ''}user, ${notif.meta?.name || 'Someone'}, has created an account with us.`
                                                        : notif.message}
                                                </p>
                                            </td>
                                            <td className="p-4.5 uppercase">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-[#011023]">
                                                        {new Date(notif.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(notif.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4.5">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${notif.isRead
                                                    ? 'bg-gray-100 text-gray-600'
                                                    : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {notif.isRead ? 'Read' : 'Unread'}
                                                </span>
                                            </td>
                                            <td className="p-4.5">
                                                <div className="flex justify-center">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); deleteNotif(notif._id); }}
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                                                        title="Delete Notification"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Notifications;
