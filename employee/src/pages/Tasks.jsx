import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
    Search, 
    Filter, 
    Eye, 
    Check, 
    Loader2, 
    AlertCircle, 
    User, 
    Phone, 
    MapPin, 
    Car, Calendar,
    Clock,
    X,
    MessageSquare,
    Send,
    Bug as BugIcon } from 'lucide-react';

import useHighlight from '../hooks/useHighlight';
import { TableSkeleton } from '../components/Skeleton';
import { useFilter } from '../context/FilterContext';
import { useAlert } from '../context/AlertContext';
import { useRowLabels, FloatingLabelSelector, renderLabelIcon, stripEmoji, LABEL_FILTER_GROUP } from '../components/RowLabel';

const getSeverityColor = (severity) => {
    switch (severity) {
        case 'Critical': return 'bg-rose-100 text-rose-800 border-rose-200';
        case 'High': return 'bg-orange-100 text-orange-800 border-orange-200';
        case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'Low': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        default: return 'bg-gray-100 text-gray-700';
    }
};

const getBugStatusColor = (status) => {
    switch (status) {
        case 'Resolved':
        case 'Delivered': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        case 'Completed': return 'bg-teal-100 text-teal-800 border-teal-200';
        case 'In Service': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
        case 'In Progress': return 'bg-purple-100 text-purple-700 border-purple-200';
        case 'Pending': return 'bg-amber-100 text-amber-800 border-amber-200';
        case 'Cancelled': return 'bg-rose-100 text-rose-800 border-rose-200';
        default: return 'bg-gray-100 text-gray-700';
    }
};

const getPortalColor = (portal) => {
    switch (portal) {
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

const getPortalLabel = (portal) => {
    switch (portal) {
        case 'employee': return 'employee web';
        case 'app': return 'employee app';
        case 'garage': return 'garage website';
        case 'customer app': return 'customer app';
        case 'business': return 'business web';
        case 'frontend': return 'customer web';
        default: return portal;
    }
};

const formatSubmittedAt = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    const day = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const time = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    return `${day}, ${time.toLowerCase()}`;
};

const Tasks = () => {
    const { triggerAlert } = useAlert();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [lastRefreshed, setLastRefreshed] = useState(null);
    const [userRole, setUserRole] = useState('');
    const [employeeCategory, setEmployeeCategory] = useState('');

    const isDeveloper = (employeeCategory || '').toLowerCase() === 'developer';

    const [labelFilter, setLabelFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState('latest');
    const [timeRange, setTimeRange] = useState('all');

    const { setFilterConfig, setResultsCount } = useFilter();
    const { rowLabels, activeLabelRowId, setActiveLabelRowId, handleSaveRowLabel, labelPopupRef, isLabelMode } = useRowLabels('tasks_row_labels');

    // Register filter options with the floating filter button
    useEffect(() => {
        if (isDeveloper) {
            setFilterConfig({
                title: 'Filter Bug Reports',
                hasSort: true,
                groups: [
                    LABEL_FILTER_GROUP,
                    {
                        id: 'status',
                        label: 'Bug Status',
                        defaultValue: 'all',
                        options: [
                            { label: 'All', value: 'all' },
                            { label: 'Pending', value: 'Pending' },
                            { label: 'In Progress', value: 'In Progress' },
                            { label: 'Resolved', value: 'Resolved' },
                        ]
                    }
                ],
                initialValues: {
                    status: filterStatus === 'All' ? 'all' : filterStatus,
                    label: labelFilter,
                    sortOrder,
                    timeRange
                },
                onChange: (newValues) => {
                    if (newValues.status !== undefined) {
                        setFilterStatus(newValues.status === 'all' ? 'All' : newValues.status);
                    }
                    if (newValues.label !== undefined) setLabelFilter(newValues.label);
                    if (newValues.sortOrder !== undefined) setSortOrder(newValues.sortOrder);
                    if (newValues.timeRange !== undefined) setTimeRange(newValues.timeRange);
                },
                onReset: () => {
                    setFilterStatus('All');
                    setLabelFilter('all');
                    setSortOrder('latest');
                    setTimeRange('all');
                }
            });
        } else {
            setFilterConfig({
                title: 'Filter Tasks',
                groups: [
                    LABEL_FILTER_GROUP,
                    {
                        id: 'status',
                        label: 'Booking Status',
                        defaultValue: 'all',
                        options: [
                            { label: 'All', value: 'all' },
                            { label: 'Pending', value: 'Pending' },
                            { label: 'In Progress', value: 'In Progress' },
                            { label: 'In Service', value: 'In Service' },
                            { label: 'Completed', value: 'Completed' },
                            { label: 'Delivered', value: 'Delivered' },
                            { label: 'Cancelled', value: 'Cancelled' },
                        ]
                    }
                ],
                initialValues: {
                    status: filterStatus === 'All' ? 'all' : filterStatus,
                    label: 'all'
                },
                onChange: (newValues) => {
                    if (newValues.status !== undefined) {
                        setFilterStatus(newValues.status === 'all' ? 'All' : newValues.status);
                    }
                    if (newValues.label !== undefined) setLabelFilter(newValues.label);
                    if (newValues.sortOrder !== undefined) setSortOrder(newValues.sortOrder);
                    if (newValues.timeRange !== undefined) setTimeRange(newValues.timeRange);
                },
                onReset: () => {
                    setFilterStatus('All');
                    setLabelFilter('all');
                    setSortOrder('latest');
                    setTimeRange('all');
                }
            });
        }
        return () => setFilterConfig(null);
    }, [setFilterConfig, filterStatus, isDeveloper, labelFilter, sortOrder, timeRange]);

    useEffect(() => {
        const storedUser = localStorage.getItem('employeeUser');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            setUserRole(user.role || '');
            setEmployeeCategory(user.category || '');
        }
    }, []);

    const highlightedRow = useHighlight(tasks);

    // Multi-step workflow state
    const [showDurationModal, setShowDurationModal] = useState(false);
    const [showOTPModal, setShowOTPModal] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [durationDays, setDurationDays] = useState('');
    const [durationHours, setDurationHours] = useState('');
    const duration = (durationDays !== '' && durationHours !== '') ? `${durationDays} Day${durationDays !== '1' ? 's' : ''}, ${durationHours} Hour${durationHours !== '1' ? 's' : ''}` : '';
    const [otpInput, setOtpInput] = useState('');
    const [selectedTaskId, setSelectedTaskId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Remark Modal States
    const [isRemarkModalOpen, setIsRemarkModalOpen] = useState(false);
    const [selectedRemarkTask, setSelectedRemarkTask] = useState(null);
    const [remarkText, setRemarkText] = useState('');
    const [isSubmittingRemark, setIsSubmittingRemark] = useState(false);

    const fetchTasks = async (silent = false) => {
        try {
            const storedUser = localStorage.getItem('employeeUser');
            if (!storedUser) {
                setError("Please login again.");
                if (!lastRefreshed) setLastRefreshed(new Date());
                return;
            }
            const user = JSON.parse(storedUser);
            const isDev = (user.category || '').toLowerCase() === 'developer';
            setEmployeeCategory(user.category || '');

            if (!silent) setLoading(true);

            if (isDev) {
                const res = await fetch('https://vehicleecare.onrender.com/api/bugs');
                if (!res.ok) throw new Error("Server communication error.");
                const data = await res.json();
                if (data.success) {
                    setTasks(data.data || []);
                    setLastRefreshed(new Date());
                    setError(null);
                } else {
                    setError(data.message || "Failed to fetch bug tasks.");
                }
            } else {
                const empId = user._id || user.id;
                if (!empId) {
                    setError("Employee identification error. Please re-login.");
                    if (!lastRefreshed) setLastRefreshed(new Date());
                    return;
                }
                const res = await fetch(`https://vehicleecare.onrender.com/api/bookings/employee/${empId}`);
                if (!res.ok) throw new Error("Server communication error.");
                const data = await res.json();
                if (data.success) {
                    setTasks(data.data || []);
                    setLastRefreshed(new Date());
                    setError(null);
                } else {
                    setError(data.message || "Failed to fetch tasks.");
                }
            }
        } catch (err) {
            setError(err.message || "Connection failed.");
            if (!lastRefreshed) setLastRefreshed(new Date());
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateBugStatus = async (id, newStatus) => {
        try {
            const res = await fetch(`https://vehicleecare.onrender.com/api/bugs/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            const data = await res.json();
            if (data.success) {
                setTasks(prev => prev.map(b => b._id === id ? { ...b, status: newStatus } : b));
                if (selectedTask && selectedTask._id === id) {
                    setSelectedTask(prev => ({ ...prev, status: newStatus }));
                }
                triggerAlert('Bug status updated successfully', 'success');
            } else {
                triggerAlert(data.message || "Failed to update bug status.", 'error');
            }
        } catch (error) {
            console.error("Error updating bug status:", error);
            triggerAlert("Network error. Failed to update status.", 'error');
        }
    };

    useEffect(() => {
        fetchTasks();
        const timer = setInterval(() => fetchTasks(true), 5000); // Silent refresh every 5s
        return () => clearInterval(timer);
    }, []);

    
    const handleUpdateStatus = async (id, newStatus) => {
        try {
            const res = await fetch(`https://vehicleecare.onrender.com/api/bookings/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            const data = await res.json();
            if (data.success) {
                setTasks(prev => prev.map(t => t._id === id ? { ...t, status: newStatus } : t));
            }
        } catch (err) {
            console.error("Update failed:", err);
        }
    };
    const handleViewDetails = (task) => {
        setSelectedTask(task);
        setIsViewModalOpen(true);
    };

    const handleOpenRemarkModal = (task) => {
        setSelectedRemarkTask(task);
        setRemarkText(task.employeeRemark || '');
        setIsRemarkModalOpen(true);
    };

    const handleRemarkSubmit = async (e) => {
        e.preventDefault();
        if (!selectedRemarkTask) return;
        if (!remarkText || !remarkText.trim()) {
            triggerAlert('Please fill out all the required field', 'error');
            return;
        }
        setIsSubmittingRemark(true);
        try {
            let empName = 'Employee';
            let empId = 'EMPLOYEE';
            let empRole = 'Technician';
            const storedUser = localStorage.getItem('employeeUser');
            if (storedUser) {
                try {
                    const u = JSON.parse(storedUser);
                    empName = u.name || u.employeeName || empName;
                    empId = u.employeeId || u.userId || u._id || empId;
                    empRole = u.role || empRole;
                } catch (_) {}
            }

            const isBugTask = Boolean(selectedRemarkTask.bugId || selectedRemarkTask.portal || isDeveloper);
            const refId = selectedRemarkTask.bugId || selectedRemarkTask.bookingId || String(selectedRemarkTask._id);
            const custDetails = selectedRemarkTask.reporterName || selectedRemarkTask.reporterId || selectedRemarkTask.user?.userId || selectedRemarkTask.user?.phone || selectedRemarkTask.user?.name || selectedRemarkTask.customerId || selectedRemarkTask.customerPhone || '—';

            const remarkRes = await fetch('https://vehicleecare.onrender.com/api/remarks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    referenceId: refId,
                    bookingId: refId,
                    bookingMongoId: selectedRemarkTask._id,
                    reporterId: empId,
                    reporterName: empName,
                    remarkerRole: empRole,
                    remarkedRole: isBugTask ? 'Developer' : (selectedRemarkTask.role || 'Customer'),
                    role: isBugTask ? 'Developer' : (selectedRemarkTask.role || 'Customer'),
                    customerDetails: custDetails,
                    remark: remarkText,
                    status: selectedRemarkTask.status || 'Pending'
                })
            });
            const remarkData = await remarkRes.json();
            const createdRemarkId = remarkData.data?.remarkId;

            if (isBugTask) {
                await fetch(`https://vehicleecare.onrender.com/api/bugs/${selectedRemarkTask._id}/status`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ remark: remarkText, employeeRemark: remarkText })
                });
            } else {
                const res = await fetch(`https://vehicleecare.onrender.com/api/bookings/${selectedRemarkTask._id}/status`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ remark: remarkText, remarks: remarkText, employeeRemark: remarkText })
                });
                const data = await res.json();
                if (data.success) {
                    fetchTasks(true);
                }
            }
            setTasks(prev => prev.map(t => t._id === selectedRemarkTask._id ? { ...t, remark: remarkText, remarks: remarkText, employeeRemark: remarkText, remarkId: createdRemarkId } : t));
            triggerAlert('Remark submitted successfully!', 'success');
        } catch (err) {
            console.error('[Tasks] Error submitting remark:', err);
            triggerAlert('Failed to submit remark.', 'error');
        } finally {
            setIsSubmittingRemark(false);
            setIsRemarkModalOpen(false);
            setSelectedRemarkTask(null);
            setRemarkText('');
        }
    };

    const getDeliveryDue = (booking) => {
        if (!booking?.serviceDuration || booking.serviceDuration === '—') return '—';
        const str = booking.serviceDuration.toLowerCase();
        let days = 0;
        let hours = 0;
        
        const dMatch = str.match(/(\d+)\s*day/);
        if (dMatch) days = parseInt(dMatch[1], 10);
        
        const hMatch = str.match(/(\d+)\s*hour/);
        if (hMatch) hours = parseInt(hMatch[1], 10);
        
        // Use the explicitly scheduled service time as the baseline
        let baseTime = new Date(booking.createdAt || Date.now());
        if (booking.schedule?.date) {
            const parsedSchedule = new Date(`${booking.schedule.date} ${booking.schedule.time || ''}`.trim());
            if (!isNaN(parsedSchedule.getTime())) {
                baseTime = parsedSchedule;
            }
        }
        
        baseTime.setDate(baseTime.getDate() + days);
        baseTime.setHours(baseTime.getHours() + hours);
        
        return baseTime.toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    };

    const handleSendOTP = async (taskId) => {
        if (!taskId) return;
        const currentTask = tasks.find(t => t._id === taskId);
        if (!currentTask) return;

        setIsSubmitting(true);
        setSelectedTaskId(taskId); 

        // For "In Progress" -> "In Service":
        // 1. If we are NOT in the duration modal yet, open it.
        // 2. If we ARE in the duration modal (Next was clicked), open the OTP modal.
        if (currentTask.status === 'In Progress' && !showDurationModal) {
            setShowDurationModal(true);
            setIsSubmitting(false); // Don't block yet, user needs to enter duration
            return;
        }

        // For delivery flow OR when Duration is already completed: open OTP modal immediately
        setShowDurationModal(false);
        setShowOTPModal(true);

        try {
            const endpoint = currentTask.status === 'Completed' ? 'send-delivery-otp' : 'send-otp';
            const res = await fetch(`https://vehicleecare.onrender.com/api/bookings/${taskId}/${endpoint}`, {
                method: 'POST'
            });
            const data = await res.json();
            if (!data.success) {
                triggerAlert(data.message || "Failed to send OTP", "error");
                setShowOTPModal(false);
                setSelectedTaskId(null);
            } else {
                triggerAlert("OTP sent successfully", "success");
            }
        } catch (err) {
            console.error("OTP send failed:", err);
            triggerAlert("Connection error. Please try again.", "error");
            setShowOTPModal(false);
            setSelectedTaskId(null);
        } finally {
            setIsSubmitting(false);
        }
    };

    // OTP Input Helpers
    const handleOtpBoxChange = (value, index) => {
        if (value && !/^\d+$/.test(value)) return;
        const paddedOtp = otpInput.padEnd(6, ' ');
        const otpArray = paddedOtp.split('');
        otpArray[index] = value || ' ';
        const finalOtp = otpArray.join('');
        setOtpInput(finalOtp);

        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-box-${index + 1}`);
            nextInput?.focus();
        }
    };

    const handleOtpBoxKeyDown = (e, index) => {
        if (e.key === 'Backspace' || e.key === 'Delete') {
            const paddedOtp = otpInput.padEnd(6, ' ');
            const otpArray = paddedOtp.split('');
            
            if (otpArray[index] !== ' ') {
                // If there's a character, just clear it directly. Bypasses cursor position issues.
                e.preventDefault();
                otpArray[index] = ' ';
                setOtpInput(otpArray.join(''));
            } else if (index > 0) {
                // If already empty, jump back one box and clear it simultaneously
                e.preventDefault();
                otpArray[index - 1] = ' ';
                setOtpInput(otpArray.join(''));
                const prevInput = document.getElementById(`otp-box-${index - 1}`);
                prevInput?.focus();
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            e.preventDefault();
            const prevInput = document.getElementById(`otp-box-${index - 1}`);
            prevInput?.focus();
        } else if (e.key === 'ArrowRight' && index < 5) {
            e.preventDefault();
            const nextInput = document.getElementById(`otp-box-${index + 1}`);
            nextInput?.focus();
        }
    };

    const handleVerifyOTP = async () => {
        const cleanOtp = otpInput.replace(/\s+/g, '');
        if (!cleanOtp || cleanOtp.length !== 6 || !selectedTaskId) {
            triggerAlert("Please enter a valid 6-digit OTP", "error");
            return;
        }
        setIsSubmitting(true);
        try {
            const currentTask = tasks.find(t => t._id === selectedTaskId);
            const currentStatus = currentTask?.status;
            const endpoint = currentStatus === 'Completed' ? 'verify-delivery-otp' : 'verify-otp';
            const body = currentStatus === 'Completed' ? { otp: cleanOtp } : { otp: cleanOtp, duration };

            const res = await fetch(`https://vehicleecare.onrender.com/api/bookings/${selectedTaskId}/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (data.success) {
                const nextStatus = currentStatus === 'Completed' ? 'Delivered' : 'In Service';
                setTasks(prev => prev.map(t => t._id === selectedTaskId ? { ...t, status: nextStatus, serviceDuration: duration || t.serviceDuration } : t));
                triggerAlert(currentStatus === 'Completed' ? "Delivery OTP verified!" : "Service OTP verified!", "success");
                setShowOTPModal(false);
                setShowDurationModal(false);
                setDurationDays('');
                setDurationHours('');
                setOtpInput('');
                setSelectedTaskId(null);
            } else {
                triggerAlert(data.message || "Invalid OTP", "error");
            }
        } catch (err) {
            console.error("OTP verification failed:", err);
            triggerAlert("Verification failed. Please try again.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Delivered': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'Completed': return 'bg-teal-100 text-teal-800 border-teal-200';
            case 'In Service': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
            case 'In Progress': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'Pending': return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'Cancelled': return 'bg-rose-100 text-rose-800 border-rose-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getItemDate = (item) => {
        if (!item) return null;
        const fields = [
            item.createdAt,
            item.bookingDate,
            item.date,
            item.timestamp,
            item.startDate,
            item.appliedDate,
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

    const getBookedAtParts = (task) => {
        const itemDate = getItemDate(task);
        if (!itemDate || isNaN(itemDate.getTime())) return { dateStr: '—', timeStr: '' };
        const day = itemDate.toLocaleDateString('en-IN', { day: '2-digit' });
        const month = itemDate.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase();
        const year = itemDate.getFullYear();
        const time = itemDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).toUpperCase();
        return {
            dateStr: `${day} ${month} ${year}`,
            timeStr: time
        };
    };

    const filteredTasks = useMemo(() => {
        if (isDeveloper) {
            return tasks.filter(b => {
                if (filterStatus !== 'All' && b.status?.toLowerCase() !== filterStatus.toLowerCase()) {
                    return false;
                }
                if (labelFilter !== 'all') {
                    const label = rowLabels[b._id];
                    if (!label || label.toUpperCase() !== labelFilter.toUpperCase()) {
                        return false;
                    }
                }
                if (timeRange !== 'all') {
                    const itemDate = b.createdAt ? new Date(b.createdAt) : null;
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
                const idA = String(a.bugId || a._id || a.title || '');
                const idB = String(b.bugId || b._id || b.title || '');
                return sortOrder === 'latest' ? idB.localeCompare(idA) : idA.localeCompare(idB);
            });
        }

        const filtered = tasks.filter(task => {
            const matchesStatus = filterStatus === 'All' || task.status?.toLowerCase() === filterStatus.toLowerCase();
            
            const customerName = task.customerDetails?.name || '';
            const bookingId = task.bookingId || '';
            const registrationNumber = task.vehicleDetails?.registrationNumber || '';
            const matchesSearch = 
                customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                bookingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                registrationNumber.toLowerCase().includes(searchTerm.toLowerCase());

            if (!matchesStatus || !matchesSearch) return false;

            if (timeRange !== 'all') {
                const itemDate = getItemDate(task);
                if (itemDate && !isNaN(itemDate.getTime())) {
                    const now = new Date();
                    const diffDays = Math.ceil(Math.abs(now - itemDate) / (1000 * 60 * 60 * 24));
                    if (timeRange === 'week' && diffDays > 7) return false;
                    if (timeRange === 'month' && diffDays > 30) return false;
                }
            }
            if (labelFilter !== 'all') {
                const currentLabel = rowLabels[task._id];
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
    }, [tasks, searchTerm, filterStatus, labelFilter, rowLabels, sortOrder, timeRange, isDeveloper]);

    useEffect(() => {
        setResultsCount(filteredTasks.length);
    }, [filteredTasks.length, setResultsCount]);

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto h-[calc(100vh-9.25rem)] flex flex-col">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-[#011023] uppercase tracking-tight">
                    {isDeveloper ? 'Bug Tracker' : 'My Tasks'}
                </h1>
                <div className="flex items-center gap-2 text-xs uppercase text-gray-400 font-medium self-center">
                    {lastRefreshed
                        ? `Last refreshed | ${lastRefreshed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | ${lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`
                        : 'Loading…'}
                </div>
            </div>

            <div className="bg-white flex-1 min-h-0 border border-[#e9f2fb] rounded-2xl shadow-[0_1px_2.5px_0_rgba(0,0,0,0.07)] overflow-hidden flex flex-col">
                <div className="overflow-x-hidden overflow-y-auto text-center flex-1 relative hide-scrollbar">
                    <table className="w-full text-left border-collapse table-fixed">
                        <thead className="sticky top-0 z-30 shadow-sm">
                            {isDeveloper ? (
                                <tr className="bg-[#f0f6ff] text-[15px] uppercase tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                    <th className="p-4 font-bold text-center w-[10%]">Bug ID</th>
                                    <th className="p-4 font-bold text-center w-[11%]">Portal</th>
                                    <th className="p-4 font-bold text-center w-[9%]">Reporter</th>
                                    <th className="p-4 font-bold text-center w-[34%]">Bug Subject</th>
                                    <th className="p-4 font-bold text-center w-[15%]">Reported At</th>
                                    <th className="p-4 font-bold text-center w-[9.5%]">Status</th>
                                    <th className="p-4 font-bold text-center w-[7.5%]">Actions</th>
                                </tr>
                            ) : (
                                <tr className="bg-[#f2f7ff] text-[15px] text-center uppercase tracking-wider text-gray-500 border-b border-[#f0f6fc]">
                                    <th className="p-4.5 font-bold text-center w-[9%]">Booking ID</th>
                                    <th className="p-4.5 font-bold text-center w-[10%]">Customer</th>
                                    <th className="p-4.5 font-bold text-center w-[15%]">Contact</th>
                                    <th className="p-4.5 font-bold text-center w-[33%]">Service Details</th>
                                    <th className="p-4.5 font-bold text-center w-[9%]">Booked At</th>
                                    <th className="p-4.5 font-bold text-center w-[10%]">Status</th>
                                    <th className="p-4.5 font-bold text-center w-[7%]">Action</th>
                                </tr>
                            )}
                        </thead>
                        <tbody className="divide-y divide-[#e6f0fa] uppercase text-[12px]">
                            {loading && tasks.length === 0 ? (
                                <TableSkeleton rows={15} cols={7} />
                            ) : filteredTasks.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-20 text-center text-sm text-gray-500 font-bold">
                                        {isDeveloper ? 'No bug reports found.' : 'No bookings found.'}
                                    </td>
                                </tr>
                            ) : isDeveloper ? (
                                filteredTasks.map((bug) => {
                                    const rowId = bug.bugId || bug._id;
                                    return (
                                        <tr 
                                            key={bug._id} 
                                            id={`row-${rowId}`}
                                            onClick={(e) => {
                                                if (isLabelMode) {
                                                    e.stopPropagation();
                                                    setActiveLabelRowId(prev => prev === bug._id ? null : bug._id);
                                                }
                                            }}
                                            className={`transition-all duration-1000 border-b border-[#e6f0fa] group ${
                                                isLabelMode ? 'cursor-pointer hover:bg-blue-50/60' : 'hover:bg-white/50'
                                            } ${(highlightedRow === rowId || highlightedRow === bug._id || highlightedRow === bug.bugId) ? 'bg-emerald-100/60 rounded-2xl relative z-10 scale-[1.01]' : ''}`}
                                        >
                                            <td className="p-4 font-semibold text-[#052558] text-sm text-center relative w-[10%]">
                                                <div className="relative flex items-center justify-center w-full">
                                                    {Boolean(rowLabels[bug._id]) && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActiveLabelRowId(prev => prev === bug._id ? null : bug._id);
                                                            }}
                                                            className="absolute -left-1.5 top-1/2 -translate-y-1/2 cursor-pointer hover:scale-115 transition-transform active:scale-95 p-0.5 z-10"
                                                            title={`Label: ${stripEmoji(rowLabels[bug._id] || 'Add label')}`}
                                                        >
                                                            {renderLabelIcon(rowLabels[bug._id], 16)}
                                                        </button>
                                                    )}
                                                    {activeLabelRowId === bug._id && (
                                                        <FloatingLabelSelector 
                                                            rowId={bug._id}
                                                            currentLabel={rowLabels[bug._id]}
                                                            onSaveLabel={handleSaveRowLabel}
                                                            labelPopupRef={labelPopupRef}
                                                            topClass='-top-8.5'
                                                            positionClass="-left-4"
                                                        />
                                                    )}
                                                    <span>{(bug.bugId || bug._id.substring(0, 8)).replace(/-/g, '').toUpperCase()}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center w-[10%]">
                                                <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getPortalColor(bug.portal)}`}>
                                                    {getPortalLabel(bug.portal)}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm font-semibold text-[#052558] text-center w-[12%]">{bug.reporterId}</td>
                                            <td className="p-4 text-center font-semibold text-[#011023] truncate max-w-[280px] uppercase ">{bug.title}</td>
                                            <td className="p-4 text-center whitespace-nowrap text-sm text-gray-800 font-semibold">
                                                <div className="flex items-center justify-center w-full">
                                                    <span className="flex-1 text-right">{new Date(bug.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                    <span className="px-1.5 text-gray-700">|</span>
                                                    <span className="flex-1 text-left">{new Date(bug.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`inline-block px-3 py-1 text-xs text-center font-semibold rounded-full border border-transparent ${getBugStatusColor(bug.status)}`}>
                                                    {bug.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-center gap-4.5">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedTask(bug);
                                                            setIsViewModalOpen(true);
                                                        }}
                                                        className="text-gray-400 hover:text-blue-500 cursor-pointer"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    {bug.status !== 'Resolved' && (
                                                        <button
                                                            onClick={() => {
                                                                if (bug.status === 'Pending') {
                                                                    handleUpdateBugStatus(bug._id, 'In Progress');
                                                                } else if (bug.status === 'In Progress') {
                                                                    handleUpdateBugStatus(bug._id, 'Resolved');
                                                                }
                                                            }}
                                                            className="text-gray-400 hover:text-emerald-500 cursor-pointer"
                                                        >
                                                            <Check size={18} className="stroke-[2]" />
                                                        </button>
                                                    )}
                                                    {bug.status === 'Resolved' && (
                                                        <button
                                                            onClick={() => handleOpenRemarkModal(bug)}
                                                            className="text-gray-400 hover:text-emerald-500 cursor-pointer"
                                                            title="Task Remark"
                                                        >
                                                            <MessageSquare size={18} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                filteredTasks.map((task) => {
                                    const rowId = task.bookingId || task._id;
                                    const { dateStr, timeStr } = getBookedAtParts(task);
                                return (
                                    <tr 
                                        key={task._id} 
                                        id={`row-${rowId}`}
                                        onClick={() => {
                                            if (isLabelMode) {
                                                setActiveLabelRowId(prev => prev === task._id ? null : task._id);
                                            }
                                        }}
                                        className={`text-center cursor-pointer transition-all duration-1000 ${
                                            highlightedRow === rowId 
                                                ? 'bg-emerald-100/60 rounded-2xl relative z-20 scale-[1.01]' 
                                                : 'hover:bg-blue-50/30'
                                        }`}
                                    >
                                    <td className="p-4 font-semibold text-[#052558] text-sm text-center relative">
                                        <div className="relative flex items-center justify-center w-full">
                                            {Boolean(rowLabels[task._id]) && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveLabelRowId(prev => prev === task._id ? null : task._id);
                                                    }}
                                                    className="absolute -left-1.5 top-1/2 -translate-y-1/2 cursor-pointer hover:scale-115 transition-transform active:scale-95 p-0.5"
                                                    title={`Label: ${stripEmoji(rowLabels[task._id])}`}
                                                >
                                                    {renderLabelIcon(rowLabels[task._id], 16)}
                                                </button>
                                            )}

                                            {activeLabelRowId === task._id && (
                                                <FloatingLabelSelector 
                                                    rowId={task._id}
                                                    currentLabel={rowLabels[task._id]}
                                                    onSaveLabel={handleSaveRowLabel}
                                                    labelPopupRef={labelPopupRef}
                                                    positionClass="-left-4"
                                                />
                                            )}
                                            <span>{task.bookingId}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col items-center">
                                            <div className="font-semibold text-[13px] uppercase">
                                                {task.user.name}
                                            </div>
                                            <div className="text-[11.5px] text-slate-500 uppercase">
                                                {task.user.userId}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="font-semibold text-[13px] uppercase truncate max-w-[150px] mx-auto">
                                            {task.user.phone}
                                        </div>
                                        <div className="text-[11.5px] text-slate-500 lowercase tracking-wide">
                                            {task.user.email}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="font-semibold text-[13px] uppercase leading-snug">
                                            {task.service.title}
                                        </div>
                                        <div className="text-[11.5px] text-slate-500 uppercase tracking-wide">
                                            {(() => {
                                                const year = task.vehicle?.year || '';
                                                const make = (task.vehicle?.make || task.vehicle?.brand || '').trim();
                                                const model = (task.vehicle?.model || task.vehicle?.modelName || task.vehicle?.carModel || task.vehicle?.name || '').trim();
                                                const hasValidModel = model && model.toUpperCase() !== 'N/A';
                                                const hasValidMake = make && make.toUpperCase() !== 'N/A';

                                                let vehicleStr = 'N/A';
                                                if (hasValidMake && hasValidModel) {
                                                    vehicleStr = make.toLowerCase().includes(model.toLowerCase()) ? make : `${make} ${model}`;
                                                } else if (hasValidMake) {
                                                    vehicleStr = make;
                                                } else if (hasValidModel) {
                                                    vehicleStr = model;
                                                }

                                                return (year && vehicleStr !== 'N/A') ? `${year} ${vehicleStr}` : vehicleStr;
                                            })()}
                                        </div>
                                    </td>
                                    <td className="p-4 font-semibold text-[13px] text-center">
                                        <div className="text-[#011023]">{dateStr}</div>
                                        {timeStr && <div className="text-gray-500 mt-0.5 text-xs font-normal">{timeStr}</div>}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full border text-xs font-semibold uppercase tracking-wider ${getStatusStyle(task.status)}`}>
                                            {task.status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-center gap-4">
                                            <button 
                                                onClick={() => handleViewDetails(task)}
                                                className="text-gray-400 hover:text-blue-500 cursor-pointer"
                                            >
                                                <Eye size={17} />
                                            </button>
                                             {task.status !== 'Delivered' && userRole === 'Technician' && (
                                                <button
                                                    onClick={() => {
                                                        if (task.status === 'In Progress') {
                                                            handleSendOTP(task._id);
                                                        } else if (task.status === 'In Service') {
                                                            handleUpdateStatus(task._id, 'Completed');
                                                        } else if (task.status === 'Completed') {
                                                            handleSendOTP(task._id);
                                                        } else {
                                                            handleUpdateStatus(task._id, 'In Progress');
                                                        }
                                                    }}
                                                    disabled={isSubmitting && selectedTaskId === task._id}
                                                    className={` cursor-pointer ${
                                                        task.status === 'Delivered' ? 'text-emerald-500 ' : 
                                                        task.status === 'Completed' ? 'text-blue-600' : 
                                                        task.status === 'In Service' ? 'text-emerald-500 ' : 
                                                        task.status === 'In Progress' ? 'text-purple-600 ' : 
                                                        'text-gray-400 hover:text-indigo-500 '
                                                    } ${isSubmitting && selectedTaskId === task._id ? 'opacity-50' : ''}`}
                                                >
                                                    {isSubmitting && selectedTaskId === task._id ? (
                                                        <Loader2 size={17} className="animate-spin" />
                                                    ) : (
                                                        <Check size={17} strokeWidth={2.5} />
                                                    )}
                                                </button>
                                            )}
                                            {task.status === 'Delivered' && (
                                                <button
                                                    onClick={() => handleOpenRemarkModal(task)}
                                                    className="text-gray-400 hover:text-emerald-500 cursor-pointer"
                                                    title="Task Remark"
                                                >
                                                    <MessageSquare size={17} />
                                                </button>
                                            )}
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

            {/* View Details Modal */}
            {isDeveloper && isViewModalOpen && selectedTask && createPortal(
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#011023]/10 backdrop-blur-sm"
                    onClick={() => { setIsViewModalOpen(false); setSelectedTask(null); }}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-[#e6f0fa] flex justify-between items-center bg-gradient-to-r from-blue-50/50 to-white">
                            <div>
                                <h3 className="text-xl uppercase font-bold text-[#052558]">Bug Details</h3>
                                <p className="text-sm text-gray-500 mt-1">ID: <span className="font-semibold text-gray-700">{(selectedTask.bugId || selectedTask._id?.slice(0,8))?.replace(/-/g, '')}</span></p>
                            </div>
                            <button
                                onClick={() => { setIsViewModalOpen(false); setSelectedTask(null); }}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            {/* Info Grid */}
                            <div className="flex flex-col md:flex-row gap-6 w-full text-left">
                                <div className="space-y-4 w-full md:w-[35%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Reporter Info</h4>
                                    <div className="pt-4 rounded-xl uppercase space-y-2">
                                        <p className="text-sm flex"><span className="text-gray-500 w-24 shrink-0 font-medium">Name:</span> <span className="font-semibold text-[#011023] truncate" title={selectedTask.reporterName}>{selectedTask.reporterName || 'N/A'}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-24 shrink-0 font-medium">ID:</span> <span className="font-semibold text-gray-800 truncate">{selectedTask.reporterId || 'N/A'}</span></p>
                                    </div>
                                </div>
                                <div className="space-y-4 w-full md:w-[25%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Issue Meta</h4>
                                    <div className="pt-4 rounded-xl uppercase space-y-2">
                                        <div className="text-sm flex items-center"><span className="text-gray-500 w-20 shrink-0 font-medium">Severity</span> <span className={`inline-block px-3 py-1 text-xs text-center font-semibold rounded-full border border-transparent ${getSeverityColor(selectedTask.severity)}`}>{selectedTask.severity || 'Medium'}</span></div>
                                        <div className="text-sm flex items-center">
                                            <span className="text-gray-500 w-20 shrink-0 font-medium">Status</span> 
                                            <select 
                                                value={selectedTask.status} 
                                                onChange={(e) => handleUpdateBugStatus(selectedTask._id, e.target.value)}
                                                className={`px-3 py-1 text-xs text-center font-semibold rounded-full border border-transparent cursor-pointer outline-none ${getBugStatusColor(selectedTask.status)}`}
                                            >
                                                <option value="Pending">Pending</option>
                                                <option value="In Progress">In Progress</option>
                                                <option value="Resolved">Resolved</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4 w-full md:w-[37%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Timeline</h4>
                                    <div className="pt-4 rounded-xl uppercase space-y-2">
                                        <p className="text-sm flex items-center"><span className="text-gray-500 w-24 shrink-0 font-medium">Portal:</span> <span className={`inline-block px-3 py-1 text-xs font-semibold ml-3.5 rounded-full ${getPortalColor(selectedTask.portal)}`}>{getPortalLabel(selectedTask.portal)}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-28 shrink-0 uppercase font-medium">Reported On:</span> <span className="font-bold text-gray-600 text-sm">{formatSubmittedAt(selectedTask.createdAt)}</span></p>
                                    </div>
                                </div>
                            </div>

                            {/* Bug Subject & Details */}
                            <div className="space-y-3 text-left"> 
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Bug Subject and Details</h4>
                                <p className="text-[14px] uppercase font-semibold text-justify leading-relaxed">
                                    <span className="text-[#052558] font-semibold">{selectedTask.title}</span>
                                    <span className="text-gray-700 mx-2 font-semibold">|</span>
                                    <span className="text-gray-800 font-semibold">{selectedTask.description}</span>
                                </p>
                            </div>
                        </div>

                        {/* Footer Action */}
                        <div className="p-4 border-t border-gray-100 flex justify-end gap-3">
                            <button
                                onClick={() => handleUpdateBugStatus(selectedTask._id, selectedTask.status === 'Resolved' ? 'In Progress' : 'Resolved')}
                                className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                                    selectedTask.status === 'Resolved'
                                        ? 'bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-200'
                                        : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-100'
                                }`}
                            >
                                {selectedTask.status === 'Resolved' ? 'Reopen Bug (In Progress)' : 'Mark as Resolved'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {!isDeveloper && isViewModalOpen && selectedTask && createPortal(
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#011023]/10 backdrop-blur-sm"
                    onClick={() => setIsViewModalOpen(false)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-[#e6f0fa] flex justify-between items-center bg-gradient-to-r from-blue-50/50 to-white">
                            <div>
                                <h3 className="text-xl uppercase font-bold text-[#052558]">Task Details</h3>
                                <p className="text-sm text-gray-500 mt-1">ID: <span className="font-semibold text-gray-700">{selectedTask.bookingId || selectedTask._id}</span></p>
                            </div>
                            <button
                                onClick={() => setIsViewModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 space-y-6 hide-scrollbar">
                            <div className="flex flex-col md:flex-row gap-6 w-full">
                                {/* Customer Info */}
                                <div className="space-y-4 w-full md:w-[40%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Customer Info</h4>
                                    <div className="pt-4 rounded-xl uppercase space-y-2">
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Name:</span> <span className="font-semibold text-[#011023] truncate" title={selectedTask.user?.name}>{selectedTask.user?.name || 'N/A'}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Phone:</span> <span className="font-semibold text-gray-800 truncate">{selectedTask.user?.phone || 'N/A'}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Email:</span> <span className="font-semibold text-gray-800 truncate" title={selectedTask.user?.email}>{selectedTask.user?.email || 'N/A'}</span></p>
                                    </div>
                                </div>

                                {/* Vehicle Info */}
                                <div className="space-y-4 w-full md:w-[24%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Vehicle Info</h4>
                                    <div className="pt-4 rounded-xl uppercase space-y-2 min-h-[110px]">
                                        <p className="text-sm"><span className="text-gray-500 w-16 inline-block">Brand:</span> <span className="font-semibold text-[#011023]">{selectedTask.vehicle?.make || selectedTask.vehicle?.brand || 'N/A'}</span></p>
                                        <p className="text-sm"><span className="text-gray-500 w-16 inline-block">Model:</span> <span className="font-semibold text-gray-800">{selectedTask.vehicle?.model || selectedTask.vehicle?.modelName || selectedTask.vehicle?.carModel || selectedTask.vehicle?.name || 'N/A'}</span></p>
                                        <p className="text-sm"><span className="text-gray-500 w-16 inline-block">Year:</span> <span className="font-semibold text-gray-800">{selectedTask.vehicle?.year || 'N/A'}</span></p>
                                    </div>
                                </div>

                                {/* Payment & Status */}
                                <div className="flex flex-col gap-4.5 w-full md:w-[34%]">
                                    <div className="space-y-0.5">
                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Other Details</h4>
                                        <div className="flex items-center mt-7 mb-0.75 gap-3">
                                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider w-24">Status</h4>
                                            <div className="flex uppercase items-center gap-2 pl-6">
                                                <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full border border-transparent ${getStatusStyle(selectedTask.status)}`}>
                                                    {selectedTask.status}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider w-24">Duration</h4>
                                            <div className="flex uppercase items-center gap-2 pl-3">
                                                <span className="inline-block px-3 py-1 text-sm font-semibold rounded-md uppercase text-gray-800">{selectedTask.serviceDuration || '—'}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider w-29">Delivery Due</h4>
                                            <div className="flex uppercase items-center gap-2">
                                                <span className="inline-block px-1 py-1 text-sm font-semibold rounded-md uppercase text-gray-800">
                                                    {getDeliveryDue(selectedTask)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Service Details */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Service Details</h4>
                                <div className="gap-4 rounded-xl flex justify-between items-center">
                                    <div>
                                        <h5 className="font-semibold text-[#052558] uppercase text-sm">{selectedTask.service?.title || 'General Service'}</h5>
                                        <p className="text-sm uppercase text-gray-500 mt-1">Scheduled for: <span className="font-semibold text-gray-700">{selectedTask.schedule?.date} at {selectedTask.schedule?.time}</span></p>
                                    </div>
                                </div>
                            </div>

                            {/* Garage & Employees Info */}
                            <div className="flex gap-5 mt-8">
                                {/* Employees Info - 100% */}
                                <div className="w-full rounded-xl flex divide-x divide-[#e6f0fa]">
                                    <div className="w-1/3 pr-4 uppercase">
                                        <p className="text-sm font-bold text-gray-400 mb-3">Assigned Employee's</p>
                                        <h5 className="font-semibold text-[#052558] text-sm">{selectedTask.assignedEmployees?.technician?.name || 'Waiting...'}</h5>
                                        <p className="text-sm text-gray-500 mt-0.5">Technician | {selectedTask.assignedEmployees?.technician?.employeeId || 'ID Pending'}</p>
                                    </div>
                                    <div className="w-1/3 px-4 uppercase">
                                        <h5 className="font-semibold text-[#052558] mt-8 text-sm">{selectedTask.assignedEmployees?.support?.name || 'Waiting...'}</h5>
                                        <p className="text-sm text-gray-500 mt-0.5">Support Staff | {selectedTask.assignedEmployees?.support?.employeeId || 'ID Pending'}</p>
                                    </div>
                                    <div className="w-1/3 pl-4 uppercase">
                                        <h5 className="font-semibold text-[#052558] mt-8 text-sm">{selectedTask.assignedEmployees?.mechanic?.name || '—'}</h5>
                                        <p className="text-sm text-gray-500 mt-0.5">Mechanic | {selectedTask.assignedEmployees?.mechanic?.employeeId || '—'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Duration Modal */}
            {showDurationModal && createPortal(
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#011023]/10 backdrop-blur-sm" onClick={() => { setShowDurationModal(false); setDurationDays(''); setDurationHours(''); }} />
                    <div className="relative w-full max-w-xl bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50 animate-in fade-in zoom-in duration-200">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100/50 flex items-center justify-between relative">
                            <div className="w-8"></div>
                            <div className="text-center absolute left-1/2 -translate-x-1/2 uppercase">
                                <h2 className="text-xl mt-2 font-bold text-[#011023]">Service Duration</h2>
                                <p className="text-[13px] text-gray-500 font-bold mt-1">Enter the estimated time required</p>
                            </div>
                            <button onClick={() => { setShowDurationModal(false); setDurationDays(''); setDurationHours(''); }} className="p-2 rounded-full transition-colors text-gray-400 hover:text-gray-700 relative z-10">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-4 uppercase overflow-y-auto hide-scrollbar">
                            <div className="grid grid-cols-2 gap-4 px-5">
                                <div>
                                    <label className="block text-sm text-center font-semibold text-[#011023] mb-2">Days</label>
                                    <select 
                                        className="w-full uppercase px-4 font-semibold text-center text-xs py-3 bg-white/50 border border-white/60 rounded-xl transition-all outline-none appearance-none cursor-pointer"
                                        value={durationDays}
                                        onChange={(e) => setDurationDays(e.target.value)}
                                    >
                                        <option value=""></option>
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((h) => (
                                            <option key={h} value={h}>{h} {h === 1 ? 'Day' : 'Days'}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-center font-semibold text-[#011023] mb-2">Hours</label>
                                    <select 
                                        className="w-full uppercase px-4 font-semibold text-center text-xs py-3 bg-white/50 border border-white/60 rounded-xl transition-all outline-none appearance-none cursor-pointer"
                                        value={durationHours}
                                        onChange={(e) => setDurationHours(e.target.value)}
                                    >
                                        <option value=""></option>
                                        {[3, 6, 9, 12, 15, 18, 24].map((h) => (
                                            <option key={h} value={h}>{h} {h === 1 ? 'Hour' : 'Hours'}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-2 grid grid-cols-2 gap-3 pb-8 px-11">
                            <button onClick={() => { setShowDurationModal(false); setDurationDays(''); setDurationHours(''); }} className="px-4 py-3 bg-white border border-gray-200 text-gray-400 rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-white hover:text-gray-600 transition-all shadow-sm active:scale-95">CANCEL</button>
                            <button 
                                onClick={() => handleSendOTP(selectedTaskId)} 
                                disabled={isSubmitting || !duration} 
                                className="px-4 py-3 bg-emerald-600 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                            >
                                {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> NEXT...</> : 'NEXT'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {showOTPModal && createPortal(
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#011023]/10 backdrop-blur-sm" onClick={() => { setShowOTPModal(false); setOtpInput(''); }} />
                    <div className="relative w-full max-w-xl bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50 animate-in fade-in zoom-in duration-200">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100/50 flex items-center justify-between relative">
                            <div className="w-9"></div>
                            <div className="text-center absolute left-1/2 -translate-x-1/2 uppercase">
                                <h3 className="text-xl mt-2 font-bold text-[#011023] whitespace-nowrap">
                                    {/* {tasks.find(t => t._id === selectedTaskId)?.status === 'Completed' ? 'Verify Delivery' : 'Verify Service'} */}

                                <h2 className="text-xl mt-2 font-bold text-[#011023]">Service Duration</h2>
                                </h3>
                                <p className="text-[13px] uppercase text-gray-500 font-bold mt-1 lowercase first-letter:uppercase">
                                    {/* {isSubmitting && !otpInput ? "Sending OTP to customer..." : "Enter the 6-digit code sent to customer"} */}
                                <p className="text-[13px] text-gray-500 font-bold mt-1">Enter the OTP sent to customer</p>
                                </p>
                            </div>
                            <button onClick={() => { setShowOTPModal(false); setOtpInput(''); }} className="p-2 rounded-full transition-colors text-gray-400 hover:text-gray-700 relative z-10">
                                <X size={20} />
                            </button>
                        </div>
                        
                        {/* Body */}
                        <div className="p-10 space-y-8 flex flex-col items-center overflow-y-auto hide-scrollbar">
                            <div className="text-center">
                                <label className="block text-[12px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-6">
                                    6-Digit Verification Code
                                </label>
                                <div className="flex justify-center gap-2 sm:gap-3 w-full px-2">
                                    {[0, 1, 2, 3, 4, 5].map((index) => (
                                        <input
                                            key={index}
                                            id={`otp-box-${index}`}
                                            type="text"
                                            maxLength="1"
                                            value={otpInput[index]?.trim() || ''}
                                            onChange={(e) => handleOtpBoxChange(e.target.value, index)}
                                            onKeyDown={(e) => handleOtpBoxKeyDown(e, index)}
                                            onFocus={(e) => e.target.select()}
                                            autoComplete="off"
                                            className="w-10 h-12 text-center text-xl text-[#011023] bg-white/50 border border-white/60 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30 transition-all shadow-sm outline-none caret-transparent selection:bg-transparent selection:text-[#011023]"
                                            autoFocus={index === 0}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-2 grid grid-cols-2 gap-3 pb-8 px-11">
                            <button 
                                onClick={() => { setShowOTPModal(false); setOtpInput(''); }}
                                className="px-4 py-3 bg-white border border-gray-200 text-gray-400 rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-white hover:text-gray-600 transition-all shadow-sm active:scale-95"
                            >
                                CANCEL
                            </button>
                            <button 
                                onClick={handleVerifyOTP}
                                disabled={isSubmitting || otpInput.replace(/\s+/g, '').length !== 6}
                                className="px-4 py-3 bg-emerald-600 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <><Loader2 size={16} className="animate-spin" /> VERIFYING...</>
                                ) : (
                                    tasks.find(t => t._id === selectedTaskId)?.status === 'Completed' ? "VERIFY & DELIVER" : "VERIFY & START"
                                )}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
            {/* Remark Modal */}
            {isRemarkModalOpen && selectedRemarkTask && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#011023]/10 backdrop-blur-sm" onClick={() => { setIsRemarkModalOpen(false); setSelectedRemarkTask(null); setRemarkText(''); }} />
                    <div className="bg-white border border-[#cbd5e1] rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden relative z-10 p-6 space-y-6 animate-in zoom-in duration-200">
                        {/* Form Header */}
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                            <div className="flex flex-col items-start text-left">
                                <h3 className="text-xl font-bold text-[#011023] uppercase tracking-wide flex items-center gap-2">
                                    Task Remark
                                </h3>
                                {selectedRemarkTask.remarkId && (
                                    <p className="flex items-center text-sm uppercase gap-2 mt-0.5">
                                        ID: <span className="text-sm font-semibold text-gray-700 uppercase">{selectedRemarkTask.remarkId}</span>
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => { setIsRemarkModalOpen(false); setSelectedRemarkTask(null); setRemarkText(''); }}
                                className="text-gray-400 hover:text-[#011023] hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Task Info Header Details */}
                        <div className="flex w-full items-center justify-between gap-4">
                            <div className="flex flex-col items-start justify-center text-left">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{selectedRemarkTask.bugId ? 'Bug ID' : 'Booking ID'}</p>
                                <p className="text-sm font-semibold text-[#011023] uppercase">{selectedRemarkTask.bugId || selectedRemarkTask.bookingId || selectedRemarkTask._id}</p>
                            </div>
                            <div className="flex flex-col items-center justify-center text-center">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Role</p>
                                <p className="text-sm font-semibold text-gray-800 uppercase">
                                    {selectedRemarkTask.portal ? getPortalLabel(selectedRemarkTask.portal) : (selectedRemarkTask.role || 'Customer')}
                                </p>
                            </div>
                            <div className="flex flex-col items-center justify-center text-center">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Details</p>
                                <p className="text-sm font-semibold text-gray-800 uppercase">
                                    {selectedRemarkTask.reporterName || 
                                     selectedRemarkTask.reporterId || 
                                     selectedRemarkTask.user?.userId || 
                                     selectedRemarkTask.customerId || 
                                     selectedRemarkTask.customerPhone || 
                                     '—'}
                                </p>
                            </div>
                            <div className="flex flex-col items-end justify-center text-right">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-4.5 mb-1">Status</p>
                                <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full uppercase border ${getBugStatusColor(selectedRemarkTask.status)}`}>
                                    {selectedRemarkTask.status}
                                </span>
                            </div>
                        </div>

                        {/* Remark Textarea Form */}
                        {(() => {
                            const hasExistingRemark = Boolean(selectedRemarkTask.employeeRemark);
                            return (
                                <form onSubmit={handleRemarkSubmit} className="space-y-4.5 text-left">
                                    <div className="space-y-2">
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Remark</label>
                                        <textarea
                                            rows="4"
                                            disabled={hasExistingRemark}
                                            value={remarkText}
                                            onChange={(e) => setRemarkText(e.target.value)}
                                            className="w-full px-4 py-3 bg-[#f8fafc] uppercase border border-[#cbd5e1] rounded-xl focus:outline-none focus:bg-white focus:border-[#a5b4fc] transition-all font-semibold text-sm text-[#011023] resize-none disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                                        />
                                    </div>

                                    {!hasExistingRemark && (
                                        <button
                                            type="submit"
                                            disabled={isSubmittingRemark}
                                            className="w-full py-2 border rounded-xl text-sm font-bold uppercase tracking-wider transition-all shadow-sm mt-4 flex items-center justify-center gap-2 bg-[#e0e7ff] border-[#a5b4fc] text-[#3730a3] hover:bg-[#c7d2fe] cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                                        >
                                            {isSubmittingRemark ? (
                                                <>
                                                    <Loader2 size={14} className="animate-spin" /> Submitting REMARK...
                                                </>
                                            ) : (
                                                <>
                                                    <Send size={14} /> Submit REMARK
                                                </>
                                            )}
                                        </button>
                                    )}
                                </form>
                            );
                        })()}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default Tasks;
