import React, { useState, useEffect } from 'react';
import { Bell, UserPlus, CalendarCheck, MessageSquare, Star, Zap, Warehouse, Loader2, CheckCheck, Trash2 } from 'lucide-react';

const EVENT_CONFIG = {
    user_registered: {
        icon: <UserPlus size={18} />,
        color: 'bg-blue-100 text-blue-600',
        label: 'New User',
    },
    booking_created: {
        icon: <CalendarCheck size={18} />,
        color: 'bg-emerald-100 text-emerald-600',
        label: 'Booking',
    },
    message_received: {
        icon: <MessageSquare size={18} />,
        color: 'bg-purple-100 text-purple-600',
        label: 'Message',
    },
    review_submitted: {
        icon: <Star size={18} />,
        color: 'bg-amber-100 text-amber-600',
        label: 'Review',
    },
    garage_added: {
        icon: <Warehouse size={18} />,
        color: 'bg-orange-100 text-orange-600',
        label: 'Garage',
    },
    charging_station_added: {
        icon: <Zap size={18} />,
        color: 'bg-teal-100 text-teal-600',
        label: 'Charging Station',
    },
};

const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unread, setUnread] = useState(0);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await fetch('http://localhost:5001/api/notifications');
            const data = await res.json();
            setNotifications(data.data || []);
            setUnread(data.unreadCount || 0);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchNotifications(); }, []);

    const markRead = async (id) => {
        await fetch(`http://localhost:5001/api/notifications/${id}/read`, { method: 'PATCH' });
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        setUnread(prev => Math.max(0, prev - 1));
    };

    const markAllRead = async () => {
        await fetch('http://localhost:5001/api/notifications/mark-all-read', { method: 'PATCH' });
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnread(0);
    };

    const deleteNotif = async (id) => {
        await fetch(`http://localhost:5001/api/notifications/${id}`, { method: 'DELETE' });
        const deleted = notifications.find(n => n._id === id);
        setNotifications(prev => prev.filter(n => n._id !== id));
        if (deleted && !deleted.isRead) setUnread(prev => Math.max(0, prev - 1));
    };

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-[#011023] uppercase tracking-tight flex items-center gap-3">
                    Notifications
                    {unread > 0 && (
                        <span className="flex items-center justify-center min-w-[28px] h-7 bg-[#052558] text-white text-xs font-black rounded-full px-2">
                            {unread}
                        </span>
                    )}
                </h1>
                {unread > 0 && (
                    <button
                        onClick={markAllRead}
                        className="flex items-center gap-1.5 text-sm font-bold text-[#052558] hover:text-[#1a4a8a] transition-colors"
                    >
                        <CheckCheck size={15} /> Mark all as read
                    </button>
                )}
            </div>

            <div className="bg-white/70 backdrop-blur-md transform-gpu border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden">
                <div className="overflow-y-auto h-[860px]">
                    {loading ? (
                        <div className="h-full flex items-center justify-center">
                            <div className="flex flex-col items-center gap-3 text-gray-400">
                                <Loader2 size={26} className="animate-spin text-[#527FB0]" />
                                <p className="text-sm font-medium">Loading notifications...</p>
                            </div>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-300">
                            <Bell size={40} />
                            <p className="text-sm font-semibold">No notifications yet</p>
                            <p className="text-xs">New registrations, bookings and messages will appear here.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-[#e6f0fa]">
                            {notifications.map(notif => {
                                const cfg = EVENT_CONFIG[notif.eventType] || {
                                    icon: <Bell size={18} />,
                                    color: 'bg-gray-100 text-gray-600',
                                    label: 'Event',
                                };
                                return (
                                    <div
                                        key={notif._id}
                                        onClick={() => !notif.isRead && markRead(notif._id)}
                                        className={`group flex items-start gap-4 px-6 py-4 cursor-pointer transition-colors ${notif.isRead ? 'hover:bg-gray-50/50' : 'bg-blue-50/40 hover:bg-blue-50/70'}`}
                                    >
                                        {/* Icon */}
                                        <div className={`flex-shrink-0 mt-0.5 w-10 h-10 rounded-2xl flex items-center justify-center ${cfg.color}`}>
                                            {cfg.icon}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h4 className={`text-sm ${notif.isRead ? 'font-semibold text-gray-700' : 'font-black text-[#011023]'}`}>
                                                        {notif.title}
                                                    </h4>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${cfg.color}`}>
                                                        {cfg.label}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">{timeAgo(notif.createdAt)}</span>
                                            </div>
                                            <p className={`text-sm mt-0.5 leading-relaxed ${notif.isRead ? 'text-gray-500' : 'text-gray-600 font-medium'}`}>
                                                {notif.message}
                                            </p>
                                        </div>

                                        {/* Right side: unread dot + delete */}
                                        <div className="flex flex-col items-center gap-2 flex-shrink-0">
                                            {!notif.isRead && (
                                                <div className="w-2.5 h-2.5 bg-[#052558] rounded-full mt-1" />
                                            )}
                                            <button
                                                onClick={e => { e.stopPropagation(); deleteNotif(notif._id); }}
                                                className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-all"
                                                title="Delete"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Notifications;
