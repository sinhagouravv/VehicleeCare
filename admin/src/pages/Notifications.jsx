import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Bell, UserPlus, CalendarCheck, MessageSquare, Star, Zap, Warehouse, Loader2, CheckCheck, Trash2, ExternalLink } from 'lucide-react';
import { TableSkeleton, SkeletonBlock } from '../components/Skeleton';

const EVENT_MAPPING = {
    user_registered: { type: 'User', category: 'Website', color: 'bg-blue-100 text-blue-700', typeColor: 'bg-indigo-100 text-indigo-700' },
    message_received: { type: 'Message', category: 'Website', color: 'bg-blue-100 text-blue-700', typeColor: 'bg-fuchsia-100 text-fuchsia-700' },
    review_submitted: { type: 'Review', category: 'Garage', color: 'bg-emerald-100 text-emerald-700', typeColor: 'bg-amber-100 text-amber-700' },
    review: { type: 'Review', category: 'Garage', color: 'bg-emerald-100 text-emerald-700', typeColor: 'bg-amber-100 text-amber-700' },
    bug_reported: { type: 'Bug', category: 'Website', color: 'bg-blue-100 text-blue-700', typeColor: 'bg-rose-100 text-rose-700' },
    bug: { type: 'Bug', category: 'Website', color: 'bg-blue-100 text-blue-700', typeColor: 'bg-rose-100 text-rose-700' },
    garage_added: { type: 'Garage', category: 'Admin', color: 'bg-orange-100 text-orange-700', typeColor: 'bg-teal-100 text-teal-700' },
    charging_station_added: { type: 'Charging', category: 'Admin', color: 'bg-orange-100 text-orange-700', typeColor: 'bg-teal-100 text-teal-700' },
    employee_added: { type: 'Employee', category: 'Garage', color: 'bg-emerald-100 text-emerald-700', typeColor: 'bg-teal-100 text-teal-700' },
};

const EXCLUDED_EVENT_TYPES = new Set([
    'booking',
    'booking_created',
    'leave',
    'overtime',
    'id_card_requested',
    'id_card_status_updated',
    'meeting'
]);

import { useFilter } from '../context/FilterContext';
import { useRowLabels, FloatingLabelSelector, renderLabelIcon, stripEmoji, LABEL_FILTER_GROUP } from '../components/RowLabel';

const Notifications = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [users, setUsers] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastRefreshed, setLastRefreshed] = useState(null);
    const [_unread, setUnread] = useState(0);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [notifToDelete, setNotifToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [expandedIds, setExpandedIds] = useState(new Set());

    // Filter, Sort & Row Label States
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [labelFilter, setLabelFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState('latest');
    const [timeRange, setTimeRange] = useState('all');

    const { setFilterConfig, setResultsCount } = useFilter();
    const { rowLabels, activeLabelRowId, setActiveLabelRowId, handleSaveRowLabel, labelPopupRef, isLabelMode } = useRowLabels('admin_notifications_labels');

    // Register filter options
    useEffect(() => {
        setFilterConfig({
            title: 'Filter Notifications',
            hasSort: true,
            groups: [
                {
                    id: 'type',
                    label: 'Type',
                    defaultValue: 'all',
                    options: [
                        { label: 'All', value: 'all' },
                        { label: 'User', value: 'User' },
                        { label: 'Message', value: 'Message' },
                        { label: 'Review', value: 'Review' },
                        { label: 'Bug', value: 'Bug' },
                        // { label: 'Garage', value: 'Garage' },
                        // { label: 'Charging', value: 'Charging' },
                        { label: 'Employee', value: 'Employee' },
                    ]
                },
                {
                    id: 'category',
                    label: 'Category',
                    defaultValue: 'all',
                    options: [
                        { label: 'All', value: 'all' },
                        { label: 'Website', value: 'Website' },
                        { label: 'Garage', value: 'Garage' },
                        { label: 'Employee', value: 'Employee' },
                        { label: 'App', value: 'App' },
                        // { label: 'Admin', value: 'Admin' },
                        { label: 'Business', value: 'Business' },
                    ]
                },
                LABEL_FILTER_GROUP,
            ],
            initialValues: {
                category: filterCategory,
                type: filterType,
                label: labelFilter,
                sortOrder,
                timeRange
            },
            onChange: (newValues) => {
                if (newValues.category !== undefined) setFilterCategory(newValues.category);
                if (newValues.type !== undefined) setFilterType(newValues.type);
                if (newValues.label !== undefined) setLabelFilter(newValues.label);
                if (newValues.sortOrder !== undefined) setSortOrder(newValues.sortOrder);
                if (newValues.timeRange !== undefined) setTimeRange(newValues.timeRange);
            },
            onReset: () => {
                setFilterCategory('all');
                setFilterType('all');
                setLabelFilter('all');
                setSortOrder('latest');
                setTimeRange('all');
            }
        });
        return () => setFilterConfig(null);
    }, [setFilterConfig, filterCategory, filterType, labelFilter, sortOrder, timeRange]);

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
            const res = await fetch('http://localhost:5001/api/notifications');
            const data = await res.json();
            
            const rawNotifs = data.data || [];
            // Filter out garage/employee specific notifications (booking, leave, overtime, id_card/meeting)
            const adminNotifs = rawNotifs.filter(n => {
                if (n.superCategory === 'garageNotification' || n.superCategory === 'employees_notification') {
                    return false;
                }
                if (EXCLUDED_EVENT_TYPES.has(n.eventType)) {
                    return false;
                }
                return true;
            });

            setNotifications(adminNotifs);
            setUnread(adminNotifs.filter(n => !n.isRead).length);
            setLastRefreshed(new Date());

            // Also fetch users to build the name-to-ID map
            const userRes = await fetch('http://localhost:5001/api/users');
            if (userRes.ok) {
                const userData = await userRes.json();
                setUsers(userData.data || []);
            }

            // Also fetch employees for ID lookup
            const empRes = await fetch('http://localhost:5001/api/employees');
            if (empRes.ok) {
                const empData = await empRes.json();
                setEmployees(empData.data || []);
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

    const employeeMap = useMemo(() => {
        const map = {};
        employees.forEach(emp => {
            if (emp.employeeId) map[emp.employeeId] = emp;
            if (emp.userId) map[emp.userId] = emp;
            if (emp._id) map[emp._id] = emp;
        });
        return map;
    }, [employees]);

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
            const name = (n.meta?.userName || n.meta?.name || '').trim().toUpperCase();
            if (name && n.meta?.displayUserId && n.meta.displayUserId !== 'GUEST') {
                map[name] = n.meta.displayUserId;
            }
        });

        return map;
    }, [users, notifications]);

    const getUserName = (notif) => {
        if (notif.meta?.userName) return notif.meta.userName;
        if (notif.meta?.name) return notif.meta.name;
        if (notif.meta?.adminName) return notif.meta.adminName;
        if (notif.meta?.approverName) return notif.meta.approverName;

        const empId = notif.meta?.employeeId || notif.meta?.approverEmpId || notif.meta?.adminEmpId;
        if (empId && employeeMap[empId]?.name) {
            return employeeMap[empId].name;
        }

        if (notif.eventType === 'booking_created' && notif.message?.includes(' booked')) {
            const extracted = notif.message.split(' booked')[0].trim();
            if (extracted && extracted.length < 40) return extracted;
        }

        if (notif.eventType === 'message_received' && notif.message?.includes('Message from ')) {
            const afterFrom = notif.message.replace('Message from ', '');
            const nameOnly = afterFrom.split(' (')[0].trim();
            if (nameOnly && nameOnly.length < 40) return nameOnly;
        }

        if (empId) return `Employee (${empId})`;
        return 'System';
    };

    const getDisplayUserId = (notif) => {
        if (notif.meta?.displayUserId && notif.meta.displayUserId !== 'GUEST') return notif.meta.displayUserId;
        if (notif.meta?.employeeId) return notif.meta.employeeId;
        if (notif.meta?.userId && notif.meta.userId.length < 15) return notif.meta.userId;
        if (notif.meta?.garageId) return notif.meta.garageId;

        const userName = (notif.meta?.userName || notif.meta?.name || '').trim().toUpperCase();
        if (userName && nameToUserIdMap[userName]) return nameToUserIdMap[userName];

        if (notif.eventType === 'message_received') return 'GUEST';
        if (notif.eventType === 'garage_added') return notif.meta?.garageId || 'GAR-N/A';
        if (notif.eventType === 'charging_station_added') return notif.meta?.stationId || 'CS-N/A';

        return '—';
    };

    const handleRedirect = (notif, e) => {
        if (e) e.stopPropagation();
        if (notif.eventType === 'user_registered') {
            const userId = notif.meta?.userId || notif.meta?.displayUserId;
            navigate('/users', { state: { highlightId: userId } });
        } else if (notif.eventType === 'review_submitted' || notif.eventType === 'review') {
            const revId = notif.meta?.customReviewId || notif.meta?.reviewId || notif.meta?.displayUserId || notif.meta?.id;
            navigate('/reviews', { state: { highlightId: revId } });
        } else if (notif.eventType === 'bug_reported' || notif.eventType === 'bug') {
            const bugId = notif.meta?.bugId || notif.meta?.mongoBugId || notif.meta?.id || notif.meta?._id;
            navigate('/bug', { state: { highlightId: bugId } });
        } else if (notif.eventType === 'booking_created' || notif.eventType === 'booking') {
            const bookingId = notif.meta?.bookingId || notif.meta?.displayId;
            navigate('/bookings', { state: { highlightId: bookingId } });
        } else if (notif.eventType === 'message_received') {
            const msgId = notif.meta?.messageId || notif.meta?.id;
            navigate('/messages', { state: { highlightId: msgId } });
        } else if (notif.eventType === 'garage_added') {
            const garageId = notif.meta?.garageId;
            navigate('/garages', { state: { highlightId: garageId } });
        } else if (notif.eventType === 'charging_station_added') {
            const stationId = notif.meta?.stationId || notif.meta?.id;
            navigate('/charging-stations', { state: { highlightId: stationId } });
        } else if (notif.eventType === 'employee_added') {
            const empId = notif.meta?.employeeId || notif.meta?.id;
            navigate('/employees', { state: { highlightId: empId } });
        } else {
            navigate('/bookings');
        }
    };

    const getMapping = (notif) => {
        let mapping = EVENT_MAPPING[notif.eventType] || { 
            type: notif.eventType ? notif.eventType.replace(/_/g, ' ') : 'General', 
            category: 'Garage', 
            color: 'bg-emerald-100 text-emerald-700', 
            typeColor: 'bg-slate-100 text-slate-700' 
        };
        
        // Refine based on meta
        if (notif.eventType === 'message_received' && notif.meta?.type === 'business') {
            mapping = { ...mapping, category: 'Business', color: 'bg-purple-100 text-purple-700', typeColor: 'bg-fuchsia-100 text-fuchsia-700' };
        }
        if (notif.eventType === 'review_submitted' && notif.meta?.reviewType === 'Business') {
            mapping = { ...mapping, category: 'Business', color: 'bg-purple-100 text-purple-700', typeColor: 'bg-amber-100 text-amber-700' };
        }
        if (notif.eventType === 'bug_reported' || notif.eventType === 'bug') {
            const p = (notif.meta?.portal || '').toLowerCase();
            const msg = (notif.message || '').toLowerCase();
            if (p.includes('app') || msg.includes('app portal') || msg.includes('employee app')) {
                mapping = { ...mapping, category: 'App', color: 'bg-violet-100 text-violet-700', typeColor: 'bg-rose-100 text-rose-700' };
            } else if (p.includes('employee')) {
                mapping = { ...mapping, category: 'Employee', color: 'bg-teal-100 text-teal-700', typeColor: 'bg-rose-100 text-rose-700' };
            } else if (p.includes('garage')) {
                mapping = { ...mapping, category: 'Garage', color: 'bg-emerald-100 text-emerald-700', typeColor: 'bg-rose-100 text-rose-700' };
            } else if (p.includes('business')) {
                mapping = { ...mapping, category: 'Business', color: 'bg-purple-100 text-purple-700', typeColor: 'bg-rose-100 text-rose-700' };
            } else {
                mapping = { ...mapping, category: 'Website', color: 'bg-blue-100 text-blue-700', typeColor: 'bg-rose-100 text-rose-700' };
            }
        }

        return mapping;
    };

    const filteredNotifications = React.useMemo(() => {
        return notifications.filter(notif => {
            const mapping = getMapping(notif);
            if (filterCategory !== 'all') {
                if (mapping.category.toLowerCase() !== filterCategory.toLowerCase()) return false;
            }
            if (filterType !== 'all') {
                if (mapping.type.toLowerCase() !== filterType.toLowerCase()) return false;
            }
            if (labelFilter !== 'all') {
                const label = rowLabels[notif._id];
                if (!label || label.toUpperCase() !== labelFilter.toUpperCase()) {
                    return false;
                }
            }
            if (timeRange !== 'all') {
                const itemDate = notif.createdAt ? new Date(notif.createdAt) : null;
                if (itemDate && !isNaN(itemDate.getTime())) {
                    const now = new Date();
                    const diffDays = Math.ceil(Math.abs(now - itemDate) / (1000 * 60 * 60 * 24));
                    if (timeRange === 'week' && diffDays > 7) return false;
                    if (timeRange === 'month' && diffDays > 30) return false;
                }
            }
            return true;
        }).sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            if (dateA !== dateB && dateA > 0 && dateB > 0) {
                return sortOrder === 'latest' ? dateB - dateA : dateA - dateB;
            }
            const idA = String(a._id || a.title || '');
            const idB = String(b._id || b.title || '');
            return sortOrder === 'latest' ? idB.localeCompare(idA) : idA.localeCompare(idB);
        });
    }, [notifications, filterCategory, filterType, labelFilter, timeRange, sortOrder, rowLabels]);

    useEffect(() => {
        setResultsCount(filteredNotifications.length);
    }, [filteredNotifications.length, setResultsCount]);

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto h-[calc(100vh-9.25rem)] flex flex-col">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-[#011023] uppercase tracking-tight">
                    Notifications
                </h1>
                <div className="flex items-center gap-2 text-xs uppercase text-gray-400 font-medium self-center">
                    {!lastRefreshed ? (
                        <SkeletonBlock className="h-4 w-64 bg-slate-200/80 rounded-md" />
                    ) : (
                        `Last refreshed | ${lastRefreshed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | ${lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`
                    )}
                </div>
            </div>

            {/* Main Content Table */}
            <div className="bg-white border border-[#e9f2fb] rounded-2xl shadow-[0_1px_2.5px_0_rgba(0,0,0,0.07)] flex-1 min-h-0 overflow-hidden flex flex-col">
                <div className="overflow-x-hidden overflow-y-auto text-center flex-1 relative hide-scrollbar">
                    <table className="w-full text-center border-collapse table-fixed">
                        <thead className="sticky top-0 z-10 shadow-sm">
                            <tr className="bg-[#f0f6ff] text-[15px] uppercase tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                <th className="p-4.5 font-bold text-center w-[10.5%]">Category</th>
                                <th className="p-4.5 font-bold text-center w-[8%]">Type</th>
                                {/* <th className="p-4.5 font-bold text-center w-[10%]">User</th> */}
                                <th className="p-4.5 font-bold text-center w-[57%]">Content</th>
                                <th className="p-4.5 font-bold text-center w-[10%]">Received On</th>
                                <th className="p-4.5 font-bold text-center w-[6.5%]">Status</th>
                                <th className="p-4.5 font-bold text-center w-[5%]"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-[13px] divide-[#e6f0fa]">
                            {loading ? (
                                <TableSkeleton rows={15} cols={6} />
                            ) : filteredNotifications.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-20 text-center text-gray-300">
                                        <div className="flex flex-col items-center gap-3">
                                            <Bell size={40} />
                                            <p className="text-sm font-semibold uppercase">No notifications found</p>
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
                                             onClick={(e) => {
                                                 if (isLabelMode) {
                                                     e.stopPropagation();
                                                     setActiveLabelRowId(prev => prev === notif._id ? null : notif._id);
                                                 } else if (!notif.isRead) {
                                                     markRead(notif._id);
                                                 }
                                             }}
                                             className={`transition-all duration-300 group cursor-pointer ${
                                                 isLabelMode ? 'hover:bg-blue-50/60' : notif.isRead ? 'hover:bg-white/50' : 'bg-blue-50/40 hover:bg-blue-50/60'
                                             }`}
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
                                                            className="absolute -left-2 top-1/2 -translate-y-1/2 cursor-pointer hover:scale-115 transition-transform active:scale-95 p-0.5"
                                                            title={`Label: ${stripEmoji(rowLabels[notif._id] || 'Add label')}`}
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
                                                            positionClass="-left-4.5"
                                                        />
                                                    )}
                                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${mapping.color}`}>
                                                        {mapping.category}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4.25 text-center">
                                                <div className="flex items-center justify-center">
                                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${mapping.typeColor || 'bg-gray-100 text-gray-700'}`}>
                                                        {mapping.type}
                                                    </span>
                                                </div>
                                            </td>
                                            {/* <td className="p-4.25 text-center">
                                                <div className="flex flex-col items-center justify-center">
                                                    <span className="font-bold text-[#011023] uppercase text-[13px] truncate max-w-[150px]">
                                                        {getUserName(notif)}
                                                    </span>
                                                    <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-tight">
                                                        {getDisplayUserId(notif)}
                                                    </span>
                                                </div>
                                            </td> */}
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
                                                        className={`text-sm text-center uppercase leading-snug transition-colors duration-200 ${notif.isRead ? 'text-gray-500 font-semibold' : 'text-[#011023] font-bold'} ${!isExpanded ? 'line-clamp-2' : ''}`}
                                                        style={!isExpanded ? { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } : {}}
                                                    >
                                                        {notif.eventType === 'booking_created' 
                                                            ? notif.message.replace(/^.*booked/i, 'Booked') 
                                                            : notif.eventType === 'employee_added'
                                                            ? `A new employee, ${notif.meta?.name || 'Staff Member'}, has been added to the ${notif.meta?.garageName || 'Garage'} ${notif.meta?.garageId || 'ID'} for ${notif.meta?.role || 'Staff'} role.`
                                                            : notif.eventType === 'user_registered'
                                                            ? `A new ${notif.meta?.role === 'vendor' ? 'business ' : ''}user, ${notif.meta?.name || 'Someone'}, has created an account with us.`
                                                            : notif.message}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="p-4.25 uppercase text-center">
                                                <div className="flex flex-col items-center justify-center">
                                                    <span className="text-sm font-semibold text-[#011023]">
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
                                                <div className="flex justify-center">
                                                    <button 
                                                        onClick={(e) => handleRedirect(notif, e)}
                                                        className="cursor-pointer text-gray-400 hover:text-blue-600 transition-colors"
                                                        title="View Details"
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
