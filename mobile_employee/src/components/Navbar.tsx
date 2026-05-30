import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Platform, StatusBar } from 'react-native';
import { Bell, User, Menu } from 'lucide-react-native';
import { router, usePathname } from 'expo-router';
import Sidebar from './Sidebar';

export default function Navbar() {
  const [isSidebarVisible, setSidebarVisible] = useState(false);
  const pathname = usePathname();
  const lastValidTitle = useRef('VehicleeCare');

  const getPageTitle = (path: string) => {
    switch(path) {
      case '/task': return 'MY TASKS';
      case '/attendance': return 'ATTENDANCE';
      case '/leave': return 'LEAVE';
      case '/settings': return 'SETTINGS';
      case '/': 
      case '/index': return 'VehicleeCare';
      default: return null;
    }
  };

  const currentTitle = getPageTitle(pathname);
  if (currentTitle) {
    lastValidTitle.current = currentTitle;
  }

  const titleToDisplay = currentTitle || lastValidTitle.current;
  const isHome = titleToDisplay === 'VehicleeCare';

  return (
    <>
      <SafeAreaView style={{ backgroundColor: '#ffffff', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, zIndex: 50 }}>
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
          
          {/* Left: Sidebar Trigger (Profile/Menu) */}
          <TouchableOpacity onPress={() => setSidebarVisible(true)} className=" flex-row items-center">
             <Menu size={22} color="#011023" strokeWidth={2.5} />
          </TouchableOpacity>
          
          
          {/* Center: Title */}
          <Text 
            style={{ fontSize: isHome ? 22 : 20 }} 
            className={`font-bold text-[#011023] ${isHome ? 'tracking-[0.5px]' : 'tracking-[-0.5px] uppercase'}`}
          >
            {titleToDisplay}
          </Text>

          {/* Right: Notification */}
          <TouchableOpacity onPress={() => router.push('/notification')} className=" relative">
            <Bell size={22} color="#011023" strokeWidth={2.5} />
            <View className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
          </TouchableOpacity>
          
        </View>
      </SafeAreaView>
      
      {/* Sidebar Modal */}
      <Sidebar visible={isSidebarVisible} onClose={() => setSidebarVisible(false)} />
    </>
  );
}
