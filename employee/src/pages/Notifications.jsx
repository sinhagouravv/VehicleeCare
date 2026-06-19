import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Bell, Loader2, Trash2 } from 'lucide-react';

const EVENT_MAPPING = {
    booking_created: { type: 'Booking', category: 'Task', color: 'bg-emerald-100 text-emerald-700', typeColor: 'bg-sky-100 text-sky-700' },
    leave: { type: 'Leave', category: 'HR', color: 'bg-purple-100 text-purple-700', typeColor: 'bg-amber-100 text-amber-800 border border-amber-200' },
    overtime: { type: 'Overtime', category: 'HR', color: 'bg-orange-100 text-orange-700', typeColor: 'bg-orange-100 text-orange-700 border border-orange-200' },
};

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [users, setUsers] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [lastRefreshed, setLastRefreshed] = useState(null);
    const [unread, setUnread] = useState(0);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [notifToDelete, setNotifToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const fetchNotifications = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            
            const storedUser = localStorage.getItem('employeeUser');
            let empId = null;
            if (storedUser) {
                const user = JSON.parse(storedUser);
                empId = user._id || user.id;
            }

            if (!empId) {
                if (!silent) setLoading(false);
                return;
            }

            const res = await fetch('http://localhost:5001/api/notifications');
            const data = await res.json();
            
            let allNotifs = data.data || [];
            
            // Filter notifications for this employee ONLY
            // 1. Must be 'booking_created'
            // 2. Must match the employee's ID in meta.assignedEmployees
            const employeeNotifs = allNotifs.filter(n => {
                if (n.eventType === 'leave' || n.eventType === 'overtime') {
                    const user = JSON.parse(storedUser || '{}');
                    return n.meta?.employeeId === empId || n.meta?.employeeId === user.employeeId || n.meta?.employeeId === user.id || n.meta?.employeeId === user._id;
                }

                if (n.eventType !== 'booking_created') return false;
                
                const assignment = n.meta?.assignedEmployees;
                if (!assignment) return false;

                const isAssigned = 
                    assignment.technician?.id === empId ||
                    assignment.technician?.employeeId === empId ||
                    assignment.support?.id === empId ||
                    assignment.support?.employeeId === empId ||
                    assignment.mechanic?.id === empId ||
                    assignment.mechanic?.employeeId === empId;
                
                return isAssigned;
            });

            setNotifications(employeeNotifs);
            setUnread(employeeNotifs.filter(n => !n.isRead).length);
            setLastRefreshed(new Date());

            // Also fetch users to build the name-to-ID map (similar to garage portal)
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

    const confirmDeleteNotif = async () => {
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
            console.error('Error deleting notification:', error);
        } finally {
            setDeleting(false);
        }
    };

    // Build a map of Name -> userId from all users AND notifications to fill in gaps
    const nameToUserIdMap = useMemo(() => {
        const map = {};
        
        // 1. Fill from the full user database
        users.forEach(u => {
            if (u.name && u.userId) {
                map[u.name.trim().toUpperCase()] = u.userId;
            }
        });

        // 2. Supplement from notifications
        notifications.forEach(n => {
            const name = (n.meta?.userName || n.meta?.name || n.message.split(' (')[0].split(' booked')[0]).trim().toUpperCase();
            if (name && n.meta?.displayUserId && n.meta.displayUserId !== 'GUEST') {
                map[name] = n.meta.displayUserId;
            }
        });

        return map;
    }, [users, notifications]);

    const getDisplayUserId = (notif) => {
        if (notif.eventType === 'leave') return notif.meta?.approverEmpId || 'SYSTEM';
        if (notif.eventType === 'overtime') return notif.meta?.approverEmpId || 'MANAGER';
        // Direct hit from meta
        if (notif.meta?.displayUserId && notif.meta.displayUserId !== 'GUEST') return notif.meta.displayUserId;
        
        // Try map lookup by name
        const name = (notif.meta?.userName || notif.meta?.name || notif.message.split(' (')[0].split(' booked')[0]).trim().toUpperCase();
        if (nameToUserIdMap[name]) return nameToUserIdMap[name];

        // Fallback to legacy userId if it looks like a custom ID
        if (notif.meta?.userId && notif.meta.userId.length < 15 && (notif.meta.userId.startsWith('65') || notif.meta.userId.startsWith('75'))) {
            return notif.meta.userId;
        }

        return 'GUEST';
    };

    const getMapping = (notif) => {
        return { ...EVENT_MAPPING[notif.eventType] } || { type: 'Task', category: 'System', color: 'bg-gray-50 text-gray-600' };
    };

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <h1 className="text-3xl font-bold text-[#011023] uppercase tracking-tight flex items-center gap-3">
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
                                <th className="p-4.5 font-bold" style={{ width: '10%' }}>Customer</th>
                                <th className="p-4.5 font-bold" style={{ width: '45%' }}>Notification Details</th>
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
                                            <p className="text-sm font-semibold uppercase">No new assignments</p>
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
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${mapping.typeColor || 'bg-gray-100 text-gray-700'}`}>
                                                    {mapping.type}
                                                </span>
                                            </td>
                                            <td className="p-4.5">
                                                <div className="flex flex-col items-center justify-center">
                                                    <span className="font-bold text-[#011023] uppercase text-[13px] truncate max-w-[120px]">
                                                        {notif.eventType === 'leave' || notif.eventType === 'overtime' ? (notif.meta?.approverName || 'MANAGER') : (notif.meta?.userName || notif.meta?.name || notif.message.split(' (')[0].split(' booked')[0] || 'N/A')}
                                                    </span>
                                                    <span className={`text-[11px] font-semibold uppercase tracking-tight ${notif.eventType === 'leave' || notif.eventType === 'overtime' ? 'text-slate-700' : 'text-gray-400'}`}>
                                                        {getDisplayUserId(notif)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4.5">
                                                <p className={`text-sm text-center uppercase ${notif.isRead ? 'text-gray-500 font-semibold' : 'text-[#011023] font-bold'}`}>
                                                    {notif.eventType === 'booking_created'
                                                        ? `A new task is assigned to you, for ${notif.meta?.service || 'service'} of ${notif.meta?.vehicle || 'vehicle'}. Kindly contact with the assigned team member's and complete the task within the time.`
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
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${notif.isRead
                                                    ? 'bg-gray-100 text-gray-600'
                                                    : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {notif.isRead ? 'Read' : 'Unread'}
                                                </span>
                                            </td>
                                            <td className="p-4.5">
                                                <div className="flex justify-center">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setNotifToDelete(notif._id); setIsDeleteModalOpen(true); }}
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
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
                                This will permanently remove this notification from your record. <br/>
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
                                onClick={confirmDeleteNotif}
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
