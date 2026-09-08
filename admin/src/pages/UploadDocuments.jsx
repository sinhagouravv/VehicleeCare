import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { FileText, Eye, Download, Trash2, X, Loader2, Check, MoreVertical, MessageSquare } from 'lucide-react';
import useHighlight from '../hooks/useHighlight';
import { TableSkeleton, SkeletonBlock } from '../components/Skeleton';

import { useFilter } from '../context/FilterContext';
import { useAlert } from '../context/AlertContext';
import { useRowLabels, FloatingLabelSelector, renderLabelIcon, stripEmoji, LABEL_FILTER_GROUP } from '../components/RowLabel';

const UploadDocuments = ({ isModal = false, onClose, highlightId }) => {
    const location = useLocation();
    const { triggerAlert } = useAlert();
    const [documents, setDocuments] = useState([]);
    const highlightedRow = useHighlight(documents, highlightId);
    const [loading, setLoading] = useState(true);
    const [lastRefreshed, setLastRefreshed] = useState(null);

    // Filter, Sort & Row Label States
    const [filterPortal, setFilterPortal] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [labelFilter, setLabelFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState('latest');
    const [timeRange, setTimeRange] = useState('all');

    const { setFilterConfig, setResultsCount } = useFilter();
    const { rowLabels, activeLabelRowId, setActiveLabelRowId, handleSaveRowLabel, labelPopupRef, isLabelMode } = useRowLabels('admin_documents_labels');

    // Modals state
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [docToDelete, setDocToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [openMenuId, setOpenMenuId] = useState(null);



    // Rejection Modal state
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectingDoc, setRejectingDoc] = useState(null);
    const [actionRemarks, setActionRemarks] = useState('');
    const [updatingStatus, setUpdatingStatus] = useState(false);

    // Close 3 dots action menu on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (openMenuId && !e.target.closest('.doc-action-menu')) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openMenuId]);

    // Register filter options
    useEffect(() => {
        setFilterConfig({
            title: 'Filter Uploaded Documents',
            hasSort: true,
            groups: [
                {
                    id: 'portal',
                    label: 'Portal Type',
                    defaultValue: 'all',
                    options: [
                        { label: 'All', value: 'all' },
                        { label: 'Employee', value: 'employee' },
                        { label: 'Garage', value: 'garage' },
                    ]
                },
                {
                    id: 'status',
                    label: 'Status',
                    defaultValue: 'all',
                    options: [
                        { label: 'All', value: 'all' },
                        { label: 'Pending', value: 'pending' },
                        { label: 'Approved', value: 'approved' },
                        { label: 'Rejected', value: 'rejected' },
                    ]
                },
                LABEL_FILTER_GROUP
            ],
            initialValues: {
                portal: filterPortal,
                status: filterStatus,
                label: labelFilter,
                sortOrder,
                timeRange
            },
            onChange: (newValues) => {
                if (newValues.portal !== undefined) setFilterPortal(newValues.portal);
                if (newValues.status !== undefined) setFilterStatus(newValues.status);
                if (newValues.label !== undefined) setLabelFilter(newValues.label);
                if (newValues.sortOrder !== undefined) setSortOrder(newValues.sortOrder);
                if (newValues.timeRange !== undefined) setTimeRange(newValues.timeRange);
            },
            onReset: () => {
                setFilterPortal('all');
                setFilterStatus('all');
                setLabelFilter('all');
                setSortOrder('latest');
                setTimeRange('all');
            }
        });
        return () => setFilterConfig(null);
    }, [setFilterConfig, filterPortal, filterStatus, labelFilter, sortOrder, timeRange]);

    const fetchAllDocuments = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const [empRes, garRes] = await Promise.all([
                fetch('https://vehicleecare.onrender.com/api/employees'),
                fetch('https://vehicleecare.onrender.com/api/garages')
            ]);

            const empData = await empRes.json();
            const garData = await garRes.json();

            const items = [];

            const getOrGenerateDocId = (entity, docKey) => {
                if (entity[`${docKey}DocId`]) {
                    return entity[`${docKey}DocId`].toUpperCase();
                }
                let hash = 0;
                const str = `${entity._id || ''}-${docKey}`;
                for (let i = 0; i < str.length; i++) {
                    hash = (hash * 31 + str.charCodeAt(i)) % 9000000;
                }
                const num = 1000000 + Math.abs(hash);
                return `D${num}`;
            };

            const getDocStatus = (entity, docKey, activeDocId) => {
                if (activeDocId) {
                    const storedByDocId = localStorage.getItem(`doc_status_${activeDocId}`);
                    if (storedByDocId) return storedByDocId;
                }
                const st = entity[`${docKey}Status`];
                if (st && st !== 'Uploaded') return st;
                return 'Pending';
            };

            if (empData.success && Array.isArray(empData.data)) {
                empData.data.forEach(emp => {
                    const docDefs = [
                        { key: 'panCard', label: 'PAN CARD' },
                        { key: 'adharCard', label: 'AADHAR CARD' },
                        { key: 'voterId', label: 'VOTER CARD' },
                        { key: 'drivingLicense', label: 'DRIVING LICENSE' },
                        { key: 'agreement', label: 'EMPLOYMENT AGREEMENT' },
                        { key: 'signature', label: 'SIGNATURE' },
                    ];
                    docDefs.forEach(doc => {
                        const fileUrl = emp[doc.key];
                        const isUploaded = Boolean(fileUrl && typeof fileUrl === 'string' && (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')));
                        const uploadedAt = emp[`${doc.key}UploadedAt`];
                        const activeDocId = getOrGenerateDocId(emp, doc.key);
                        const historyList = emp[`${doc.key}History`] || [];

                        historyList.forEach((h, idx) => {
                            if (h && h.fileUrl) {
                                items.push({
                                    _id: `${emp._id}-${doc.key}-history-${idx}`,
                                    documentId: h.docId || activeDocId.replace(/R$/, ''),
                                    uploaderId: emp.employeeId || emp._id,
                                    uploaderName: emp.name || 'Unknown Employee',
                                    entityId: emp._id,
                                    docKey: doc.key,
                                    portal: 'employee',
                                    documentName: doc.label,
                                    fileUrl: h.fileUrl,
                                    uploadedAt: h.uploadedAt || emp.updatedAt || emp.createdAt,
                                    createdAt: h.uploadedAt || emp.updatedAt || emp.createdAt,
                                    status: h.status || 'Rejected',
                                    remark: h.remark || emp[`${doc.key}Remark`] || localStorage.getItem(`doc_remark_${emp._id}_${doc.key}`) || localStorage.getItem(`doc_remark_${activeDocId}`) || ''
                                });
                            }
                        });

                        if (historyList.length === 0 && activeDocId.endsWith('R') && isUploaded) {
                            items.push({
                                _id: `${emp._id}-${doc.key}-legacy-rejected`,
                                documentId: activeDocId.slice(0, -1),
                                uploaderId: emp.employeeId || emp._id,
                                uploaderName: emp.name || 'Unknown Employee',
                                entityId: emp._id,
                                docKey: doc.key,
                                portal: 'employee',
                                documentName: doc.label,
                                fileUrl: fileUrl,
                                uploadedAt: uploadedAt || emp.updatedAt || emp.createdAt,
                                createdAt: uploadedAt || emp.updatedAt || emp.createdAt,
                                status: 'Rejected',
                                remark: emp[`${doc.key}Remark`] || localStorage.getItem(`doc_remark_${emp._id}_${doc.key}`) || localStorage.getItem(`doc_remark_${activeDocId}`) || ''
                            });
                        }

                        if (isUploaded) {
                            items.push({
                                _id: `${emp._id}-${doc.key}`,
                                documentId: activeDocId,
                                uploaderId: emp.employeeId || emp._id,
                                uploaderName: emp.name || 'Unknown Employee',
                                entityId: emp._id,
                                docKey: doc.key,
                                portal: 'employee',
                                documentName: doc.label,
                                fileUrl: fileUrl,
                                uploadedAt: uploadedAt || emp.updatedAt || emp.createdAt,
                                createdAt: uploadedAt || emp.updatedAt || emp.createdAt,
                                status: getDocStatus(emp, doc.key, activeDocId),
                                remark: emp[`${doc.key}Remark`] || localStorage.getItem(`doc_remark_${emp._id}_${doc.key}`) || localStorage.getItem(`doc_remark_${activeDocId}`) || ''
                            });
                        }
                    });
                });
            }

            if (garData.success && Array.isArray(garData.data)) {
                garData.data.forEach(gar => {
                    const docDefs = [
                        { key: 'panCard', label: 'PAN CARD' },
                        { key: 'adharCard', label: 'AADHAR CARD' },
                        { key: 'voterId', label: 'VOTER CARD' },
                        { key: 'tradeLicense', label: 'TRADE LICENSE' },
                        { key: 'agreement', label: 'GARAGE AGREEMENT' },
                        { key: 'signature', label: 'SIGNATURE' },
                        { key: 'gstCert', label: 'GST CERTIFICATE' },
                    ];
                    docDefs.forEach(doc => {
                        const fileUrl = gar[doc.key];
                        const isUploaded = Boolean(fileUrl && typeof fileUrl === 'string' && (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')));
                        const uploadedAt = gar[`${doc.key}UploadedAt`];
                        const activeDocId = getOrGenerateDocId(gar, doc.key);
                        const historyList = gar[`${doc.key}History`] || [];

                        historyList.forEach((h, idx) => {
                            if (h && h.fileUrl) {
                                items.push({
                                    _id: `${gar._id}-${doc.key}-history-${idx}`,
                                    documentId: h.docId || activeDocId.replace(/R$/, ''),
                                    uploaderId: gar.garageId || gar._id,
                                    uploaderName: gar.name || 'Unknown Garage',
                                    entityId: gar._id,
                                    docKey: doc.key,
                                    portal: 'garage',
                                    documentName: doc.label,
                                    fileUrl: h.fileUrl,
                                    uploadedAt: h.uploadedAt || gar.updatedAt || gar.createdAt,
                                    createdAt: h.uploadedAt || gar.updatedAt || gar.createdAt,
                                    status: h.status || 'Rejected',
                                    remark: h.remark || gar[`${doc.key}Remark`] || localStorage.getItem(`doc_remark_${gar._id}_${doc.key}`) || localStorage.getItem(`doc_remark_${activeDocId}`) || ''
                                });
                            }
                        });

                        if (historyList.length === 0 && activeDocId.endsWith('R') && isUploaded) {
                            items.push({
                                _id: `${gar._id}-${doc.key}-legacy-rejected`,
                                documentId: activeDocId.slice(0, -1),
                                uploaderId: gar.garageId || gar._id,
                                uploaderName: gar.name || 'Unknown Garage',
                                entityId: gar._id,
                                docKey: doc.key,
                                portal: 'garage',
                                documentName: doc.label,
                                fileUrl: fileUrl,
                                uploadedAt: uploadedAt || gar.updatedAt || gar.createdAt,
                                createdAt: uploadedAt || gar.updatedAt || gar.createdAt,
                                status: 'Rejected',
                                remark: gar[`${doc.key}Remark`] || localStorage.getItem(`doc_remark_${gar._id}_${doc.key}`) || localStorage.getItem(`doc_remark_${activeDocId}`) || ''
                            });
                        }

                        if (isUploaded) {
                            items.push({
                                _id: `${gar._id}-${doc.key}`,
                                documentId: activeDocId,
                                uploaderId: gar.garageId || gar._id,
                                uploaderName: gar.name || 'Unknown Garage',
                                entityId: gar._id,
                                docKey: doc.key,
                                portal: 'garage',
                                documentName: doc.label,
                                fileUrl: fileUrl,
                                uploadedAt: uploadedAt || gar.updatedAt || gar.createdAt,
                                createdAt: uploadedAt || gar.updatedAt || gar.createdAt,
                                status: getDocStatus(gar, doc.key, activeDocId),
                                remark: gar[`${doc.key}Remark`] || localStorage.getItem(`doc_remark_${gar._id}_${doc.key}`) || localStorage.getItem(`doc_remark_${activeDocId}`) || ''
                            });
                        }
                    });
                });
            }

            setDocuments(items);
            setLastRefreshed(new Date());
        } catch (err) {
            console.error("Error fetching uploaded documents:", err);
            triggerAlert("Failed to load documents", "error");
        } finally {
            if (!silent) setLoading(false);
        }
    }, [triggerAlert]);

    useEffect(() => {
        fetchAllDocuments();
        const interval = setInterval(() => {
            fetchAllDocuments(true);
        }, 5000);
        return () => clearInterval(interval);
    }, [fetchAllDocuments]);

    const handleDownload = async (fileUrl, label) => {
        if (!fileUrl || typeof fileUrl !== 'string' || (!fileUrl.startsWith('http://') && !fileUrl.startsWith('https://'))) {
            triggerAlert("The content is not available for the specific", "error");
            return;
        }
        try {
            const response = await fetch(fileUrl);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            const ext = fileUrl.split('.').pop()?.split('?')[0] || 'pdf';
            link.download = `${label.replace(/\s+/g, '_')}.${ext}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (err) {
            window.open(fileUrl, '_blank');
        }
    };

    const handleViewDocument = (doc) => {
        if (!doc.fileUrl || !doc.fileUrl.startsWith('http')) {
            triggerAlert("The content is not available for the specific", "error");
            return;
        }
        setSelectedDoc(doc);
        setIsViewModalOpen(true);
    };

    const confirmDeleteDocument = async () => {
        if (!docToDelete) return;
        try {
            setDeleting(true);
            const endpoint = docToDelete.portal === 'employee'
                ? `https://vehicleecare.onrender.com/api/employees/${docToDelete.entityId}/document/${docToDelete.docKey}`
                : `https://vehicleecare.onrender.com/api/garages/${docToDelete.entityId}/document/${docToDelete.docKey}`;

            const res = await fetch(endpoint, { method: 'DELETE' });
            const data = await res.json();
            if (res.ok && data.success) {
                triggerAlert(`${docToDelete.documentName} deleted successfully`, 'success');
                setIsDeleteModalOpen(false);
                setDocToDelete(null);
                fetchAllDocuments(true);
            } else {
                triggerAlert(data.message || "Failed to delete document", 'error');
            }
        } catch (err) {
            console.error("Error deleting document:", err);
            triggerAlert("Network error. Failed to delete document.", 'error');
        } finally {
            setDeleting(false);
        }
    };

    const getPortalColor = (portal) => {
        switch (portal) {
            case 'employee': return 'bg-purple-100 text-purple-700';
            case 'garage':
            default: return 'bg-orange-100 text-orange-700';
        }
    };

    const getPortalLabel = (portal) => {
        switch (portal) {
            case 'employee': return 'EMPLOYEE';
            case 'garage': return 'GARAGE';
            default: return portal.toUpperCase();
        }
    };

    const handleUpdateDocumentStatus = async (doc, newStatus) => {
        try {
            if (doc.entityId) {
                localStorage.setItem(`doc_status_${doc.entityId}_${doc.docKey}`, newStatus);
            }
            if (doc.uploaderId) {
                localStorage.setItem(`doc_status_${doc.uploaderId}_${doc.docKey}`, newStatus);
            }
            if (doc.documentId) {
                localStorage.setItem(`doc_status_${doc.documentId}`, newStatus);
            }

            const endpoint = doc.portal === 'employee'
                ? `https://vehicleecare.onrender.com/api/employees/${doc.entityId}`
                : `https://vehicleecare.onrender.com/api/garages/${doc.entityId}`;

            await fetch(endpoint, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [`${doc.docKey}Status`]: newStatus })
            });

            setDocuments(prev => prev.map(d => d._id === doc._id ? { ...d, status: newStatus } : d));
            triggerAlert(`${doc.documentName} set to ${newStatus}!`, 'success');
        } catch (err) {
            console.error("Error updating document status:", err);
            triggerAlert("Failed to update status", 'error');
        }
    };

    const handleConfirmReject = async (e) => {
        if (e) e.preventDefault();
        if (!rejectingDoc || !actionRemarks.trim()) return;

        try {
            setUpdatingStatus(true);
            const doc = rejectingDoc;
            const remarkText = actionRemarks.trim();

            if (doc.entityId) {
                localStorage.setItem(`doc_status_${doc.entityId}_${doc.docKey}`, 'Rejected');
                localStorage.setItem(`doc_remark_${doc.entityId}_${doc.docKey}`, remarkText);
            }
            if (doc.uploaderId) {
                localStorage.setItem(`doc_status_${doc.uploaderId}_${doc.docKey}`, 'Rejected');
                localStorage.setItem(`doc_remark_${doc.uploaderId}_${doc.docKey}`, remarkText);
            }
            if (doc.documentId) {
                localStorage.setItem(`doc_status_${doc.documentId}`, 'Rejected');
                localStorage.setItem(`doc_remark_${doc.documentId}`, remarkText);
            }

            const endpoint = doc.portal === 'employee'
                ? `https://vehicleecare.onrender.com/api/employees/${doc.entityId}`
                : `https://vehicleecare.onrender.com/api/garages/${doc.entityId}`;

            await fetch(endpoint, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    [`${doc.docKey}Status`]: 'Rejected',
                    [`${doc.docKey}Remark`]: remarkText
                })
            });

            setDocuments(prev => prev.map(d => d._id === doc._id ? { ...d, status: 'Rejected', remark: remarkText } : d));
            triggerAlert(`${doc.documentName} set to Rejected!`, 'success');
            setIsRejectModalOpen(false);
            setRejectingDoc(null);
            setActionRemarks('');
        } catch (err) {
            console.error("Error rejecting document:", err);
            triggerAlert("Failed to reject document", 'error');
        } finally {
            setUpdatingStatus(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Approved':
            case 'Verified': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'Rejected': return 'bg-rose-100 text-rose-800 border-rose-200';
            case 'Uploaded': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'Pending':
            default: return 'bg-amber-100 text-amber-800 border-amber-200';
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return '—';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '—';
        const day = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        const time = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
        return `${day}, ${time.toLowerCase()}`;
    };

    const filteredDocuments = React.useMemo(() => {
        return documents.filter(doc => {
            if (filterPortal !== 'all' && doc.portal.toLowerCase() !== filterPortal.toLowerCase()) {
                return false;
            }
            if (filterStatus !== 'all' && doc.status.toLowerCase() !== filterStatus.toLowerCase()) {
                return false;
            }
            if (labelFilter !== 'all') {
                const label = rowLabels[doc._id];
                if (!label || label.toUpperCase() !== labelFilter.toUpperCase()) {
                    return false;
                }
            }
            if (timeRange !== 'all') {
                const itemDate = doc.uploadedAt ? new Date(doc.uploadedAt) : null;
                if (itemDate && !isNaN(itemDate.getTime())) {
                    const now = new Date();
                    const diffDays = Math.ceil(Math.abs(now - itemDate) / (1000 * 60 * 60 * 24));
                    if (timeRange === 'week' && diffDays > 7) return false;
                    if (timeRange === 'month' && diffDays > 30) return false;
                }
            }
            return true;
        }).sort((a, b) => {
            const dateA = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
            const dateB = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
            if (dateA !== dateB && dateA > 0 && dateB > 0) {
                return sortOrder === 'latest' ? dateB - dateA : dateA - dateB;
            }
            const idA = String(a.uploaderId || a._id);
            const idB = String(b.uploaderId || b._id);
            return sortOrder === 'latest' ? idB.localeCompare(idA) : idA.localeCompare(idB);
        });
    }, [documents, filterPortal, filterStatus, labelFilter, timeRange, sortOrder, rowLabels]);

    useEffect(() => {
        setResultsCount(filteredDocuments.length);
    }, [filteredDocuments.length, setResultsCount]);

    return (
        <div className={`space-y-4 max-w-[97.5rem] mx-auto flex flex-col ${isModal ? 'h-full overflow-hidden' : 'h-[calc(100vh-9.25rem)]'}`}>
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold uppercase text-[#011023] tracking-tight flex items-center gap-2">
                    Document verification
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

            {/* Main Table */}
            <div className="bg-white border border-[#e9f2fb] rounded-2xl shadow-[0_1px_2.5px_0_rgba(0,0,0,0.07)] flex-1 min-h-0 overflow-hidden flex flex-col">
                <div className="overflow-x-hidden overflow-y-auto text-center flex-1 relative hide-scrollbar">
                    <table className="w-full text-center border-collapse table-fixed">
                        <thead className="sticky top-0 z-20 shadow-sm bg-[#f0f6ff]">
                            <tr className="bg-[#f0f6ff] text-[15px] uppercase tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                <th className="p-4 font-bold text-center w-[10%]">Document ID</th>
                                <th className="p-4 font-bold text-center w-[11%]">Uploader ID</th>
                                <th className="p-4 font-bold text-center w-[18%]">Uploader Name</th>
                                <th className="p-4 font-bold text-center w-[10%]">Portal</th>
                                <th className="p-4 font-bold text-center w-[20%]">Document Name</th>
                                <th className="p-4 font-bold text-center w-[16%]">Date and Time</th>
                                <th className="p-4 font-bold text-center w-[8%]">Status</th>
                                <th className="p-4 font-bold text-center w-[9%]">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-[13px] divide-[#e6f0fa] uppercase font-semibold text-gray-700">
                            {loading && documents.length === 0 ? (
                                <TableSkeleton rows={15} cols={8} />
                            ) : filteredDocuments.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-gray-400 font-bold">No uploaded documents found.</td>
                                </tr>
                            ) : (
                                filteredDocuments.map((doc) => {
                                    const rowId = doc._id;
                                    return (
                                        <tr 
                                            key={doc._id} 
                                            id={`row-${rowId}`}
                                            data-row-id={doc._id}
                                            data-doc-id={doc.documentId}
                                            data-document-id={doc.documentId}
                                            onClick={(e) => {
                                                if (isLabelMode) {
                                                    e.stopPropagation();
                                                    setActiveLabelRowId(prev => prev === doc._id ? null : doc._id);
                                                }
                                            }}
                                            className={`transition-all duration-1000 border-b border-[#e6f0fa] group ${
                                                isLabelMode ? 'cursor-pointer hover:bg-blue-50/60' : 'hover:bg-white/50'
                                            } ${(highlightedRow && (
                                                String(highlightedRow).toLowerCase() === String(doc._id).toLowerCase() ||
                                                String(highlightedRow).toLowerCase() === String(doc.documentId || '').toLowerCase() ||
                                                String(highlightedRow).toLowerCase() === String(doc.documentName || '').toLowerCase()
                                            )) ? 'bg-emerald-100/60 rounded-2xl relative z-10 scale-[1.01]' : ''}`}
                                        >
                                            {/* Document ID */}
                                            <td className="p-4 font-semibold text-[#052558] text-sm text-center relative w-[11%]">
                                                <div className="relative flex items-center justify-center w-full">
                                                    {Boolean(rowLabels[doc._id]) && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActiveLabelRowId(prev => prev === doc._id ? null : doc._id);
                                                            }}
                                                            className="absolute -left-1.5 top-1/2 -translate-y-1/2 cursor-pointer hover:scale-115 transition-transform active:scale-95 p-0.5 z-10"
                                                            title={`Label: ${stripEmoji(rowLabels[doc._id] || 'Add label')}`}
                                                        >
                                                            {renderLabelIcon(rowLabels[doc._id], 16)}
                                                        </button>
                                                    )}

                                                    {activeLabelRowId === doc._id && (
                                                        <FloatingLabelSelector 
                                                            rowId={doc._id}
                                                            currentLabel={rowLabels[doc._id]}
                                                            onSaveLabel={handleSaveRowLabel}
                                                            labelPopupRef={labelPopupRef}
                                                            topClass='-top-8.5'
                                                            positionClass="-left-4"
                                                        />
                                                    )}
                                                    <span>{doc.documentId}</span>
                                                </div>
                                            </td>

                                            {/* Uploader ID */}
                                            <td className="p-4 font-semibold text-[#052558] text-sm text-center w-[11%]">
                                                <span>{String(doc.uploaderId).toUpperCase()}</span>
                                            </td>

                                            {/* Uploader Name */}
                                            <td className="p-4 text-center font-semibold text-[#011023] truncate max-w-[200px] uppercase">
                                                {doc.uploaderName}
                                            </td>

                                            {/* Portal */}
                                            <td className="p-4 text-center w-[12%]">
                                                <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full uppercase ${getPortalColor(doc.portal)}`}>
                                                    {getPortalLabel(doc.portal)}
                                                </span>
                                            </td>

                                            {/* Document Name */}
                                            <td className="p-4 text-center font-semibold text-[#011023] truncate max-w-[220px] uppercase">
                                                {doc.documentName}
                                            </td>

                                            {/* Date and Time */}
                                            <td className="p-4 text-center whitespace-nowrap text-sm text-gray-800 font-semibold">
                                                {doc.uploadedAt ? (
                                                    <div className="flex items-center justify-center w-full">
                                                        <span className="flex-1 text-right">{new Date(doc.uploadedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                        <span className="px-1.5 text-gray-700">|</span>
                                                        <span className="flex-1 text-left">{new Date(doc.uploadedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 font-semibold">—</span>
                                                )}
                                            </td>

                                            {/* Status */}
                                            <td className="p-4 text-center">
                                                <span className={`inline-block px-3 py-1 text-xs text-center font-semibold rounded-full border border-transparent uppercase ${getStatusColor(doc.status)}`}>
                                                    {doc.status}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="p-4 text-center relative" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-center pl-2 gap-4">
                                                    <button
                                                        onClick={() => handleViewDocument(doc)}
                                                        className="text-gray-400 hover:text-blue-500 cursor-pointer transition-colors flex items-center justify-center"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDownload(doc.fileUrl, doc.documentName)}
                                                        className="text-gray-400 hover:text-emerald-500 cursor-pointer transition-colors flex items-center justify-center"
                                                    >
                                                        <Download size={18} />
                                                    </button>

                                                    {doc.status === 'Pending' ? (
                                                        /* 3-Dots Action Button & Dropdown */
                                                        <div className="relative inline-flex items-center justify-center doc-action-menu">
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setOpenMenuId(prev => prev === doc._id ? null : doc._id);
                                                                }}
                                                                className={`flex items-center justify-center transition-colors cursor-pointer ${
                                                                    openMenuId === doc._id
                                                                        ? 'text-blue-600'
                                                                        : 'text-gray-400 hover:text-gray-700'
                                                                }`}
                                                            >
                                                                <MoreVertical size={18} />
                                                            </button>

                                                            {/* Popover Menu with Check ✓ (Up) and Cross ✕ (Down) just above 3-dots */}
                                                            {openMenuId === doc._id && (
                                                                <div className="absolute left-1/2 -translate-x-1/2 z-50 bg-white border border-slate-200/90 rounded-2xl p-1 flex flex-col items-center gap-1 justify-center animate-in fade-in zoom-in-95 duration-150">
                                                                    {/* Check ✓ (Up - Approve) */}
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setOpenMenuId(null);
                                                                            handleUpdateDocumentStatus(doc, 'Approved');
                                                                        }}
                                                                        className="text-slate-500 hover:text-emerald-600 cursor-pointer flex items-center justify-center transition-colors p-1 hover:bg-emerald-50 rounded-2xl"
                                                                    >
                                                                        <Check size={18} className="stroke-[2]" />
                                                                    </button>

                                                                    {/* Cross ✕ (Down - Reject) */}
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setOpenMenuId(null);
                                                                            setRejectingDoc(doc);
                                                                            setActionRemarks('');
                                                                            setIsRejectModalOpen(true);
                                                                        }}
                                                                        className="text-slate-500 hover:text-rose-600 cursor-pointer flex items-center justify-center transition-colors p-1 hover:bg-rose-50 rounded-2xl"
                                                                    >
                                                                        <X size={18} className="stroke-[2]" />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleViewDocument(doc);
                                                            }}
                                                            className="text-gray-400 hover:text-blue-500 cursor-pointer transition-colors flex items-center justify-center"
                                                            title="View Remark / Details"
                                                        >
                                                            <MessageSquare size={18} />
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

            {/* View Document Modal (Matching Remark.jsx UI) */}
            {isViewModalOpen && selectedDoc && createPortal(
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#011023]/10 backdrop-blur-sm"
                    onClick={() => {
                        setIsViewModalOpen(false);
                        setSelectedDoc(null);
                    }}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-6 flex justify-between items-center bg-gradient-to-r from-blue-50/50 to-white">
                            <div>
                                <h3 className="text-xl uppercase font-bold text-[#052558]">Document Details</h3>
                                <p className="text-sm text-gray-500 uppercase mt-1">
                                    ID: <span className="font-semibold text-gray-700">{selectedDoc.documentId || '—'}</span>
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setIsViewModalOpen(false);
                                    setSelectedDoc(null);
                                }}
                                className="text-gray-400 hover:text-gray-600 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="px-6 pb-5 overflow-y-auto flex-1">
                            {selectedDoc.remark && (
                                <div className="text-left bg-rose-50/100 rounded-xl px-3 py-1.5 mb-4 flex items-center gap-2.5">
                                    <span className="text-[13.5px] font-semibold text-rose-500 uppercase shrink-0">Rejection Remark</span>
                                    <span className="text-rose-500 font-semibold">|</span>
                                    <p className="text-[13.5px] font-semibold uppercase text-rose-500 truncate">
                                        {selectedDoc.remark}
                                    </p>
                                </div>
                            )}

                            {/* Content Preview */}
                            <div className="text-left">
                                <div className="w-full h-[500px] p-3 flex flex-col items-center justify-center bg-slate-50/80 rounded-2xl border border-slate-200/80 overflow-hidden">
                                    {selectedDoc.fileUrl && selectedDoc.fileUrl.match(/\.(jpg|jpeg|png|webp|gif)($|\?)/i) ? (
                                        <img
                                            src={selectedDoc.fileUrl}
                                            alt={selectedDoc.documentName}
                                            className="w-full h-full object-contain rounded-xl shadow-sm border border-slate-200"
                                        />
                                    ) : selectedDoc.fileUrl && selectedDoc.fileUrl.includes('cloudinary.com') ? (
                                        <img
                                            src={selectedDoc.fileUrl.replace(/\.pdf($|\?)/i, '.jpg')}
                                            alt={selectedDoc.documentName}
                                            className="w-full h-full object-contain rounded-xl shadow-sm border border-slate-200"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                const fallback = document.getElementById(`pdf-iframe-${selectedDoc.documentId}`);
                                                if (fallback) fallback.style.display = 'block';
                                            }}
                                        />
                                    ) : (
                                        <iframe
                                            id={`pdf-iframe-${selectedDoc.documentId}`}
                                            src={`https://docs.google.com/gview?url=${encodeURIComponent(selectedDoc.fileUrl)}&embedded=true`}
                                            title={selectedDoc.documentName}
                                            className="w-full h-full rounded-xl border border-slate-200 bg-white"
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && docToDelete && createPortal(
                <div 
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#011023]/10 backdrop-blur-sm transition-all duration-300"
                    onClick={() => { setIsDeleteModalOpen(false); setDocToDelete(null); }}
                >
                    <div 
                        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-8 text-center uppercase space-y-4">
                            <h3 className="text-2xl font-bold text-[#011023] uppercase tracking-tighter mb-9">Delete Document</h3>
                            <p className="text-[13px] text-gray-500 font-medium leading-relaxed">
                                This will permanently remove <span className="text-[#052558] font-bold uppercase">{docToDelete.documentName}</span> for <span className="text-[#052558] font-bold uppercase">{docToDelete.uploaderName}</span> ({docToDelete.uploaderId}). <br/>
                                This action <span className="text-rose-600 font-bold uppercase">cannot be undone</span>.
                            </p>
                        </div>
                        <div className="p-2 bg-gray-50/80 border-t border-gray-100 grid grid-cols-2 gap-3 pb-8 px-8">
                            <button 
                                onClick={() => { setIsDeleteModalOpen(false); setDocToDelete(null); }}
                                className="px-4 py-3.5 bg-white border border-gray-200 text-gray-400 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-white hover:text-gray-600 transition-all shadow-sm active:scale-95 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmDeleteDocument}
                                disabled={deleting}
                                className="px-4 py-3.5 bg-rose-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
                            >
                                {deleting ? <Loader2 size={16} className="animate-spin" /> : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Rejection Modal matching Leave.jsx design */}
            {isRejectModalOpen && rejectingDoc && createPortal(
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#052558]/10 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => !updatingStatus && setIsRejectModalOpen(false)} />
                    
                    <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-white overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Header */}
                        <div className="px-7 py-5 bg-slate-50 border-b border-slate-100 flex items-center justify-center relative">
                            <h3 className="text-xl font-bold text-[#011023] uppercase tracking-wider">
                                Reject Document
                            </h3>
                            <button 
                                type="button"
                                onClick={() => setIsRejectModalOpen(false)}
                                className="absolute right-7 p-2 text-slate-400 rounded-xl transition-colors hover:bg-slate-200 hover:text-slate-600"
                                disabled={updatingStatus}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleConfirmReject}>
                            {/* Body */}
                            <div className="p-8 space-y-4">
                                <div className="bg-slate-50/50 border border-slate-100 p-3 rounded-2xl">
                                    <p className="text-sm uppercase font-medium text-justify text-slate-700 leading-relaxed">
                                        Please provide a reason to <span className="font-bold text-[#011023]">reject</span> this document request ({rejectingDoc.documentName} - {rejectingDoc.documentId}). This reason will be shared with the {rejectingDoc.portal} so they can re-upload the correct document.
                                    </p>
                                </div>

                                <div className="flex gap-2.5 text-left">
                                    <div className="w-full">
                                        <textarea 
                                            rows={4}
                                            required
                                            className="w-full bg-white border border-gray-200 rounded-xl py-2 px-4 text-[13px] font-semibold uppercase text-[#011023] outline-none transition-all shadow-sm focus:border-rose-200 resize-none"
                                            value={actionRemarks}
                                            onChange={e => setActionRemarks(e.target.value)}
                                            disabled={updatingStatus}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-8 pb-6 pt-1 bg-gray-50/50 border-t border-gray-100 flex gap-4">
                                <button 
                                    type="submit"
                                    disabled={updatingStatus || !actionRemarks.trim()}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg disabled:opacity-50 disabled:shadow-none bg-rose-600 cursor-pointer shadow-rose-200/50"
                                >
                                    {updatingStatus ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        'Confirm Action'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default UploadDocuments;
