import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Eye, X, Mail, RefreshCw, Search, CheckCircle2, AlertCircle, Clock, Send, ShieldAlert, User, Briefcase, Users, ExternalLink } from 'lucide-react';
import { useAlert } from '../context/AlertContext';
import { useFilter } from '../context/FilterContext';
import { useRowLabels, FloatingLabelSelector, renderLabelIcon, stripEmoji, LABEL_FILTER_GROUP } from './RowLabel';
import { SkeletonBlock } from './Skeleton';
import API_BASE_URL from '../config/api';

const MailModal = ({ isOpen, onClose, isSidebarCollapsed = true }) => {
    const { triggerAlert } = useAlert();
    const [mails, setMails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastRefreshed, setLastRefreshed] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Selected mail for View Details Sub-Modal
    const [selectedMail, setSelectedMail] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    // Filter, Sort & Row Label States
    const [filterType, setFilterType] = useState('All'); // 'All' | 'Customer' | 'Employee' | 'User'
    const [filterStatus, setFilterStatus] = useState('All');
    const [labelFilter, setLabelFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState('latest');
    const [timeRange, setTimeRange] = useState('all');

    const { filterConfig: activeContextConfig, setFilterConfig, setResultsCount } = useFilter();
    const { rowLabels, activeLabelRowId, setActiveLabelRowId, handleSaveRowLabel, labelPopupRef, isLabelMode } = useRowLabels('admin_sent_mails_labels');

    const previousConfigRef = useRef(null);
    useEffect(() => {
        if (isOpen) {
            if (activeContextConfig && activeContextConfig.title !== 'Filter Sent Emails') {
                previousConfigRef.current = activeContextConfig;
            }

            setFilterConfig({
                title: 'Filter Sent Emails',
                groups: [
                    {
                        id: 'recipientType',
                        title: 'Recipient Type',
                        options: [
                            { label: 'All Recipients', value: 'all' },
                            { label: 'Customer', value: 'Customer' },
                            { label: 'Employee', value: 'Employee' },
                            { label: 'User', value: 'User' }
                        ]
                    },
                    {
                        id: 'status',
                        title: 'Delivery Status',
                        options: [
                            { label: 'All Statuses', value: 'all' },
                            { label: 'Sent', value: 'Sent' },
                            { label: 'Delivered', value: 'Delivered' },
                            { label: 'Failed', value: 'Failed' }
                        ]
                    },
                    LABEL_FILTER_GROUP
                ],
                values: {
                    recipientType: filterType === 'All' ? 'all' : filterType,
                    status: filterStatus === 'All' ? 'all' : filterStatus,
                    label: labelFilter
                },
                sortOrder: sortOrder,
                timeRange: timeRange,
                onChange: (newValues) => {
                    if (newValues.recipientType !== undefined) {
                        setFilterType(newValues.recipientType === 'all' ? 'All' : newValues.recipientType);
                    }
                    if (newValues.status !== undefined) {
                        setFilterStatus(newValues.status === 'all' ? 'All' : newValues.status);
                    }
                    if (newValues.label !== undefined) {
                        setLabelFilter(newValues.label);
                    }
                    if (newValues.sortOrder !== undefined) {
                        setSortOrder(newValues.sortOrder);
                    }
                    if (newValues.timeRange !== undefined) {
                        setTimeRange(newValues.timeRange);
                    }
                }
            });
        }

        return () => {
            setFilterConfig(previousConfigRef.current || null);
        };
    }, [isOpen, setFilterConfig, filterType, filterStatus, labelFilter, sortOrder, timeRange]);

    // Format date string to 12-hour display: DD Mon YYYY | hh:mm:ss am/pm
    const formatDateTime = (dateString) => {
        if (!dateString) return '—';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '—';
        const day = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        const time = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
        return `${day} | ${time}`;
    };

    // Type pill styling
    const getTypeBadge = (type) => {
        switch (type?.toLowerCase()) {
            case 'customer':
                return {
                    label: 'Customer',
                    className: 'bg-emerald-100 text-emerald-800 border-emerald-200'
                };
            case 'employee':
                return {
                    label: 'Employee',
                    className: 'bg-purple-100 text-purple-700 border-purple-200'
                };
            case 'user':
                return {
                    label: 'User',
                    className: 'bg-blue-100 text-blue-700 border-blue-200'
                };
            case 'garage':
                return {
                    label: 'Garage',
                    className: 'bg-amber-100 text-amber-800 border-amber-200'
                };
            case 'admin':
                return {
                    label: 'Admin',
                    className: 'bg-rose-100 text-rose-800 border-rose-200'
                };
            default:
                return {
                    label: type || 'User',
                    className: 'bg-gray-100 text-gray-700 border-gray-200'
                };
        }
    };

    // Status pill styling
    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case 'delivered':
                return {
                    label: 'Delivered',
                    className: 'bg-emerald-100 text-emerald-800 border-emerald-200'
                };
            case 'sent':
                return {
                    label: 'Sent',
                    className: 'bg-blue-100 text-blue-700 border-blue-200'
                };
            case 'failed':
                return {
                    label: 'Failed',
                    className: 'bg-rose-100 text-rose-800 border-rose-200'
                };
            default:
                return {
                    label: status || 'Sent',
                    className: 'bg-gray-100 text-gray-700 border-gray-200'
                };
        }
    };

    // Category pill styling
    const getCategoryBadge = (category) => {
        const cat = (category || '').toLowerCase();
        if (cat.includes('otp')) {
            return 'bg-amber-50 text-amber-700 border-amber-200';
        }
        if (cat.includes('welcome') || cat.includes('credentials')) {
            return 'bg-blue-50 text-blue-700 border-blue-200';
        }
        if (cat.includes('leave') || cat.includes('meeting')) {
            return 'bg-purple-50 text-purple-700 border-purple-200';
        }
        if (cat.includes('alert') || cat.includes('security')) {
            return 'bg-rose-50 text-rose-700 border-rose-200';
        }
        return 'bg-slate-100 text-slate-700 border-slate-200';
    };

    // Fetch sent email logs from backend
    const fetchMails = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const res = await fetch(`${API_BASE_URL}/api/email-logs?limit=200&t=${Date.now()}`);
            if (res.ok) {
                const data = await res.json();
                if (data.success && Array.isArray(data.data)) {
                    setMails(data.data);
                }
            }
            setLastRefreshed(new Date());
        } catch (err) {
            console.error('Failed to fetch email logs:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Polling when modal is open
    useEffect(() => {
        if (!isOpen) return;

        fetchMails();
        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                fetchMails(true);
            }
        }, 8000);

        return () => clearInterval(interval);
    }, [isOpen, fetchMails]);

    // Filter, search & sort
    const filteredMails = useMemo(() => {
        return mails.filter(mail => {
            // Type tab filter (Customer, Employee, User)
            if (filterType !== 'All') {
                if (mail.recipientType?.toLowerCase() !== filterType.toLowerCase()) {
                    return false;
                }
            }

            // Status filter
            if (filterStatus !== 'All') {
                if (mail.status?.toLowerCase() !== filterStatus.toLowerCase()) {
                    return false;
                }
            }

            // Search query
            if (searchQuery.trim()) {
                const query = searchQuery.trim().toLowerCase();
                const matchId = (mail.emailId || '').toLowerCase().includes(query);
                const matchName = (mail.recipientName || '').toLowerCase().includes(query);
                const matchEmail = (mail.recipientEmail || '').toLowerCase().includes(query);
                const matchSubject = (mail.subject || '').toLowerCase().includes(query);
                const matchCategory = (mail.category || '').toLowerCase().includes(query);
                if (!matchId && !matchName && !matchEmail && !matchSubject && !matchCategory) {
                    return false;
                }
            }

            // Row label filter
            const rowId = String(mail._id || mail.emailId);
            if (labelFilter !== 'all') {
                const label = rowLabels[rowId] || (mail.emailId ? rowLabels[mail.emailId] : null);
                if (!label || label.toUpperCase() !== labelFilter.toUpperCase()) {
                    return false;
                }
            }

            // Time range filter
            if (timeRange !== 'all') {
                const itemDate = mail.sentAt || mail.createdAt ? new Date(mail.sentAt || mail.createdAt) : null;
                if (itemDate && !isNaN(itemDate.getTime())) {
                    const now = new Date();
                    const diffDays = Math.ceil(Math.abs(now - itemDate) / (1000 * 60 * 60 * 24));
                    if (timeRange === 'week' && diffDays > 7) return false;
                    if (timeRange === 'month' && diffDays > 30) return false;
                }
            }

            return true;
        }).sort((a, b) => {
            const dateA = a.sentAt || a.createdAt ? new Date(a.sentAt || a.createdAt).getTime() : 0;
            const dateB = b.sentAt || b.createdAt ? new Date(b.sentAt || b.createdAt).getTime() : 0;
            if (dateA !== dateB && dateA > 0 && dateB > 0) {
                return sortOrder === 'latest' ? dateB - dateA : dateA - dateB;
            }
            return (b.emailId || '').localeCompare(a.emailId || '');
        });
    }, [mails, filterType, filterStatus, searchQuery, labelFilter, sortOrder, timeRange, rowLabels]);

    // Update active results count in filter context
    useEffect(() => {
        if (isOpen) {
            setResultsCount(filteredMails.length);
        }
    }, [filteredMails.length, isOpen, setResultsCount]);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (isViewModalOpen) {
                    setIsViewModalOpen(false);
                } else if (isOpen) {
                    onClose();
                }
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isViewModalOpen, onClose]);

    // Open detail modal helper
    const handleOpenDetail = (mail) => {
        setSelectedMail(mail);
        setIsViewModalOpen(true);
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop Blur */}
            <div 
                className="fixed inset-y-0 left-0 right-1 bg-[#011023]/1 backdrop-blur-sm z-25 transition-all duration-300 animate-in fade-in duration-200 cursor-pointer"
                onClick={onClose}
            />

            {/* Main Modal Container */}
            <div className={`fixed top-0 bottom-0 right-0 z-30 flex items-center justify-center p-6 transition-all duration-300 pointer-events-none ${isSidebarCollapsed ? 'left-[0.5rem]' : 'left-[15.75rem]'}`}>
                <div className="bg-white border border-[#cbd5e1] rounded-3xl shadow-xl w-full max-w-[101rem] h-[93.75vh] overflow-hidden relative z-10 p-6 flex flex-col animate-in zoom-in duration-200 pointer-events-auto">
                    
                    <div className="space-y-4 max-w-[97.5rem] mx-auto flex flex-col h-full overflow-hidden w-full">
                        {/* Header matching Bug.jsx */}
                        <div className="flex justify-between items-center">
                            <h1 className="text-2xl font-bold uppercase text-[#011023] tracking-tight flex items-center gap-2">
                                Sent Emails
                            </h1>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 text-xs uppercase text-gray-400 font-medium self-center">
                                    {!lastRefreshed ? (
                                        <SkeletonBlock className="h-4 w-64 bg-slate-200/80 rounded-md" />
                                    ) : (
                                        `Last refreshed | ${lastRefreshed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | ${lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Main Content Table matching Bug.jsx and DeveloperRequestsModal.jsx */}
                        <div className="bg-white border border-[#e9f2fb] rounded-2xl shadow-[0_1px_2.5px_0_rgba(0,0,0,0.07)] flex-1 min-h-0 overflow-hidden flex flex-col">
                            <div className="overflow-x-hidden overflow-y-auto text-center flex-1 relative hide-scrollbar">
                                <table className="w-full text-center border-collapse table-fixed">
                                    <thead className="sticky top-0 z-30 shadow-sm bg-[#f0f6ff]">
                                        <tr className="bg-[#f0f6ff] text-[15px] uppercase tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                            <th className="p-4 font-bold text-center w-[7%]">Mail ID</th>
                                            <th className="p-4 font-bold text-center w-[15%]">Recipient</th>
                                            <th className="p-4 font-bold text-center w-[10%]">Type</th>
                                            <th className="p-4 font-bold text-center w-[12%]">Category</th>
                                            <th className="p-4 font-bold text-center w-[27%]">Subject</th>
                                            <th className="p-4 font-bold text-center w-[16%]">Date Sent</th>
                                            <th className="p-4 font-bold text-center w-[8%]">Status</th>
                                            <th className="p-4 font-bold text-center w-[6.5%]">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y text-[13px] divide-[#e6f0fa] uppercase font-semibold text-gray-700">
                                        {loading && mails.length === 0 ? (
                                            Array.from({ length: 10 }).map((_, i) => (
                                                <tr key={i} className="border-b border-[#e6f0fa] animate-pulse">
                                                    <td className="p-4 text-center"><div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div></td>
                                                    <td className="p-4 text-center"><div className="h-4 bg-gray-200 rounded w-28 mx-auto"></div></td>
                                                    <td className="p-4 text-center"><div className="h-5 bg-gray-200 rounded-full w-20 mx-auto"></div></td>
                                                    <td className="p-4 text-center"><div className="h-5 bg-gray-200 rounded-full w-24 mx-auto"></div></td>
                                                    <td className="p-4 text-center"><div className="h-4 bg-gray-200 rounded w-48 mx-auto"></div></td>
                                                    <td className="p-4 text-center"><div className="h-4 bg-gray-200 rounded w-28 mx-auto"></div></td>
                                                    <td className="p-4 text-center"><div className="h-5 bg-gray-200 rounded-full w-16 mx-auto"></div></td>
                                                    <td className="p-4 text-center"><div className="h-6 bg-gray-200 rounded-full w-8 mx-auto"></div></td>
                                                </tr>
                                            ))
                                        ) : filteredMails.length === 0 ? (
                                            <tr>
                                                <td colSpan="8" className="p-16 text-center text-gray-400">
                                                    <div className="flex flex-col items-center justify-center gap-3">
                                                        <Mail size={40} className="text-gray-300 stroke-[1.5]" />
                                                        <p className="text-base font-medium">No sent emails found</p>
                                                        <p className="text-xs text-gray-400 lowercase">
                                                            {searchQuery ? 'Try adjusting your search criteria' : 'Sent email notifications will appear here automatically'}
                                                        </p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredMails.map((mail) => {
                                                const rowId = String(mail._id || mail.emailId);
                                                const rowLabel = rowLabels[rowId] || (mail.emailId ? rowLabels[mail.emailId] : null);
                                                const typeInfo = getTypeBadge(mail.recipientType);
                                                const statusInfo = getStatusBadge(mail.status);

                                                return (
                                                    <tr 
                                                        key={mail._id || mail.emailId}
                                                        onClick={() => handleOpenDetail(mail)}
                                                        className="hover:bg-blue-50/40 transition-colors border-b border-[#e6f0fa] cursor-pointer group"
                                                    >
                                                        {/* Mail ID with floating row label */}
                                                        <td className="p-4 text-center text-gray-500 font-semibold relative">
                                                            <div className="relative inline-flex items-center justify-center">
                                                                {/* Row Label Selector Indicator */}
                                                                {isLabelMode && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setActiveLabelRowId(prev => prev === rowId ? null : rowId);
                                                                        }}
                                                                        className="absolute -left-1.5 top-1/2 -translate-y-1/2 cursor-pointer hover:scale-115 transition-transform active:scale-95 p-0.5 z-10"
                                                                        title={`Label: ${stripEmoji(rowLabel || 'Add label')}`}
                                                                    >
                                                                        {renderLabelIcon(rowLabel, 16)}
                                                                    </button>
                                                                )}

                                                                {activeLabelRowId === rowId && (
                                                                    <FloatingLabelSelector 
                                                                        rowId={rowId}
                                                                        currentLabel={rowLabel}
                                                                        onSaveLabel={handleSaveRowLabel}
                                                                        labelPopupRef={labelPopupRef}
                                                                        topClass="-top-8.5"
                                                                        positionClass="-left-4"
                                                                    />
                                                                )}
                                                                <span>{mail.emailId}</span>
                                                            </div>
                                                        </td>

                                                        {/* Recipient (Name & Email) */}
                                                        <td className="p-4 text-center">
                                                            <div className="flex flex-col items-center justify-center">
                                                                <span className="font-semibold text-[#052558] truncate max-w-[200px]" title={mail.recipientName}>
                                                                    {mail.recipientName || 'Recipient'}
                                                                </span>
                                                                <span className="text-xs text-gray-500 lowercase font-medium truncate max-w-[200px]" title={mail.recipientEmail}>
                                                                    {mail.recipientEmail}
                                                                </span>
                                                            </div>
                                                        </td>

                                                        {/* Recipient Type Badge */}
                                                        <td className="p-4 text-center">
                                                            <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full border uppercase ${typeInfo.className}`}>
                                                                {typeInfo.label}
                                                            </span>
                                                        </td>

                                                        {/* Category Badge */}
                                                        <td className="p-4 text-center">
                                                            <span className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-lg border uppercase truncate max-w-[150px] ${getCategoryBadge(mail.category)}`} title={mail.category}>
                                                                {mail.category || 'Notification'}
                                                            </span>
                                                        </td>

                                                        {/* Subject */}
                                                        <td className="p-4 text-center font-semibold text-[#011023] truncate max-w-[260px] uppercase">
                                                            <span title={mail.subject}>{mail.subject}</span>
                                                        </td>

                                                        {/* Date Sent (12-hour format) */}
                                                        <td className="p-4 text-center whitespace-nowrap text-sm text-gray-800 font-semibold">
                                                            <div className="flex items-center justify-center w-full">
                                                                <span className="flex-1 text-right">
                                                                    {new Date(mail.sentAt || mail.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                </span>
                                                                <span className="px-1.5 text-gray-700">|</span>
                                                                <span className="flex-1 text-left">
                                                                    {new Date(mail.sentAt || mail.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                                                                </span>
                                                            </div>
                                                        </td>

                                                        {/* Status Badge */}
                                                        <td className="p-4 text-center">
                                                            <span className={`inline-block px-3 py-1 text-xs text-center font-semibold rounded-full border uppercase ${statusInfo.className}`}>
                                                                {statusInfo.label}
                                                            </span>
                                                        </td>

                                                        {/* Action: View Eye */}
                                                        <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                                                            <div className="flex items-center justify-center gap-3">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleOpenDetail(mail)}
                                                                    className="text-gray-400 hover:text-blue-600 transition-colors cursor-pointer flex items-center justify-center"
                                                                    title="View Email Message"
                                                                >
                                                                    <Eye size={18} />
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
                </div>
            </div>

            {/* View Details Sub-Modal */}
            {isViewModalOpen && selectedMail && createPortal(
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#011023]/20 backdrop-blur-sm"
                    onClick={() => setIsViewModalOpen(false)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-5 border-b border-[#e6f0fa] flex justify-between items-center bg-gradient-to-r from-blue-50/50 to-white">
                            <div>
                                <h3 className="text-xl uppercase font-bold text-[#052558] flex items-center gap-2.5">
                                    <Mail size={22} className="text-blue-600" />
                                    Email Details
                                </h3>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    Mail ID: <span className="font-semibold text-gray-700">{selectedMail.emailId}</span>
                                </p>
                            </div>
                            <button
                                onClick={() => setIsViewModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 rounded-full transition-colors cursor-pointer p-1 hover:bg-slate-100"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content Grid */}
                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            {/* 3-Column Info Grid matching DeveloperRequestsModal & Bug.jsx */}
                            <div className="flex flex-col md:flex-row gap-6 w-full text-left">
                                {/* Column 1: Recipient Info */}
                                <div className="space-y-4 w-full md:w-[35%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Recipient Info</h4>
                                    <div className="pt-3 rounded-xl uppercase space-y-2">
                                        <p className="text-sm flex">
                                            <span className="text-gray-500 w-20 shrink-0 font-medium">Name:</span>
                                            <span className="font-semibold text-[#011023] truncate" title={selectedMail.recipientName}>
                                                {selectedMail.recipientName || 'Recipient'}
                                            </span>
                                        </p>
                                        <p className="text-sm flex">
                                            <span className="text-gray-500 w-20 shrink-0 font-medium">Email:</span>
                                            <span className="font-semibold text-gray-800 lowercase truncate" title={selectedMail.recipientEmail}>
                                                {selectedMail.recipientEmail}
                                            </span>
                                        </p>
                                        <div className="text-sm flex items-center">
                                            <span className="text-gray-500 w-20 shrink-0 font-medium">Type:</span>
                                            <span className={`inline-block px-3 py-0.5 text-xs font-semibold rounded-full border uppercase ${getTypeBadge(selectedMail.recipientType).className}`}>
                                                {selectedMail.recipientType}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Column 2: Mail Meta */}
                                <div className="space-y-4 w-full md:w-[32%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Mail Meta</h4>
                                    <div className="pt-3 rounded-xl uppercase space-y-2">
                                        <div className="text-sm flex items-center">
                                            <span className="text-gray-500 w-24 shrink-0 font-medium">Category:</span>
                                            <span className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-lg border uppercase ${getCategoryBadge(selectedMail.category)}`}>
                                                {selectedMail.category}
                                            </span>
                                        </div>
                                        <div className="text-sm flex items-center">
                                            <span className="text-gray-500 w-24 shrink-0 font-medium">Status:</span>
                                            <span className={`inline-block px-3 py-0.5 text-xs font-semibold rounded-full border uppercase ${getStatusBadge(selectedMail.status).className}`}>
                                                {selectedMail.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Column 3: Timeline */}
                                <div className="space-y-4 w-full md:w-[33%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Timeline</h4>
                                    <div className="pt-3 rounded-xl uppercase space-y-2">
                                        <p className="text-sm flex">
                                            <span className="text-gray-500 w-24 shrink-0 uppercase font-medium">Sent On:</span>
                                            <span className="font-semibold text-[#011023] text-sm">
                                                {formatDateTime(selectedMail.sentAt || selectedMail.createdAt)}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Delivery Failure Notice if failed */}
                            {(selectedMail.status === 'Failed' || selectedMail.error) && (
                                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3 text-left">
                                    <ShieldAlert size={20} className="text-rose-600 shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-xs text-rose-600 uppercase font-bold tracking-wider">Email Delivery Failed</p>
                                        <p className="text-xs font-mono font-medium text-rose-800 mt-1.5 whitespace-pre-wrap bg-white/80 p-2.5 rounded-lg border border-rose-200/80">
                                            {selectedMail.error || 'SMTP transmission failed or mail delivery was rejected.'}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Subject & Live HTML Email Preview */}
                            <div className="space-y-3 text-left">
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Subject & Message</h4>
                                
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Subject</p>
                                    <p className="text-sm font-bold text-[#052558]">{selectedMail.subject}</p>
                                </div>

                                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                                    <div className="bg-slate-100/90 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                                            Rendered Email Preview
                                        </span>
                                        <span className="text-xs text-slate-500 lowercase font-medium">
                                            to: {selectedMail.recipientEmail}
                                        </span>
                                    </div>
                                    <div 
                                        className="p-6 bg-white overflow-x-auto max-h-[420px] overflow-y-auto"
                                        dangerouslySetInnerHTML={{ __html: selectedMail.body || '<p class="text-gray-400 italic">No content</p>' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default MailModal;
