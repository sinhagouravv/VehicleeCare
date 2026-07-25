import React, { useState, useEffect } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, FileText, Loader2, Eye, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FormSkeleton } from '../components/Skeleton';

const UploadDocuments = () => {
    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedDocType, setSelectedDocType] = useState('adharCard');
    const [selectedFile, setSelectedFile] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const navigate = useNavigate();

    const fetchProfile = async () => {
        try {
            const storedUser = localStorage.getItem('employeeUser');
            if (!storedUser) {
                navigate('/login');
                return;
            }
            const user = JSON.parse(storedUser);
            const res = await fetch(`http://localhost:5001/api/employees/${user._id || user.id}`);
            if (res.ok) {
                const data = await res.json();
                setEmployee(data.data);
                const updatedUser = {
                    ...user,
                    ...data.data,
                    id: data.data.employeeId || user.id
                };
                localStorage.setItem('employeeUser', JSON.stringify(updatedUser)); // keep in sync
            } else {
                setEmployee(user);
            }
        } catch (err) {
            console.error("Failed to fetch employee", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, [navigate]);

    const documentTypes = [
        { key: 'adharCard', label: 'Aadhaar Card' },
        { key: 'voterId', label: 'Voter ID' },
        { key: 'panCard', label: 'PAN Card' },
        { key: 'drivingLicense', label: 'Driving License' },
        { key: 'agreement', label: 'Employment Agreement' },
        { key: 'signature', label: 'Signature Template' }
    ];

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setSelectedFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleUploadSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!selectedFile) {
            setError("Please select a file to upload.");
            return;
        }

        setUploading(true);

        try {
            const empId = employee._id || employee.id;
            const formData = new FormData();
            formData.append('document', selectedFile);
            formData.append('documentType', selectedDocType);

            const res = await fetch(`http://localhost:5001/api/employees/${empId}/document`, {
                method: 'POST',
                body: formData
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setSuccess(`${documentTypes.find(d => d.key === selectedDocType)?.label} uploaded successfully!`);
                setSelectedFile(null);
                setEmployee(data.data);
                const currentUser = JSON.parse(localStorage.getItem('employeeUser') || '{}');
                const updatedUser = {
                    ...currentUser,
                    ...data.data,
                    id: data.data.employeeId || currentUser.id
                };
                localStorage.setItem('employeeUser', JSON.stringify(updatedUser));
            } else {
                setError(data.message || "Failed to upload document.");
            }
        } catch (err) {
            console.error("Upload error", err);
            setError("Network error. Please verify server connection.");
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 max-w-[92rem] mx-auto animate-pulse">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
                        <div className="h-3 w-64 bg-slate-200 rounded mt-2 animate-pulse" />
                    </div>
                </div>

                {/* Form/Card grid skeleton representation */}
                <FormSkeleton fields={4} />
            </div>
        );
    }

    if (!employee) return null;

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold uppercase text-[#011023] tracking-tight">Upload Documents</h1>
                    <p className="text-xs text-gray-400 font-semibold mt-1">Official verification documents management center</p>
                </div>
            </div>

            {/* Content Split: List & Upload Zone */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Column 1 & 2 & 3: Document Status List */}
                <div className="lg:col-span-3 bg-white/60 backdrop-blur-xl border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden">
                    <div className="p-6 border-b border-[#e6f0fa]">
                        <h4 className="text-sm font-bold text-[#011023] uppercase tracking-wider">Document Verification Registry</h4>
                        <p className="text-[10px] text-gray-400 font-semibold uppercase">Official documents uploaded in profile record</p>
                    </div>

                    <div className="divide-y text-xs uppercase divide-[#e6f0fa]">
                        {documentTypes.map((doc) => {
                            const fileUrl = employee[doc.key];
                            return (
                                <div key={doc.key} className="p-4 flex items-center justify-between hover:bg-blue-50/20 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${fileUrl ? 'bg-emerald-50 text-emerald-500' : 'bg-gray-50 text-gray-400'}`}>
                                            <FileText size={18} />
                                        </div>
                                        <div>
                                            <h5 className="font-bold text-[#011023]">{doc.label}</h5>
                                            <p className="text-[9px] text-gray-400 font-black mt-0.5">{doc.key}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <span className={`px-3 py-1 rounded-full border text-[9px] font-black tracking-widest ${
                                            fileUrl 
                                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                                                : 'bg-rose-50 text-rose-600 border-rose-100'
                                        }`}>
                                            {fileUrl ? 'VERIFIED / UPLOADED' : 'MISSING'}
                                        </span>

                                        {fileUrl ? (
                                            <a 
                                                href={fileUrl} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1 text-[#052558] hover:text-[#527FB0] font-bold text-[10px] cursor-pointer"
                                            >
                                                VIEW <ExternalLink size={12} />
                                            </a>
                                        ) : (
                                            <span className="text-gray-300 font-bold text-[10px] select-none">NA</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Column 4 & 5: Upload Form */}
                <div className="lg:col-span-2 bg-white/60 backdrop-blur-xl border border-white p-6 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] flex flex-col">
                    <div className="pb-4 border-b border-[#e6f0fa] mb-6">
                        <h4 className="text-sm font-bold text-[#011023] uppercase tracking-wider">Document Uploader</h4>
                        <p className="text-[10px] text-gray-400 font-semibold uppercase">Select and upload scanned copy of your ID</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3.5 rounded-xl text-xs font-bold uppercase tracking-wide flex items-center gap-2 border border-red-100 mb-4">
                            <AlertCircle size={14} className="shrink-0" /> {error}
                        </div>
                    )}

                    {success && (
                        <div className="bg-emerald-50 text-emerald-700 p-3.5 rounded-xl text-xs font-bold uppercase tracking-wide border border-emerald-100 mb-4">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleUploadSubmit} className="space-y-6 text-xs font-bold text-[#011023]">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Document Category</label>
                            <select
                                className="w-full px-4 py-3 bg-[#f0f6ff] border border-transparent rounded-xl focus:outline-none focus:bg-white focus:border-blue-100 transition-all font-semibold cursor-pointer uppercase text-xs"
                                value={selectedDocType}
                                onChange={(e) => setSelectedDocType(e.target.value)}
                            >
                                {documentTypes.map(d => (
                                    <option key={d.key} value={d.key} className="uppercase">{d.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Drag & Drop Box */}
                        <div 
                            className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 transition-colors ${
                                dragActive 
                                    ? 'border-blue-400 bg-blue-50/20' 
                                    : selectedFile 
                                        ? 'border-emerald-300 bg-emerald-50/10' 
                                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/10'
                            }`}
                            onDragEnter={handleDrag}
                            onDragOver={handleDrag}
                            onDragLeave={handleDrag}
                            onDrop={handleDrop}
                        >
                            <UploadCloud size={36} className={selectedFile ? 'text-emerald-500' : 'text-gray-400'} />
                            {selectedFile ? (
                                <div className="text-center">
                                    <p className="font-bold text-[#011023] normal-case truncate max-w-[200px]">{selectedFile.name}</p>
                                    <p className="text-[10px] text-gray-400 font-semibold mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <p className="font-bold text-gray-500">DRAG AND DROP FILE HERE</p>
                                    <p className="text-[10px] text-gray-400 font-semibold mt-1">OR CLICK TO BROWSE FILES</p>
                                </div>
                            )}
                            <input
                                id="file-upload-input"
                                type="file"
                                accept=".jpg,.jpeg,.png,.pdf"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                            <button
                                type="button"
                                onClick={() => document.getElementById('file-upload-input').click()}
                                className="mt-2 px-4 py-2 border border-gray-200 hover:border-blue-100 hover:bg-blue-50 text-[#052558] hover:text-[#527FB0] rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                            >
                                Browse Files
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={uploading || !selectedFile}
                            className={`w-full py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
                                !selectedFile 
                                    ? 'bg-gray-100 text-gray-400 border border-transparent cursor-not-allowed' 
                                    : 'bg-[#052558] hover:bg-[#527FB0] text-white'
                            }`}
                        >
                            {uploading ? (
                                <>
                                    <Loader2 size={14} className="animate-spin" /> UPLOADING DOCUMENT...
                                </>
                            ) : 'UPLOAD OFFICIAL DOCUMENT'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default UploadDocuments;
