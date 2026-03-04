import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Mail, Eye, Trash2, X } from 'lucide-react';
import useHighlight from '../hooks/useHighlight';

const Messages = () => {
    const [messages, setMessages] = useState([]);
    const highlightedRow = useHighlight(messages);
    const [loading, setLoading] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState(null);

    const [lastRefreshed, setLastRefreshed] = useState(null);

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

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this message?")) return;
        try {
            const res = await fetch(`http://localhost:5001/api/messages/${id}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (data.success) {
                setMessages(messages.filter(m => m._id !== id));
            } else {
                alert("Failed to delete message.");
            }
        } catch (err) {
            console.error("Error deleting message:", err);
            alert("Error deleting message.");
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

    const totalMessages = messages.length;
    const readMessages = messages.filter(m => m.isRead).length;
    const unreadMessages = messages.filter(m => !m.isRead).length;

    return (
        <div className="space-y-6 max-w-[92rem] mx-auto ">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-[#011023] uppercase tracking-tight">Messages</h1>
                <div className="text-xs uppercase text-gray-400 font-medium self-center">
                    {lastRefreshed
                        ? `Last refreshed | ${lastRefreshed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | ${lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`
                        : 'Loading…'}
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5.5">
                <div className="bg-white/60 backdrop-blur-xl border border-white p-6 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)]">
                    <p className="text-gray-500 font-semibold mb-1">Total Messages</p>
                    <p className="text-3xl font-black text-[#011023]">{totalMessages}</p>
                </div>
                <div className="bg-white/60 backdrop-blur-xl border border-white p-6 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)]">
                    <p className="text-gray-500 font-semibold mb-1">Read Messages</p>
                    <p className="text-3xl font-black text-emerald-500">{readMessages}</p>
                </div>
                <div className="bg-white/60 backdrop-blur-xl border border-white p-6 rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)]">
                    <p className="text-gray-500 font-semibold mb-1">Unread Messages</p>
                    <p className="text-3xl font-black text-blue-500">{unreadMessages}</p>
                </div>
            </div>

            {/* Main Content Table (Glassmorphism) */}
            <div className="bg-white/60 backdrop-blur-xl max-h-[50rem] border border-white rounded-2xl shadow-[0_8px_30px_rgba(5,37,88,0.04)] overflow-hidden">
                <div className="overflow-x-hidden overflow-y-auto h-[730px] relative">
                    <table className="w-full text-center border-collapse">
                        <thead className="sticky top-0 z-10 shadow-sm">
                            <tr className="bg-[#f0f6ff] text-[15px] uppercase tracking-wider text-gray-500 border-b border-[#e6f0fa]">
                                <th className="p-4.5 font-bold">Message id</th>
                                <th className="p-4.5 font-bold">Contact Info</th>
                                <th className="p-4.5 font-bold text-center">Type</th>
                                <th className="p-4.5 font-bold text-left">Subject</th>
                                <th className="p-4.5 font-bold text-left">Message preview</th>
                                <th className="p-4.5 font-bold">Date Received</th>
                                <th className="p-4.5 font-bold text-center">Status</th>
                                <th className="p-4.5 font-bold text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-[13px] divide-[#e6f0fa]">
                            {messages.map((message) => {
                                const rowId = message.messageId || message._id;
                                return (
                                    <tr key={message._id} id={`row-${rowId}`} className={`transition-all duration-1000 group ${highlightedRow === rowId ? 'bg-emerald-100/60 rounded-2xl relative z-20 scale-[1.01]' : 'hover:bg-white/50'}`}>
                                        <td className="p-4.5">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-[#011023] text-[13px]">{message.messageId || message._id.substring(0, 7).toUpperCase()}</span>
                                            </div>
                                        </td>
                                        <td className="p-4.5">
                                            <div className="flex flex-col items-center">
                                                <span className="font-bold text-[#011023] text-[15px]">{message.name}</span>
                                                {message.company && <span className="text-xs font-semibold text-purple-600/80 mb-0.5">@ {message.company}</span>}
                                                {message.phone && <span className="text-xs text-gray-400">{message.phone}</span>}
                                                <span className="text-sm text-gray-500">{message.email}</span>
                                            </div>
                                        </td>
                                        <td className="p-4.5 text-center">
                                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${message.type === 'business' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {message.type || 'website'}
                                            </span>
                                        </td>
                                        <td className="p-4.5 text-left">
                                            <span className={`font-semibold ${!message.isRead ? 'text-[#011023]' : 'text-gray-500'}`}>
                                                {message.subject}
                                            </span>
                                        </td>
                                        <td className="p-4.5 max-w-xs truncate text-left">
                                            <span className={`text-sm ${!message.isRead ? 'font-medium text-gray-800' : 'text-gray-500'}`} title={message.message}>
                                                {message.message}
                                            </span>
                                        </td>
                                        <td className="p-4.5">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-[#011023]">
                                                    {new Date(message.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(message.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4.5 text-center">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${message.isRead
                                                ? 'bg-gray-100 text-gray-600'
                                                : 'bg-emerald-100 text-emerald-700'
                                                }`}>
                                                {message.isRead ? 'Read' : 'New'}
                                            </span>
                                        </td>
                                        <td className="p-4.5">
                                            <div className="flex justify-center gap-3">
                                                <button
                                                    onClick={() => handleViewMessage(message)}
                                                    className={`p-1.5 rounded-lg transition-colors text-blue-400 hover:text-blue-600 hover:bg-blue-50`}
                                                    title="View Message"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button onClick={() => handleDelete(message._id)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title="Delete">
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
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#011023]/60 backdrop-blur-sm"
                    onClick={() => setSelectedMessage(null)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-[#e6f0fa] flex justify-between items-center bg-gradient-to-r from-blue-50/50 to-white">
                            <div>
                                <h3 className="text-xl font-bold text-[#052558]">Message Details</h3>
                                <p className="text-sm text-gray-500 mt-1">ID: <span className="font-semibold text-gray-700">{selectedMessage.messageId || selectedMessage._id.substring(0, 7).toUpperCase()}</span></p>
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
                                    <div className="bg-blue-50/30 p-4 rounded-xl space-y-2 border border-blue-50">
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Name:</span> <span className="font-semibold text-[#011023] truncate" title={selectedMessage.name}>{selectedMessage.name || 'N/A'}</span></p>
                                        {selectedMessage.company && <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Company:</span> <span className="font-semibold text-purple-700 truncate">{selectedMessage.company}</span></p>}
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Phone:</span> <span className="font-semibold text-gray-800 truncate">{selectedMessage.phone || 'N/A'}</span></p>
                                        <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Email:</span> <span className="font-semibold text-gray-800 truncate" title={selectedMessage.email}>{selectedMessage.email || 'N/A'}</span></p>
                                        <p className="text-sm flex items-center mt-3 pt-3 border-t border-blue-100/50"><span className="text-gray-500 w-16 shrink-0">Type:</span> <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${selectedMessage.type === 'business' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{selectedMessage.type || 'website'}</span></p>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-4.5 w-full md:w-[40%]">
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Timestamp</h4>
                                        <div className="bg-blue-50/30 p-4 rounded-xl space-y-2 border border-blue-50">
                                            <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Date:</span> <span className="font-semibold text-[#011023]">{new Date(selectedMessage.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span></p>
                                            <p className="text-sm flex"><span className="text-gray-500 w-16 shrink-0">Time:</span> <span className="font-semibold text-gray-800">{new Date(selectedMessage.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span></p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Message Content */}
                            <div className="space-y-3 mt-4">
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Subject & Message</h4>
                                <h3 className="text-xl font-bold text-[#011023] bg-blue-50/30 px-5 pt-5 rounded-t-xl border-x border-t border-blue-50">{selectedMessage.subject}</h3>
                                <div className="bg-blue-50/30 rounded-b-xl p-5 border-x border-b border-blue-50 mt-0">
                                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                        {selectedMessage.message}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>, document.body
            )}
        </div>
    );
};

export default Messages;
