import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, RefreshControl, Modal, ScrollView, TextInput, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Search, SlidersHorizontal, X, Plus, Clock, Calendar, Check, Trash2, Loader2, FileText, Activity } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import DateTimePicker from '@react-native-community/datetimepicker';

const API_URL = 'http://localhost:5001';

const NativeDatePicker = ({ visible, onClose, valueStr, minDateStr, onSelect, title }: any) => {
  if (!visible) return null;

  const getNoon = (d?: Date) => {
    const nd = d ? new Date(d) : new Date();
    nd.setHours(12, 0, 0, 0);
    return nd;
  };

  const parseLocalDate = (dateStr: string) => {
    if (!dateStr) return getNoon();
    const [day, month, year] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0);
  };

  const minDate = minDateStr ? parseLocalDate(minDateStr) : getNoon();
  const maxDate = getNoon();
  maxDate.setMonth(maxDate.getMonth() + 2);

  const [tempDate, setTempDate] = useState<Date>(valueStr ? parseLocalDate(valueStr) : minDate);

  useEffect(() => {
    if (visible) {
      setTempDate(valueStr ? parseLocalDate(valueStr) : minDate);
    }
  }, [visible, valueStr, minDateStr]);

  if (!visible) return null;

  const handleDone = () => {
    let finalDate = tempDate;
    if (tempDate < minDate) finalDate = minDate;
    if (tempDate > maxDate) finalDate = maxDate;

    const year = finalDate.getFullYear();
    const month = String(finalDate.getMonth() + 1).padStart(2, '0');
    const day = String(finalDate.getDate()).padStart(2, '0');
    
    onSelect(`${day}-${month}-${year}`);
    onClose();
  };

  const onChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      if (Platform.OS === 'android') {
        let finalDate = selectedDate;
        if (selectedDate < minDate) finalDate = minDate;
        
        const year = finalDate.getFullYear();
        const month = String(finalDate.getMonth() + 1).padStart(2, '0');
        const day = String(finalDate.getDate()).padStart(2, '0');
        onSelect(`${day}-${month}-${year}`);
        onClose();
      } else {
        setTempDate(selectedDate);
      }
    } else if (Platform.OS === 'android') {
      onClose();
    }
  };

  if (Platform.OS === 'ios') {
    return (
      <View style={{ position: 'absolute', bottom: 0, alignSelf: 'center', width: '97%', zIndex: 9999, elevation: 9999, backgroundColor: 'white', borderTopLeftRadius: 28, borderTopRightRadius: 28, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.15, shadowRadius: 20, paddingBottom: 40 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 22, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
          <Text className="font-bold text-slate-800 text-[16px]">{title}</Text>
          <TouchableOpacity onPress={handleDone}>
            <Text style={{ color: '#007AFF', fontWeight: 'bold', fontSize: 16 }}>DONE</Text>
          </TouchableOpacity>
        </View>
        <View style={{ alignItems: 'center', width: '100%', paddingTop: 0 }}>
          <DateTimePicker
            value={tempDate}
            mode="date"
            display="spinner"
            minimumDate={minDate}
            maximumDate={maxDate}
            onChange={onChange}
            textColor="#000000"
            themeVariant="light"
            locale="en-GB"
            style={{ width: 320, alignSelf: 'center' }}
          />
        </View>
      </View>
    );
  }

  return (
    <DateTimePicker
      value={tempDate}
      mode="date"
      display="default"
      minimumDate={minDate}
      maximumDate={maxDate}
      onChange={onChange}
      locale="en-GB"
    />
  );
};

export default function LeaveScreen() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [tempFilterStatus, setTempFilterStatus] = useState('All');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Modals state
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<any>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parentLeaveId, setParentLeaveId] = useState<string | null>(null);
  const [isLeaveTypeDropdownOpen, setIsLeaveTypeDropdownOpen] = useState(false);
  const [isLeavePeriodDropdownOpen, setIsLeavePeriodDropdownOpen] = useState(false);
  const [isStartTimeDropdownOpen, setIsStartTimeDropdownOpen] = useState(false);
  const [isEndTimeDropdownOpen, setIsEndTimeDropdownOpen] = useState(false);
  const [isStartDateModalOpen, setIsStartDateModalOpen] = useState(false);
  const [isEndDateModalOpen, setIsEndDateModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    type: '',
    leaveTime: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    reason: ''
  });

  const calculateEndTime = (startStr: string, period: string) => {
    if (!startStr || !period || period === '') return '';
    const startHour = parseInt(startStr.split(':')[0], 10);
    if (isNaN(startHour)) return '';
    
    let hoursToAdd = 0;
    if (period === 'Full Day') hoursToAdd = 12;
    else if (period === 'Half Day') hoursToAdd = 6;
    
    if (hoursToAdd === 0) return '';
    
    let endHour = startHour + hoursToAdd;
    return `${endHour.toString().padStart(2, '0')}:00`;
  };

  const calculateStartTime = (endStr: string, period: string) => {
    if (!endStr || !period || period === '') return '';
    const endHour = parseInt(endStr.split(':')[0], 10);
    if (isNaN(endHour)) return '';
    
    let hoursToSubtract = 0;
    if (period === 'Full Day') hoursToSubtract = 12;
    else if (period === 'Half Day') hoursToSubtract = 6;
    
    if (hoursToSubtract === 0) return '';
    
    let startHour = endHour - hoursToSubtract;
    return `${startHour.toString().padStart(2, '0')}:00`;
  };

  const resetForm = () => {
    setFormData({
      type: '',
      leaveTime: '',
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: '',
      reason: ''
    });
    setParentLeaveId(null);
    setIsLeaveTypeDropdownOpen(false);
    setIsLeavePeriodDropdownOpen(false);
    setIsStartTimeDropdownOpen(false);
    setIsEndTimeDropdownOpen(false);
    setIsStartDateModalOpen(false);
    setIsEndDateModalOpen(false);
    setIsExtendModalOpen(false);
  };

  const pendingLeave = leaves.find((l: any) => l.status === 'Pending');

  useEffect(() => {
    loadUserAndFetchLeaves();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (user) {
      const empId = user.employeeId || user.id || user._id;
      interval = setInterval(() => {
        fetchLeaves(empId, false);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [user]);

  const loadUserAndFetchLeaves = async () => {
    try {
      const storedUserStr = await SecureStore.getItemAsync('employeeUser');
      if (storedUserStr) {
        const parsedUser = JSON.parse(storedUserStr);
        setUser(parsedUser);
        const empId = parsedUser.employeeId || parsedUser.id || parsedUser._id;
        if (empId) {
          fetchLeaves(empId);
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

  const fetchLeaves = async (empId: any, isRefresh = false) => {
    if (!empId) return;
    try {
      if (isRefresh) setRefreshing(true);
      const res = await axios.get(`${API_URL}/api/leaves/employee/${empId}`);
      if (res.data.success) {
        setLeaves(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch leaves:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    if (user) fetchLeaves(user.employeeId || user.id || user._id, true);
  }, [user]);

  const handleExtendLeave = () => {
    if (selectedLeave) {
      const endDate = new Date(selectedLeave.endDate);
      endDate.setDate(endDate.getDate() + 1);
      const nextY = endDate.getFullYear();
      const nextM = String(endDate.getMonth() + 1).padStart(2, '0');
      const nextD = String(endDate.getDate()).padStart(2, '0');
      const nextStartDateStr = `${nextD}-${nextM}-${nextY}`;
      
      setFormData({
        ...formData,
        type: selectedLeave.type,
        leaveTime: selectedLeave.leaveTime,
        startDate: nextStartDateStr,
        startTime: selectedLeave.startTime || '09:00',
        endDate: nextStartDateStr,
        endTime: selectedLeave.endTime || '21:00',
        // reason: `Extension of previous leave request (${selectedLeave.leaveId}) which is ending on ${selectedLeave.endDate}. `
      });
      setParentLeaveId(selectedLeave.leaveId);
      setIsExtendModalOpen(true);
    }
  };

  const handleSubmit = async () => {
    if (!formData.startDate || !formData.endDate || !formData.reason) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    const words = formData.reason.trim().split(/\s+/).filter(word => word.length > 0);
    if (words.length < 10) {
      Alert.alert('Error', 'Reason must be at least 10 words long.');
      return;
    }
    
    setIsSubmitting(true);
    
    const formatDateForDB = (dateStr: string) => {
      if (!dateStr) return dateStr;
      if (dateStr.includes('-') && dateStr.split('-')[0].length === 2) {
        const [d, m, y] = dateStr.split('-');
        return `${y}-${m}-${d}`;
      }
      return dateStr;
    };

    try {
      const res = await axios.post(`${API_URL}/api/leaves/request`, {
        employeeId: user.employeeId || user.id || user._id,
        employeeName: user.name,
        employeePhone: user.phone,
        employeeEmail: user.email,
        garageId: user.garageId,
        parentLeaveId: parentLeaveId,
        ...formData,
        startDate: formatDateForDB(formData.startDate),
        endDate: formatDateForDB(formData.endDate),
      });

      if (res.data.success) {
        Alert.alert('Success', 'Leave request submitted successfully!');
        setIsApplyModalOpen(false);
        setIsViewModalOpen(false);
        resetForm();
        setLeaves(prev => [res.data.data, ...prev]);
        fetchLeaves(user.employeeId || user.id || user._id, false);
      } else {
        Alert.alert('Error', 'Failed to apply for leave. Please try again after sometime.');
      }
    } catch (err) {
      console.error("Submission error:", err);
      Alert.alert('Error', 'Failed to apply for leave. Please try again after sometime.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: any) => {
    Alert.alert(
      "Delete Request",
      "Are you sure you want to delete this leave request?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            // Optimistic update for seamless UI
            setLeaves(prev => prev.filter(l => l._id !== id));
            setIsViewModalOpen(false);
            try {
              const res = await axios.delete(`${API_URL}/api/leaves/${id}`);
              if (!res.data.success) {
                fetchLeaves(user.employeeId || user.id || user._id, false); // revert if failed
                Alert.alert("Error", "Failed to deleted the leave. Try again");
              } else {
                Alert.alert("Success", "Leave request deleted successfully.");
              }
            } catch (err) {
              Alert.alert("Error", "Failed to deleted the leave. Please try again after sometime.");
              fetchLeaves(user.employeeId || user.id || user._id, false);
            }
          }
        }
      ]
    );
  };

  const getStatusStyle = (status: any) => {
    switch (status) {
      case 'Approved': return { backgroundColor: '#dcfce7', borderColor: '#bbf7d0', textColor: '#166534' };
      case 'Rejected': return { backgroundColor: '#ffe4e6', borderColor: '#fecdd3', textColor: '#be123c' };
      case 'Pending': return { backgroundColor: '#fef3c7', borderColor: '#fde68a', textColor: '#92400e' };
      default: return { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0', textColor: '#1e293b' };
    }
  };

  const renderLeaveCard = ({ item: leave }: any) => {
    const statusStyle = getStatusStyle(leave.status);
    
    return (
      <TouchableOpacity 
        activeOpacity={0.7}
        onPress={() => { setSelectedLeave(leave); setIsViewModalOpen(true); }}
        style={{ marginHorizontal: 19, paddingTop: 9.5, paddingBottom: 10 }} 
        className="bg-white rounded-2xl px-5 mb-4 shadow-sm border border-slate-100"
      >
        {/* Header: ID & Status */}
        <View className="flex-row justify-between items-center mb-2">
          <Text style={{ fontSize: 16, fontWeight: '600' }} className="font-semibold text-[#011023] text-[14px] uppercase tracking-wider">{leave.leaveId}</Text>
          <View className="rounded-full items-center justify-center" style={{ backgroundColor: statusStyle.backgroundColor, borderColor: statusStyle.borderColor, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2 }}>
            <Text className="text-[11px] font-semibold uppercase" style={{ color: statusStyle.textColor }}>
              {leave.status}
            </Text>
          </View>
        </View>

        {/* Leave Type & Duration Info */}
        <View className="flex-row justify-between mb-2">
          <View className="flex-1 border-r border-slate-200 pr-3 items-start justify-center">
            <Text className="text-[14px] font-semibold text-[#011023] uppercase truncate mb-1" numberOfLines={1}>{leave.type}</Text>
            <Text className="text-[12px] text-slate-500 uppercase font-semibold pr-1">{leave.leaveTime}</Text>
          </View>

          <View className="flex-1 pl-3 justify-center" style={{ alignItems: 'flex-end' }}>
            <Text className="text-[14px] font-semibold text-[#011023] uppercase truncate mb-1" numberOfLines={1}>{leave.totalDays} {leave.totalDays > 1 ? "Day's" : 'Day'}</Text>
            <Text className="text-[12px] text-slate-500 font-semibold uppercase">Duration</Text>
          </View>
        </View>

        {/* Dates Info */}
        <View>
          <Text className="text-[13px] font-semibold text-[#011023] uppercase">
            Starts {new Date(leave.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '-')} | {leave.startTime} till {new Date(leave.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')} | {leave.endTime}
          </Text>
          {/* <Text className="text-[12px] text-slate-500 uppercase mt-1 font-medium truncate" numberOfLines={1}>{leave.reason}</Text> */}
        </View>
      </TouchableOpacity>
    );
  };

  const filteredLeaves = leaves.filter(leave => {
    const matchesSearch = !searchQuery || (
      leave.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      leave.reason?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const matchesFilter = filterStatus === 'All' || leave.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <View className="flex-1 bg-slate-50">
      
      {/* Search Bar & Filter & Apply Leave */}
      <View className="px-5 flex-row items-stretch" style={{ marginVertical: 14, gap: 1 }}>
        <View className="flex-1 flex-row bg-white rounded-2xl px-4 border border-slate-100 shadow-sm" style={{ alignItems: 'center', paddingVertical: 7 }}>
          <Search size={20} color="#64748b" strokeWidth={2} />
          <TextInput
            className="flex-1 ml-3 text-[15px] font-semibold uppercase text-[#011023]"
            style={{ paddingVertical: 5 }}
            placeholder="Search leaves..."
            placeholderTextColor="#bdc6d1ff"
            value={searchQuery}
            onChangeText={setSearchQuery}
            selectionColor="#011023"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}  className="p-1 rounded-full">
              <X size={14} color="#64748b" strokeWidth={3} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={() => { setTempFilterStatus(filterStatus); setIsFilterModalOpen(true); }} 
           style={{ paddingHorizontal: 10 }} className="ml-2.5 bg-white rounded-2xl border border-slate-100 shadow-sm justify-center items-center">
          <SlidersHorizontal size={20} color="#011023" strokeWidth={2} />
        </TouchableOpacity>

        <TouchableOpacity 
           onPress={() => {
             if (pendingLeave) {
               Alert.alert('Notice', 'Kindly ask the manager to approve or reject the current leave to apply for a new leave');
               return;
             }
             resetForm();
             setIsApplyModalOpen(true);
           }}
           style={{ paddingHorizontal: 9 }}
           className={`ml-2.5 bg-white rounded-2xl border border-slate-100 shadow-sm justify-center items-center ${pendingLeave ? 'opacity-50' : ''}`}
        >
           <Plus size={22} color="#011023" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#011023" />
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={filteredLeaves}
          keyExtractor={item => item._id}
          renderItem={renderLeaveCard}
          contentContainerStyle={{ paddingTop: 0 }}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          overScrollMode="never"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#011023" />}
          ListEmptyComponent={
            <View className="p-10 items-center justify-center">
              <Text className="text-slate-400 font-bold uppercase tracking-widest text-sm">No Leaves Found</Text>
            </View>
          }
        />
      )}

      {/* --- MODALS --- */}

      {/* Apply Leave Modal */}
      <Modal visible={isApplyModalOpen} animationType="slide" transparent={true} onRequestClose={() => setIsApplyModalOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <BlurView intensity={20} tint="dark" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} />
            <TouchableOpacity activeOpacity={1} onPress={() => { setIsApplyModalOpen(false); resetForm(); }} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} />
            
            <View className="bg-[#f5f7f9] shadow-2xl overflow-hidden" style={{ maxHeight: '80%', width: '91%', borderRadius: 35 }}>
              <View style={{ paddingTop: 22, paddingBottom: 7, paddingHorizontal: 20 }} className=" flex-row justify-between items-center relative">
                <View style={{ width: 20, paddingTop: 20 }} />
                <Text className="text-[18px] font-bold text-[#011023] text-center uppercase tracking-wide flex-1">Apply For Leave</Text>
                <TouchableOpacity onPress={() => { setIsApplyModalOpen(false); resetForm(); }}>
                  <X size={20} color="#011023" />
                </TouchableOpacity>
              </View>

              <ScrollView className="p-6" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <View className="flex-row items-center justify-between mb-4 relative" style={{ zIndex: 100, elevation: 100 }}>
                  <Text style={{ fontSize: 13}} className="font-semibold text-slate-500 uppercase tracking-widest">Leave Type</Text>
                  
                  <TouchableOpacity 
                    onPress={() => {
                      setIsLeaveTypeDropdownOpen(!isLeaveTypeDropdownOpen);
                      setIsLeavePeriodDropdownOpen(false);
                      setIsStartTimeDropdownOpen(false);
                      setIsEndTimeDropdownOpen(false);
                    }}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', paddingHorizontal: 16, height: 32, borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', width: 215 }}
                  >
                    <Text style={{ fontWeight: '500', textTransform: 'uppercase', fontSize: 12.5, color: '#011023', letterSpacing: 0.5 }}>{formData.type}</Text>
                  </TouchableOpacity>

                  {isLeaveTypeDropdownOpen && (
                    <View className="bg-white border border-slate-200 rounded-[18px] mt-1 shadow-sm overflow-hidden absolute top-full right-0 z-50" style={{ width: 215, borderRadius:14, maxHeight: 150 }}>
                      <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
                        {['', 'Sick Leave', 'Casual Leave', 'Planned Leave', 'Emergency Leave'].map((type) => (
                          <TouchableOpacity
                            key={type}
                            onPress={() => {
                              setFormData({...formData, type});
                              setIsLeaveTypeDropdownOpen(false);
                            }}
                            className={`flex-row items-center justify-center relative ${formData.type === type ? 'bg-slate-50' : 'bg-white'}`}
                            style={{ paddingVertical: 6 }}
                          >
                            <Text className={`font-semibold uppercase text-[12.5px] tracking-wide text-center ${formData.type === type ? 'text-[#011023]' : 'text-slate-500'}`}>
                              {type}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>

                <View className="flex-row items-center justify-between mb-4 relative" style={{ zIndex: 90, elevation: 90 }}>
                  <Text style={{ fontSize: 13 }} className="font-semibold text-slate-500 uppercase tracking-widest">Duration</Text>
                  
                  <TouchableOpacity 
                    onPress={() => {
                      setIsLeavePeriodDropdownOpen(!isLeavePeriodDropdownOpen);
                      setIsLeaveTypeDropdownOpen(false);
                      setIsStartTimeDropdownOpen(false);
                      setIsEndTimeDropdownOpen(false);
                    }}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', paddingHorizontal: 16, height: 32, borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', width: 215 }}
                  >
                    <Text style={{ fontWeight: '500', textTransform: 'uppercase', fontSize: 12.5, color: '#011023', letterSpacing: 0.5 }}>{formData.leaveTime}</Text>
                  </TouchableOpacity>

                  {isLeavePeriodDropdownOpen && (
                    <View className="bg-white border border-slate-200 rounded-2xl mt-1 shadow-sm overflow-hidden absolute top-full right-0 z-50" style={{ width: 215, borderRadius:14, maxHeight: 180 }}>
                      <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
                        {['', 'Full Day', 'Half Day'].map((time) => (
                          <TouchableOpacity
                            key={time}
                            onPress={() => {
                              let newStartTime = formData.startTime;
                              if (time === 'Full Day') {
                                newStartTime = '09:00';
                              }
                              const newEndTime = calculateEndTime(newStartTime, time);
                              
                              const updates: any = { leaveTime: time, startTime: newStartTime, endTime: newEndTime || formData.endTime };
                              if (time === 'Half Day' && formData.startDate) {
                                updates.endDate = formData.startDate;
                              }
                              
                              setFormData({...formData, ...updates});
                              setIsLeavePeriodDropdownOpen(false);
                            }}
                            className={`flex-row items-center justify-center relative ${formData.leaveTime === time ? 'bg-slate-50' : 'bg-white'}`}
                            style={{ paddingVertical: 6 }}
                          >
                            <Text className={`font-semibold uppercase text-[12.5px] tracking-wide text-center ${formData.leaveTime === time ? 'text-[#011023]' : 'text-slate-500'}`}>
                              {time}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>

                <View className="flex-row items-center justify-between mb-4 relative" style={{ zIndex: 80, elevation: 80 }}>
                  <Text style={{ fontSize: 13 }} className="font-semibold text-slate-500 uppercase tracking-widest">Start Date</Text>
                  <View className="flex-row gap-2" style={{ width: 215 }}>
                    <TouchableOpacity 
                      onPress={() => {
                        setIsStartDateModalOpen(true);
                        setIsStartTimeDropdownOpen(false);
                        setIsEndTimeDropdownOpen(false);
                        setIsLeaveTypeDropdownOpen(false);
                        setIsLeavePeriodDropdownOpen(false);
                      }}
                      className="bg-white border border-slate-200 flex-row items-center justify-center"
                      style={{ width: '60%', height: 32, borderRadius: 10 }}
                    >
                      <Text className={`font-semibold uppercase text-center text-[12px] tracking-widest ${formData.startDate ? 'text-[#011023]' : 'text-slate-400'}`}>
                        {formData.startDate}
                      </Text>
                    </TouchableOpacity>
                    <View style={{ width: '35%' }}>
                      <TouchableOpacity 
                        disabled={formData.leaveTime === 'Full Day'}
                        onPress={() => {
                          setIsStartTimeDropdownOpen(!isStartTimeDropdownOpen);
                          setIsEndTimeDropdownOpen(false);
                          setIsLeaveTypeDropdownOpen(false);
                          setIsLeavePeriodDropdownOpen(false);
                        }}
                        style={{ height: 32, borderRadius: 10 }}
                        className={`bg-white border border-slate-200 flex-row items-center justify-center ${formData.leaveTime === 'Full Day' ? 'opacity-80' : ''}`}
                      >
                        <Text style={{ fontWeight: '600', textTransform: 'uppercase', fontSize: 12, color: '#011023', letterSpacing: 1 }}>{formData.startTime}</Text>
                      </TouchableOpacity>

                      {isStartTimeDropdownOpen && (
                        <View className="bg-white border border-slate-200 rounded-xl mt-1 shadow-sm overflow-hidden absolute top-full right-0 z-50" style={{ width: 75, maxHeight: 230 }}>
                          <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
                            {(formData.leaveTime === 'Full Day' ? ['', '09:00'] : ['', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00']).map((time) => (
                              <TouchableOpacity
                                key={time}
                                onPress={() => {
                                  const newEndTime = calculateEndTime(time, formData.leaveTime);
                                  setFormData({...formData, startTime: time, endTime: newEndTime || formData.endTime});
                                  setIsStartTimeDropdownOpen(false);
                                }}
                                className={`flex-row items-center justify-center relative ${formData.startTime === time ? 'bg-slate-50' : 'bg-white'}`}
                                style={{ paddingVertical: 7 }}
                              >
                                <Text className={`font-semibold uppercase text-[12px] tracking-wide text-center ${formData.startTime === time ? 'text-[#011023]' : 'text-slate-500'}`}>
                                  {time}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                <View className="flex-row items-center justify-between mb-4 relative" style={{ zIndex: 70, elevation: 70 }}>
                  <Text style={{ fontSize: 13 }} className="font-semibold text-slate-500 uppercase tracking-widest">End Date</Text>
                  <View className="flex-row gap-2" style={{ width: 215 }}>
                    <TouchableOpacity 
                      disabled={formData.leaveTime === 'Half Day'}
                      onPress={() => {
                        setIsEndDateModalOpen(true);
                        setIsStartTimeDropdownOpen(false);
                        setIsEndTimeDropdownOpen(false);
                        setIsLeaveTypeDropdownOpen(false);
                        setIsLeavePeriodDropdownOpen(false);
                      }}
                      className={`border border-slate-200 flex-row items-center justify-center ${formData.leaveTime === 'Half Day' ? 'bg-slate-50 opacity-80' : 'bg-white'}`}
                      style={{ width: '60%', height: 32, borderRadius: 10 }}
                    >
                      <Text className={`font-semibold uppercase text-center text-[12px] tracking-widest ${formData.endDate ? 'text-[#011023]' : 'text-slate-400'}`}>
                        {formData.endDate}
                      </Text>
                    </TouchableOpacity>
                    <View style={{ width: '35%' }}>
                      <TouchableOpacity 
                        disabled={formData.leaveTime === 'Full Day'}
                        onPress={() => {
                          setIsEndTimeDropdownOpen(!isEndTimeDropdownOpen);
                          setIsStartTimeDropdownOpen(false);
                          setIsLeaveTypeDropdownOpen(false);
                          setIsLeavePeriodDropdownOpen(false);
                        }}
                        style={{ height: 32, borderRadius: 10 }}
                        className={`bg-white border border-slate-200 flex-row items-center justify-center ${formData.leaveTime === 'Full Day' ? 'opacity-80' : ''}`}
                      >
                        <Text style={{ fontWeight: '600', textTransform: 'uppercase', fontSize: 12, color: '#011023', letterSpacing: 1 }}>{formData.endTime}</Text>
                      </TouchableOpacity>

                      {isEndTimeDropdownOpen && (
                        <View className="bg-white border border-slate-200 rounded-xl mt-1 shadow-sm overflow-hidden absolute top-full right-0 z-50" style={{ width: 75, maxHeight: 230 }}>
                          <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
                            {(formData.leaveTime === 'Full Day' ? ['', '21:00'] : ['', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00']).map((time) => (
                              <TouchableOpacity
                                key={time}
                                onPress={() => {
                                  const newStartTime = calculateStartTime(time, formData.leaveTime);
                                  setFormData({...formData, endTime: time, startTime: newStartTime || formData.startTime});
                                  setIsEndTimeDropdownOpen(false);
                                }}
                                className={`flex-row items-center justify-center relative ${formData.endTime === time ? 'bg-slate-50' : 'bg-white'}`}
                                style={{ paddingVertical: 7 }}
                              >
                                <Text className={`font-semibold uppercase text-[12px] tracking-wide text-center ${formData.endTime === time ? 'text-[#011023]' : 'text-slate-500'}`}>
                                  {time}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                <Text style={{ fontSize: 12 }} className="font-semibold text-slate-500 uppercase tracking-widest mb-3">Please provide a Reason for the leave</Text>
                <TextInput 
                  className="bg-white border rounded-xl px-4 py-4 font-semibold text-[#011023] mb-2"
                  autoCapitalize="characters"
                  multiline
                  numberOfLines={3}
                  style={{ 
                    minHeight: 80, 
                    textAlignVertical: 'top',
                    borderColor: (formData.reason || '').trim().length > 0 && (formData.reason || '').trim().split(/\s+/).filter(w => w.length > 0).length < 10 ? '#f87171' : '#e2e8f0'
                  }}
                  value={formData.reason}
                  onChangeText={(t) => setFormData({...formData, reason: t})}
                />
                {(formData.reason || '').trim().length > 0 && (formData.reason || '').trim().split(/\s+/).filter(w => w.length > 0).length < 10 ? (
                  <Text className="text-red-500 text-[11px] font-semibold mb-5 tracking-wide uppercase">Minimum 10 words required</Text>
                ) : (
                  <View style={{ marginBottom: 20 }} />
                )}

                <TouchableOpacity 
                  disabled={isSubmitting}
                  onPress={handleSubmit}
                  className="bg-[#011023] rounded-2xl py-4 items-center uppercase justify-center flex-row mb-1 shadow-sm"
                >
                  <Text className="text-white font-bold uppercase tracking-widest text-[14px]">Submit Request</Text>
                </TouchableOpacity>

              </ScrollView>
            </View>

            {isApplyModalOpen && isStartDateModalOpen && (
              <NativeDatePicker 
                visible={isStartDateModalOpen}
                onClose={() => setIsStartDateModalOpen(false)}
                valueStr={formData.startDate}
                minDateStr=""
                title="SELECT START DATE"
                onSelect={(date: string) => {
                   setFormData(prev => {
                     const updates: any = { startDate: date };
                     if (prev.leaveTime === 'Half Day') {
                       updates.endDate = date;
                     } else if (prev.endDate) {
                       const parse = (s: string) => {
                         const p = s.split('-');
                         return new Date(Number(p[2]), Number(p[1])-1, Number(p[0]));
                       };
                       if (parse(date) > parse(prev.endDate)) {
                         updates.endDate = date;
                       }
                     }
                     return { ...prev, ...updates };
                   });
                }}
              />
            )}
            
            {isApplyModalOpen && isEndDateModalOpen && (
              <NativeDatePicker 
                visible={isEndDateModalOpen}
                onClose={() => setIsEndDateModalOpen(false)}
                valueStr={formData.endDate || formData.startDate}
                minDateStr={formData.startDate}
                title="Select End Date"
                onSelect={(date: string) => setFormData({...formData, endDate: date})}
              />
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* View Modal */}
      <Modal visible={isViewModalOpen} animationType="slide" transparent={true} onRequestClose={() => setIsViewModalOpen(false)}>
        {isViewModalOpen && (
          <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
          <BlurView intensity={20} tint="dark" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} />
          <TouchableOpacity activeOpacity={1} onPress={() => setIsViewModalOpen(false)} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} />
          <View className="bg-white shadow-2xl overflow-hidden" style={{ maxHeight: '85%', width: '98%', borderRadius: 40, padding: 10 }}>
            {/* Modal Header */}
            <View style={{ paddingTop: 15 }} className="px-5 flex-row justify-between items-center">
              <View>
                <Text className="text-[18px] font-semibold text-[#011023] uppercase">Leave Details</Text>
                <Text style={{ marginTop: 2 }} className="text-sm text-slate-700 font-semibold tracking-wider">ID: {selectedLeave?.leaveId}</Text>
              </View>
              <TouchableOpacity onPress={() => setIsViewModalOpen(false)}>
                <X size={20} color="#011023" />
              </TouchableOpacity>
            </View>

            <ScrollView className="p-5" contentContainerStyle={{ paddingBottom: 0 }}>
              <Text style={{ fontSize: 15 }} className="font-semibold text-slate-500 uppercase tracking-widest mb-1">Overview</Text>
              <View className="mb-3" style={{ paddingVertical: 10, gap: 5 }}>
                <View className="flex-row items-center justify-between">
                  <Text className="text-slate-700 uppercase font-semibold pr-1">Leave Type</Text>
                  <Text className="text-[#011023] font-semibold uppercase text-right flex-shrink-1 pr-1">{selectedLeave?.type}</Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-slate-700 uppercase font-semibold pr-1">Leave Period</Text>
                  <Text className="text-[#011023] font-semibold uppercase text-right flex-shrink-1 pr-1">{selectedLeave?.leaveTime}</Text>
                </View>
              </View>

              <Text style={{ fontSize: 15 }} className="font-semibold text-slate-500 uppercase tracking-widest mb-1">Dates & Duration</Text>
              <View className="mb-3" style={{ paddingVertical: 10, gap: 5 }}>
                <View className="flex-row items-center justify-between">
                  <Text className="text-slate-700 uppercase font-semibold pr-1">Start Date</Text>
                  <Text className="text-[#011023] font-semibold uppercase text-right flex-shrink-1">
                    {new Date(selectedLeave?.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    {selectedLeave?.startTime ? ` | ${selectedLeave.startTime}` : ''}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-slate-700 uppercase font-semibold pr-1">End Date</Text>
                  <Text className="text-[#011023] font-semibold uppercase text-right flex-shrink-1">
                    {new Date(selectedLeave?.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    {selectedLeave?.endTime ? ` | ${selectedLeave.endTime}` : ''}
                  </Text>
                </View>
              </View>

              <Text style={{ fontSize: 15 }} className="font-semibold text-slate-500 uppercase tracking-widest mb-2">Reason</Text>
                <View >
                  <Text className="font-semibold text-[#011023] text-[14px] uppercase text-justify mb-4">{selectedLeave?.reason}</Text>
                </View>

              <Text style={{ fontSize: 15 }} className="font-semibold text-slate-500 uppercase tracking-widest mb-1">Status & Duration</Text>
              <View className="mb-3" style={{ paddingVertical: 1, gap: 5 }}>
                <View className="flex-row items-center justify-between mt-2">
                  <Text className="text-slate-700 uppercase font-semibold pr-1">Status</Text>
                  <View className="rounded-full items-center justify-center" style={{ ...getStatusStyle(selectedLeave?.status), borderWidth: 1, paddingHorizontal: 10, paddingVertical: 2 }}>
                    <Text className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: getStatusStyle(selectedLeave?.status).textColor }}>{selectedLeave?.status}</Text>
                  </View>
                </View>
                
                <View className="flex-row mb-2 items-center justify-between">
                  <Text className="text-slate-700 uppercase font-semibold pr-1">Duration</Text>
                  <Text className="text-[#011023] font-semibold uppercase text-right flex-shrink-1" numberOfLines={1}>{selectedLeave?.totalDays} {selectedLeave?.totalDays > 1 ? "Day's" : 'Day'}</Text>
                </View>
              </View>
              
              {selectedLeave?.status !== 'Pending' && selectedLeave?.remarks && (
                <>
                  <Text style={{ fontSize: 15 }} className="font-semibold text-slate-500 uppercase tracking-widest mb-2">Remarks</Text>
                  <View>
                      <Text className="font-semibold text-[#011023] text-[14px] uppercase text-justify mb-2">{selectedLeave.remarks}</Text>
                  </View>
                </>
              )}
              
              {selectedLeave?.status === 'Approved' && selectedLeave?.leaveTime === 'Full Day' && !selectedLeave?.leaveId?.endsWith('E') && (
                <TouchableOpacity 
                  onPress={handleExtendLeave} 
                  style={{ backgroundColor: '#011023', paddingVertical: 15, borderRadius: 18, alignItems: 'center', marginBottom: 5, marginTop: 20 }}
                >
                  <Text style={{ color: 'white', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 13 }}>Extend Leave</Text>
                </TouchableOpacity>
              )}

              {selectedLeave?.status === 'Pending' && (
                <TouchableOpacity 
                  onPress={() => handleDelete(selectedLeave?._id)} 
                  style={{ paddingVertical: 15, borderRadius: 18, alignItems: 'center', marginBottom: 10, borderWidth: 1.5, borderColor: '#fecdd3', backgroundColor: '#fff1f2', flexDirection: 'row', justifyContent: 'center' }}
                >
                  <Trash2 size={18} color="#be123c" />
                  <Text style={{ color: '#be123c', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 13, marginLeft: 8 }}>Cancel Leave</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        
      {/* Extend Leave Modal */}
      {isExtendModalOpen && (
        <View style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0, zIndex: 9999, elevation: 9999 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <BlurView intensity={20} tint="dark" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} />
            <TouchableOpacity activeOpacity={1} onPress={() => { setIsExtendModalOpen(false); resetForm(); }} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} />
            
            <View className="bg-[#f5f7f9] shadow-2xl overflow-hidden" style={{ maxHeight: '80%', width: '91%', borderRadius: 35 }}>
              <View style={{ paddingTop: 22, paddingBottom: 7, paddingHorizontal: 20 }} className=" flex-row justify-between items-center relative">
                <View style={{ width: 20, paddingTop: 20 }} />
                <Text className="text-[18px] font-bold text-[#011023] text-center uppercase tracking-wide flex-1">Extend Leave</Text>
                <TouchableOpacity onPress={() => { setIsExtendModalOpen(false); resetForm(); }}>
                  <X size={20} color="#011023" />
                </TouchableOpacity>
              </View>

              <ScrollView className="p-6" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <View className="flex-row items-center justify-between mb-4 relative" style={{ zIndex: 100, elevation: 100 }}>
                  <Text style={{ fontSize: 13}} className="font-semibold text-slate-500 uppercase tracking-widest">Leave Type</Text>
                  
                  <TouchableOpacity 
                    disabled={true}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', paddingHorizontal: 16, height: 32, borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', width: 215, opacity: 0.6 }}
                  >
                    <Text style={{ fontWeight: '500', textTransform: 'uppercase', fontSize: 12.5, color: '#011023', letterSpacing: 0.5 }}>{formData.type}</Text>
                  </TouchableOpacity>
                </View>

                <View className="flex-row items-center justify-between mb-4 relative" style={{ zIndex: 90, elevation: 90 }}>
                  <Text style={{ fontSize: 13 }} className="font-semibold text-slate-500 uppercase tracking-widest">Duration</Text>
                  
                  <TouchableOpacity 
                    disabled={true}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', paddingHorizontal: 16, height: 32, borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', width: 215, opacity: 0.6 }}
                  >
                    <Text style={{ fontWeight: '500', textTransform: 'uppercase', fontSize: 12.5, color: '#011023', letterSpacing: 0.5 }}>{formData.leaveTime}</Text>
                  </TouchableOpacity>
                </View>

                <View className="flex-row items-center justify-between mb-4 relative" style={{ zIndex: 80, elevation: 80 }}>
                  <Text style={{ fontSize: 13 }} className="font-semibold text-slate-500 uppercase tracking-widest">Start Date</Text>
                  <View className="flex-row gap-2" style={{ width: 215 }}>
                    <TouchableOpacity 
                      disabled={true}
                      className="bg-slate-50 border border-slate-200 flex-row items-center justify-center"
                      style={{ width: '60%', height: 32, borderRadius: 10, opacity: 0.6 }}
                    >
                      <Text className={`font-semibold uppercase text-center text-[12px] tracking-widest ${formData.startDate ? 'text-[#011023]' : 'text-slate-400'}`}>
                        {formData.startDate}
                      </Text>
                    </TouchableOpacity>
                    <View style={{ width: '35%' }}>
                      <TouchableOpacity 
                        disabled={true}
                        style={{ height: 32, borderRadius: 10, opacity: 0.6 }}
                        className="bg-slate-50 border border-slate-200 flex-row items-center justify-center"
                      >
                        <Text style={{ fontWeight: '600', textTransform: 'uppercase', fontSize: 12, color: '#011023', letterSpacing: 1 }}>{formData.startTime}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <View className="flex-row items-center justify-between mb-4 relative" style={{ zIndex: 70, elevation: 70 }}>
                  <Text style={{ fontSize: 13 }} className="font-semibold text-slate-500 uppercase tracking-widest">End Date</Text>
                  <View className="flex-row gap-2" style={{ width: 215 }}>
                    <TouchableOpacity 
                      disabled={formData.leaveTime === 'Half Day'}
                      onPress={() => {
                        setIsEndDateModalOpen(true);
                        setIsStartTimeDropdownOpen(false);
                        setIsEndTimeDropdownOpen(false);
                        setIsLeaveTypeDropdownOpen(false);
                        setIsLeavePeriodDropdownOpen(false);
                      }}
                      className={`border border-slate-200 flex-row items-center justify-center ${formData.leaveTime === 'Half Day' ? 'bg-slate-50 opacity-80' : 'bg-white'}`}
                      style={{ width: '60%', height: 32, borderRadius: 10 }}
                    >
                      <Text className={`font-semibold uppercase text-center text-[12px] tracking-widest ${formData.endDate ? 'text-[#011023]' : 'text-slate-400'}`}>
                        {formData.endDate}
                      </Text>
                    </TouchableOpacity>
                    <View style={{ width: '35%' }}>
                      <TouchableOpacity 
                        disabled={formData.leaveTime === 'Full Day'}
                        onPress={() => {
                          setIsEndTimeDropdownOpen(!isEndTimeDropdownOpen);
                          setIsStartTimeDropdownOpen(false);
                          setIsLeaveTypeDropdownOpen(false);
                          setIsLeavePeriodDropdownOpen(false);
                        }}
                        style={{ height: 32, borderRadius: 10 }}
                        className={`bg-white border border-slate-200 flex-row items-center justify-center ${formData.leaveTime === 'Full Day' ? 'opacity-80' : ''}`}
                      >
                        <Text style={{ fontWeight: '600', textTransform: 'uppercase', fontSize: 12, color: '#011023', letterSpacing: 1 }}>{formData.endTime}</Text>
                      </TouchableOpacity>

                      {isEndTimeDropdownOpen && (
                        <View className="bg-white border border-slate-200 rounded-xl mt-1 shadow-sm overflow-hidden absolute top-full right-0 z-50" style={{ width: 75, maxHeight: 230 }}>
                          <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
                            {(formData.leaveTime === 'Full Day' ? ['', '21:00'] : ['', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00']).map((time) => (
                              <TouchableOpacity
                                key={time}
                                onPress={() => {
                                  const newStartTime = calculateStartTime(time, formData.leaveTime);
                                  setFormData({...formData, endTime: time, startTime: newStartTime || formData.startTime});
                                  setIsEndTimeDropdownOpen(false);
                                }}
                                className={`flex-row items-center justify-center relative ${formData.endTime === time ? 'bg-slate-50' : 'bg-white'}`}
                                style={{ paddingVertical: 7 }}
                              >
                                <Text className={`font-semibold uppercase text-[12px] tracking-wide text-center ${formData.endTime === time ? 'text-[#011023]' : 'text-slate-500'}`}>
                                  {time}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                <Text style={{ fontSize: 12 }} className="font-semibold text-slate-500 uppercase tracking-widest mb-3">Please provide a Reason for the leave</Text>
                <TextInput 
                  className="bg-white border rounded-xl px-4 py-4 font-semibold text-[#011023] mb-2"
                  autoCapitalize="characters"
                  multiline
                  numberOfLines={3}
                  style={{ 
                    minHeight: 80, 
                    textAlignVertical: 'top',
                    borderColor: (formData.reason || '').trim().length > 0 && (formData.reason || '').trim().split(/\s+/).filter(w => w.length > 0).length < 10 ? '#f87171' : '#e2e8f0'
                  }}
                  value={formData.reason}
                  onChangeText={(t) => setFormData({...formData, reason: t})}
                />
                {(formData.reason || '').trim().length > 0 && (formData.reason || '').trim().split(/\s+/).filter(w => w.length > 0).length < 10 ? (
                  <Text className="text-red-500 text-[11px] font-semibold mb-5 ml-2 tracking-wide uppercase">Minimum 10 words required</Text>
                ) : (
                  <View style={{ marginBottom: 20 }} />
                )}

                <TouchableOpacity 
                  disabled={isSubmitting}
                  onPress={handleSubmit}
                  className="bg-[#011023] rounded-2xl py-4 items-center uppercase justify-center flex-row mb-1 shadow-sm"
                >
                  <Text className="text-white font-bold uppercase tracking-widest text-[14px]">Submit Request</Text>
                </TouchableOpacity>

              </ScrollView>
            </View>

            {isExtendModalOpen && isStartDateModalOpen && (
              <NativeDatePicker 
                visible={isStartDateModalOpen}
                onClose={() => setIsStartDateModalOpen(false)}
                valueStr={formData.startDate}
                minDateStr=""
                title="SELECT START DATE"
                onSelect={(date: string) => {
                   setFormData(prev => {
                     const updates: any = { startDate: date };
                     if (prev.leaveTime === 'Half Day') {
                       updates.endDate = date;
                     } else if (prev.endDate) {
                       const parse = (s: string) => {
                         const p = s.split('-');
                         return new Date(Number(p[2]), Number(p[1])-1, Number(p[0]));
                       };
                       if (parse(date) > parse(prev.endDate)) {
                         updates.endDate = date;
                       }
                     }
                     return { ...prev, ...updates };
                   });
                }}
              />
            )}
            
            {isExtendModalOpen && isEndDateModalOpen && (
              <NativeDatePicker 
                visible={isEndDateModalOpen}
                onClose={() => setIsEndDateModalOpen(false)}
                valueStr={formData.endDate || formData.startDate}
                minDateStr={formData.startDate}
                title="Select End Date"
                onSelect={(date: string) => setFormData({...formData, endDate: date})}
              />
            )}
          </View>
        </KeyboardAvoidingView>
              </View>
      )}
</View>
        )}
      </Modal>

      {/* Filter Modal */}
      <Modal visible={isFilterModalOpen} animationType="fade" transparent={true} onRequestClose={() => setIsFilterModalOpen(false)}>
        {isFilterModalOpen && (
          <View className="flex-1 justify-center items-center">
            <BlurView intensity={20} tint="dark" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} />
            <TouchableOpacity activeOpacity={1} className="absolute inset-0" />
            <TouchableWithoutFeedback onPress={() => { if (isStatusDropdownOpen) setIsStatusDropdownOpen(false); }}>
              <View className="bg-white rounded-[24px] shadow-2xl w-[340px]" style={{ backgroundColor: 'white', padding: 24, borderRadius: 24, width: 340, height: 220, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <View className="items-center relative justify-center flex-row">
                  <Text className="text-[18px] font-bold text-[#011023] uppercase tracking-wide">Filter</Text>
                </View>

                <View className="flex-row items-center justify-center z-10 w-full">
                  <View>
                    <Text className="text-[14px] font-semibold text-slate-500 uppercase tracking-widest">Status in</Text>
                  </View>
                  <View className="relative" style={{ width: 130, marginLeft: 20 }}>
                    <TouchableOpacity 
                      onPress={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', paddingHorizontal: 16, height: 30, borderRadius: 24, borderWidth: 1, borderColor: '#e2e8f0', width: 130 }}
                    >
                      <Text style={{ fontWeight: '500', textTransform: 'uppercase', fontSize: 13, color: '#011023', letterSpacing: 0.5 }}>{tempFilterStatus}</Text>
                    </TouchableOpacity>

                    {isStatusDropdownOpen && (
                      <View className="bg-white border border-slate-200 rounded-xl mt-1 shadow-sm overflow-hidden absolute top-full left-0 z-50" style={{ width: 130, maxHeight: 180 }}>
                        <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
                          {['All', 'Pending', 'Approved', 'Rejected'].map((statusOption) => (
                            <TouchableOpacity
                              key={statusOption}
                              onPress={() => {
                                setTempFilterStatus(statusOption);
                                setIsStatusDropdownOpen(false);
                              }}
                              className={`flex-row items-center justify-center relative ${tempFilterStatus === statusOption ? 'bg-slate-50' : 'bg-white'}`}
                              style={{ paddingVertical: 5 }}
                            >
                              <Text className={`font-semibold uppercase text-[14px] tracking-wide text-center ${tempFilterStatus === statusOption ? 'text-[#011023]' : 'text-slate-500'}`}>
                                {statusOption}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                </View>
                
                {/* Action Buttons */}
                <View className="flex-row border-t border-slate-100 justify-between items-center" style={{ paddingTop: 16, marginTop: 8, gap: 15 }}>
                  <TouchableOpacity 
                    onPress={() => setIsFilterModalOpen(false)} 
                    style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', borderColor: '#e2e8f0', borderWidth: 1.5, borderRadius: 12, paddingVertical: 9 }}
                  >
                    <Text style={{ fontWeight: 'bold', color: '#3c4655ff', textTransform: 'uppercase', fontSize: 12, letterSpacing: 1 }}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    onPress={() => {
                      setFilterStatus(tempFilterStatus);
                      setIsFilterModalOpen(false);
                    }} 
                    style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#151a20ff', borderRadius: 12, paddingVertical: 9 }}
                  >
                    <Text style={{ fontWeight: 'bold', color: '#ffffff', textTransform: 'uppercase', fontSize: 12, letterSpacing: 1 }}>Apply</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        )}
      </Modal>

    </View>
  );
}
