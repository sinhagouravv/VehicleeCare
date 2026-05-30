import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator, Alert, Modal, Platform, StatusBar, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Bell, Trash2, Loader2, Calendar, Search, X, SlidersHorizontal } from 'lucide-react-native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = 'http://localhost:5001';

const EVENT_MAPPING: any = {
  booking_created: { type: 'Booking', category: 'Task', color: 'bg-emerald-100 text-emerald-700', typeColor: 'bg-sky-100', typeTextColor: 'text-sky-700' },
  leave: { type: 'Leave', category: 'HR', typeStyle: { backgroundColor: '#fef3c7', borderColor: '#fde68a' }, typeTextStyle: { color: '#92400e' } },
};

export default function NotificationScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unread, setUnread] = useState(0);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }, []);

  const fetchNotifications = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else if (notifications.length === 0) setLoading(true);

      const storedUser = await SecureStore.getItemAsync('employeeUser');
      let empId = null;
      if (storedUser) {
        const user = JSON.parse(storedUser);
        empId = user._id || user.id;
      }

      if (!empId) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const res = await axios.get(`${API_URL}/api/notifications`);
      const data = res.data;

      let allNotifs = data.data || [];

      // Filter notifications for this employee ONLY
      const employeeNotifs = allNotifs.filter((n: any) => {
        if (n.eventType === 'leave') {
          let userObj: any = {};
          if (storedUser) {
            try { userObj = JSON.parse(storedUser); } catch(e){}
          }
          return n.meta?.employeeId === empId || n.meta?.employeeId === userObj.employeeId || n.meta?.employeeId === userObj.id || n.meta?.employeeId === userObj._id;
        }

        if (n.eventType !== 'booking_created') return false;

        const assignment = n.meta?.assignedEmployees;
        if (!assignment) return false;

        const isAssigned =
          assignment.technician?.id === empId ||
          assignment.technician?.employeeId === empId ||
          assignment.support?.id === empId ||
          assignment.support?.employeeId === empId ||
          assignment.mechanic?.id === empId ||
          assignment.mechanic?.employeeId === empId;

        return isAssigned;
      });

      setNotifications(employeeNotifs);
      setUnread(employeeNotifs.filter((n: any) => !n.isRead).length);

      // Fetch users
      try {
        const userRes = await axios.get(`${API_URL}/api/users`);
        if (userRes.data.success) {
          setUsers(userRes.data.data || []);
        }
      } catch (e) {
        console.error('Error fetching users:', e);
      }
    } catch (error) {
      // Use console.log instead of error to avoid Expo's red screen for background polling 500 errors
      console.log('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [notifications.length]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(() => fetchNotifications(false), 5000); // Silent polling every 5s
    return () => clearInterval(interval);
  }, [fetchNotifications]);


  const nameToUserIdMap = useMemo(() => {
    const map: any = {};
    users.forEach(u => {
      if (u.name && u.userId) {
        map[u.name.trim().toUpperCase()] = u.userId;
      }
    });
    notifications.forEach(n => {
      const name = (n.meta?.userName || n.meta?.name || n.message.split(' (')[0].split(' booked')[0]).trim().toUpperCase();
      if (name && n.meta?.displayUserId && n.meta.displayUserId !== 'GUEST') {
        map[name] = n.meta.displayUserId;
      }
    });
    return map;
  }, [users, notifications]);

  const getDisplayUserId = (notif: any) => {
    if (notif.eventType === 'leave') return notif.meta?.approverEmpId || 'SYSTEM';
    if (notif.meta?.displayUserId && notif.meta.displayUserId !== 'GUEST') return notif.meta.displayUserId;
    const name = (notif.meta?.userName || notif.meta?.name || notif.message.split(' (')[0].split(' booked')[0]).trim().toUpperCase();
    if (nameToUserIdMap[name]) return nameToUserIdMap[name];
    if (notif.meta?.userId && notif.meta.userId.length < 15 && (notif.meta.userId.startsWith('65') || notif.meta.userId.startsWith('75'))) {
      return notif.meta.userId;
    }
    return 'GUEST';
  };

  const getMapping = (notif: any) => {
    return EVENT_MAPPING[notif.eventType] || { type: 'Task', category: 'System', typeColor: 'bg-gray-100' };
  };

  const onRefresh = useCallback(() => {
    fetchNotifications(true);
  }, [fetchNotifications]);

  return (
    <View className="flex-1 bg-[#f5f7f9]">
      {/* Header with White Safe Area */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#ffffff', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, zIndex: 50 }}>
        <View style={{
            backgroundColor: '#ffffff',
            borderBottomWidth: 1,
            borderBottomColor: '#f1f5f9',
            height: Platform.OS === 'ios' ? 50 : 35,
            paddingBottom: Platform.OS === 'ios' ? 10 : 5,
            paddingHorizontal: 19,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            elevation: 10,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.05,
            shadowRadius: 5,
            zIndex: 50
          }}>
            {/* Left: Back Arrow */}
            <TouchableOpacity onPress={() => router.back()} className="flex-row items-center">
              <ArrowLeft size={22} color="#011023" strokeWidth={2.5} />
            </TouchableOpacity>
            
            {/* Center: Title */}
            <Text 
              style={{ fontSize: 20 }} 
              className="font-bold text-[#011023] tracking-[-0.5px] uppercase"
            >
              NOTIFICATIONS
            </Text>

            {/* Right: Calendar / Notification Dot */}
            <TouchableOpacity onPress={() => router.push('/attendance')} className="relative">
              <Calendar size={22} color="#011023" strokeWidth={2.5} />
              {unread > 0 && (
                <View className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
              )}
            </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Main Content */}
      {loading && notifications.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#011023" />
          <Text className="text-slate-500 font-semibold mt-4 uppercase tracking-wider text-xs">Loading Notifications...</Text>
        </View>
      ) : (
        <View className="flex-1">
          {/* Search Bar */}
          <View className="px-5 flex-row items-stretch" style={{ marginVertical: 16, marginHorizontal: 1.5 }}>
            <View className="flex-1 flex-row bg-white rounded-2xl px-4 border border-slate-100 shadow-sm" style={{ alignItems: 'center' }}>
              <Search size={20} color="#64748b" strokeWidth={2} />
              <TextInput
                className="flex-1 ml-3 text-[15px] font-semibold uppercase text-[#011023]"
                style={{ paddingVertical: 12 }}
                placeholder="Search notifications..."
                placeholderTextColor="#bdc6d1ff"
                value={searchQuery}
                onChangeText={setSearchQuery}
                selectionColor="#011023"
                caretHidden={false} // Used for the cursor visibility
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} className="p-1 rounded-full">
                  <X size={14} color="#64748b" strokeWidth={3} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity className="ml-3 px-4 bg-white rounded-2xl border border-slate-100 shadow-sm justify-center items-center">
              <SlidersHorizontal size={20} color="#011023" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            className="flex-1 px-"
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#011023" />}
          >
            {(() => {
              const filteredNotifications = notifications.filter((n: any) => {
                if (!searchQuery) return true;
                const lowerQuery = searchQuery.toLowerCase();
                const customerName = (n.meta?.userName || n.meta?.name || n.message.split(' (')[0].split(' booked')[0] || '').toLowerCase();
                const displayId = getDisplayUserId(n).toLowerCase();
                const message = (n.message || '').toLowerCase();
                return customerName.includes(lowerQuery) || displayId.includes(lowerQuery) || message.includes(lowerQuery);
              });

              if (filteredNotifications.length === 0) {
                return (
                  <View className="flex-1 justify-center items-center py-20 mt-10">
                    <View className="bg-slate-200 p-6 rounded-full mb-4">
                      <Bell size={40} color="#94a3b8" />
                    </View>
                    <Text className="text-[20px] font-bold text-[#011023] uppercase tracking-wide mb-2">No notifications found</Text>
                    <Text className="text-slate-500 text-center font-medium">No results match your search.</Text>
                  </View>
                );
              }

              return filteredNotifications.map((notif: any) => {
                const mapping = getMapping(notif);
                const customerName = notif.eventType === 'leave' ? (notif.meta?.approverName || 'MANAGER') : (notif.meta?.userName || notif.meta?.name || notif.message.split(' (')[0].split(' booked')[0] || 'N/A');
                const displayId = getDisplayUserId(notif);
                const isExpanded = expandedIds.includes(notif._id);
                
                return (
                <TouchableOpacity 
                  key={notif._id}
                  activeOpacity={0.7}
                  onPress={() => toggleExpand(notif._id)}
                  style={{ paddingTop: 11, paddingBottom: 12, marginHorizontal: 20, marginBottom: 14 }}
                  className={`bg-white rounded-2xl px-5 shadow-sm border border-slate-100`}
                >
                  {/* Customer Info & Badge */}
                  <View className="flex-row justify-between items-start mb-2">
                    <View>
                      <Text className={`text-[15px] uppercase tracking-wide text-slate-700 font-semibold`}>
                        {customerName}
                      </Text>
                      <Text className={`text-[12px] font-semibold text-slate-700 uppercase tracking-wide`}>
                        {notif.eventType === 'leave' ? displayId : `ID: ${displayId}`}
                      </Text>
                    </View>
                    <View style={{ paddingHorizontal: 14, paddingVertical: 5, marginTop: 4, alignSelf: 'flex-start', ...(mapping.typeStyle || {}) }} className={`rounded-full ${mapping.typeColor || (mapping.typeStyle ? '' : 'bg-slate-100')}`}>
                      <Text style={mapping.typeTextStyle || {}} className={`text-[11px] font-bold uppercase tracking-widest ${mapping.typeTextColor || (mapping.typeTextStyle ? '' : 'text-slate-600')}`}>{mapping.type}</Text>
                    </View>
                  </View>

                  {/* Message */}
                  <Text 
                    style={{ textAlign: 'justify' }} 
                    numberOfLines={isExpanded ? undefined : 2}
                    className={`leading-5 uppercase ${notif.eventType === 'booking_created' ? 'uppercase text-[13px] text-slate-600 font-semibold' : 'text-[13px] text-slate-600 font-semibold'}`}
                  >
                    {notif.eventType === 'booking_created' ? <React.Fragment>A new Booking is being assigned to you for <Text className="text-slate-700 font-bold">{notif.meta?.service || 'service'}</Text> of <Text className="text-slate-700 font-bold">{notif.meta?.vehicle || 'vehicle'}</Text>. Kindly contact with your assigned team member's and complete the task within the time.</React.Fragment> : notif.message}
                  </Text>
                  
                  <View style={{ marginTop: 7 }} className="flex-row justify-start">
                    <Text className="text-[13px] font-semibold text-slate-900 uppercase tracking-wide">
                      By {mapping.type?.toLowerCase() === 'leave' ? ('MANAGER') : 'ADMIN'} at {new Date(notif.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')} | {new Date(notif.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View> 
                </TouchableOpacity>
              );
            })
            })()}
        </ScrollView>
        </View>
      )}


    </View>
  );
}
