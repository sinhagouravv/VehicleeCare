import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Mail, Eye, Trash2, X, Loader2 } from 'lucide-react';
import useHighlight from '../hooks/useHighlight';
import { TableSkeleton, SkeletonBlock } from '../components/Skeleton';

const Messages = () => {
    const [messages, setMessages] = useState([]);
    const highlightedRow = useHighlight(messages);
    const [loading, setLoading] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState(null);

    const [lastRefreshed, setLastRefreshed] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [messageToDelete, setMessageToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const fetchMessages = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const res = await fetch('http://localhost:5001/api/messages');
            const result = await res.json();
            if (result.success && result.data) {
                setMessages(result.data);
                setLastRefreshed(new Date());
            }
        } catch (err) {
            console.error("Error fetching messages:", err);
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(() => fetchMessages(true), 5000);
        return () => clearInterval(interval);
    }, [fetchMessages]);

    const confirmDeleteMessage = async () => {
        if (!messageToDelete) return;
        setDeleting(true);
        try {
            const res = await fetch(`http://localhost:5001/api/messages/${messageToDelete}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (data.success) {
                setMessages(messages.filter(m => m._id !== messageToDelete));
                setIsDeleteModalOpen(false);
                setMessageToDelete(null);
            } else {
                alert("Failed to delete message.");
            }
        } catch (err) {
            console.error("Error deleting message:", err);
            alert("Error deleting message.");
        } finally {
            setDeleting(false);
        }
    };

    const handleViewMessage = async (message) => {
        setSelectedMessage(message);

        // If unread, mark it as read permanently
        if (!message.isRead) {
            try {
                const res = await fetch(`http://localhost:5001/api/messages/${message._id}/toggle-status`, {
                    method: 'PUT',
                });
                const data = await res.json();
                if (data.success) {
                    setMessages(messages.map(m => m._id === message._id ? { ...m, isRead: true } : m));
                }
            } catch (err) {
                console.error("Error updating message status:", err);
            }
        }
    };

    const _totalMessages = messages.length;
    const _readMessages = messages.filter(m => m.isRead).length;
    const _unreadMessages = messages.filter(m => !m.isRead).length;

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto h-[calc(100vh-9.25rem)] flex flex-col">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-[#011023] uppercase tracking-tight">Messages</h1>
                <div className="text-xs uppercase text-gray-400 font-medium self-center">
                    {!lastRefreshed ? (
                        <SkeletonBlock className="h-4 w-64 bg-slate-200/80 rounded-md" />
                    ) : (
                        `Last refreshed | ${lastRefreshed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | ${lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`
                    )}
                </div>
            </div>

            {/* Stats Overview */}
            {/* <div className="flex flex-wrap uppercase items-center gap-5">
                <div className="bg-white border border-[#e2e8f0] px-5 py-3 rounded-2xl shadow-xs flex-1 min-w-[200px]">
                    <div className="flex justify-between items-center">
                        <p className="text-gray-500 font-semibold uppercase">Total Messages</p>
                        <p className="text-2xl font-bold text-[#011023]">{totalMessages}</p>
                    </div>
                </div>
                <div className="bg-white border border-[#e2e8f0] px-5 py-3 rounded-2xl shadow-xs flex-1 min-w-[200px]">
                    <div className="flex justify-between items-center">
                        <p className="text-gray-500 font-semibold uppercase">Read Messages</p>
                        <p className="text-2xl font-bold text-emerald-500">{readMessages}</p>
                    </div>
                </div>
                <div className="bg-white border border-[#e2e8f0] px-5 py-3 rounded-2xl shadow-xs flex-1 min-w-[200px]">
                    <div className="flex justify-between items-center">
                        <p className="text-gray-500 font-semibold uppercase">Unread Messages</p>
                        <p className="text-2xl font-bold text-blue-500">{unreadMessages}</p>
                    </div>
                </div>
            </div> */}

            {/* Main Content Table */}
            <div className="bg-white border border-[#e9f2fb] rounded-2xl shadow-[0_1px_2.5px_0_rgba(0,0,0,0.07)] flex-1 min-h-0 overflow-hidden flex flex-col">
                <div className="overflow-x-hidden overflow-y-auto text-center flex-1 relative hide-scrollbar">
                    <table className="w-full text-center border-collapse table-fixed">
                        <thead className="sticky top-0 z-10 shadow-sm">
                            <tr className="bg-[#f0f6ff] text-[15px] uppercase tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                <th className="p-4.5 font-bold text-center w-[10%]">Message id</th>
                                <th className="p-4.5 font-bold text-center w-[12%]">Contact Info</th>
                                <th className="p-4.5 font-bold text-center w-[10%]">Source</th>
                                {/* <th className="p-4.5 font-bold text-center w-[16%]">Subject</th> */}
                                <th className="p-4.5 font-bold text-center w-[38%]">Message preview</th>
                                <th className="p-4.5 font-bold text-center w-[10%]">Received at</th>
                                <th className="p-4.5 font-bold text-center w-[8%]">Status</th>
                                <th className="p-4.5 font-bold text-center w-[7%]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-[13px] divide-[#e6f0fa]">
                            {loading ? (
                                <TableSkeleton rows={15} cols={7} />
                            ) : messages.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-sm text-gray-500">
                                        No messages found.
                                    </td>
                                </tr>
                            ) : messages.map((message) => {
                                const rowId = message.messageId || message._id;
                                return (
                                    <tr key={message._id} id={`row-${rowId}`} className={`transition-all duration-1000 group ${highlightedRow === rowId ? 'bg-emerald-100/60 rounded-2xl relative z-20 scale-[1.01]' : 'hover:bg-white/50'}`}>
                                        <td className="p-4.5 text-center w-[10%]">
                                            <div className="flex flex-col items-center">
                                                <span className="font-semibold text-[#011023] text-sm text-center">{message.messageId || message._id.substring(0, 7).toUpperCase()}</span>
                                            </div>
                                        </td>
                                        <td className="p-4.5 text-center w-[14%]">
                                            <div className="flex flex-col uppercase items-center justify-center">
                                                <span className="font-semibold text-[#011023] text-center">{message.name}</span>
                                                <span className="text-xs lowercase text-gray-500 text-center">{message.email}</span>
                                            </div>
                                        </td>
                                        <td className="p-4.5 text-center w-[10%]">
                                            <span className={`inline-block px-3 py-1 text-xs font-semibold uppercase rounded-full ${message.type === 'business' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {message.type || 'website'}
                                            </span>
                                        </td>
                                        {/* <td className="p-4.5 text-center uppercase w-[16%]">
                                            <span className={`font-semibold text-center ${!message.isRead ? 'text-[#011023]' : 'text-gray-500'}`}>
                                                {message.type === 'business' ? 'Business inquiry' : message.subject}
                                            </span>
                                        </td> */}
                                        <td className="p-4.5 text-center uppercase w-[38%]">
                                            <span className={`text-sm text-center line-clamp-2 ${!message.isRead ? 'font-medium text-gray-800' : 'text-gray-500'}`}>
                                                {message.message}
                                            </span>
                                        </td>
                                        <td className="p-4.5 uppercase text-center w-[10%]">
                                            <div className="flex flex-col items-center justify-center">
                                                <span className="text-sm font-semibold text-[#011023]">
                                                    {new Date(message.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </span>
                                                <span className="text-xs text-gray-600">
                                                    {new Date(message.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4.5 text-center w-[8%]">
                                            <span className={`inline-block px-3 py-1 text-xs font-semibold uppercase rounded-full ${
                                                message.isRead ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                                            }`}>
                                                {message.isRead ? 'Read' : 'Unread'}
                                            </span>
                                        </td>
                                        <td className="p-4.5 text-center w-[7%]">
                                            <div className="flex justify-center gap-4">
                                                <button
                                                    onClick={() => handleViewMessage(message)}
                                                    className={`text-gray-400 hover:text-blue-600`}
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button onClick={() => { setMessageToDelete(message._id); setIsDeleteModalOpen(true); }} className="text-gray-400 hover:text-red-500">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {messages.length === 0 && (
                                <tr>
                                    <td colSpan="8" className="p-8 text-center text-gray-500 font-medium">
                                        No messages found. Let's hope someone says hi!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* View Details Modal */}
            {selectedMessage && createPortal(
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#011023]/10 backdrop-blur-sm"
                    onClick={() => setSelectedMessage(null)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-[#e6f0fa] flex justify-between items-center bg-gradient-to-r from-blue-50/50 to-white">
                            <div>
                                <h3 className="text-xl font-bold text-[#052558] uppercase">Message Details</h3>
                                <p className="text-sm text-gray-500 mt-1 uppercase">ID: <span className="font-semibold text-gray-700">{selectedMessage.messageId || selectedMessage._id.substring(0, 7).toUpperCase()}</span></p>
                            </div>
                            <button
                                onClick={() => setSelectedMessage(null)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            {/* Info Grid */}
                            <div className="flex flex-col md:flex-row gap-6 w-full">
                                <div className="space-y-4 w-full md:w-[60%]">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Sender Info</h4>
                                    <div className="pt-4 rounded-xl space-y-2 uppercase">
                                        <p className="text-sm flex"><span className="text-gray-500 w-24 shrink-0">Name:</span> <span className="font-semibold text-[#011023] truncate" title={selectedMessage.name}>{selectedMessage.name || 'N/A'}</span></p>
                                        {selectedMessage.company && <p className="text-sm flex"><span className="text-gray-500 w-24 shrink-0">Company:</span> <span className="font-semibold text-purple-700 truncate">{selectedMessage.company}</span></p>}
                                        <p className="text-sm flex"><span className="text-gray-500 w-24 shrink-0">Phone:</span> <span className="font-semibold text-gray-800 truncate">{selectedMessage.phone || 'N/A'}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-24 shrink-0">Email:</span> <span className="font-semibold text-gray-800 truncate" title={selectedMessage.email}>{selectedMessage.email || 'N/A'}</span></p>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-4.5 w-full md:w-[40%]">
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Timestamp</h4>
                                        <div className="bg-blue-50/30 pt-4 rounded-xl space-y-2 border border-blue-50 uppercase">
                                            <p className="text-sm flex"><span className="text-gray-500 w-20 shrink-0">Date:</span> <span className="font-semibold text-[#011023]">{new Date(selectedMessage.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span></p>
                                            <p className="text-sm flex"><span className="text-gray-500 w-20 shrink-0">Time:</span> <span className="font-semibold text-gray-800">{new Date(selectedMessage.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span></p>
                                            <p className="text-sm flex"><span className="text-gray-500 w-20 shrink-0">Type:</span> <span className={`px-2 py-0.5 rounded text-[10px] text-center font-bold uppercase ${selectedMessage.type === 'business' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>{selectedMessage.type || 'website'}</span></p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Message Content */}
                            <div className="space-y-3 text-left">
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Subject & Message</h4>
                                <p className="text-[14px] uppercase font-semibold leading-relaxed">
                                    <span className="text-[#052558]">{selectedMessage.type === 'business' ? 'Business inquiry' : selectedMessage.subject}</span>
                                    <span className="text-gray-600 mx-2 font-normal">|</span>
                                    <span className="text-gray-800">{selectedMessage.message}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>, document.body
            )}
            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && createPortal(
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#011023]/10 backdrop-blur-sm transition-all duration-300"
                    onClick={() => { setIsDeleteModalOpen(false); setMessageToDelete(null); }}
                >
                    <div 
                        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-8 text-center uppercase space-y-4">
                            <h3 className="text-2xl font-bold text-[#011023] uppercase tracking-tighter mb-9">Delete Message</h3>
                            <p className="text-[13px] text-gray-500 font-medium leading-relaxed">
                                This will permanently remove the message from <span className="text-[#052558] font-bold uppercase">{messages.find(m => m._id === messageToDelete)?.name}</span>. <br/>
                                This action <span className="text-rose-600 font-bold uppercase">cannot be undone</span>.
                            </p>
                        </div>
                        <div className="p-2 bg-gray-50/80 border-t border-gray-100 grid grid-cols-2 gap-3 pb-8 px-8">
                            <button 
                                onClick={() => { setIsDeleteModalOpen(false); setMessageToDelete(null); }}
                                className="px-4 py-3.5 bg-white border border-gray-200 text-gray-400 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-white hover:text-gray-600 transition-all shadow-sm active:scale-95"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmDeleteMessage}
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

export default Messages;
