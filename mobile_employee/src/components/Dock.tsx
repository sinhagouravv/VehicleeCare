import { Tabs, router } from 'expo-router';
import { LayoutDashboard, CalendarClock, FileText, Settings, CheckSquare, User, Bell } from 'lucide-react-native';
import { Platform, TouchableOpacity, View } from 'react-native';
import Navbar from './Navbar';

export default function Dock() {
  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <Tabs
        screenOptions={{
          header: () => <Navbar />,
          tabBarActiveTintColor: '#2d343dff',
          tabBarInactiveTintColor: '#94a3b8',
          tabBarStyle: {
            backgroundColor: '#ffffff',
            marginTop: 15, // Creates a global gap above the dock for all screens
            borderTopWidth: 1,
            borderTopColor: '#f1f5f9',
            height: Platform.OS === 'ios' ? 90 : 65,
          paddingBottom: Platform.OS === 'ios' ? 35 : 10,
          paddingTop: 14,
          paddingHorizontal: 12,
          elevation: 10,
          shadowColor: '#000000ff',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.05,
          shadowRadius: 5,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          marginTop: 4,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'HOME',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} strokeWidth={2.5} />,
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          title: 'ATTEND',
          tabBarIcon: ({ color, size }) => <CalendarClock size={size} color={color} strokeWidth={2.5} />,
        }}
      />
      <Tabs.Screen
        name="task"
        options={{
          title: 'TASK',
          tabBarIcon: ({ color, size }) => <CheckSquare size={size} color={color} strokeWidth={2.5} />,
        }}
      />
      <Tabs.Screen
        name="leave"
        options={{
          title: 'LEAVE',
          tabBarIcon: ({ color, size }) => <FileText size={size} color={color} strokeWidth={2.5} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'SETTING',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} strokeWidth={2.5} />,
        }}
      />
    </Tabs>
    </View>
  );
}
