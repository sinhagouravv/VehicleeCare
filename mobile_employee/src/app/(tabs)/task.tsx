import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, FlatList, RefreshControl, Modal, ScrollView, TextInput, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { Eye, Check, Loader2, X, Calendar, Clock, User, Phone, Car, Tag, Search, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

const API_URL = 'http://localhost:5001';

export default function TaskScreen() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [userId, setUserId] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [tempFilterStatus, setTempFilterStatus] = useState('All');

  // Modals state
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  
  const [showDurationModal, setShowDurationModal] = useState(false);
  const [durationDays, setDurationDays] = useState('');
  const [durationHours, setDurationHours] = useState('');
  const [isDaysDropdownOpen, setIsDaysDropdownOpen] = useState(false);
  const [isHoursDropdownOpen, setIsHoursDropdownOpen] = useState(false);
  
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const otpInputRef = useRef<any>(null);
  
  const [selectedTaskId, setSelectedTaskId] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const duration = (durationDays !== '' && durationHours !== '') ? `${durationDays} Day${durationDays !== '1' ? 's' : ''}, ${durationHours} Hour${durationHours !== '1' ? 's' : ''}` : '';

  useEffect(() => {
    loadUserAndFetchTasks();
  }, []);

  const loadUserAndFetchTasks = async () => {
    try {
      const storedUser = await SecureStore.getItemAsync('employeeUser');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setUserRole(user.role || '');
        const empId = user._id || user.id;
        setUserId(empId);
        if (empId) {
          fetchTasks(empId);
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

  const fetchTasks = async (empId: any, isRefresh = false) => {
    if (!empId) return;
    try {
      if (isRefresh) setRefreshing(true);
      const res = await axios.get(`${API_URL}/api/bookings/employee/${empId}`);
      if (res.data.success) {
        setTasks(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    fetchTasks(userId, true);
  }, [userId]);

  const handleUpdateStatus = async (id: any, newStatus: any) => {
    try {
      const res = await axios.put(`${API_URL}/api/bookings/${id}/status`, { status: newStatus });
      if (res.data.success) {
        setTasks(prev => prev.map(t => t._id === id ? { ...t, status: newStatus } : t));
        if (selectedTask?._id === id) {
          setSelectedTask((prev: any) => ({ ...prev, status: newStatus }));
        }
      }
    } catch (err) {
      console.error("Update failed:", err);
      Alert.alert('Error', 'Failed to update task status');
    }
  };

  const handleSendOTP = async (taskId: any) => {
    if (!taskId) return;
    const currentTask = tasks.find(t => t._id === taskId);
    if (!currentTask) return;

    setIsSubmitting(true);
    setSelectedTaskId(taskId);

    // Transition from In Progress -> In Service requires duration
    if (currentTask.status === 'In Progress' && !showDurationModal) {
      setDurationDays('');
      setDurationHours('');
      setShowDurationModal(true);
      setIsSubmitting(false);
      return;
    }

    setShowDurationModal(false);
    setShowOTPModal(true);
    setOtpInput('');

    try {
      const endpoint = currentTask.status === 'Completed' ? 'send-delivery-otp' : 'send-otp';
      const res = await axios.post(`${API_URL}/api/bookings/${taskId}/${endpoint}`);
      if (!res.data.success) {
        Alert.alert('Error', res.data.message || 'Failed to send OTP');
        setShowOTPModal(false);
        setSelectedTaskId(null);
      }
    } catch (err) {
      console.error("OTP send failed:", err);
      Alert.alert('Error', 'Connection error. Please try again.');
      setShowOTPModal(false);
      setSelectedTaskId(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOTP = async () => {
    const cleanOtp = otpInput.replace(/\s+/g, '');
    if (!cleanOtp || cleanOtp.length !== 6 || !selectedTaskId) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const currentTask = tasks.find(t => t._id === selectedTaskId);
      const currentStatus = currentTask?.status;
      const endpoint = currentStatus === 'Completed' ? 'verify-delivery-otp' : 'verify-otp';
      const body = currentStatus === 'Completed' ? { otp: cleanOtp } : { otp: cleanOtp, duration };

      const res = await axios.post(`${API_URL}/api/bookings/${selectedTaskId}/${endpoint}`, body);
      
      if (res.data.success) {
        const nextStatus = currentStatus === 'Completed' ? 'Delivered' : 'In Service';
        setTasks(prev => prev.map(t => t._id === selectedTaskId ? { ...t, status: nextStatus, serviceDuration: duration || t.serviceDuration } : t));
        
        if (selectedTask?._id === selectedTaskId) {
          setSelectedTask((prev: any) => ({ ...prev, status: nextStatus, serviceDuration: duration || prev.serviceDuration }));
        }

        setShowOTPModal(false);
        setShowDurationModal(false);
        setDurationDays('');
        setDurationHours('');
        setOtpInput('');
      } else {
        Alert.alert('Error', res.data.message || 'Invalid OTP');
      }
    } catch (err) {
      console.error("OTP verification failed:", err);
      Alert.alert('Error', 'OTP verification failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusStyle = (status: any) => {
    switch (status) {
      case 'Delivered': return { backgroundColor: '#dcfce7', borderColor: '#bbf7d0' };
      case 'Completed': return { backgroundColor: '#ccfbf1', borderColor: '#99f6e4' };
      case 'In Service': return { backgroundColor: '#e0e7ff', borderColor: '#c7d2fe' };
      case 'In Progress': return { backgroundColor: '#f3e8ff', borderColor: '#e9d5ff' };
      case 'Pending': return { backgroundColor: '#fef08a', borderColor: '#fde047' };
      case 'Cancelled': return { backgroundColor: '#ffe4e6', borderColor: '#fecdd3' };
      default: return { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' };
    }
  };

  const getStatusTextColor = (status: any) => {
    switch (status) {
      case 'Delivered': return '#166534';
      case 'Completed': return '#115e59';
      case 'In Service': return '#4338ca';
      case 'In Progress': return '#7e22ce';
      case 'Pending': return '#92400e';
      default: return '#1e293b';
    }
  };

  const renderTaskCard = ({ item: task }: any) => (
    <TouchableOpacity 
      activeOpacity={0.7}
      onPress={() => { setSelectedTask(task); setIsViewModalOpen(true); }}
      style={{ marginHorizontal: 20, paddingTop: 11, paddingBottom: 11 }} 
      className="bg-white rounded-2xl px-5 mb-4 shadow-sm border border-slate-100 mx-5"
    >
      {/* Header: ID & Status */}
      <View className="flex-row justify-between items-center mb-3">
        <Text  style={{ fontSize: 16, fontWeight: '600' }} className="font-semibold text-[#011023] text-[14px] uppercase tracking-wider">{task.bookingId}</Text>
        <View className="rounded-full items-center justify-center" style={{ ...getStatusStyle(task.status), borderWidth: 1, paddingHorizontal: 6, paddingVertical: 1 }}>
          <Text className="text-[11px] font-semibold uppercase" style={{ color: getStatusTextColor(task.status) }}>
            {task.status}
          </Text>
        </View>
      </View>

      {/* Customer & Vehicle Info */}
      <View className="flex-row justify-between mb-3">
        <View className="flex-1 border-r border-slate-200 pr-3 items-start justify-center">
          <Text className="text-[13.5px] font-semibold text-[#011023] uppercase truncate mb-1" numberOfLines={1}>{task.user?.name}</Text>
          <Text className="text-[12px] text-slate-500 font-semibold">{task.user?.phone}</Text>
        </View>

        <View className="flex-1 pl-3 justify-center" style={{ alignItems: 'flex-end' }}>
          <Text className="text-[13px] font-semibold text-[#011023] uppercase truncate mb-1" numberOfLines={1}>{task.vehicle?.make}</Text>
          <Text className="text-[11px] text-slate-500 font-semibold uppercase">{task.vehicle?.model} | {task.vehicle?.year}</Text>
        </View>
        
      </View>

      {/* Service Info */}
      <View>
        <Text className="text-[14px] font-semibold text-[#011023] uppercase">{task.service?.title}</Text>
        <Text className="text-[12px] text-slate-500 uppercase mt-1 font-medium">{task.schedule?.date} at {task.schedule?.time}</Text>
      </View>

    </TouchableOpacity>
  );

  const renderOTPModalContent = () => (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
      <BlurView intensity={20} tint="dark" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} />
      <TouchableOpacity activeOpacity={1} onPress={() => setShowOTPModal(false)} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} />
      
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <View className="bg-[#f5f7f9] shadow-2xl relative items-center w-full" style={{ width: '92%', borderRadius: 32, padding: 24, paddingTop: 32, paddingBottom: 24 }}>
          
          {/* Header */}
          <View className="items-center mb-8">
            <Text className="text-[19px] font-bold text-[#011023] uppercase tracking-wide">Verification</Text>
            <Text style={{ fontSize: 13.25 }} className="text-slate-500 font-semibold mt-2 uppercase tracking-wider text-center">Enter the OTP sent to customer</Text>
          </View>

          {/* Hidden Input for handling keyboard reliably */}
          <TextInput
            ref={otpInputRef}
            value={otpInput}
            onChangeText={(text) => setOtpInput(text.replace(/[^0-9]/g, '').slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
            className="absolute opacity-0 w-0 h-0"
          />

          {/* Visual OTP Boxes */}
          <TouchableOpacity 
            activeOpacity={1} 
            onPress={() => otpInputRef.current?.focus()}
            style={{ flexDirection: 'row', justifyContent: 'space-evenly', width: '100%', paddingHorizontal: 20, marginBottom: 25 }}
          >
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <View 
                key={index}
                style={{ 
                  width: 36, 
                  height: 40, 
                  borderRadius: 12, 
                  borderWidth: 1,
                  borderColor: otpInput.length === index ? '#10b981' : (otpInput[index] ? '#f8fafc' : '#e2e8f0')
                }}
                className={`bg-white items-center justify-center shadow-sm ${otpInput.length === index ? 'bg-emerald-50/20' : ''}`}
              >
                <Text style={{fontSize: 28, marginTop: 8, marginLeft: 2, fontWeight: '500'}} className="font-semibold text-[#011023]">{otpInput[index] ? '*' : ''}</Text>
              </View>
            ))}
          </TouchableOpacity>

          {/* Action Buttons */}
          <View className="flex-row border-t border-slate-100 justify-between items-center w-full" style={{ gap: 15, paddingTop: 16 }}>
            <TouchableOpacity 
              onPress={() => setShowOTPModal(false)} 
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', borderColor: '#e2e8f0', borderWidth: 1, borderRadius: 12, paddingVertical: 10 }}
            >
              <Text style={{ fontWeight: 'bold', color: '#3c4655ff', textTransform: 'uppercase', fontSize: 12, letterSpacing: 1 }}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              disabled={isSubmitting || otpInput.length !== 6}
              onPress={handleVerifyOTP}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: (otpInput.length !== 6) ? '#94a3b8' : '#151a20ff', borderRadius: 12, paddingVertical: 10, flexDirection: 'row' }}
            >
              {isSubmitting ? <Loader2 size={16} color="white" className="animate-spin mr-2" /> : null}
              <Text style={{ fontWeight: 'bold', color: '#ffffff', textTransform: 'uppercase', fontSize: 12, letterSpacing: 1 }}>Verify</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );

  const renderDurationModalContent = () => (
    <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, justifyContent: 'center', alignItems: 'center' }}>
      <BlurView intensity={20} tint="dark" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} />
      <TouchableOpacity activeOpacity={1} onPress={() => { setIsDaysDropdownOpen(false); setIsHoursDropdownOpen(false); }} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} />
      
      <TouchableWithoutFeedback onPress={() => { setIsDaysDropdownOpen(false); setIsHoursDropdownOpen(false); }}>
        <View className="bg-[#f5f7f9] shadow-2xl relative" style={{ width: '92%', borderRadius: 32, padding: 24, paddingTop: 32, paddingBottom: 24 }}>
        
        {/* Header */}
        <View className="items-center mb-8">
          <Text className="text-[19px] font-bold text-[#011023] uppercase tracking-wide">Service Duration</Text>
          {/* <Text className="text-slate-500 font-bold text-[11px] mt-2 uppercase tracking-widest">Enter the estimated time required</Text> */}
        </View>

        {/* Inputs */}
        <View className="flex-row gap-4 mb-8 z-50">
           <View className="flex-1 z-50">
             <Text className="text-[13px] font-bold text-[#011023] uppercase tracking-widest mb-3 text-center">Days</Text>
             <View className="relative z-50">
               <TouchableOpacity 
                 onPress={() => {
                   setIsDaysDropdownOpen(!isDaysDropdownOpen);
                   setIsHoursDropdownOpen(false);
                 }}
                 style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', height: 37, borderRadius: 13, borderWidth: 1.5, borderColor: '#f5efefff' }}
               >
                 <Text style={{ fontWeight: 'bold', fontSize: 14.5, color: durationDays ? '#000000ff' : '#94a3b8' }}>{durationDays || ''}</Text>
               </TouchableOpacity>

               {isDaysDropdownOpen && (
                 <View className="bg-white border border-slate-200 rounded-xl mb-1 shadow-md overflow-hidden absolute top-10 left-0 right-0 z-50" style={{ maxHeight: 210 }}>
                   <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
                     {['', '0', '1', '2', '3', '4', '5'].map((d) => (
                       <TouchableOpacity
                         key={d}
                         onPress={() => {
                           setDurationDays(d);
                           setIsDaysDropdownOpen(false);
                         }}
                         className={`flex-row items-center justify-center ${durationDays === d ? 'bg-slate-50' : 'bg-white'}`}
                         style={{ paddingVertical: 4, borderBottomWidth: d === '3' ? 0 : 0, borderBottomColor: '#f1f5f9' }}
                       >
                         <Text className={`font-semibold text-[16px] ${durationDays === d ? 'text-[#011023]' : 'text-slate-400'}`}>
                           {d}
                         </Text>
                       </TouchableOpacity>
                     ))}
                   </ScrollView>
                 </View>
               )}
             </View>
           </View>
           
           <View className="flex-1 z-50">
             <Text className="text-[13px] font-bold text-[#011023] uppercase tracking-widest mb-3 text-center">Hours</Text>
             <View className="relative z-50">
               <TouchableOpacity 
                 onPress={() => {
                   setIsHoursDropdownOpen(!isHoursDropdownOpen);
                   setIsDaysDropdownOpen(false);
                 }}
                 style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', height: 37, borderRadius: 13, borderWidth: 1.5, borderColor: '#f5efefff' }}
               >
                 <Text style={{ fontWeight: 'bold', fontSize: 14.5, color: durationHours ? '#011023' : '#94a3b8' }}>{durationHours || ''}</Text>
               </TouchableOpacity>

               {isHoursDropdownOpen && (
                 <View className="bg-white border border-slate-200 rounded-xl mb-1 shadow-md overflow-hidden absolute top-10 left-0 right-0 z-50" style={{ maxHeight: 250, gap: 1, padding: 1 }}>
                   <ScrollView showsVerticalScrollIndicator={true} nestedScrollEnabled>
                     {['', '3', '6', '9', '12', '15', '24'].map((h) => (
                       <TouchableOpacity
                         key={h}
                         onPress={() => {
                           setDurationHours(h);
                           setIsHoursDropdownOpen(false);
                         }}
                         className={`flex-row items-center justify-center ${durationHours === h ? 'bg-slate-50' : 'bg-white'}`}
                         style={{ paddingVertical: 4, borderBottomWidth: h === '24' ? 0 : 0, borderBottomColor: '#f1f5f9' }}
                       >
                         <Text className={`font-semibold text-[16px] ${durationHours === h ? 'text-[#011023]' : 'text-slate-400'}`}>
                           {h}
                         </Text>
                       </TouchableOpacity>
                     ))}
                   </ScrollView>
                 </View>
               )}
             </View>
           </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row border-t border-slate-100 justify-between items-center" style={{ gap: 15 }}>
              <TouchableOpacity 
                onPress={() => { setDurationDays(''); setDurationHours(''); setShowDurationModal(false); }} 
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', borderColor: '#e2e8f0', borderWidth: 1, borderRadius: 12, paddingVertical: 10 }}
              >
                <Text style={{ fontWeight: 'bold', color: '#3c4655ff', textTransform: 'uppercase', fontSize: 12, letterSpacing: 1 }}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                disabled={isSubmitting || !durationDays || !durationHours}
                onPress={() => handleSendOTP(selectedTaskId)} 
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: (!durationDays || !durationHours) ? '#94a3b8' : '#151a20ff', borderRadius: 12, paddingVertical: 10, flexDirection: 'row' }}
              >
                {isSubmitting ? <Loader2 size={16} color="white" className="animate-spin mr-2" /> : null}
                <Text style={{ fontWeight: 'bold', color: '#ffffff', textTransform: 'uppercase', fontSize: 12, letterSpacing: 1 }}>Next</Text>
              </TouchableOpacity>
            </View>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = !searchQuery || (
      task.bookingId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.vehicle?.make?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.vehicle?.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.service?.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const matchesFilter = filterStatus === 'All' || task.status === filterStatus;
    return matchesSearch && matchesFilter;
  });
  return (
    <View className="flex-1 bg-slate-50">
      {/* Search Bar */}
      <View className="px-5 flex-row items-stretch" style={{ marginVertical: 16, marginHorizontal: 1.5 }}>
        <View className="flex-1 flex-row bg-white rounded-2xl px-4 py-2 border border-slate-100 shadow-sm" style={{ alignItems: 'center' }}>
          <Search size={20} color="#64748b" strokeWidth={2} />
          <TextInput
            className="flex-1 ml-3 text-[15px] font-semibold uppercase text-[#011023]"
            style={{ paddingVertical: 5 }}
            placeholder="Search assignments..."
            placeholderTextColor="#bdc6d1ff"
            value={searchQuery}
            onChangeText={setSearchQuery}
            selectionColor="#011023"
            caretHidden={false} // Used for the cursor visibility
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} className="p-1  rounded-full">
              <X size={14} color="#64748b" strokeWidth={3} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={() => { setTempFilterStatus(filterStatus); setIsFilterModalOpen(true); }} className="ml-3 px-4 bg-white rounded-2xl border border-slate-100 shadow-sm justify-center items-center">
          <SlidersHorizontal size={20} color="#011023" strokeWidth={2} />
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
          data={filteredTasks}
          keyExtractor={item => item._id}
          renderItem={renderTaskCard}
          contentContainerStyle={{ paddingTop: 0 }}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          overScrollMode="never"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#011023" />}
          ListEmptyComponent={
            <View className="p-10 items-center justify-center">
              <Text className="text-slate-400 font-bold uppercase tracking-widest text-sm">No Assignments Found</Text>
            </View>
          }
        />
      )}

      {/* --- MODALS --- */}

      {/* Task Details Bottom Sheet Modal */}
      <Modal visible={isViewModalOpen} animationType="slide" transparent={true} onRequestClose={() => setIsViewModalOpen(false)}>
        {isViewModalOpen ? (
          <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
          <BlurView intensity={20} tint="dark" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} />
          <TouchableOpacity activeOpacity={1} onPress={() => setIsViewModalOpen(false)} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} />
          <View className="bg-white shadow-2xl overflow-hidden" style={{ maxHeight: '85%', width: '98%', borderRadius: 40, padding: 10 }}>
            {/* Modal Header */}
            <View style={{ paddingTop: 15 }} className="px-5 flex-row justify-between items-center">
              <View>
                <Text className="text-[18px] font-semibold text-[#011023] uppercase">Task Details</Text>
                <Text style={{ marginTop: 2 }} className="text-sm text-slate-700 font-semibold tracking-wider">ID: {selectedTask?.bookingId}</Text>
              </View>
              <TouchableOpacity onPress={() => setIsViewModalOpen(false)}>
                <X size={20} color="#011023" />
              </TouchableOpacity>
            </View>

            <ScrollView className="p-5" contentContainerStyle={{ paddingBottom: 0 }}>
              {/* Customer */}
              <Text style={{ fontSize: 15 }} className="font-semibold text-slate-500 uppercase tracking-widest mb-1">Customer Info</Text>
              <View className="mb-3" style={{ paddingVertical: 10, gap: 5 }}>
                <View className="flex-row items-center justify-between">
                  <Text className="text-slate-700 uppercase font-semibold pr-1">Name</Text>
                  <Text className="text-[#011023] font-semibold uppercase text-right flex-shrink-1 pr-1">{selectedTask?.user?.name}</Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-slate-700 uppercase font-semibold pr-1">Phone</Text>
                  <Text className="text-[#011023] font-semibold text-right flex-shrink-1 pr-1">{selectedTask?.user?.phone}</Text>
                </View>
                {/* <View className="flex-row items-center justify-between">
                  <Text className="text-slate-500 font-bold">Email</Text>
                  <Text className="text-[#011023] font-semibold text-xs">{selectedTask?.user?.email}</Text>
                </View> */}
              </View>

              <Text style={{ fontSize: 15 }} className="font-semibold text-slate-500 uppercase tracking-widest mb-1">Customer Details</Text>
              <View className="mb-3" style={{ paddingVertical: 10, gap: 5 }}>
                <View className="flex-row items-center justify-between">
                  <Text className="text-slate-700 uppercase font-semibold pr-1">Email</Text>
                  <Text className="text-[#011023] uppercase font-semibold text-right flex-shrink-1 pr-1">{selectedTask?.user?.email}</Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-slate-700 uppercase font-semibold pr-1">Address</Text>
                  <Text className="text-[#011023] uppercase font-semibold text-right flex-shrink-1">{selectedTask?.user?.address}</Text>
                </View>
              </View>

              {/* Vehicle */}
              <Text style={{ fontSize: 15 }} className="font-semibold text-slate-500 uppercase tracking-widest mb-1">Booking Details</Text>
              <View className="mb-3" style={{ paddingVertical: 10, gap: 5 }}>
                <View className="flex-row items-center justify-between">
                  <Text className="text-slate-700 uppercase font-semibold pr-1">Year</Text>
                  <Text className="text-[#011023] font-semibold text-right flex-shrink-1 pr-1">{selectedTask?.vehicle?.year}</Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-slate-700 uppercase font-semibold pr-1">Vehicle</Text>
                  <Text className="text-[#011023] font-semibold uppercase text-right flex-shrink-1 pr-1">{selectedTask?.vehicle?.make + " | " + selectedTask?.vehicle?.model}</Text>
                </View>
              </View>

              {/* Service */}
              <Text style={{ fontSize: 15 }} className="font-semibold text-slate-500 uppercase tracking-widest mb-1">Service Details</Text>
              <View className="mb-3" style={{ paddingVertical: 12 }}>
                <Text className="font-semibold text-slate-700 text-semibold uppercase">{selectedTask?.service?.title}</Text>
                <View className="flex-row items-center mt-2">
                  <Text className="text-slate-6700 text-[13.5px] font-semibold uppercase">Schedule At: {selectedTask?.schedule?.date} | {selectedTask?.schedule?.time}</Text>
                </View>
              </View>

              {/* Status */}
              <Text style={{ fontSize: 15 }} className="font-semibold text-slate-500 uppercase tracking-widest mb-1">Status Overview</Text>
              <View className="mb-3" style={{ paddingVertical: 10, gap: 5 }}>
                <View className="flex-row items-center justify-between">
                  <Text style={{fontSize:13.5}} className="text-slate-700 uppercase font-semibold">Current Status</Text>
                  <View className=" rounded-full" style={{ ...getStatusStyle(selectedTask?.status), borderWidth: 1 }}>
                    <Text className="font-semibold uppercase tracking-wider" style={{ color: getStatusTextColor(selectedTask?.status), paddingVertical:2, paddingHorizontal: 12, fontSize: 12.75 }}>{selectedTask?.status}</Text>
                  </View>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text style={{fontSize:13.5}} className="text-slate-700 uppercase font-semibold">Duration Estimate</Text>
                  <Text style={{fontSize:13.5}} className="text-[#011023] font-semibold uppercase">{selectedTask?.serviceDuration || 'Not Set'}</Text>
                </View>
              </View>

              {userRole === 'Technician' ? (
                <>
                  {selectedTask?.status === 'Pending' && (
                    <TouchableOpacity 
                      onPress={() => handleUpdateStatus(selectedTask?._id, 'In Progress')} 
                      style={{ backgroundColor: '#011023', paddingVertical: 15, borderRadius: 18, alignItems: 'center', marginBottom: 10, marginTop: 10 }}
                    >
                      <Text style={{ color: 'white', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 13 }}>Start Working</Text>
                    </TouchableOpacity>
                  )}

                  {selectedTask?.status === 'In Progress' && (
                    <TouchableOpacity 
                      onPress={() => {
                        setSelectedTaskId(selectedTask?._id);
                        setDurationDays('');
                        setDurationHours('');
                        setIsViewModalOpen(true);
                        setTimeout(() => {
                          setShowDurationModal(true);
                        }, 350);
                      }} 
                      style={{ backgroundColor: '#011023', paddingVertical: 15, borderRadius: 18, alignItems: 'center', marginBottom: 5, marginTop: 10 }}
                    >
                      <Text style={{ color: 'white', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 13 }}>Set Service Duration</Text>
                    </TouchableOpacity>
                  )}

                  {selectedTask?.status === 'In Service' && (
                    <TouchableOpacity 
                      onPress={() => handleUpdateStatus(selectedTask?._id, 'Completed')} 
                      style={{ backgroundColor: '#011023', paddingVertical: 15, borderRadius: 18, alignItems: 'center', marginBottom: 5, marginTop: 10 }}
                    >
                      <Text style={{ color: 'white', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 13 }}>Mark Complete</Text>
                    </TouchableOpacity>
                  )}

                  {selectedTask?.status === 'Completed' && (
                    <TouchableOpacity 
                      onPress={() => handleSendOTP(selectedTask?._id)} 
                      style={{ backgroundColor: '#011023', paddingVertical: 15, borderRadius: 18, alignItems: 'center', marginBottom: 5, marginTop: 10 }}
                    >
                      <Text style={{ color: 'white', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 13 }}>Deliver the vehicle</Text>
                    </TouchableOpacity>
                  )}
                </>
              ) : (
                <View className="mb-0">
                  <Text style={{ fontSize: 15 }} className="font-semibold text-slate-500 uppercase tracking-widest">Assigned Technician</Text>
                  <View style={{ paddingVertical: 8, gap: 2 }}>
                    <View className="flex-row items-center justify-between">
                      <Text style={{fontSize:13.5}} className="text-slate-700 uppercase font-semibold">Name</Text>
                      <Text style={{fontSize:13.5}} className="text-[#011023] font-semibold uppercase">{selectedTask?.assignedEmployees?.technician?.name || 'Not Assigned'}</Text>
                    </View>
                    <View className="flex-row items-center justify-between mt-1">
                      <Text style={{fontSize:13.5}} className="text-slate-700 uppercase font-semibold">Phone</Text>
                      <Text style={{fontSize:13.5}} className="text-[#011023] font-semibold uppercase">{selectedTask?.assignedEmployees?.technician?.phone || 'N/A'}</Text>
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
          
          {/* Render Duration Content Inside Task Details Modal to bypass iOS limits */}
          {showDurationModal && renderDurationModalContent()}
          
          {/* Render OTP Content Inside Task Details Modal to bypass iOS limits */}
          {showOTPModal && renderOTPModalContent()}
        </View>
        ) : null}
      </Modal>

      {/* Duration Centered Modal (Fallback for Task List) */}
      <Modal visible={showDurationModal && !isViewModalOpen} animationType="fade" transparent={true} onRequestClose={() => setShowDurationModal(false)}>
        {(showDurationModal && !isViewModalOpen) ? renderDurationModalContent() : null}
      </Modal>

      {/* OTP Bottom Sheet (Fallback for Task List) */}
      <Modal visible={showOTPModal && !isViewModalOpen} animationType="slide" transparent={true} onRequestClose={() => setShowOTPModal(false)}>
        {(showOTPModal && !isViewModalOpen) ? renderOTPModalContent() : null}
      </Modal>

      {/* Filter Modal */}
      <Modal visible={isFilterModalOpen} animationType="fade" transparent={true} onRequestClose={() => setIsFilterModalOpen(false)}>
        {isFilterModalOpen ? (
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
                      {['All', 'Pending', 'In Progress', 'In Service', 'Completed', 'Delivered'].map((statusOption) => (
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
                          {tempFilterStatus === statusOption && (
                            <View className="absolute right-4">
                            </View>
                          )}
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
                onPress={() => {
                  setIsFilterModalOpen(false);
                }} 
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
        ) : null}
      </Modal>


    </View>
  );
}
