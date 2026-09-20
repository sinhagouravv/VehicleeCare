import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Bell, Loader2, ExternalLink } from 'lucide-react';
import { TableSkeleton, SkeletonBlock } from '../components/Skeleton';
import { useFilter } from '../context/FilterContext';
import { useAlert } from '../context/AlertContext';
import { useRowLabels, FloatingLabelSelector, renderLabelIcon, stripEmoji, LABEL_FILTER_GROUP } from '../components/RowLabel';
import useGuestGuard from '../hooks/useGuestGuard';
import { API_BASE_URL } from '../config/api';

// Module-level cache for instant tab transitions
let cachedNotifications = null;
let cachedUsers = null;
let cachedNotificationsGarageId = null;
let cachedNotificationsTimestamp = null;

const EVENT_MAPPING = {
    booking: { type: 'Booking', category: 'Garage', color: 'bg-emerald-100 text-emerald-700', typeColor: 'bg-sky-100 text-sky-700' },
    booking_created: { type: 'Booking', category: 'Garage', color: 'bg-emerald-100 text-emerald-700', typeColor: 'bg-sky-100 text-sky-700' },
    meeting: { type: 'Meeting', category: 'Admin', color: 'bg-fuchsia-100 text-fuchsia-700', typeColor: 'bg-purple-100 text-purple-700 border border-purple-200' },
    id_card_requested: { type: 'Meeting', category: 'Admin', color: 'bg-fuchsia-100 text-fuchsia-700', typeColor: 'bg-purple-100 text-purple-700 border border-purple-200' },
    leave: { type: 'Leave', category: 'HR', color: 'bg-purple-100 text-purple-700', typeColor: 'bg-amber-100 text-amber-800 border border-amber-200' },
    overtime: { type: 'Overtime', category: 'HR', color: 'bg-orange-100 text-orange-700', typeColor: 'bg-orange-100 text-orange-700 border border-orange-200' },
    account_deletion: { type: 'Request', category: 'Garage', color: 'bg-emerald-100 text-emerald-700', typeColor: 'bg-purple-100 text-purple-700 border border-purple-200' },
    account_deletion_request: { type: 'Request', category: 'Garage', color: 'bg-emerald-100 text-emerald-700', typeColor: 'bg-purple-100 text-purple-700 border border-purple-200' },
    deletion_request: { type: 'Request', category: 'Garage', color: 'bg-emerald-100 text-emerald-700', typeColor: 'bg-purple-100 text-purple-700 border border-purple-200' },
    reminder: { type: 'Reminder', category: 'Admin', color: 'bg-orange-100 text-orange-900', typeColor: 'bg-orange-100 text-orange-900 border border-orange-200' },
    warning: { type: 'Warning', category: 'Admin', color: 'bg-rose-100 text-rose-800', typeColor: 'bg-rose-100 text-rose-800 border border-rose-200' },
    document: { type: 'Document', category: 'Garage', color: 'bg-emerald-100 text-emerald-700', typeColor: 'bg-sky-100 text-sky-700 border border-sky-200' },
};

const Notifications = () => {
    const outletContext = useOutletContext();
    const isSidebarCollapsed = outletContext?.isSidebarCollapsed ?? true;
    const { triggerAlert } = useAlert();
    const { isGuest, guardGuestAction } = useGuestGuard();
    const navigate = useNavigate();

    const [notifications, setNotifications] = useState(() => {
        try {
            const stored = localStorage.getItem('garageUser');
            if (stored) {
                const gId = JSON.parse(stored).id;
                if (cachedNotificationsGarageId === gId && Array.isArray(cachedNotifications)) return cachedNotifications;
            }
        } catch (e) {}
        return [];
    });
    const [users, setUsers] = useState(() => {
        try {
            const stored = localStorage.getItem('garageUser');
            if (stored) {
                const gId = JSON.parse(stored).id;
                if (cachedNotificationsGarageId === gId && Array.isArray(cachedUsers)) return cachedUsers;
            }
        } catch (e) {}
        return [];
    });
    const [loading, setLoading] = useState(() => {
        try {
            const stored = localStorage.getItem('garageUser');
            if (stored) {
                const gId = JSON.parse(stored).id;
                if (cachedNotificationsGarageId === gId && Array.isArray(cachedNotifications)) return false;
            }
        } catch (e) {}
        return true;
    });
    const [lastRefreshed, setLastRefreshed] = useState(() => cachedNotificationsTimestamp ? new Date(cachedNotificationsTimestamp) : null);
    const [_unread, setUnread] = useState(() => {
        if (Array.isArray(cachedNotifications)) return cachedNotifications.filter(n => !n.isRead).length;
        return 0;
    });
    const isFetchingRef = useRef(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [notifToDelete, setNotifToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [expandedIds, setExpandedIds] = useState(new Set());

    // Filter & Sort states
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterType, setFilterType] = useState('all');
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
                    id: 'category',
                    label: 'Category',
                    defaultValue: 'all',
                    options: [
                        { label: 'All', value: 'all' },
                        { label: 'Garage', value: 'Garage' },
                        { label: 'Admin', value: 'Admin' },
                        { label: 'HR', value: 'HR' },
                    ]
                },
                LABEL_FILTER_GROUP,
                {
                    id: 'type',
                    label: 'Type',
                    defaultValue: 'all',
                    options: [
                        { label: 'All', value: 'all' },
                        { label: 'Booking', value: 'Booking' },
                        { label: 'Request', value: 'Request' },
                        { label: 'Document', value: 'Document' },
                        { label: 'Leave', value: 'Leave' },
                        { label: 'Overtime', value: 'Overtime' },
                        { label: 'Meeting', value: 'Meeting' },
                        { label: 'Reminder', value: 'Reminder' },
                        { label: 'Warning', value: 'Warning' },
                    ]
                }
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

        return () => {
            setFilterConfig(null);
            setResultsCount(null);
        };
    }, [setFilterConfig, setResultsCount, filterCategory, filterType, labelFilter, sortOrder, timeRange]);

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
        if (isFetchingRef.current) return;
        isFetchingRef.current = true;
        try {
            if (!silent && !cachedNotifications) setLoading(true);
            
            const storedUser = localStorage.getItem('garageUser');
            let garageId = null;
            if (storedUser) {
                const user = JSON.parse(storedUser);
                garageId = user.id;
            }

            const [notifRes, userRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/notifications`),
                fetch(`${API_BASE_URL}/api/users`)
            ]);

            const data = await notifRes.json();
            let allNotifs = data.data || [];
            
            // Filter notifications for this garage ONLY
            const garageNotifs = allNotifs.filter(n => {
                if (n.superCategory === 'employees_notification' || n.superCategory === 'adminNotification' || n.superCategory === 'admin_notification') return false;

                // Initial deletion requests are meant ONLY for Admin
                const msg = (n.message || '').toLowerCase();
                const isInitialDeletionRequest = (n.eventType === 'account_deletion_request' || n.eventType === 'account_deletion') && !n.meta?.status && (msg.includes('requested account deletion') || msg.includes('requested deletion'));
                if (isInitialDeletionRequest) return false;

                if (n.eventType === 'document') {
                    const title = (n.title || '').toLowerCase();
                    const isApprovedOrRejected = title.includes('approved') || title.includes('rejected') || n.meta?.status === 'Approved' || n.meta?.status === 'Rejected';
                    const isMatchingGarage = !n.meta?.garageId || String(n.meta?.garageId) === String(garageId);
                    return (n.superCategory === 'garageNotification' || n.superCategory === 'garage_notification') && isMatchingGarage && isApprovedOrRejected;
                }

                if (n.superCategory === 'garageNotification' || n.superCategory === 'garage_notification') return true;

                const isMatchingGarage = !n.meta?.garageId || n.meta?.garageId === garageId;
                if (!isMatchingGarage) return false;
                
                return n.eventType === 'booking_created' || n.eventType === 'booking' || n.eventType === 'leave' || n.eventType === 'overtime' || n.eventType === 'meeting' || n.eventType === 'id_card_requested' || n.eventType === 'reminder' || n.eventType === 'warning';
            });

            setNotifications(garageNotifs);
            setUnread(garageNotifs.filter(n => !n.isRead).length);
            const now = new Date();
            setLastRefreshed(now);

            let usersList = [];
            if (userRes.ok) {
                const userData = await userRes.json();
                usersList = userData.data || [];
                setUsers(usersList);
            }

            cachedNotifications = garageNotifs;
            cachedUsers = usersList;
            cachedNotificationsGarageId = garageId;
            cachedNotificationsTimestamp = now.getTime();
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
            isFetchingRef.current = false;
        }
    }, []);

    useEffect(() => {
        fetchNotifications(Boolean(cachedNotifications));
        if (isGuest) return;
        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                fetchNotifications(true);
            }
        }, 30000);
        return () => clearInterval(interval);
    }, [fetchNotifications, isGuest]);

    const markRead = async (id) => {
        if (guardGuestAction()) return;
        await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, { method: 'PATCH' });
        setNotifications(prev => {
            const updated = prev.map(n => n._id === id ? { ...n, isRead: true } : n);
            cachedNotifications = updated;
            return updated;
        });
        setUnread(prev => Math.max(0, prev - 1));
    };

    const confirmDelete = async () => {
        if (guardGuestAction()) return;
        if (!notifToDelete) return;
        setDeleting(true);
        try {
            await fetch(`${API_BASE_URL}/api/notifications/${notifToDelete}`, { method: 'DELETE' });
            const deleted = notifications.find(n => n._id === notifToDelete);
            setNotifications(prev => {
                const updated = prev.filter(n => n._id !== notifToDelete);
                cachedNotifications = updated;
                return updated;
            });
            if (deleted && !deleted.isRead) setUnread(prev => Math.max(0, prev - 1));
            triggerAlert('Notification deleted successfully', 'success');
            setIsDeleteModalOpen(false);
            setNotifToDelete(null);
        } catch (error) {
            console.error('Error deleting notification:', error);
            triggerAlert('Failed to delete notification.', 'error');
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

    const getMapping = (notif) => {
        let mapping = EVENT_MAPPING[notif.eventType] ? { ...EVENT_MAPPING[notif.eventType] } : { type: notif.eventType ? notif.eventType.replace(/_/g, ' ') : 'General', category: 'Garage', color: 'bg-emerald-100 text-emerald-700', typeColor: 'bg-slate-100 text-slate-700' };
        
        const typeLower = (notif.eventType || '').toLowerCase();
        const msgLower = (notif.message || '').toLowerCase();

        if (
            typeLower.includes('deletion') ||
            typeLower.includes('delete_request') ||
            typeLower === 'account_deletion' ||
            typeLower === 'account_deletion_request' ||
            typeLower === 'deletion_request' ||
            typeLower === 'request' ||
            msgLower.includes('requested account deletion') ||
            msgLower.includes('requested deletion') ||
            msgLower.includes('deletion request') ||
            msgLower.includes('requested deletion.')
        ) {
            mapping = { ...mapping, type: 'Request', category: 'Garage', color: 'bg-emerald-100 text-emerald-700', typeColor: 'bg-purple-100 text-purple-700 border border-purple-200' };
        }
        
        if (notif.eventType === 'document') {
            mapping = { ...mapping, category: 'Garage', color: 'bg-emerald-100 text-emerald-700', typeColor: 'bg-sky-100 text-sky-700 border border-sky-200' };
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
        if (setResultsCount) {
            setResultsCount(filteredNotifications.length);
        }
    }, [filteredNotifications.length, setResultsCount]);

    return (
        <div className={`space-y-6 ${isSidebarCollapsed ? 'max-w-[92rem]' : 'max-w-[81.75rem]'} mx-auto h-[calc(100vh-9.25rem)] flex flex-col transition-all duration-300`}>
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold uppercase text-[#011023] tracking-tight">
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
                                <th className={`p-4.5 font-bold text-center transition-all duration-300 ${isSidebarCollapsed ? 'w-[57%]' : 'w-[46%]'}`}>Content</th>
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
                                            <td 
                                                className="p-4.25 cursor-pointer select-none"
                                                onClick={(e) => {
                                                    toggleExpand(notif._id, e);
                                                    if (!notif.isRead) markRead(notif._id);
                                                }}
                                            >
                                                <div 
                                                    className={`overflow-hidden transition-all duration-300 ml-1.5 ease-in-out ${isExpanded ? 'max-h-96' : 'max-h-[2.6rem]'}`}
                                                >
                                                    <p 
                                                        className={`text-sm text-center uppercase leading-snug transition-colors duration-200 ${notif.isRead ? 'text-gray-500 font-semibold' : 'text-[#011023] font-bold'} ${!isExpanded ? 'line-clamp-2' : ''}`}
                                                        style={!isExpanded ? { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } : {}}
                                                    >
                                                        {(() => {
                                                            if (notif.eventType === 'document') {
                                                                const garageName = notif.meta?.garageName || notif.meta?.name || 'Garage';
                                                                const docName = notif.meta?.docLabel || notif.meta?.documentType || 'Document';
                                                                const docIdStr = notif.meta?.docId ? ` (${notif.meta.docId})` : '';
                                                                const isApproved = (notif.title || '').toLowerCase().includes('approved') || notif.meta?.status === 'Approved';
                                                                if (isApproved) {
                                                                    return `Dear ${garageName}, Your ${docName}${docIdStr} has been approved.`;
                                                                } else {
                                                                    return `Dear ${garageName}, Your ${docName}${docIdStr} has been rejected. Kindly review the remarks provided by the administration and re-upload the document. Please ensure that you upload it correctly, as this is the final attempt to do so.`;
                                                                }
                                                            }
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
                                                                return `Dear ${garageName}, Your employee ${employeeName} ${employeeId} had requested for a meeting. Kindly review the details of the meeting and approved or reject accordingly.`;
                                                            }
                                                            if (notif.eventType === 'leave') {
                                                                const garageName = notif.meta?.garageName || 'Garage';
                                                                const employeeName = notif.meta?.employeeName || notif.meta?.name || 'Employee';
                                                                const employeeId = notif.meta?.employeeId || '';
                                                                return `Dear ${garageName}, Your employee ${employeeName} ${employeeId} had requested for a leave. Kindly review the details of the leave and approved or reject accordingly.`;
                                                            }
                                                            if (notif.eventType === 'overtime') {
                                                                const garageName = notif.meta?.garageName || 'Garage';
                                                                const employeeName = notif.meta?.employeeName || notif.meta?.name || 'Employee';
                                                                const employeeId = notif.meta?.employeeId || '';
                                                                return `Dear ${garageName}, Your employee ${employeeName} ${employeeId} had requested for a overtime. Kindly review the details of the overtime and approved or reject accordingly.`;
                                                            }
                                                            if (notif.message && notif.message.toLowerCase().includes('account deletion request')) {
                                                                if (notif.message.toLowerCase().startsWith('dear garage')) return notif.message;
                                                                return `Dear Garage, ${notif.message}`;
                                                            }
                                                            return notif.message;
                                                        })()}
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
                                                        ? 'bg-gray-100 text-gray-700 border border-gray-200'
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
