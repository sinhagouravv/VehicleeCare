import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Bell, Loader2, Trash2, Star, ExternalLink, Tag, X, Flame, Zap, Pin, AlertTriangle, CircleAlert, CheckCircle2, AlertOctagon, Search } from 'lucide-react';
import { TableSkeleton } from '../components/Skeleton';
import { useFilter } from '../context/FilterContext';
import { useRowLabels, FloatingLabelSelector, renderLabelIcon, stripEmoji, LABEL_FILTER_GROUP } from '../components/RowLabel';

const EVENT_MAPPING = {
    booking_created: { type: 'Booking', category: 'Task', color: 'bg-emerald-100 text-emerald-700', typeColor: 'bg-sky-100 text-sky-700' },
    leave: { type: 'Leave', category: 'HR', color: 'bg-purple-100 text-purple-700', typeColor: 'bg-amber-100 text-amber-800 border border-amber-200' },
    overtime: { type: 'Overtime', category: 'HR', color: 'bg-orange-100 text-orange-700', typeColor: 'bg-orange-100 text-orange-700 border border-orange-200' },
    meeting: { type: 'Meeting', category: 'Admin', color: 'bg-fuchsia-100 text-fuchsia-700', typeColor: 'bg-purple-100 text-purple-700 border border-purple-200' },
};

const Notifications = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [users, setUsers] = useState([]); 
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastRefreshed, setLastRefreshed] = useState(null);
    const [unread, setUnread] = useState(0);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [notifToDelete, setNotifToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [expandedIds, setExpandedIds] = useState(new Set());

    // Filter states
    const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'unread' | 'read'
    const [starFilter, setStarFilter] = useState('all'); // 'all' | 'starred'
    const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'booking_created' | 'leave' | 'overtime' | 'meeting'
    const [labelFilter, setLabelFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState('latest');
    const [timeRange, setTimeRange] = useState('all');

    const { isLabelMode, setIsLabelMode, setFilterConfig, setResultsCount } = useFilter();
    const { rowLabels, activeLabelRowId, setActiveLabelRowId, handleSaveRowLabel, labelPopupRef } = useRowLabels('notifications_row_labels');

    // Register filter options with the floating filter button
    useEffect(() => {
        setFilterConfig({
            title: 'Filter Notifications',
            groups: [
                {
                    id: 'starred',
                    label: 'Starred',
                    defaultValue: 'all',
                    options: [
                        { label: 'All', value: 'all' },
                        { label: 'Starred Only', value: 'starred' },
                    ]
                },
                {
                    id: 'status',
                    label: 'Read Status',
                    defaultValue: 'all',
                    options: [
                        { label: 'All', value: 'all' },
                        { label: 'Unread Only', value: 'unread' },
                        { label: 'Read Only', value: 'read' },
                    ]
                },
                {
                    id: 'type',
                    label: 'Type / Category',
                    defaultValue: 'all',
                    options: [
                        { label: 'All', value: 'all' },
                        { label: 'Booking', value: 'booking_created' },
                        { label: 'Leave', value: 'leave' },
                        { label: 'Overtime', value: 'overtime' },
                        { label: 'Meeting', value: 'meeting' },
                    ]
                },
                LABEL_FILTER_GROUP
            ],
            initialValues: {
                status: 'all',
                starred: 'all',
                type: 'all',
                label: 'all'
            },
            onChange: (newValues) => {
                if (newValues.status !== undefined) setStatusFilter(newValues.status);
                if (newValues.starred !== undefined) setStarFilter(newValues.starred);
                if (newValues.type !== undefined) setTypeFilter(newValues.type);
                if (newValues.label !== undefined) setLabelFilter(newValues.label);
                if (newValues.sortOrder !== undefined) setSortOrder(newValues.sortOrder);
                if (newValues.timeRange !== undefined) setTimeRange(newValues.timeRange);
            },
            onReset: () => {
                setStatusFilter('all');
                setStarFilter('all');
                setTypeFilter('all');
                setLabelFilter('all');
                setSortOrder('latest');
                setTimeRange('all');
            }
        });
        return () => setFilterConfig(null);
    }, [setFilterConfig]);

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
            
            const storedUser = localStorage.getItem('employeeUser');
            let empId = null;
            if (storedUser) {
                const user = JSON.parse(storedUser);
                empId = user._id || user.id;
            }

            if (!empId) {
                setLoading(false);
                return;
            }

            const res = await fetch('http://localhost:5001/api/notifications');
            const data = await res.json();
            
            let allNotifs = data.data || [];
            
            // Filter notifications for this employee ONLY
            const employeeNotifs = allNotifs.filter(n => {
                if (n.superCategory === 'garageNotification') return false;

                if (n.eventType === 'leave' || n.eventType === 'overtime' || n.eventType === 'meeting') {
                    const user = JSON.parse(storedUser || '{}');
                    const isTargetEmp = n.meta?.employeeId === empId || n.meta?.employeeId === user.employeeId || n.meta?.employeeId === user.id || n.meta?.employeeId === user._id;
                    return isTargetEmp && (n.superCategory === 'employees_notification' || n.meta?.status);
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

            // Also fetch employees to build employee ID-to-Name map
            const empRes = await fetch('http://localhost:5001/api/employees');
            if (empRes.ok) {
                const empData = await empRes.json();
                setEmployees(empData.data || []);
            }

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

    const handleToggleStar = async (id, e) => {
        if (e) e.stopPropagation();
        try {
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isStarred: !n.isStarred } : n));
            await fetch(`http://localhost:5001/api/notifications/${id}/star`, {
                method: 'PATCH'
            });
        } catch (err) {
            console.error("Failed to toggle star:", err);
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
            navigate('/tasks', { state: { highlightId: notif.meta?.bookingId } });
        }
    };

    // Build a map of employee ID -> Name
    const empIdToNameMap = useMemo(() => {
        const map = {};
        employees.forEach(emp => {
            if (emp.employeeId && emp.name) {
                map[String(emp.employeeId).trim()] = emp.name;
            }
            if (emp._id && emp.name) {
                map[String(emp._id).trim()] = emp.name;
            }
        });
        return map;
    }, [employees]);

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
        if (notif.eventType === 'leave' || notif.eventType === 'overtime') {
            return notif.meta?.approverEmpId || 'MANAGER';
        }
        if (notif.eventType === 'booking_created' || notif.eventType === 'meeting') {
            return notif.meta?.adminEmpId || 'SYSTEM';
        }
        return notif.meta?.adminEmpId || notif.meta?.approverEmpId || notif.meta?.senderId || 'SYSTEM';
    };

    const getSenderName = (notif) => {
        const senderId = getDisplayUserId(notif);
        if (senderId && senderId !== 'SYSTEM' && empIdToNameMap[String(senderId).trim()]) {
            return empIdToNameMap[String(senderId).trim()];
        }
        if (notif.eventType === 'leave' || notif.eventType === 'overtime') {
            return notif.meta?.approverName || 'MANAGER';
        }
        if (notif.eventType === 'booking_created' || notif.eventType === 'meeting') {
            return notif.meta?.adminName || 'ADMIN';
        }
        return notif.meta?.adminName || notif.meta?.approverName || notif.meta?.senderName || 'ADMIN';
    };

    const getMapping = (notif) => {
        return EVENT_MAPPING[notif.eventType] || { type: 'Task', category: 'System', color: 'bg-gray-50 text-gray-600', typeColor: 'bg-gray-100 text-gray-700' };
    };

    const getItemDate = (item) => {
        if (!item) return null;
        const fields = [
            item.createdAt,
            item.date,
            item.timestamp,
            item.startDate,
            item.appliedDate,
            item.bookingDate,
            item.scheduledAt,
            item.updatedAt
        ];
        for (const f of fields) {
            if (!f) continue;
            if (f instanceof Date && !isNaN(f.getTime())) return f;
            if (typeof f === 'number') {
                const d = new Date(f);
                if (!isNaN(d.getTime())) return d;
            }
            if (typeof f === 'string') {
                const trimmed = f.trim();
                const ddmmyyyy = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
                if (ddmmyyyy) {
                    const day = parseInt(ddmmyyyy[1], 10);
                    const month = parseInt(ddmmyyyy[2], 10) - 1;
                    const year = parseInt(ddmmyyyy[3], 10);
                    const d = new Date(year, month, day);
                    if (!isNaN(d.getTime())) return d;
                }
                const d = new Date(trimmed);
                if (!isNaN(d.getTime())) return d;
            }
        }
        if (typeof item._id === 'string' && item._id.length === 24 && /^[a-f\d]{24}$/i.test(item._id)) {
            const timestamp = parseInt(item._id.substring(0, 8), 16) * 1000;
            const d = new Date(timestamp);
            if (!isNaN(d.getTime())) return d;
        }
        return null;
    };

    // Filter notifications based on active criteria
    const filteredNotifications = useMemo(() => {
        const filtered = notifications.filter(n => {
            // Read status filter
            if (statusFilter === 'unread' && n.isRead) return false;
            if (statusFilter === 'read' && !n.isRead) return false;

            // Starred filter
            if (starFilter === 'starred' && !n.isStarred) return false;

            // Type filter
            if (typeFilter !== 'all') {
                if (typeFilter === 'booking_created') {
                    if (n.eventType !== 'booking_created' && n.eventType !== 'booking') return false;
                } else if (n.eventType !== typeFilter) {
                    return false;
                }
            }

            // Label filter
            if (labelFilter !== 'all') {
                const currentLabel = rowLabels[n._id];
                if (labelFilter === 'labeled') {
                    if (!currentLabel) return false;
                } else if (labelFilter === 'unlabeled') {
                    if (currentLabel) return false;
                } else {
                    if (!currentLabel || currentLabel.toUpperCase() !== labelFilter.toUpperCase()) return false;
                }
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
    }, [notifications, statusFilter, starFilter, typeFilter, labelFilter, rowLabels, sortOrder, timeRange]);

    useEffect(() => {
        setResultsCount(filteredNotifications.length);
    }, [filteredNotifications.length, setResultsCount]);

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto h-[calc(100vh-9.25rem)] flex flex-col">
            <div className="flex justify-between items-center">
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
            <div className="bg-white flex-1 min-h-0 border border-[#e9f2fb] rounded-2xl shadow-[0_1px_2.5px_0_rgba(0,0,0,0.07)] overflow-hidden flex flex-col">
                <div className="overflow-x-hidden overflow-y-auto text-center flex-1 relative hide-scrollbar">
                    <table className="w-full text-left border-collapse table-fixed">
                        <thead className="sticky top-0 z-10 shadow-sm">
                            <tr className="bg-[#f2f7ff] text-[15px] text-center uppercase tracking-wider text-gray-500 border-b border-[#f0f6fc]">
                                <th className="p-4.5 font-bold w-[11%]">Type</th>
                                <th className="p-4.5 font-bold w-[10%]">Sent By</th>
                                <th className="p-4.5 font-bold w-[55%]">Notification Details</th>
                                <th className="p-4.5 font-bold w-[10%]">Received On</th>
                                <th className="p-4.5 font-bold w-[6.5%]">Status</th>
                                <th className="p-4.5 font-bold w-[6.5%]">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-[13px] divide-[#e6f0fa]">
                            {loading && notifications.length === 0 ? (
                                <TableSkeleton rows={15} cols={6} />
                            ) : filteredNotifications.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-20 text-center text-gray-300">
                                        <div className="flex flex-col items-center gap-3">
                                            <p className="text-sm font-semibold uppercase">
                                                {notifications.length === 0 ? 'No new assignments' : 'No notifications match the active filter criteria'}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredNotifications.map((notif) => {
                                    const mapping = getMapping(notif);
                                    const isExpanded = expandedIds.has(notif._id);
                                    const hasRowLabel = Boolean(rowLabels[notif._id]);
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
                                            className={`transition-all duration-300 group cursor-pointer ${
                                                notif.isRead ? 'hover:bg-white/50' : 'bg-blue-50/40 hover:bg-blue-50/60'
                                            }`}
                                        >
                                            <td className="p-4.25 relative">
                                                <div className="relative flex items-center justify-center w-full">
                                                    {hasRowLabel && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActiveLabelRowId(prev => prev === notif._id ? null : notif._id);
                                                            }}
                                                            className="absolute -left-2 top-1/2 -translate-y-1/2 cursor-pointer hover:scale-115 transition-transform active:scale-95 p-0.5"
                                                            title={`Label: ${stripEmoji(rowLabels[notif._id])} (Click to change)`}
                                                        >
                                                            {renderLabelIcon(rowLabels[notif._id], 16)}
                                                        </button>
                                                    )}

                                                    {/* Floating Label Icons Bar */}
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
                                            <td className="p-4.25">
                                                <div className="flex flex-col items-center justify-center">
                                                    <span className="font-bold text-[#011023] uppercase text-[13px] truncate max-w-[140px]">
                                                        {getSenderName(notif)}
                                                    </span>
                                                    <span className="text-[11px] font-semibold uppercase tracking-tight text-slate-700">
                                                        {getDisplayUserId(notif)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td 
                                                className="p-4.25 cursor-pointer select-none"
                                                onClick={(e) => {
                                                    if (!isLabelMode) {
                                                        toggleExpand(notif._id, e);
                                                        if (!notif.isRead) markRead(notif._id);
                                                    }
                                                }}
                                            >
                                                <div 
                                                    className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-96' : 'max-h-[2.6rem]'}`}
                                                >
                                                    <p 
                                                        className={`text-sm text-center uppercase leading-snug transition-colors duration-200 ${notif.isRead ? 'text-gray-500 font-semibold' : 'text-[#011023] font-bold'} ${!isExpanded ? 'line-clamp-2' : ''}`}
                                                        style={!isExpanded ? { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } : {}}
                                                    >
                                                        {notif.eventType === 'booking_created'
                                                            ? `Dear Employee, A new task is assigned to you, for ${notif.meta?.service || 'service'} of ${notif.meta?.vehicle || 'vehicle'}. Kindly contact with the assigned team member's and complete the task within the time.`
                                                            : notif.message}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="p-4.25 uppercase">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-sm font-semibold text-[#011023]">
                                                        {new Date(notif.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(notif.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4.25">
                                                <div className="flex justify-center">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${notif.isRead
                                                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                                        : 'bg-blue-100 text-blue-700 border border-blue-100'
                                                        }`}>
                                                        {notif.isRead ? 'Read' : 'Unread'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4.25">
                                                <div className="flex items-center justify-center gap-4">
                                                    <button 
                                                        onClick={(e) => handleToggleStar(notif._id, e)}
                                                        className=" cursor-pointer"
                                                    >
                                                        <Star 
                                                            size={18} 
                                                            className={`transition-all duration-150 active:scale-125 ${
                                                                notif.isStarred 
                                                                    ? 'fill-amber-400 text-amber-400' 
                                                                    : 'text-gray-400 hover:text-amber-400'
                                                            }`} 
                                                        />
                                                    </button>

                                                    <button 
                                                        onClick={(e) => handleRedirect(notif, e)}
                                                        className="cursor-pointer text-gray-400 hover:text-blue-600"
                                                    >
                                                        <ExternalLink size={18} />
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
