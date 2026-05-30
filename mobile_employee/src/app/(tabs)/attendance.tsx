import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, RefreshControl, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Search, X, LogIn, LogOut, CheckCircle, AlertCircle } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

const API_URL = 'http://localhost:5001';

export default function AttendanceScreen() {
    const [user, setUser] = useState<any>(null);
    const [todayRecord, setTodayRecord] = useState<any>(null);
    const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadUser();
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (user) {
            const empId = user.employeeId || user.id || user._id;
            interval = setInterval(() => {
                fetchTodayStatus(empId, true);
            }, 5000);
        }
        return () => clearInterval(interval);
    }, [user]);

    const loadUser = async () => {
        try {
            const storedUserStr = await SecureStore.getItemAsync('employeeUser');
            if (storedUserStr) {
                const parsedUser = JSON.parse(storedUserStr);
                setUser(parsedUser);
                const empId = parsedUser.employeeId || parsedUser.id || parsedUser._id;
                if (empId) {
                    fetchTodayStatus(empId);
                } else {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        } catch (e) {
            console.error(e);
            setLoading(false);
        }
    };

    const fetchTodayStatus = async (empId: string, silent = false) => {
        try {
            if (!silent) setLoading(true);

            const [statusRes, recordsRes] = await Promise.all([
                axios.get(`${API_URL}/api/attendance/status/${empId}`),
                axios.get(`${API_URL}/api/attendance/employee/${empId}`)
            ]);

            if (statusRes.data.success && recordsRes.data.success) {
                setTodayRecord(statusRes.data.data);
                
                const records = (recordsRes.data.data || []).map((r: any) => ({
                    id: r._id,
                    date: r.date,
                    employeeId: r.employeeId,
                    employeeName: r.employeeName,
                    contact: r.contact || '—',
                    email: r.email || '',
                    role: r.role || '—',
                    shift: r.shift || '—',
                    checkIn: r.checkIn,
                    checkOut: r.checkOut,
                    status: r.status,
                    _id: r._id
                }));
                setAttendanceRecords(records);
            }
        } catch (err) {
            console.error("Failed to fetch attendance:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        if (user) {
            setRefreshing(true);
            fetchTodayStatus(user.employeeId || user.id || user._id, false);
        }
    }, [user]);

    const handleCheckIn = async () => {
        if (!user) return;
        setActionLoading(true);
        try {
            const res = await axios.post(`${API_URL}/api/attendance/check-in`, {
                employeeId: user.employeeId || user.id || user._id
            });
            if (res.data.success || res.data.message?.includes('Absent')) {
                fetchTodayStatus(user.employeeId || user.id || user._id, true);
                Alert.alert('Success', 'Checked in successfully!');
            } else {
                Alert.alert('Error', res.data.message || 'Check-in failed. Please try again.');
            }
        } catch (err) {
            console.error("Check-in error:", err);
            Alert.alert('Error', 'Connection failed. Please try again.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCheckOut = async () => {
        if (!todayRecord?._id || !user) return;
        setActionLoading(true);
        try {
            const res = await axios.put(`${API_URL}/api/attendance/check-out/${todayRecord._id}`);
            if (res.data.success) {
                fetchTodayStatus(user.employeeId || user.id || user._id, true);
                Alert.alert('Success', 'Checked out successfully!');
            } else {
                Alert.alert('Error', res.data.message || 'Check-out failed. Please try again.');
            }
        } catch (err) {
            console.error("Check-out error:", err);
            Alert.alert('Error', 'Connection failed. Please try again.');
        } finally {
            setActionLoading(false);
        }
    };

    const isCheckedIn = todayRecord && todayRecord.checkIn;
    const isCheckedOut = todayRecord && todayRecord.checkOut;
    const isShiftComplete = isCheckedIn && isCheckedOut;
    const isMarkedAbsent = todayRecord && todayRecord.status === 'Absent';
    const isOnLeave = todayRecord && todayRecord.status === 'On Leave';

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Present': return { backgroundColor: '#dcfce7', borderColor: '#bbf7d0', textColor: '#166534' };
            case 'Absent': return { backgroundColor: '#ffe4e6', borderColor: '#fecdd3', textColor: '#be123c' };
            case 'Late': return { backgroundColor: '#ffedd5', borderColor: '#fed7aa', textColor: '#c2410c' };
            case 'On Leave': return { backgroundColor: '#dbeafe', borderColor: '#bfdbfe', textColor: '#1d4ed8' };
            case 'Overtime': return { backgroundColor: '#e0e7ff', borderColor: '#c7d2fe', textColor: '#4338ca' };
            default: return { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0', textColor: '#475569' };
        }
    };
    
    const getShiftStyle = (shift: string) => {
        const lowerShift = (shift || '').toLowerCase();
        switch (lowerShift) {
            case 'morning': return { backgroundColor: '#fff7ed', borderColor: '#ffedd5', textColor: '#ea580c' };
            case 'evening': return { backgroundColor: '#faf5ff', borderColor: '#f3e8ff', textColor: '#9333ea' };
            case 'night': return { backgroundColor: '#eef2ff', borderColor: '#e0e7ff', textColor: '#4f46e5' };
            default: return { backgroundColor: '#f8fafc', borderColor: '#f1f5f9', textColor: '#475569' };
        }
    };

    const formatTime = (dateStr: string) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).toLowerCase();
    };

    const formatDateStr = (dateStr: string) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '—';
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const filteredRecords = attendanceRecords.filter(r => {
        const matchesSearch = !searchQuery || (
            r.status?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            formatDateStr(r.date)?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        return matchesSearch;
    });

    const getLateThresholdTime = (shift: string) => {
        switch (shift?.toLowerCase()) {
            case 'evening': return '03:05 PM';
            case 'night': return '09:05 PM';
            default: return '09:05 AM'; // Morning
        }
    };

    const renderActionCard = () => {
        if (loading && !todayRecord) {
            return (
                <View className="bg-white rounded-[20px] p-5 mx-5 mb-5 shadow-sm border border-slate-100 flex items-center justify-center min-h-[100px]">
                    <ActivityIndicator size="small" color="#011023" />
                </View>
            );
        }

        return (
            <View className="mx-5 mt-4 mb-4">
                {isShiftComplete ? (
                    <View className="bg-emerald-50 border border-emerald-100 py-3 rounded-2xl flex-row justify-center items-center">
                        {/* <CheckCircle size={18} color="#059669" /> */}
                        <Text className="ml-2 font-bold text-emerald-600 uppercase tracking-widest text-[13px]">Shift Completed</Text>
                    </View>
                ) : isMarkedAbsent ? (
                    <View style={{ paddingVertical: 12 }} className="bg-red-50 border border-red-100 rounded-2xl flex-row justify-center items-center opacity-80">
                        {/* <AlertCircle size={18} color="#ef4444" /> */}
                        <Text className="ml-2 font-bold text-red-500 uppercase tracking-widest text-[13px]">Marked Absent</Text>
                    </View>
                ) : isCheckedIn ? (
                    <TouchableOpacity 
                        disabled={actionLoading}
                        onPress={handleCheckOut}
                        className="bg-red-500 py-3 rounded-2xl flex-row justify-center items-center shadow-sm"
                        style={{ elevation: 2, shadowColor: '#ef4444' }}
                    >
                        <Text className="ml-2 font-bold text-white uppercase tracking-widest text-[13px]">Check Out</Text>
                    </TouchableOpacity>
                ) : (
                    <View>
                        <TouchableOpacity 
                            disabled={actionLoading || isOnLeave}
                            onPress={handleCheckIn}
                            className={`bg-[#011023] py-3 rounded-2xl flex-row justify-center items-center shadow-sm ${isOnLeave ? 'opacity-60' : ''}`}
                            style={{ elevation: 2, shadowColor: '#011023' }}
                        >
                            <Text className="ml-2 font-bold text-white uppercase tracking-widest text-[13px]">Check In</Text>
                        </TouchableOpacity>
                        {isOnLeave && (
                            <Text className="text-center text-red-500 font-semibold text-[11px] mt-2.5 uppercase tracking-wide">
                                You are on leave. Check in after it ends.
                            </Text>
                        )}
                    </View>
                )}
            </View>
        );
    };

    const renderRecordCard = ({ item: r }: any) => {
        const statusStyle = getStatusStyle(r.status);
        
        return (
            <View style={{ marginHorizontal: 19, paddingTop: 10, paddingBottom: 11 }} className="bg-white rounded-2xl px-5 mb-3 shadow-sm border border-slate-100">
                {/* Header: Date & Status */}
                <View className="flex-row justify-between items-center mb-2">
                    <Text style={{ fontSize: 14 }} className="font-semibold text-[#011023] uppercase tracking-wider">
                        {formatDateStr(r.date)}
                    </Text>
                    <View className="rounded-full items-center justify-center" style={{ backgroundColor: statusStyle.backgroundColor, borderColor: statusStyle.borderColor, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 2.5 }}>
                        <Text className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: statusStyle.textColor }}>
                            {r.status === 'On Leave' ? 'On Leave' : r.status}
                        </Text>
                    </View>
                </View>

                {/* Check In / Out Info */}
                <View className="flex-row justify-between items-center mb-1">
                    <View className="flex-1 items-start justify-center">
                        <Text className="text-[12px] text-slate-500 font-semibold uppercase tracking-widest mb-1">Check In</Text>
                        <Text className="text-[14px] font-semibold text-[#011023] uppercase truncate" numberOfLines={1}>{formatTime(r.checkIn)}</Text>
                    </View>
                    <View className="flex-1 items-end justify-center">
                        <Text className="text-[12px] text-slate-500 font-semibold uppercase tracking-widest mb-1 text-right">Check Out</Text>
                        <Text className="text-[14px] font-semibold text-[#011023] uppercase truncate text-right" numberOfLines={1}>{formatTime(r.checkOut)}</Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View className="flex-1 bg-slate-50">


            {renderActionCard()}

            {/* List */}
            {loading && !todayRecord ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#011023" />
                </View>
            ) : (
                <FlatList
                    style={{ flex: 1 }}
                    data={filteredRecords}
                    keyExtractor={item => item._id}
                    renderItem={renderRecordCard}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 0 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#011023" />
                    }
                    ListEmptyComponent={
                        <View className="items-center justify-center pt-10">
                            <Text className="text-slate-400 font-bold uppercase tracking-widest text-[12px]">No Attendance Records Found</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}
