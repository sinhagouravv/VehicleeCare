import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { router } from 'expo-router';
import { X, User, LogOut, Settings } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';

const { width } = Dimensions.get('window');

export default function Sidebar({ visible, onClose }: { visible: boolean, onClose: () => void }) {
  
  const handleLogout = async () => {
    try {
      await SecureStore.deleteItemAsync('employeeToken');
      await SecureStore.deleteItemAsync('employeeUser');
      onClose();
      router.replace('/login');
    } catch (e) {
      console.log('Logout error', e);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 flex-row justify-end">
        {/* Backdrop */}
        <TouchableOpacity className="absolute inset-0 bg-[#011023]/40" onPress={onClose} activeOpacity={1} />
        
        {/* Sidebar Content */}
        <View style={{ width: width * 0.75 }} className="bg-white h-full shadow-2xl overflow-hidden rounded-l-[30px]">
          
          {/* Header */}
          <View className="flex-row justify-between items-center px-6 pt-16 pb-6 border-b border-slate-100 bg-slate-50/50">
            <View>
              <Text className="text-[12px] font-bold text-slate-400 tracking-[1.5px] uppercase mb-1">Menu</Text>
              <Text className="text-[20px] font-black text-[#011023] tracking-[-0.5px]">Quick Access</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="p-2.5 bg-white rounded-full shadow-sm border border-slate-100">
              <X size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Links */}
          <View className="p-5 flex-1">
            <TouchableOpacity 
              onPress={() => { onClose(); router.push('/profile'); }}
              className="flex-row items-center p-4 bg-white border border-slate-100 rounded-2xl mb-4 shadow-sm">
              <View className="w-10 h-10 bg-[#f8fafc] rounded-full justify-center items-center">
                <User size={20} color="#052558" strokeWidth={2.5} />
              </View>
              <View className="ml-3">
                <Text className="font-bold text-[#011023] text-[15px]">My Profile</Text>
                <Text className="text-xs text-slate-500 font-medium">View & edit your details</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => { onClose(); router.push('/(tabs)/settings'); }}
              className="flex-row items-center p-4 bg-white border border-slate-100 rounded-2xl mb-4 shadow-sm">
              <View className="w-10 h-10 bg-[#f8fafc] rounded-full justify-center items-center">
                <Settings size={20} color="#052558" strokeWidth={2.5} />
              </View>
              <View className="ml-3">
                <Text className="font-bold text-[#011023] text-[15px]">Preferences</Text>
                <Text className="text-xs text-slate-500 font-medium">App settings & configs</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Footer / Logout */}
          <View className="p-5 border-t border-slate-100 bg-slate-50/50 pb-12">
            <TouchableOpacity 
              onPress={handleLogout}
              className="flex-row items-center justify-center p-4 bg-white border border-red-100 rounded-2xl shadow-sm">
              <LogOut size={18} color="#ef4444" strokeWidth={2.5} />
              <Text className="font-bold text-red-500 ml-2 tracking-wide">LOG OUT</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}
