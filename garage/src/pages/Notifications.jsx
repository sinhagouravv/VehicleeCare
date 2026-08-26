import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Bell, UserPlus, CalendarCheck, MessageSquare, Star, Zap, Warehouse, Loader2, CheckCheck, Trash2, ExternalLink } from 'lucide-react';
import { TableSkeleton } from '../components/Skeleton';
import { useFilter } from '../context/FilterContext';
import { useRowLabels, FloatingLabelSelector, renderLabelIcon, stripEmoji, LABEL_FILTER_GROUP } from '../components/RowLabel';

const EVENT_MAPPING = {
    booking: { type: 'Booking', category: 'Garage', color: 'bg-emerald-100 text-emerald-700', typeColor: 'bg-sky-100 text-sky-700' },
    booking_created: { type: 'Booking', category: 'Garage', color: 'bg-emerald-100 text-emerald-700', typeColor: 'bg-sky-100 text-sky-700' },
    meeting: { type: 'Meeting', category: 'Admin', color: 'bg-fuchsia-100 text-fuchsia-700', typeColor: 'bg-purple-100 text-purple-700 border border-purple-200' },
    id_card_requested: { type: 'Meeting', category: 'Admin', color: 'bg-fuchsia-100 text-fuchsia-700', typeColor: 'bg-purple-100 text-purple-700 border border-purple-200' },
    leave: { type: 'Leave', category: 'HR', color: 'bg-purple-100 text-purple-700', typeColor: 'bg-amber-100 text-amber-800 border border-amber-200' },
    overtime: { type: 'Overtime', category: 'HR', color: 'bg-orange-100 text-orange-700', typeColor: 'bg-orange-100 text-orange-700 border border-orange-200' },
};

const Notifications = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [users, setUsers] = useState([]); // Added for smart ID mapping
    const [loading, setLoading] = useState(true);
    const [lastRefreshed, setLastRefreshed] = useState(null);
    const [_unread, setUnread] = useState(0);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [notifToDelete, setNotifToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [expandedIds, setExpandedIds] = useState(new Set());

    // Filter & Sort states
    const [typeFilter, setTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [labelFilter, setLabelFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState('latest');
    const [timeRange, setTimeRange] = useState('all');

    const { setFilterConfig, setResultsCount } = useFilter();
    const { rowLabels, activeLabelRowId, setActiveLabelRowId, handleSaveRowLabel, labelPopupRef, isLabelMode } = useRowLabels('garage_notifications_row_labels');

    // Register filter options with the floating filter button
    useEffect(() => {
        setFilterConfig({
            title: 'Filter Notifications',
            hasSort: true,
            groups: [
                {
                    id: 'status',
                    label: 'Status',
                    defaultValue: 'all',
                    options: [
                        { label: 'All', value: 'all' },
                        { label: 'Unread', value: 'unread' },
                        { label: 'Read', value: 'read' }
                    ]
                },
                {
                    id: 'type',
                    label: 'Type',
                    defaultValue: 'all',
                    options: [
                        { label: 'All', value: 'all' },
                        { label: 'Booking', value: 'Booking' },
                        { label: 'Leave', value: 'Leave' },
                        { label: 'Overtime', value: 'Overtime' },
                        { label: 'Meeting', value: 'Meeting' }
                    ]
                },
                LABEL_FILTER_GROUP
            ],
            initialValues: {
                type: 'all',
                status: 'all',
                label: 'all'
            },
            onChange: (newValues) => {
                if (newValues.type !== undefined) setTypeFilter(newValues.type);
                if (newValues.status !== undefined) setStatusFilter(newValues.status);
                if (newValues.label !== undefined) setLabelFilter(newValues.label);
                if (newValues.sortOrder !== undefined) setSortOrder(newValues.sortOrder);
                if (newValues.timeRange !== undefined) setTimeRange(newValues.timeRange);
            },
            onReset: () => {
                setTypeFilter('all');
                setStatusFilter('all');
                setLabelFilter('all');
                setSortOrder('latest');
                setTimeRange('all');
            }
        });

        return () => {
            setFilterConfig(null);
            setResultsCount(null);
        };
    }, [setFilterConfig, setResultsCount]);

    const getItemDate = (item) => {
        if (!item) return null;
        if (item.createdAt) {
            const d = new Date(item.createdAt);
            if (!isNaN(d.getTime())) return d;
        }
        return null;
    };

    const filteredNotifications = useMemo(() => {
        const filtered = notifications.filter((n) => {
            if (typeFilter && typeFilter !== 'all') {
                const mapInfo = EVENT_MAPPING[n.event] || { type: 'General' };
                const nType = (mapInfo.type || '').trim().toLowerCase();
                if (nType !== typeFilter.trim().toLowerCase()) return false;
            }
            if (statusFilter && statusFilter !== 'all') {
                if (statusFilter === 'unread' && n.read) return false;
                if (statusFilter === 'read' && !n.read) return false;
            }
            if (timeRange && timeRange !== 'all') {
                const itemDate = getItemDate(n);
                if (itemDate) {
                    const now = new Date();
                    let cutoff;
                    if (timeRange === 'week') {
                        cutoff = new Date();
                        cutoff.setDate(now.getDate() - 7);
                    } else if (timeRange === 'month') {
                        cutoff = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    }
                    if (cutoff) {
                        cutoff.setHours(0, 0, 0, 0);
                        if (itemDate < cutoff) return false;
                    }
                }
            }
            if (labelFilter !== 'all') {
                const currentLabel = rowLabels[n._id];
                if (!currentLabel || currentLabel.toUpperCase() !== labelFilter.toUpperCase()) return false;
            }
            return true;
        });

        return filtered.sort((a, b) => {
            const dateA = getItemDate(a)?.getTime() || 0;
            const dateB = getItemDate(b)?.getTime() || 0;
            if (sortOrder === 'oldest') {
                return dateA - dateB;
            }
            return dateB - dateA;
        });
    }, [notifications, typeFilter, statusFilter, labelFilter, rowLabels, sortOrder, timeRange]);

    useEffect(() => {
        if (setResultsCount) {
            setResultsCount(filteredNotifications.length);
        }
    }, [filteredNotifications.length, setResultsCount]);

    const toggleExpand = (id, e) => {
        if (e) e.stopPropagation();
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

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
            const garageNotifs = allNotifs.filter(n => {
                if (n.superCategory === 'employees_notification') return false;

                const isMatchingGarage = n.meta?.garageId === garageId;
                if (!isMatchingGarage) return false;
                
                if (n.superCategory === 'garageNotification') return true;
                return n.eventType === 'booking_created' || n.eventType === 'booking' || n.eventType === 'leave' || n.eventType === 'overtime' || n.eventType === 'meeting' || n.eventType === 'id_card_requested';
            });

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

    const handleRedirect = (notif, e) => {
        if (e) e.stopPropagation();
        if (notif.eventType === 'leave') {
            const leaveId = notif.meta?.leaveCustomId || notif.meta?.leaveId || notif.message?.match(/LEV-[A-Z0-9-]+/i)?.[0];
            navigate('/leave', { state: { highlightId: leaveId } });
        } else if (notif.eventType === 'overtime') {
            const overtimeId = notif.meta?.overtimeCustomId || notif.meta?.overtimeId || notif.message?.match(/OVT-[A-Z0-9-]+/i)?.[0];
            navigate('/overtime', { state: { highlightId: overtimeId } });
        } else if (notif.eventType === 'meeting' || notif.eventType === 'id_card_status_updated' || notif.eventType === 'id_card_requested') {
            const meetingId = notif.meta?.requestId || notif.meta?.meetingId || notif.meta?.id;
            navigate('/meeting', { state: { highlightId: meetingId } });
        } else if (notif.eventType === 'booking_created' || notif.eventType === 'booking') {
            navigate('/my-bookings', { state: { highlightId: notif.meta?.bookingId } });
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

    const _getDisplayUserId = (notif) => {
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
        let mapping = EVENT_MAPPING[notif.eventType] ? { ...EVENT_MAPPING[notif.eventType] } : { type: 'Event', category: 'System', color: 'bg-gray-50 text-gray-600' };
        
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
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold uppercase text-[#011023] tracking-tight">Notifications</h1>
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
            <div className="bg-white border border-[#e9f2fb] rounded-2xl shadow-[0_1px_2.5px_0_rgba(0,0,0,0.07)] flex-1 min-h-0 overflow-hidden flex flex-col">
                <div className="overflow-x-hidden overflow-y-auto text-center flex-1 relative hide-scrollbar">
                    <table className="w-full text-left border-collapse table-fixed">
                        <thead className="sticky top-0 z-10 shadow-sm">
                            <tr className="bg-[#f0f6ff] text-[15px] uppercase tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                <th className="p-4.5 font-bold text-center w-[11.5%]">Type</th>
                                <th className="p-4.5 font-bold text-center w-[9%]">Send By</th>
                                <th className="p-4.5 font-bold text-center w-[53%]">Content</th>
                                <th className="p-4.5 font-bold text-center w-[10%]">Received On</th>
                                <th className="p-4.5 font-bold text-center w-[6%]">Status</th>
                                <th className="p-4.5 font-bold text-center w-[5%]"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-[13px] divide-[#e6f0fa]">
                            {loading && filteredNotifications.length === 0 ? (
                                <TableSkeleton rows={15} cols={6} />
                            ) : filteredNotifications.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-20 text-center text-gray-300">
                                        <div className="flex flex-col items-center gap-3">
                                            <Bell size={40} />
                                            <p className="text-sm font-semibold uppercase">No notifications yet</p>
                                        </div>
                                    </td>
                                </tr>
                             ) : (
                                filteredNotifications.map((notif) => {
                                    const mapping = getMapping(notif);
                                    const isExpanded = expandedIds.has(notif._id);
                                    return (
                                        <tr 
                                            key={notif._id} 
                                            onClick={() => {
                                                if (isLabelMode) {
                                                    setActiveLabelRowId(prev => prev === notif._id ? null : notif._id);
                                                } else if (!notif.isRead) {
                                                    markRead(notif._id);
                                                }
                                            }}
                                            className={`transition-all duration-300 group cursor-pointer ${notif.isRead ? 'hover:bg-white/50' : 'bg-blue-50/40 hover:bg-blue-50/60'}`}
                                        >
                                            <td className="p-4.25 text-center relative">
                                                <div className="relative flex items-center justify-center w-full">
                                                    {Boolean(rowLabels[notif._id]) && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActiveLabelRowId(prev => prev === notif._id ? null : notif._id);
                                                            }}
                                                            className="absolute -left-1.5 top-1/2 -translate-y-1/2 cursor-pointer hover:scale-115 transition-transform active:scale-95 p-0.5"
                                                            title={`Label: ${stripEmoji(rowLabels[notif._id])}`}
                                                        >
                                                            {renderLabelIcon(rowLabels[notif._id], 16)}
                                                        </button>
                                                    )}

                                                    {activeLabelRowId === notif._id && (
                                                        <FloatingLabelSelector 
                                                            rowId={notif._id}
                                                            currentLabel={rowLabels[notif._id]}
                                                            onSaveLabel={handleSaveRowLabel}
                                                            labelPopupRef={labelPopupRef}
                                                            positionClass="-left-4"
                                                        />
                                                    )}

                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${mapping.typeColor || 'bg-gray-100 text-gray-700'}`}>
                                                        {mapping.type}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4.25 text-center">
                                                <div className="flex flex-col items-center justify-center">
                                                    <span className="font-semibold text-[#011023] uppercase text-[13px] truncate max-w-[140px]">
                                                        {notif.meta?.senderName || 'ADMINISTRATOR'}
                                                    </span>
                                                    <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-tight">
                                                        {notif.meta?.senderId || '184592037461'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td 
                                                className="p-4.25 cursor-pointer select-none"
                                                onClick={(e) => {
                                                    toggleExpand(notif._id, e);
                                                    if (!notif.isRead) markRead(notif._id);
                                                }}
                                            >
                                                <div 
                                                    className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-96' : 'max-h-[2.6rem]'}`}
                                                >
                                                    <p 
                                                        className={`text-sm text-center uppercase leading-snug transition-colors duration-200 ${notif.isRead ? 'text-gray-500 font-semibold' : 'text-[#011023] font-semibold'} ${!isExpanded ? 'line-clamp-2' : ''}`}
                                                        style={!isExpanded ? { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } : {}}
                                                    >
                                                        {(() => {
                                                            if (notif.message && notif.message.startsWith('Dear ')) return notif.message;
                                                            if (notif.eventType === 'booking' || notif.eventType === 'booking_created') {
                                                                const garageName = notif.meta?.garageName || 'Garage';
                                                                const customerName = notif.meta?.userName || notif.meta?.name || 'Customer';
                                                                const vehicleName = notif.meta?.vehicle || 'Vehicle';
                                                                const date = notif.meta?.scheduleDate || notif.meta?.date || new Date(notif.createdAt).toLocaleDateString('en-GB');
                                                                return `Dear ${garageName}, a new booking has been made by ${customerName} for ${vehicleName} for ${date}. Kindly ensure that the process is completed successfully and that the booking is confirmed for the specified time.`;
                                                            }
                                                            if (notif.eventType === 'meeting' || notif.eventType === 'id_card_requested') {
                                                                const garageName = notif.meta?.garageName || 'Garage';
                                                                const employeeName = notif.meta?.name || notif.meta?.employeeName || 'Employee';
                                                                const employeeId = notif.meta?.employeeId || '';
                                                                return `Dear ${garageName}, Your employee ${employeeName} ${employeeId} had requested for a meeting. Kindly review the details of the meeting and approved or reject according.`;
                                                            }
                                                            if (notif.eventType === 'leave') {
                                                                const garageName = notif.meta?.garageName || 'Garage';
                                                                const employeeName = notif.meta?.employeeName || notif.meta?.name || 'Employee';
                                                                const employeeId = notif.meta?.employeeId || '';
                                                                return `Dear ${garageName}, Your employee ${employeeName} ${employeeId} had requested for a leave. Kindly review the details of the leave and approved or reject according.`;
                                                            }
                                                            if (notif.eventType === 'overtime') {
                                                                const garageName = notif.meta?.garageName || 'Garage';
                                                                const employeeName = notif.meta?.employeeName || notif.meta?.name || 'Employee';
                                                                const employeeId = notif.meta?.employeeId || '';
                                                                return `Dear ${garageName}, Your employee ${employeeName} ${employeeId} had requested for a overtime. Kindly review the details of the overtime and approved or reject according.`;
                                                            }
                                                            return notif.message;
                                                        })()}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="p-4.25 uppercase text-center">
                                                <div className="flex flex-col items-center justify-center">
                                                    <span className="text-sm font-semibold ">
                                                        {new Date(notif.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(notif.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4.25 text-center">
                                                <div className="flex justify-center">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${notif.isRead
                                                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                                        : 'bg-blue-100 text-blue-700 border border-blue-100'
                                                        }`}>
                                                        {notif.isRead ? 'Read' : 'Unread'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4.25 text-center">
                                                <div className="flex items-center justify-center gap-4">
                                                    <button 
                                                        onClick={(e) => handleRedirect(notif, e)}
                                                        className="cursor-pointer text-gray-400 hover:text-blue-600 transition-colors"
                                                        title="View Details"
                                                    >
                                                        <ExternalLink size={18} />
                                                    </button>
                                                    {/* <button 
                                                        onClick={(e) => { e.stopPropagation(); setNotifToDelete(notif._id); setIsDeleteModalOpen(true); }}
                                                        className="cursor-pointer text-gray-400 hover:text-red-500 transition-colors"
                                                        title="Delete Notification"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button> */}
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
                                This will permanently remove this notification. <br/>
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
