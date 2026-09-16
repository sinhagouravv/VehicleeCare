import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Eye, Download, X } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { fetchGuestLogs, fetchGuestStats } from '../utils/guestCounter';
import { useFilter } from '../context/FilterContext';
import { useAlert } from '../context/AlertContext';
import { useRowLabels, FloatingLabelSelector, renderLabelIcon, stripEmoji, LABEL_FILTER_GROUP } from './RowLabel';

const GuestAdminDetailsModal = ({ isOpen, onClose, isSidebarCollapsed = true, guestCount = 0 }) => {
    const { triggerAlert } = useAlert();
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState(() => {
        try {
            const cached = localStorage.getItem('lastGuestStats');
            return cached ? JSON.parse(cached) : null;
        } catch {
            return null;
        }
    });
    const [loading, setLoading] = useState(true);
    const [lastRefreshed, setLastRefreshed] = useState(null);
    const [selectedSession, setSelectedSession] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
    const [downloadPortal, setDownloadPortal] = useState('All');
    const [downloadStatus, setDownloadStatus] = useState('All');

    // Filter, Sort & Row Label States
    const [filterPortal, setFilterPortal] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterRole, setFilterRole] = useState('All');
    const [labelFilter, setLabelFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState('latest');
    const [timeRange, setTimeRange] = useState('all');

    const { filterConfig: activeContextConfig, setFilterConfig, setResultsCount } = useFilter();
    const { rowLabels, activeLabelRowId, setActiveLabelRowId, handleSaveRowLabel, labelPopupRef, isLabelMode } = useRowLabels('admin_guest_labels');

    const previousConfigRef = useRef(null);
    useEffect(() => {
        if (isOpen) {
            if (activeContextConfig && activeContextConfig.title !== 'Filter Guest Logins') {
                previousConfigRef.current = activeContextConfig;
            }
        }
    }, [isOpen]);

    // Register filter options when modal is open
    useEffect(() => {
        if (!isOpen) return;

        if (activeContextConfig && activeContextConfig.title !== 'Filter Guest Logins') {
            previousConfigRef.current = activeContextConfig;
        }

        setFilterConfig({
            title: 'Filter Guest Logins',
            hasSort: true,
            groups: [
                {
                    id: 'status',
                    label: 'Status',
                    defaultValue: 'all',
                    options: [
                        { label: 'All', value: 'all' },
                        { label: 'Active', value: 'Active' },
                        { label: 'Expired', value: 'Expired' },
                        { label: 'Ended', value: 'Ended' }
                    ]
                },
                {
                    id: 'role',
                    label: 'Role',
                    defaultValue: 'all',
                    options: [
                        { label: 'All', value: 'all' },
                        { label: 'Guest Admin', value: 'guest_admin' },
                        { label: 'Guest Garage', value: 'guest_garage' },
                        { label: 'Guest Employee', value: 'guest_employee' }
                    ]
                },
                LABEL_FILTER_GROUP,
            ],
            initialValues: {
                portal: 'all',
                status: 'all',
                role: 'all',
                label: 'all',
                sortOrder: 'latest',
                timeRange: 'all'
            },
            onChange: (newValues) => {
                if (newValues.portal !== undefined) {
                    setFilterPortal(newValues.portal === 'all' ? 'All' : newValues.portal);
                }
                if (newValues.status !== undefined) {
                    setFilterStatus(newValues.status === 'all' ? 'All' : newValues.status);
                }
                if (newValues.role !== undefined) {
                    setFilterRole(newValues.role === 'all' ? 'All' : newValues.role);
                }
                if (newValues.label !== undefined) setLabelFilter(newValues.label);
                if (newValues.sortOrder !== undefined) setSortOrder(newValues.sortOrder);
                if (newValues.timeRange !== undefined) setTimeRange(newValues.timeRange);
            },
            onReset: () => {
                setFilterPortal('All');
                setFilterStatus('All');
                setFilterRole('All');
                setLabelFilter('all');
                setSortOrder('latest');
                setTimeRange('all');
            }
        });

        return () => {
            setFilterConfig(previousConfigRef.current || null);
        };
    }, [isOpen, setFilterConfig]);

    const loadLogs = useCallback(async () => {
        try {
            const [logsData, statsRes] = await Promise.all([
                fetchGuestLogs(),
                fetchGuestStats()
            ]);
            let combinedLogs = Array.isArray(logsData) ? [...logsData] : [];

            // Always guarantee newest logs are strictly at the top
            combinedLogs.sort((a, b) => {
                const timeA = new Date(a.timestamp || a.createdAt || 0).getTime();
                const timeB = new Date(b.timestamp || b.createdAt || 0).getTime();
                if (timeB !== timeA) return timeB - timeA;
                return String(b._id || '').localeCompare(String(a._id || ''));
            });

            setLogs(combinedLogs);
            if (statsRes?.data) {
                setStats(statsRes.data);
                try {
                    localStorage.setItem('lastGuestStats', JSON.stringify(statsRes.data));
                } catch {
                    // ignore
                }
            }
            setLastRefreshed(new Date());
        } catch (err) {
            console.error('Error fetching guest logs:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Stable polling interval — does NOT depend on guestCount to avoid teardown/recreate gaps
    useEffect(() => {
        if (!isOpen) return;

        loadLogs();
        const interval = setInterval(loadLogs, 1000);
        const handleUpdate = () => loadLogs();

        window.addEventListener('guestCountUpdated', handleUpdate);
        window.addEventListener('focus', handleUpdate);
        window.addEventListener('storage', handleUpdate);

        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                loadLogs();
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);

        let bc;
        try {
            bc = new BroadcastChannel('guest_tracker_channel');
            bc.onmessage = () => loadLogs();
        } catch (e) {}

        return () => {
            clearInterval(interval);
            window.removeEventListener('guestCountUpdated', handleUpdate);
            window.removeEventListener('focus', handleUpdate);
            window.removeEventListener('storage', handleUpdate);
            document.removeEventListener('visibilitychange', handleVisibility);
            if (bc) bc.close();
        };
    }, [isOpen, loadLogs]);

    // Whenever the external guestCount prop ticks up, immediately force a reload
    const prevGuestCountRef = useRef(guestCount);
    useEffect(() => {
        if (isOpen && guestCount !== prevGuestCountRef.current) {
            prevGuestCountRef.current = guestCount;
            loadLogs();
        }
    }, [guestCount, isOpen, loadLogs]);

    const formatSubmittedAt = (dateString) => {
        if (!dateString) return '—';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '—';
        const day = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
        return `${day} | ${hours}:${minutes}:${seconds}.${milliseconds}`;
    };

    const getPortalColor = (portal) => {
        switch (portal?.toLowerCase()) {
            case 'employee': return 'bg-purple-100 text-purple-700';
            case 'admin': return 'bg-blue-100 text-blue-700';
            case 'app': return 'bg-pink-100 text-pink-600';
            case 'customer app': return 'bg-teal-100 text-teal-600';
            case 'business': return 'bg-indigo-100 text-indigo-700';
            case 'frontend': return 'bg-fuchsia-100 text-fuchsia-700';
            case 'garage':
            default: return 'bg-orange-100 text-orange-700';
        }
    };

    const getRoleColor = (role, portal) => {
        const r = (role || '').toLowerCase();
        const p = (portal || '').toLowerCase();
        if (r.includes('employee') || p === 'employee') return 'bg-purple-100 text-purple-700';
        if (r.includes('garage') || p === 'garage') return 'bg-orange-100 text-orange-700';
        if (r.includes('admin') || p === 'admin') return 'bg-blue-100 text-blue-700';
        return getPortalColor(portal || role);
    };

    const getPortalLabel = (portal) => {
        switch (portal?.toLowerCase()) {
            case 'employee': return 'employee web';
            case 'app': return 'employee app';
            case 'garage': return 'garage website';
            case 'customer app': return 'customer app';
            case 'business': return 'business web';
            case 'frontend': return 'customer web';
            case 'admin': return 'admin web';
            default: return portal || 'admin web';
        }
    };

    const getComputedStatus = (session) => {
        if (!session) return 'Active';
        const raw = String(session.status || 'Active').trim().toLowerCase();
        if (raw === 'ended') return 'Ended';
        if (raw === 'expired') return 'Expired';

        // If session was created > 15 minutes ago, it has reached maximum session duration
        const time = new Date(session.timestamp || session.createdAt || 0).getTime();
        if (time > 0 && Date.now() - time > 15 * 60 * 1000) {
            return 'Expired';
        }
        return 'Active';
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'active':
            case 'resolved':
            case 'delivered':
            case 'logged in':
                return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'expired':
                return 'bg-rose-100 text-rose-800 border-rose-200';
            case 'ended':
                return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'completed': return 'bg-teal-100 text-teal-800 border-teal-200';
            case 'in service':
            case 'in progress': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'cancelled': return 'bg-rose-100 text-rose-800 border-rose-200';
            default: return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        }
    };

    const filteredLogs = useMemo(() => {
        return logs.filter(session => {
            // Portal filter
            if (filterPortal !== 'All') {
                const p = (session.portal || '').toLowerCase();
                const target = filterPortal.toLowerCase();
                if (target === 'frontend' && (p === 'frontend' || p === 'customer app' || p === 'customer web')) {
                    // matches
                } else if (p !== target && !(session.role || '').toLowerCase().includes(target)) {
                    return false;
                }
            }

            // Status filter
            if (filterStatus !== 'All') {
                const st = getComputedStatus(session).toLowerCase();
                if (st !== filterStatus.toLowerCase()) {
                    return false;
                }
            }

            // Role filter
            if (filterRole !== 'All') {
                const r = (session.role || '').toLowerCase();
                if (r !== filterRole.toLowerCase()) {
                    return false;
                }
            }

            // Row label filter
            const rowId = session._id || session.sessionId;
            if (labelFilter !== 'all') {
                const label = rowLabels[rowId] || (session.sessionId ? rowLabels[session.sessionId] : null);
                if (!label || label.toUpperCase() !== labelFilter.toUpperCase()) {
                    return false;
                }
            }

            // Time range filter
            if (timeRange !== 'all') {
                const itemDate = session.timestamp || session.createdAt ? new Date(session.timestamp || session.createdAt) : null;
                if (itemDate && !isNaN(itemDate.getTime())) {
                    const now = new Date();
                    const diffDays = Math.ceil(Math.abs(now - itemDate) / (1000 * 60 * 60 * 24));
                    if (timeRange === 'week' && diffDays > 7) return false;
                    if (timeRange === 'month' && diffDays > 30) return false;
                }
            }

            return true;
        }).sort((a, b) => {
            const dateA = a.timestamp || a.createdAt ? new Date(a.timestamp || a.createdAt).getTime() : 0;
            const dateB = b.timestamp || b.createdAt ? new Date(b.timestamp || b.createdAt).getTime() : 0;
            if (dateA !== dateB && dateA > 0 && dateB > 0) {
                return sortOrder === 'latest' ? dateB - dateA : dateA - dateB;
            }
            const idA = String(a.sessionId || a._id || '');
            const idB = String(b.sessionId || b._id || '');
            return sortOrder === 'latest' ? idB.localeCompare(idA) : idA.localeCompare(idB);
        });
    }, [logs, filterPortal, filterStatus, filterRole, labelFilter, sortOrder, timeRange, rowLabels]);

    useEffect(() => {
        if (isOpen) {
            setResultsCount(filteredLogs.length);
        }
    }, [filteredLogs.length, isOpen, setResultsCount]);

    const totalCount = Math.max(logs.length, Number(guestCount) || 0, Number(stats?.total) || 0);
    const adminCount = logs.length > 0
        ? Math.max(logs.filter(l => (l.portal || '').toLowerCase() === 'admin' || (l.role || '').toLowerCase().includes('admin')).length, Number(stats?.admin) || 0)
        : (Number(stats?.admin) || 0);
    const garageCount = logs.length > 0
        ? Math.max(logs.filter(l => (l.portal || '').toLowerCase() === 'garage' || (l.role || '').toLowerCase().includes('garage')).length, Number(stats?.garage) || 0)
        : (Number(stats?.garage) || 0);
    const employeeCount = logs.length > 0
        ? Math.max(logs.filter(l => (l.portal || '').toLowerCase() === 'employee' || (l.role || '').toLowerCase().includes('employee')).length, Number(stats?.employee) || 0)
        : (Number(stats?.employee) || 0);

    const handleDownloadLog = (session) => {
        if (!session) return;
        try {
            const status = getComputedStatus(session);
            const isUpdated = ['Ended', 'Expired'].includes(status);
            const reportedAt = formatSubmittedAt(session.timestamp || session.createdAt);
            const updatedAt = isUpdated
                ? formatSubmittedAt(session.updatedAt || session.timestamp || session.createdAt)
                : '—';

            const doc = new jsPDF();
            const primary = [5, 37, 88]; // #052558
            const gray = [100, 100, 100];

            // Header Title
            doc.setFontSize(18);
            doc.setTextColor(...primary);
            doc.text('VehicleeCare — Guest Session Log', 105, 18, null, null, 'center');

            doc.setFontSize(10);
            doc.setTextColor(...gray);
            doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 14, 28);

            // Section Title
            doc.setFontSize(12);
            doc.setTextColor(...primary);
            doc.text('Session Details', 14, 38);

            // Structured Table
            autoTable(doc, {
                startY: 42,
                body: [
                    ['Session ID', session.sessionId || '—'],
                    ['Portal', getPortalLabel(session.portal)],
                    ['IP Address', session.ipAddress || '127.0.0.1'],
                    ['Role', session.role || 'guest_admin'],
                    ['User Account', session.userId || 'guestadmin@vehicleecare.com'],
                    ['Access Level', 'Read-Only'],
                    ['Action', session.action || 'LOGIN'],
                    ['Initial Status', 'Active'],
                    ['Reported At', reportedAt],
                    ['Current / Final Status', status],
                    ['Updated At', updatedAt],
                    ['User Agent / Browser', session.userAgent || 'Unknown Browser'],
                ],
                theme: 'grid',
                headStyles: { fillColor: primary },
                columnStyles: {
                    0: { fontStyle: 'bold', cellWidth: 50, textColor: primary },
                    1: { cellWidth: 130 }
                },
                styles: { fontSize: 9.5, cellPadding: 3.5, overflow: 'linebreak' },
            });

            const safeFilename = `Guest_Log_${(session.sessionId || 'session').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
            doc.save(safeFilename);

            if (triggerAlert) {
                triggerAlert(`PDF log for ${session.sessionId || 'session'} downloaded`, 'success');
            }
        } catch (err) {
            console.error('Error generating PDF log:', err);
            if (triggerAlert) {
                triggerAlert('Failed to download PDF log', 'error');
            }
        }
    };

    const logsToExport = useMemo(() => {
        return logs.filter(session => {
            if (downloadPortal !== 'All') {
                const sPortal = (session.portal || '').toLowerCase();
                const dPortal = downloadPortal.toLowerCase();
                if (sPortal !== dPortal && !(dPortal === 'employee' && sPortal === 'app')) {
                    return false;
                }
            }
            if (downloadStatus !== 'All') {
                const sStatus = getComputedStatus(session).toLowerCase();
                const dStatus = downloadStatus.toLowerCase();
                if (sStatus !== dStatus) return false;
            }
            return true;
        });
    }, [logs, downloadPortal, downloadStatus]);

    const handleExecuteDownload = () => {
        if (!logsToExport || logsToExport.length === 0) {
            if (triggerAlert) triggerAlert('No guest logs match the selected criteria', 'error');
            return;
        }

        try {
            const doc = new jsPDF('landscape');
            const primary = [5, 37, 88]; // #052558
            const gray = [100, 100, 100];

            // Header Title
            doc.setFontSize(18);
            doc.setTextColor(...primary);
            doc.text('VehicleeCare — Guest Sessions Log Report', 148.5, 16, null, null, 'center');

            doc.setFontSize(10);
            doc.setTextColor(...gray);
            const subtitle = `Generated on: ${new Date().toLocaleString('en-IN')} | Portal: ${downloadPortal} | Status: ${downloadStatus} | Total Records: ${logsToExport.length}`;
            doc.text(subtitle, 148.5, 23, null, null, 'center');

            // Table Body
            const tableRows = logsToExport.map((session, index) => {
                const status = getComputedStatus(session);
                const isUpdated = ['Ended', 'Expired'].includes(status);
                const reportedAt = formatSubmittedAt(session.timestamp || session.createdAt);
                const updatedAt = isUpdated
                    ? formatSubmittedAt(session.updatedAt || session.timestamp || session.createdAt)
                    : '—';

                return [
                    index + 1,
                    session.sessionId || '—',
                    getPortalLabel(session.portal),
                    session.ipAddress || '127.0.0.1',
                    session.role || 'guest_admin',
                    status,
                    reportedAt,
                    updatedAt
                ];
            });

            autoTable(doc, {
                startY: 28,
                head: [['#', 'Session ID', 'Portal', 'IP Address', 'Role', 'Status', 'Reported At', 'Updated At']],
                body: tableRows,
                theme: 'grid',
                headStyles: { 
                    fillColor: primary, 
                    textColor: [255, 255, 255], 
                    fontStyle: 'bold', 
                    halign: 'center',
                    fontSize: 9
                },
                columnStyles: {
                    0: { halign: 'center', cellWidth: 12 },
                    1: { halign: 'center', cellWidth: 52, fontStyle: 'bold' },
                    2: { halign: 'center', cellWidth: 32 },
                    3: { halign: 'center', cellWidth: 32 },
                    4: { halign: 'center', cellWidth: 30 },
                    5: { halign: 'center', cellWidth: 24, fontStyle: 'bold' },
                    6: { halign: 'center', cellWidth: 44 },
                    7: { halign: 'center', cellWidth: 44 },
                },
                styles: { 
                    fontSize: 8.5, 
                    cellPadding: 3, 
                    overflow: 'linebreak',
                    valign: 'middle'
                },
                alternateRowStyles: {
                    fillColor: [248, 250, 252]
                },
                didDrawPage: (data) => {
                    const pageCount = doc.internal.getNumberOfPages();
                    doc.setFontSize(8);
                    doc.setTextColor(...gray);
                    doc.text(
                        `Page ${data.pageNumber} of ${pageCount}`,
                        doc.internal.pageSize.width / 2,
                        doc.internal.pageSize.height - 8,
                        { align: 'center' }
                    );
                }
            });

            const timestampStr = new Date().toISOString().slice(0, 10);
            doc.save(`VehicleeCare_Guest_Logs_${downloadPortal}_${downloadStatus}_${timestampStr}.pdf`);

            setIsDownloadModalOpen(false);

            if (triggerAlert) {
                triggerAlert(`Downloaded ${logsToExport.length} guest logs as PDF`, 'success');
            }
        } catch (err) {
            console.error('Error generating bulk PDF log report:', err);
            if (triggerAlert) {
                triggerAlert('Failed to generate bulk PDF log report', 'error');
            }
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop Blur covering Sidebar (left-0), Top, and Bottom, stopping before right action buttons (right-28) */}
            <div 
                className="fixed inset-y-0 left-0 right-1 bg-[#011023]/1 backdrop-blur-sm z-25 transition-all duration-300 animate-in fade-in duration-200 cursor-pointer"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className={`fixed top-0 bottom-0 right-0 z-30 flex items-center justify-center p-6 transition-all duration-300 pointer-events-none ${isSidebarCollapsed ? 'left-[0.5rem]' : 'left-[16.75rem]'}`}>
                <div className="bg-white border border-[#cbd5e1] rounded-3xl shadow-xl w-full max-w-[101rem] h-[93.75vh] overflow-hidden relative z-10 p-6 flex flex-col animate-in zoom-in duration-200 pointer-events-auto">
                    
                    {/* Bug.jsx:L295-L629 Format */}
                    <div className="space-y-4 max-w-[97.5rem] mx-auto flex flex-col h-full overflow-hidden w-full">
                        
                        {/* Header */}
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-2xl font-bold uppercase text-[#011023] tracking-tight flex items-center gap-2">
                                    Guest Logins Log
                                </h1>

                                {/* Stats Box */}
                                <div className="flex items-center gap-2 ml-2">
                                    <div className="flex items-center gap-1.5 px-3.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200/80 text-xs font-bold uppercase tracking-wider text-emerald-700 shadow-2xs">
                                        <span className="text-emerald-600/90 font-semibold text-[13px]">Total Count:</span>
                                        <span className="text-emerald-900 font-bold text-[13px] min-w-3.5 inline-flex items-center justify-center">
                                            {loading && !stats && logs.length === 0 ? (
                                                <span className="inline-block w-4 h-3.5 rounded-xs bg-emerald-300/60 animate-pulse" />
                                            ) : (
                                                totalCount
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 border border-blue-200/80 text-xs font-bold uppercase tracking-wider text-blue-700">
                                        <span className="text-blue-600/90 font-semibold text-[13px]">Admin:</span>
                                        <span className="text-blue-900 font-bold text-[13px] min-w-3.5 inline-flex items-center justify-center">
                                            {loading && !stats && logs.length === 0 ? (
                                                <span className="inline-block w-4 h-3.5 rounded-xs bg-blue-300/60 animate-pulse" />
                                            ) : (
                                                adminCount
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-orange-50 border border-orange-200/80 text-xs font-bold uppercase tracking-wider text-orange-700">
                                        <span className="text-orange-600/90 font-semibold text-[13px]">Garage:</span>
                                        <span className="text-orange-900 font-bold text-[13px] min-w-3.5 inline-flex items-center justify-center">
                                            {loading && !stats && logs.length === 0 ? (
                                                <span className="inline-block w-4 h-3.5 rounded-xs bg-orange-300/60 animate-pulse" />
                                            ) : (
                                                garageCount
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-50 border border-purple-200/80 text-xs font-bold uppercase tracking-wider text-purple-700">
                                        <span className="text-purple-600/90 font-semibold text-[13px]">Employee:</span>
                                        <span className="text-purple-900 font-bold text-[13px] min-w-3.5 inline-flex items-center justify-center">
                                            {loading && !stats && logs.length === 0 ? (
                                                <span className="inline-block w-4 h-3.5 rounded-xs bg-purple-300/60 animate-pulse" />
                                            ) : (
                                                employeeCount
                                            )}
                                        </span>
                                    </div>
                                </div>

                                {/* Centralised Download Button matching stats badge UI */}
                                <button
                                    type="button"
                                    onClick={() => setIsDownloadModalOpen(true)}
                                    title="Download Guest Logs"
                                    className="flex items-center px-3 py-1.25 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200/80 text-slate-700 hover:text-[#011023] text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-2xs cursor-pointer active:scale-95 shrink-0"
                                >
                                    <Download size={15} className="stroke-[2.5]" />
                                </button>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 text-xs uppercase text-gray-400 font-medium self-center">
                                    {!lastRefreshed ? (
                                        <div className="h-4 w-64 bg-slate-200/80 rounded-md animate-pulse" />
                                    ) : (
                                        `Last refreshed | ${lastRefreshed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | ${lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Main Content List Table */}
                        <div className="bg-white border border-[#e9f2fb] rounded-2xl shadow-[0_1px_2.5px_0_rgba(0,0,0,0.07)] flex-1 min-h-0 overflow-hidden flex flex-col">
                            <div className="overflow-x-hidden overflow-y-auto text-center flex-1 relative hide-scrollbar">
                                <table className="w-full text-center border-collapse table-fixed">
                                    <thead className="sticky top-0 z-30 shadow-sm bg-[#f0f6ff]">
                                        <tr className="bg-[#f0f6ff] text-[15px] uppercase tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                            <th className="p-4 font-bold text-center w-[22%]">Session ID</th>
                                            <th className="p-4 font-bold text-center w-[13%]">Portal</th>
                                            <th className="p-4 font-bold text-center w-[15%]">IP Address</th>
                                            <th className="p-4 font-bold text-center w-[12%]">Role</th>
                                            <th className="p-4 font-bold text-center w-[12%]">Status</th>
                                            <th className="p-4 font-bold text-center w-[16%]">Date and Time</th>
                                            <th className="p-4 font-bold text-center w-[10%]">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y text-[13px] divide-[#e6f0fa] uppercase font-semibold text-gray-700">
                                        {loading && logs.length === 0 ? (
                                            Array.from({ length: 17 }).map((_, i) => (
                                                <tr key={i} className="border-b border-[#e6f0fa] animate-pulse">
                                                    <td className="p-4 text-center">
                                                        <div className="h-4 bg-slate-200/80 rounded-md w-[70%] mx-auto" />
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <div className="h-4 bg-slate-200/80 rounded-md w-16 mx-auto" />
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <div className="h-4 bg-slate-200/80 rounded-md w-24 mx-auto" />
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <div className="h-4 bg-slate-200/80 rounded-md w-20 mx-auto" />
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <div className="h-4 bg-slate-200/80 rounded-md w-16 mx-auto" />
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <div className="h-4 bg-slate-200/80 rounded-md w-28 mx-auto" />
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <div className="h-4 bg-slate-200/80 rounded-md w-10 mx-auto" />
                                                    </td>
                                                </tr>
                                            ))
                                        ) : filteredLogs.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="p-8 text-center text-gray-400 font-bold">
                                                    No guest login records found.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredLogs.map((session, idx) => {
                                                const rowId = session._id || session.sessionId || `sess_${idx}`;
                                                const sessionLabel = rowLabels[rowId] || (session.sessionId ? rowLabels[session.sessionId] : null);

                                                return (
                                                    <tr 
                                                        key={rowId}
                                                        onClick={() => {
                                                            if (isLabelMode) {
                                                                setActiveLabelRowId(prev => prev === rowId ? null : rowId);
                                                            }
                                                        }}
                                                        className={`transition-all duration-300 border-b border-[#e6f0fa] group ${
                                                            isLabelMode ? 'cursor-pointer hover:bg-blue-50/60' : 'hover:bg-blue-50/40'
                                                        }`}
                                                    >
                                                        {/* Session ID */}
                                                        <td className="p-4 font-semibold text-[#052558] text-sm text-center relative">
                                                            <div className="relative flex items-center justify-center w-full">
                                                                {Boolean(sessionLabel) && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setActiveLabelRowId(prev => prev === rowId ? null : rowId);
                                                                        }}
                                                                        className="absolute -left-1.5 top-1/2 -translate-y-1/2 cursor-pointer hover:scale-115 transition-transform active:scale-95 p-0.5 z-10"
                                                                        title={`Label: ${stripEmoji(sessionLabel || 'Add label')}`}
                                                                    >
                                                                        {renderLabelIcon(sessionLabel, 16)}
                                                                    </button>
                                                                )}

                                                                {activeLabelRowId === rowId && (
                                                                    <FloatingLabelSelector 
                                                                        rowId={rowId}
                                                                        currentLabel={sessionLabel}
                                                                        onSaveLabel={handleSaveRowLabel}
                                                                        labelPopupRef={labelPopupRef}
                                                                        topClass="-top-8.5"
                                                                        positionClass="-left-4"
                                                                    />
                                                                )}
                                                                <span className="truncate">{session.sessionId || '—'}</span>
                                                            </div>
                                                        </td>

                                                        {/* Portal */}
                                                        <td className="p-4 text-center">
                                                            <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getPortalColor(session.portal)}`}>
                                                                {getPortalLabel(session.portal)}
                                                            </span>
                                                        </td>

                                                        {/* IP Address */}
                                                        <td className="p-4 font-semibold text-gray-700 text-sm text-center truncate">
                                                            {session.ipAddress || '—'}
                                                        </td>

                                                        {/* Role */}
                                                        <td className="p-4 text-center">
                                                            <span className={`inline-block px-2.5 py-0.5 text-xs text-center font-semibold uppercase rounded-full ${getRoleColor(session.role, session.portal)}`}>
                                                                {session.role || 'guest_admin'}
                                                            </span>
                                                        </td>

                                                        {/* Status */}
                                                        <td className="p-4 text-center">
                                                            <span className={`inline-block px-3 py-1 text-xs text-center font-semibold rounded-full border border-transparent ${getStatusColor(getComputedStatus(session))}`}>
                                                                {getComputedStatus(session)}
                                                            </span>
                                                        </td>

                                                        {/* Date and Time */}
                                                        <td className="p-4 font-semibold text-gray-600 text-sm text-center">
                                                            {formatSubmittedAt(session.timestamp || session.createdAt)}
                                                        </td>

                                                        {/* Actions: View Details & Download */}
                                                        <td className="p-4 text-center">
                                                            <div className="flex items-center justify-center gap-4">
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setSelectedSession(session);
                                                                        setIsViewModalOpen(true);
                                                                    }}
                                                                    className="text-gray-400 hover:text-blue-600 transition-colors cursor-pointer"
                                                                >
                                                                    <Eye size={18} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDownloadLog(session);
                                                                    }}
                                                                    className="text-gray-400 hover:text-emerald-600 transition-colors cursor-pointer"
                                                                >
                                                                    <Download size={18} />
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

            {/* View Details Modal (Exact Bug.jsx:L435-L506 format) */}
            {isViewModalOpen && selectedSession && createPortal(
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#011023]/10 backdrop-blur-sm"
                    onClick={() => setIsViewModalOpen(false)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-[#e6f0fa] flex justify-between items-center bg-gradient-to-r from-blue-50/50 to-white">
                            <div>
                                <h3 className="text-xl uppercase font-bold text-[#052558]">Guest Admin Details</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    ID: <span className="font-semibold text-gray-700">{selectedSession.sessionId || '—'}</span>
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsViewModalOpen(false)}
                                    className="text-gray-400 hover:text-gray-600 rounded-full transition-colors cursor-pointer"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
                            {/* Info Grid */}
                            <div className="flex flex-col md:flex-row gap-6 w-full text-left">

                                {/* Column 1: Portal & IP */}
                                <div className="space-y-4 w-full md:w-[35%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Portal & IP</h4>
                                    <div className="pt-3.5 rounded-xl uppercase space-y-2">
                                        <div className="text-sm flex items-center">
                                            <span className="text-gray-500 w-25 shrink-0 font-medium">Portal:</span> 
                                            <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getPortalColor(selectedSession.portal)}`}>
                                                {getPortalLabel(selectedSession.portal)}
                                            </span>
                                        </div>
                                        <div className="text-sm flex items-center">
                                            <span className="text-gray-500 w-25.5 shrink-0 font-medium">IP Address:</span> 
                                            <span className="font-semibold text-gray-700 text-sm">
                                                {selectedSession.ipAddress || '127.0.0.1'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Column 2: Initial Status & Reported At */}
                                <div className="space-y-4 w-full md:w-[45%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Initial State</h4>
                                    <div className="pt-3.5 rounded-xl uppercase space-y-2">
                                        <div className="text-sm flex items-center">
                                            <span className="text-gray-500 w-28 shrink-0 font-medium">Status:</span> 
                                            <span className={`inline-block px-3 py-1 text-xs text-center font-semibold rounded-full border border-transparent ${getStatusColor('Active')}`}>
                                                Active
                                            </span>
                                        </div>
                                        <p className="text-sm flex items-center">
                                            <span className="text-gray-500 w-28 shrink-0 uppercase font-medium">Reported At:</span> 
                                            <span className="font-semibold text-gray-600 text-sm">
                                                {formatSubmittedAt(selectedSession.timestamp || selectedSession.createdAt)}
                                            </span>
                                        </p>
                                    </div>
                                </div>

                                {/* Column 3: Status & Updated At (Always present, blank/dash if status not changed) */}
                                <div className="space-y-4 w-full md:w-[40%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Updated State</h4>
                                    <div className="pt-3.5 rounded-xl uppercase space-y-2">
                                        <div className="text-sm flex items-center">
                                            <span className="text-gray-500 w-28 shrink-0 font-medium">Status:</span> 
                                            {['Ended', 'Expired'].includes(getComputedStatus(selectedSession)) ? (
                                                <span className={`inline-block px-3 py-1 text-xs text-center font-semibold rounded-full border border-transparent ${getStatusColor(getComputedStatus(selectedSession))}`}>
                                                    {getComputedStatus(selectedSession)}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 font-bold text-sm">—</span>
                                            )}
                                        </div>
                                        <p className="text-sm flex items-center">
                                            <span className="text-gray-500 w-28 shrink-0 uppercase font-medium">Updated At:</span> 
                                            <span className="font-semibold text-gray-600 text-sm">
                                                {['Ended', 'Expired'].includes(getComputedStatus(selectedSession))
                                                    ? formatSubmittedAt(selectedSession.updatedAt || selectedSession.timestamp || selectedSession.createdAt)
                                                    : '—'}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Client User Agent info */}
                            <div className="text-left space-y-1">
                                <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Browser Used</span>
                                <p className="text-[13px] font-mono text-gray-500 break-all pt-5 tracking-tight">
                                    {selectedSession.userAgent || 'Unknown Browser'}
                                </p>
                            </div>
                        </div>

                    </div>
                </div>,
                document.body
            )}

            {/* Download Options Modal Pop-up */}
            {isDownloadModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div 
                        className="absolute inset-0 bg-[#011023]/1 backdrop-blur-sm" 
                        onClick={() => setIsDownloadModalOpen(false)} 
                    />
                    <div className="bg-white border border-[#cbd5e1] rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10 p-6 space-y-6 animate-in zoom-in duration-200">
                        {/* Form Header */}
                        <div className="relative flex items-center justify-center pb-4">
                            <h3 className="text-xl font-semibold text-[#011023] uppercase tracking-wide text-center">
                                Download Guest Logs
                            </h3>
                        </div>

                        <div className="space-y-4 text-left">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex-1 space-y-2">
                                    <label className="block text-[13px] font-semibold text-[#011023] text-center uppercase tracking-wider">Portal</label>
                                    <select
                                        value={downloadPortal}
                                        onChange={(e) => setDownloadPortal(e.target.value)}
                                        className="w-full px-3 py-2 bg-[#f8fafc] mt-1 uppercase border border-[#cbd5e1] rounded-xl focus:outline-none transition-all font-semibold text-[14px] text-[#011023] cursor-pointer appearance-none text-center"
                                    >
                                        <option value="All">All</option>
                                        <option value="Admin">Admin</option>
                                        <option value="Garage">Garage</option>
                                        <option value="Employee">Employee</option>
                                    </select>
                                </div>

                                <div className="flex-1 space-y-2">
                                    <label className="block text-[13px] font-semibold text-[#011023] text-center uppercase tracking-wider">Status</label>
                                    <select
                                        value={downloadStatus}
                                        onChange={(e) => setDownloadStatus(e.target.value)}
                                        className="w-full px-3 py-2 bg-[#f8fafc] mt-1 uppercase border border-[#cbd5e1] rounded-xl focus:outline-none transition-all font-semibold text-[14px] text-[#011023] cursor-pointer appearance-none text-center"
                                    >
                                        <option value="All">All</option>
                                        <option value="Active">Active</option>
                                        <option value="Ended">Ended</option>
                                        <option value="Expired">Expired</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleExecuteDownload}
                                disabled={logsToExport.length === 0}
                                className="w-full py-2 bg-[#e0e7ff] mt-15 border border-[#a5b4fc] text-[#3730a3] rounded-xl text-sm font-semibold uppercase tracking-wider transition-all shadow-sm mt-4 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                <Download size={15} className="stroke-[2.5]" />
                                <span>Download</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default GuestAdminDetailsModal;
