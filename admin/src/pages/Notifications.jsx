import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Bell, UserPlus, CalendarCheck, MessageSquare, Star, Zap, Warehouse, Loader2, CheckCheck, Trash2 } from 'lucide-react';
import { TableSkeleton } from '../components/Skeleton';

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
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [notifToDelete, setNotifToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const fetchNotifications = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const res = await fetch('http://localhost:5001/api/notifications');
            const data = await res.json();
            setNotifications(data.data || []);
            setUnread(data.unreadCount || 0);
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

    const confirmDelete = async () => {
        if (!notifToDelete) return;
        setDeleting(true);
        try {
            await fetch(`http://localhost:5001/api/notifications/${notifToDelete}`, { method: 'DELETE' });
            const deleted = notifications.find(n => n._id === notifToDelete);
            setNotifications(prev => prev.filter(n => n._id !== notifToDelete));
            if (deleted && !deleted.isRead) setUnread(prev => Math.max(0, prev - 1));
            setIsDeleteModalOpen(false);
            setNotifToDelete(null);
        } catch (error) {
            console.error('Failed to delete notification:', error);
            alert('Failed to delete notification.');
        } finally {
            setDeleting(false);
        }
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
        <div className="space-y-6 max-w-[92rem] mx-auto h-[calc(100vh-9.25rem)] flex flex-col">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-[#011023] uppercase tracking-tight">
                    Notifications
                </h1>
                <div className="text-xs uppercase text-gray-400 font-medium self-center">
                    {lastRefreshed
                        ? `Last refreshed | ${lastRefreshed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | ${lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`
                        : 'Loading…'}
                </div>
            </div>

            {/* Main Content Table */}
            <div className="bg-white border border-[#e9f2fb] rounded-2xl shadow-[0_1px_2.5px_0_rgba(0,0,0,0.07)] flex-1 min-h-0 overflow-hidden flex flex-col">
                <div className="overflow-x-hidden overflow-y-auto text-center flex-1 relative hide-scrollbar">
                    <table className="w-full text-center border-collapse table-fixed">
                        <thead className="sticky top-0 z-10 shadow-sm">
                            <tr className="bg-[#f0f6ff] text-[15px] uppercase tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                <th className="p-4.5 font-bold text-center w-[10%]">Category</th>
                                <th className="p-4.5 font-bold text-center w-[10%]">Type</th>
                                <th className="p-4.5 font-bold text-center w-[14%]">User</th>
                                <th className="p-4.5 font-bold text-center w-[40%]">Content</th>
                                <th className="p-4.5 font-bold text-center w-[14%]">Received On</th>
                                <th className="p-4.5 font-bold text-center w-[6%]">Status</th>
                                <th className="p-4.5 font-bold text-center w-[6%]">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-[13px] divide-[#e6f0fa]">
                            {loading && notifications.length === 0 ? (
                                <TableSkeleton rows={15} cols={7} />
                            ) : notifications.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-20 text-center text-gray-300">
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
                                            <td className="p-4.5 text-center w-[10%]">
                                                <span className={`px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wider ${mapping.color}`}>
                                                    {mapping.category}
                                                </span>
                                            </td>
                                            <td className="p-4.5 text-center w-[10%]">
                                                <span className={`px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wider ${mapping.typeColor || 'bg-gray-100 text-gray-700'}`}>
                                                    {mapping.type}
                                                </span>
                                            </td>
                                            <td className="p-4.5 text-center w-[14%]">
                                                <div className="flex flex-col items-center justify-center">
                                                    <span className="font-bold text-[#011023] uppercase text-[13px] truncate">
                                                        {notif.meta?.userName || notif.meta?.name || notif.message.split(' (')[0].split(' booked')[0] || 'N/A'}
                                                    </span>
                                                    <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-tight">
                                                        {getDisplayUserId(notif)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4.5 text-center w-[40%]">
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
                                            <td className="p-4.5 uppercase text-center w-[14%]">
                                                <div className="flex flex-col items-center justify-center">
                                                    <span className="text-sm font-semibold text-[#011023]">
                                                        {new Date(notif.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(notif.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4.5 text-center w-[6%]">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${notif.isRead
                                                    ? 'bg-gray-100 text-gray-600'
                                                    : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {notif.isRead ? 'Read' : 'Unread'}
                                                </span>
                                            </td>
                                            <td className="p-4.5 text-center w-[6%]">
                                                <div className="flex justify-center">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setNotifToDelete(notif._id); setIsDeleteModalOpen(true); }}
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
            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && createPortal(
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#011023]/10 backdrop-blur-sm transition-all duration-300"
                    onClick={() => { setIsDeleteModalOpen(false); setNotifToDelete(null); }}
                >
                    <div 
                        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-8 text-center uppercase space-y-4">
                            <h3 className="text-2xl font-bold text-[#011023] uppercase tracking-tighter mb-9">Delete Notification</h3>
                            <p className="text-[13px] text-gray-500 font-medium leading-relaxed">
                                This will permanently remove this notification from the record. <br/>
                                This action <span className="text-rose-600 font-bold uppercase">cannot be undone</span>.
                            </p>
                        </div>
                        <div className="p-2 bg-gray-50/80 border-t border-gray-100 grid grid-cols-2 gap-3 pb-8 px-8">
                            <button 
                                onClick={() => { setIsDeleteModalOpen(false); setNotifToDelete(null); }}
                                className="px-4 py-3.5 bg-white border border-gray-200 text-gray-400 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-white hover:text-gray-600 transition-all shadow-sm active:scale-95"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmDelete}
                                disabled={deleting}
                                className="px-4 py-3.5 bg-rose-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                            >
                                {deleting ? <Loader2 size={16} className="animate-spin" /> : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default Notifications;
