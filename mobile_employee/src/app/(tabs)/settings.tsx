import { View, Text } from 'react-native';

export default function SettingsScreen() {
  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-1 justify-center items-center p-5">
        <Text className="text-[28px] font-black text-[#011023] tracking-[-0.5px] mb-2 uppercase">Settings</Text>
        <Text className="text-slate-500 font-semibold text-center leading-6">
          Configure your app preferences here.
        </Text>
      </View>
    </View>
  );
}
