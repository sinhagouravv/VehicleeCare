import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

export default function ProfileScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center px-5 py-4 border-b border-slate-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2 -ml-2 rounded-full">
          <ArrowLeft size={24} color="#011023" />
        </TouchableOpacity>
        <Text className="text-[18px] font-bold text-[#011023]">My Profile</Text>
      </View>
      <View className="flex-1 justify-center items-center p-5">
        <Text className="text-[28px] font-black text-[#011023] tracking-[-0.5px] mb-2 uppercase">Profile</Text>
        <Text className="text-slate-500 font-semibold text-center leading-6">
          View and edit your employee profile information here.
        </Text>
      </View>
    </SafeAreaView>
  );
}
