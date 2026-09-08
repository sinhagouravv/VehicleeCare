import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, Loader2, UploadCloud, Eye, Download, MessageSquare, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAlert } from '../context/AlertContext';

const UploadDocuments = () => {
    const getInitialGarage = () => {
        try {
            const storedUser = localStorage.getItem('garageUser');
            return storedUser ? JSON.parse(storedUser) : {};
        } catch (err) {
            return {};
        }
    };

    const [garage, setGarage] = useState(getInitialGarage);
    const [uploadingKey, setUploadingKey] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedDocKey, setSelectedDocKey] = useState(null);

    const [isRemarkModalOpen, setIsRemarkModalOpen] = useState(false);
    const [remarkDoc, setRemarkDoc] = useState(null);

    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState(null);

    const { triggerAlert } = useAlert();
    const navigate = useNavigate();
    const fileInputRefs = useRef({});

    const documentTypes = [
        { key: 'panCard', label: 'PAN CARD', subtext: 'KINDLY UPLOAD THE CLEAR IMAGE OF THE DOCUMENT' },
        { key: 'signature', label: 'SIGNATURE', subtext: 'KINDLY UPLOAD THE CLEAR IMAGE OF THE SIGNATURE' },
        { key: 'voterId', label: 'VOTER CARD', subtext: 'KINDLY UPLOAD THE CLEAR IMAGE OF THE DOCUMENT' },
        { key: 'adharCard', label: 'AADHAR CARD', subtext: 'KINDLY UPLOAD THE CLEAR IMAGE OF THE DOCUMENT' },
        { key: 'tradeLicense', label: 'TRADE LICENSE', subtext: 'KINDLY UPLOAD THE CLEAR IMAGE OF THE DOCUMENT' },
        { key: 'gstCert', label: 'GST CERTIFICATE', subtext: 'KINDLY UPLOAD THE CLEAR IMAGE OF THE DOCUMENT' },
        { key: 'agreement', label: 'GARAGE AGREEMENT', subtext: 'KINDLY UPLOAD THE CLEAR IMAGE OF THE DOCUMENT' },
    ];

    const fetchProfile = async () => {
        try {
            const storedUser = localStorage.getItem('garageUser');
            if (!storedUser) {
                navigate('/login');
                return;
            }
            const user = JSON.parse(storedUser);
            const garageId = user._id || user.id || user.garageId;
            const res = await fetch(`https://vehicleecare.onrender.com/api/garages/${garageId}`);
            if (res.ok) {
                const data = await res.json();
                setGarage(data.data);
                const updatedUser = {
                    ...user,
                    ...data.data,
                    id: data.data.garageId || user.id
                };
                localStorage.setItem('garageUser', JSON.stringify(updatedUser));
            } else {
                setGarage(user);
            }
        } catch (err) {
            console.error("Failed to fetch garage", err);
        }
    };

    const getOrGenerateDocId = (garageObj, docKey) => {
        if (garageObj[`${docKey}DocId`]) {
            return garageObj[`${docKey}DocId`].toUpperCase();
        }
        let hash = 0;
        const str = `${garageObj._id || garageObj.id || ''}-${docKey}`;
        for (let i = 0; i < str.length; i++) {
            hash = (hash * 31 + str.charCodeAt(i)) % 9000000;
        }
        const num = 1000000 + Math.abs(hash);
        const baseId = `D${num}`;
        const wasReuploaded = localStorage.getItem(`doc_reuploaded_${garageObj._id || garageObj.id}_${docKey}`) === 'true';
        return wasReuploaded ? `${baseId}R` : baseId;
    };

    useEffect(() => {
        fetchProfile();
        const interval = setInterval(fetchProfile, 5000);
        return () => clearInterval(interval);
    }, [navigate]);

    const handleFileUpload = async (docKey, file) => {
        if (!file) return;
        setUploadingKey(docKey);

        try {
            const garageId = garage._id || garage.id || garage.garageId;
            const currentSt = (localStorage.getItem(`doc_status_${garageId}_${docKey}`) || garage[`${docKey}Status`] || '').toUpperCase();
            if (currentSt === 'REJECTED') {
                localStorage.setItem(`doc_reuploaded_${garageId}_${docKey}`, 'true');
            }

            const formData = new FormData();
            formData.append('document', file);
            formData.append('documentType', docKey);

            const res = await fetch(`https://vehicleecare.onrender.com/api/garages/${garageId}/document`, {
                method: 'POST',
                body: formData
            });

            let data;
            const contentType = res.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await res.json();
            } else {
                const text = await res.text();
                throw new Error(`Server status ${res.status}: ${text || 'Upload failed'}`);
            }

            if (res.ok && data.success) {
                triggerAlert(`${documentTypes.find(d => d.key === docKey)?.label} uploaded successfully!`, 'success');
                setGarage(data.data);
                const docId = getOrGenerateDocId(garage, docKey);
                if (garage._id) localStorage.removeItem(`doc_status_${garage._id}_${docKey}`);
                if (garage.id) localStorage.removeItem(`doc_status_${garage.id}_${docKey}`);
                if (garage.garageId) localStorage.removeItem(`doc_status_${garage.garageId}_${docKey}`);
                localStorage.removeItem(`doc_status_${docId}`);
                const currentUser = JSON.parse(localStorage.getItem('garageUser') || '{}');
                const updatedUser = {
                    ...currentUser,
                    ...data.data,
                    id: data.data.garageId || currentUser.id
                };
                localStorage.setItem('garageUser', JSON.stringify(updatedUser));
            } else {
                triggerAlert(data.message || "Failed to upload document.", 'error');
            }
        } catch (err) {
            console.error("Upload error", err);
            triggerAlert(err.message || "Network error. Please verify server connection.", 'error');
        } finally {
            setUploadingKey(null);
        }
    };

    const handleDeleteDocument = async (docKey) => {
        setUploadingKey(docKey);

        try {
            const garageId = garage._id || garage.id || garage.garageId;
            const res = await fetch(`https://vehicleecare.onrender.com/api/garages/${garageId}/document/${docKey}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                const data = await res.json();
                setGarage(data.data || data);
                triggerAlert('Document removed successfully', 'success');
            } else {
                triggerAlert('Failed to remove document', 'error');
            }
        } catch (err) {
            console.error("Delete error", err);
            triggerAlert("Failed to delete document.", 'error');
        } finally {
            setUploadingKey(null);
        }
    };

    const confirmDelete = async () => {
        if (!selectedDocKey) return;
        await handleDeleteDocument(selectedDocKey);
        setIsDeleteModalOpen(false);
        setSelectedDocKey(null);
    };

    const handleDownloadDocument = async (url, label) => {
        if (!url || typeof url !== 'string' || (!url.startsWith('http://') && !url.startsWith('https://'))) {
            triggerAlert("The content is not available for the specific", "error");
            return;
        }
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            const ext = url.split('.').pop()?.split('?')[0] || 'pdf';
            link.download = `${label.replace(/\s+/g, '_')}.${ext}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (err) {
            window.open(url, '_blank');
        }
    };

    const formatDateWithTime = (dateInput) => {
        if (!dateInput) return '—';
        const d = new Date(dateInput);
        if (isNaN(d.getTime())) return '—';
        const dayMonthYear = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
        const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).toUpperCase();
        return (
            <span className="font-semibold text-[#011023] text-sm whitespace-nowrap">
                <span>{dayMonthYear}</span>
                <span className="text-gray-800 mx-1.5">|</span>
                <span>{timeStr}</span>
            </span>
        );
    };

    return (
        <div className="space-y-2 max-w-full mx-auto animate-in fade-in duration-500">
            {/* Document Verification Table */}
            <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-3xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden">
                <table className="w-full text-center border-collapse table-fixed">
                    <thead className="sticky top-0 z-10 shadow-sm">
                        <tr className="bg-[#f2f7ff] text-sm uppercase tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                            <th className="p-4 font-bold text-center w-[18%]">Document ID</th>
                            <th className="p-4 font-bold text-center w-[25%]">Document Name</th>
                            <th className="p-4 font-bold text-center w-[27%]">Uploaded at</th>
                            <th className="p-4 font-bold text-center w-[15%]">Status</th>
                            <th className="p-4 font-bold text-center w-[13%]">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e6f0fa] uppercase text-[12px]">
                        {documentTypes.map((doc) => {
                            const fileUrl = garage[doc.key];
                            const isUploaded = Boolean(fileUrl && typeof fileUrl === 'string' && (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')));
                            const uploadedAt = garage[`${doc.key}UploadedAt`];

                            const docId = getOrGenerateDocId(garage, doc.key);
                            const backendStatus = garage[`${doc.key}Status`];
                            const storedStatus = localStorage.getItem(`doc_status_${garage._id}_${doc.key}`) ||
                                                 localStorage.getItem(`doc_status_${garage.id}_${doc.key}`) ||
                                                 localStorage.getItem(`doc_status_${garage.garageId}_${doc.key}`) ||
                                                 localStorage.getItem(`doc_status_${docId}`);
                            const docStatus = (backendStatus || storedStatus || 'Pending').toUpperCase();

                            return (
                                <tr key={doc.key} className="hover:bg-blue-50/30 transition-colors">
                                    {/* Document ID */}
                                    <td className="p-3 font-semibold text-[#052558] text-[13.5px] text-center uppercase whitespace-nowrap">
                                        {isUploaded ? docId : '—'}
                                    </td>

                                    {/* Document Name */}
                                    <td className="p-3 font-semibold text-[#011023] text-[13.5px] text-center uppercase whitespace-nowrap">
                                        {doc.label}
                                    </td>

                                    {/* Date Uploaded */}
                                    <td className="p-3 text-center">
                                        {isUploaded ? (
                                            formatDateWithTime(uploadedAt)
                                        ) : (
                                            <span className="text-gray-400 text-[13.5px] font-semibold">—</span>
                                        )}
                                    </td>

                                    {/* Status */}
                                    <td className="p-3.75 text-center">
                                        {!isUploaded ? (
                                            <span className="px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border bg-amber-100 text-amber-700 border-amber-200">
                                                PENDING
                                            </span>
                                        ) : (docStatus === 'APPROVED' || docStatus === 'VERIFIED') ? (
                                            <span className="px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border bg-emerald-100 text-emerald-700 border-emerald-200">
                                                APPROVED
                                            </span>
                                        ) : docStatus === 'REJECTED' ? (
                                            <span className="px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border bg-rose-100 text-rose-700 border-rose-200">
                                                REJECTED
                                            </span>
                                        ) : (
                                            <span className="px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border bg-blue-100 text-blue-700 border-blue-200">
                                                UPLOADED
                                            </span>
                                        )}
                                    </td>

                                    {/* Actions */}
                                    <td className="p-3.75 text-center">
                                        {/* Hidden File Input */}
                                        <input
                                            type="file"
                                            accept=".jpg,.jpeg,.png,.pdf"
                                            className="hidden"
                                            ref={(el) => (fileInputRefs.current[doc.key] = el)}
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    handleFileUpload(doc.key, e.target.files[0]);
                                                }
                                            }}
                                        />

                                        <div className="flex items-center justify-center gap-4.5">
                                            {isUploaded ? (
                                                <>
                                                     <button
                                                         type="button"
                                                         onClick={() => {
                                                             setSelectedDoc({
                                                                 documentId: docId,
                                                                 documentName: doc.label,
                                                                 fileUrl: fileUrl,
                                                                 remark: garage[`${doc.key}Remark`] || localStorage.getItem(`doc_remark_${docId}`) || ''
                                                             });
                                                             setIsViewModalOpen(true);
                                                         }}
                                                         className="text-gray-400 hover:text-blue-500 transition-colors cursor-pointer flex items-center justify-center"
                                                         title="View Document"
                                                     >
                                                         <Eye size={18} />
                                                     </button>

                                                     {docStatus === 'REJECTED' && (() => {
                                                         const isFinalAttempt = Boolean(docId && String(docId).trim().toUpperCase().endsWith('R'));
                                                         return (
                                                             <button
                                                                 type="button"
                                                                 onClick={() => {
                                                                     if (isFinalAttempt) return;
                                                                     fileInputRefs.current[doc.key]?.click();
                                                                 }}
                                                                 disabled={uploadingKey === doc.key || isFinalAttempt}
                                                                 className={`transition-colors flex items-center justify-center ${
                                                                     isFinalAttempt 
                                                                         ? 'text-gray-300 cursor-not-allowed opacity-50' 
                                                                         : 'text-gray-400 hover:text-emerald-500 cursor-pointer'
                                                                 }`}
                                                                 title={isFinalAttempt ? 'Final attempt reached. Cannot re-upload.' : 'Re-upload Document'}
                                                             >
                                                                 {uploadingKey === doc.key ? (
                                                                     <Loader2 size={18} className="animate-spin text-emerald-500" />
                                                                 ) : (
                                                                     <UploadCloud size={18} />
                                                                 )}
                                                             </button>
                                                         );
                                                     })()}

                                                    {(docStatus === 'APPROVED' || docStatus === 'VERIFIED') && (
                                                        <button
                                                            type="button"
                                                            onClick={() => triggerAlert("Document is approved. No remarks.", "info")}
                                                            className="text-gray-400 hover:text-emerald-500 transition-colors cursor-pointer flex items-center justify-center"
                                                        >
                                                            <MessageSquare size={18} />
                                                        </button>
                                                    )}

                                                    {(docStatus === 'UPLOADED' || (docStatus !== 'REJECTED' && docStatus !== 'APPROVED' && docStatus !== 'VERIFIED')) && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedDocKey(doc.key);
                                                                setIsDeleteModalOpen(true);
                                                            }}
                                                            disabled={uploadingKey === doc.key}
                                                            className="text-gray-400 hover:text-rose-500 transition-colors cursor-pointer flex items-center justify-center"
                                                        >
                                                            {uploadingKey === doc.key ? (
                                                                <Loader2 size={18} className="animate-spin text-rose-500" />
                                                            ) : (
                                                                <Trash2 size={18} />
                                                            )}
                                                        </button>
                                                    )}
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDownloadDocument(fileUrl, doc.label)}
                                                        className="text-gray-400 hover:text-blue-500 transition-colors cursor-pointer flex items-center justify-center"
                                                    >
                                                        <Download size={18} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => fileInputRefs.current[doc.key]?.click()}
                                                        disabled={uploadingKey === doc.key}
                                                        className="text-gray-400 hover:text-emerald-500 transition-colors cursor-pointer flex items-center justify-center"
                                                    >
                                                        {uploadingKey === doc.key ? (
                                                            <Loader2 size={18} className="animate-spin text-emerald-500" />
                                                        ) : (
                                                            <UploadCloud size={18} />
                                                        )}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && selectedDocKey && createPortal(
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#011023]/10 backdrop-blur-sm transition-all duration-300"
                    onClick={() => {
                        setIsDeleteModalOpen(false);
                        setSelectedDocKey(null);
                    }}
                >
                    <div 
                        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-8 text-center uppercase space-y-4">
                            <h3 className="text-2xl font-bold text-[#011023] uppercase tracking-tighter mb-9">Delete Document</h3>
                            <p className="text-[13px] text-gray-500 font-medium leading-relaxed">
                                This will permanently remove the document. <br/>
                                This action <span className="text-rose-600 font-bold uppercase">cannot be undone</span>.
                            </p>
                        </div>
                        <div className="p-2 bg-gray-50/80 border-t border-gray-100 grid grid-cols-2 gap-3 pb-8 px-8">
                            <button 
                                onClick={() => {
                                    setIsDeleteModalOpen(false);
                                    setSelectedDocKey(null);
                                }}
                                className="px-4 py-3 bg-white border border-gray-200 text-gray-400 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-gray-600 transition-all shadow-sm active:scale-95 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmDelete}
                                disabled={uploadingKey === selectedDocKey}
                                className="px-4 py-3 bg-rose-600 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-rose-700 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50"
                            >
                                {uploadingKey === selectedDocKey ? <Loader2 size={16} className="animate-spin" /> : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Rejection Reason Modal */}
            {isRemarkModalOpen && remarkDoc && createPortal(
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#052558]/10 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsRemarkModalOpen(false)} />
                    <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-white overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="px-7 py-5 bg-slate-50 border-b border-slate-100 flex items-center justify-center relative">
                            <h3 className="text-xl font-bold text-[#011023] uppercase tracking-wider">
                                {remarkDoc.label} - Rejection Reason
                            </h3>
                            <button 
                                type="button"
                                onClick={() => setIsRemarkModalOpen(false)}
                                className="absolute right-7 p-2 text-slate-400 rounded-xl transition-colors hover:bg-slate-200 hover:text-slate-600"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-8 space-y-4">
                            <div className="bg-rose-50/50 border border-rose-100 p-4 rounded-2xl">
                                <label className="text-[11px] font-bold text-rose-500 uppercase tracking-widest block mb-1">Reason provided by Admin</label>
                                <p className="text-sm font-semibold uppercase text-slate-800 leading-relaxed">
                                    "{remarkDoc.remark}"
                                </p>
                            </div>
                        </div>
                        <div className="px-8 pb-6 pt-1 bg-gray-50/50 border-t border-gray-100">
                            <button 
                                type="button"
                                onClick={() => setIsRemarkModalOpen(false)}
                                className="w-full px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* View Document Modal (Matching Admin UI) */}
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
                        <div className="px-6 py-5 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl uppercase font-bold text-[#052558]">Document Details</h3>
                                <p className="text-sm text-gray-500 uppercase mt-1">
                                    ID: <span className="font-semibold text-gray-700">{selectedDoc.documentId || '—'}</span>
                                </p>
                            </div>
                            <button
                                type="button"
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
                        <div className="px-6 py-5 overflow-y-auto flex-1">
                            {/* Remark Note (If Rejection Reason exists) */}
                            {selectedDoc.remark && (
                                <div className="text-left bg-rose-50/100 rounded-xl px-3 py-1.5 flex items-center gap-2.5">
                                    <span className="text-[13.5px] font-semibold text-rose-500 uppercase shrink-0">Rejection Remark</span>
                                    <span className="text-rose-500 font-semibold">|</span>
                                    <p className="text-[13.5px] font-semibold uppercase text-rose-500 truncate">
                                        {selectedDoc.remark}
                                    </p>
                                </div>
                            )}

                            {/* Content Preview */}
                            <div className="text-left mt-3">
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
                                                const fallback = document.getElementById(`pdf-iframe-gar-${selectedDoc.documentId}`);
                                                if (fallback) fallback.style.display = 'block';
                                            }}
                                        />
                                    ) : (
                                        <iframe
                                            id={`pdf-iframe-gar-${selectedDoc.documentId}`}
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
        </div>
    );
};

export default UploadDocuments;
