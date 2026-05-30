import React, { useState, useEffect, useRef } from 'react';
import { 
  Text, View, TextInput, TouchableOpacity, 
  KeyboardAvoidingView, Platform, Modal, ActivityIndicator, 
  Keyboard, TouchableWithoutFeedback, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import * as SecureStore from 'expo-secure-store';

import { router } from 'expo-router';
import { Lock, User, ShieldAlert, ShieldCheck, Eye, EyeOff, X, Check } from 'lucide-react-native';
import axios from 'axios';

import Constants from 'expo-constants';

const { width, height } = Dimensions.get('window');

// Dynamically grab the exact IP address the Expo packager is using
const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
const localIp = debuggerHost?.split(':')[0] || (Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1');
const API_URL = `http://${localIp}:5001`;

export default function LoginScreen() {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Forgot Password States
  const [forgotPasswordStep, setForgotPasswordStep] = useState(0); // 0 = hidden, 1 = enter employee email, 2 = verify OTP, 3 = new pass
  const [resetEmployeeId, setResetEmployeeId] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const otpRefs = useRef<(TextInput | null)[]>([]);

  // Auto-dismiss notifications after 5 seconds
  useEffect(() => {
    if (error || successMessage) {
      const timer = setTimeout(() => {
        setError('');
        setSuccessMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, successMessage]);

  const handleLogin = async () => {
    if (!employeeId || !password) {
      setError('Please fill in all fields');
      return;
    }

    Keyboard.dismiss();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/api/auth/employee-login`, { employeeId, password }, { validateStatus: () => true });

      const data = res.data;

      if (res.status === 200) {
        await SecureStore.setItemAsync('employeeToken', data.token);
        await SecureStore.setItemAsync('employeeUser', JSON.stringify(data.employee));
        router.replace('/(tabs)'); // Route to main app after auth
        setSuccessMessage('Login Successful!');
      } else {
        setError(data.msg || 'Invalid credentials');
      }
    } catch (err) {
      console.error('LOGIN FETCH ERROR:', err);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetOtp = async () => {
    if (!resetEmployeeId || !resetEmail) {
      setError('Please fill in all fields');
      return;
    }
    Keyboard.dismiss();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/employee-forgot-password`, { employeeId: resetEmployeeId, email: resetEmail }, { validateStatus: () => true });

      const data = res.data;

      if (res.status === 200) {
        setForgotPasswordStep(2);
      } else {
        setError(data.msg || 'The email you entered is not registered');
      }
    } catch (err) {
      setError('Server connection failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const otpString = resetOtp.join('');
    if (otpString.length !== 6) {
      setError('Please enter the full 6-digit OTP');
      return;
    }
    Keyboard.dismiss();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/employee-verify-reset-otp`, { email: resetEmail, otp: otpString }, { validateStatus: () => true });

      const data = res.data;

      if (res.status === 200) {
        setForgotPasswordStep(3);
      } else {
        setError(data.msg || 'Invalid or expired OTP');
      }
    } catch (err) {
      setError('Server connection failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match');
      return;
    }
    Keyboard.dismiss();
    setError('');
    setLoading(true);
    try {
      const otpString = resetOtp.join('');
      const res = await axios.post(`${API_URL}/api/auth/employee-reset-password`, { email: resetEmail, otp: otpString, newPassword }, { validateStatus: () => true });

      const data = res.data;

      if (res.status === 200) {
        setForgotPasswordStep(0);
        setSuccessMessage('Password updated successfully. Please log in.');
        setEmployeeId('');
        setResetEmployeeId('');
        setResetOtp(['', '', '', '', '', '']);
        setNewPassword('');
        setConfirmNewPassword('');
        setResetEmail('');
      } else {
        setError(data.msg || 'Failed to update password');
      }
    } catch (err) {
      setError('Server connection failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...resetOtp];
    newOtp[index] = value;
    setResetOtp(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !resetOtp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  return (
    <View className="flex-1 bg-slate-50">
      {/* Background Gradients mimicking Web CSS */}
      <View className="absolute inset-0 overflow-hidden">
        <View className="absolute -top-[10%] -left-[10%] w-[80vw] h-[80vw] rounded-full bg-blue-400/20" />
        <View className="absolute -bottom-[10%] -right-[10%] w-[90vw] h-[90vw] rounded-full bg-emerald-400/15" />
        <View className="absolute top-[40%] right-[10%] w-[60vw] h-[60vw] rounded-full bg-purple-400/10" />
      </View>

      {/* Notifications Overlay */}
      {(error !== '' || successMessage !== '') && (
        <View className="absolute top-[60px] left-5 right-5 z-[100] items-center">
          <View className={`flex-row items-center bg-white/95 px-5 py-4 rounded-2xl border-l-[6px] w-full max-w-[400px] shadow-[0_10px_20px_rgba(0,0,0,0.1)] elevation-[15] ${error ? 'border-l-red-500' : 'border-l-emerald-500'}`}>
            {error ? <ShieldAlert size={20} color="#dc2626" /> : <ShieldCheck size={20} color="#16a34a" />}
            <Text className={`text-[13px] font-bold ml-3 flex-1 ${error ? 'text-red-700' : 'text-green-700'}`}>
              {error || successMessage}
            </Text>
          </View>
        </View>
      )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <SafeAreaView className="flex-1 justify-center items-center p-4">
            
            <View className={`w-full max-w-[420px] bg-white rounded-[40px] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.05)] overflow-hidden ${forgotPasswordStep > 0 ? 'scale-95 opacity-40' : 'scale-100 opacity-100'}`} style={{ transform: [{ translateY: -28 }] }}>
              <View className="items-center mb-10">
                <View className="mb-4 h-[50px] w-[50px] justify-center items-center">
                  <Image 
                    source={require('../../assets/images/logo.svg')} 
                    style={{ width: '100%', height: '100%' }} 
                    contentFit="contain" 
                  />
                </View>
                <Text className="text-slate-800 font-bold text-[13px] tracking-[1.5px] uppercase mb-2">vehicleecare</Text>
                <Text className="text-[28px] font-bold text-[#011023] tracking-[-0.5px] uppercase">Employee Portal</Text>
              </View>

              <View className="mb-6">
                {/* <Text className="text-[13.5px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-3">Employee ID</Text> */}
                <View className="relative justify-center">
                  <View className="absolute left-5 z-10 h-full justify-center">
                    <User size={18} color="#94a3b8" />
                  </View>
                  <TextInput
                    className="w-full bg-white border border-slate-100 shadow-sm rounded-[20px] py-4 pl-12 pr-4 text-[15px] font-semibold text-[#011023]"
                    placeholder="Employee ID"
                    placeholderTextColor="#cbd5e1"
                    keyboardType="number-pad"
                    maxLength={9}
                    value={employeeId}
                    onChangeText={(text) => setEmployeeId(text.replace(/[^0-9]/g, ''))}
                  />
                </View>
              </View>

              <View className="mb-8">
                {/* <Text className="text-[13.5px] font-semibold text-slate-400 uppercase tracking-widest ml-1 mb-3">Password</Text> */}
                <View className="relative justify-center">
                  <View className="absolute left-5 z-10 h-full justify-center">
                    <Lock size={18} color="#94a3b8" />
                  </View>
                  <TextInput
                    className="w-full bg-white border border-slate-100 shadow-sm rounded-[20px] py-4 pl-12 pr-12 text-[15px] font-semibold text-[#011023] tracking-widest"
                    placeholder="Password"
                    placeholderTextColor="#cbd5e1"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <View className="absolute right-5 z-10 h-full justify-center">
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-1">
                      {showPassword ? <EyeOff size={18} color="#94a3b8" /> : <Eye size={18} color="#94a3b8" />}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View className="flex-row items-center justify-between mb-8 px-1">
                <TouchableOpacity onPress={() => setRememberMe(!rememberMe)} activeOpacity={1} className="flex-row items-center gap-2 group">
                  <View className={`w-[22px] h-[22px] rounded-full justify-center items-center shadow-sm bg-white ${rememberMe ? '' : 'border-slate-500'}`}>
                    {rememberMe && <Check size={14} color="#000000" strokeWidth={3} />}
                  </View>
                  <Text className="text-[#052558] font-semibold text-[13.25px] ml-1 tracking-tight">Remember me</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setForgotPasswordStep(1); setError(''); }}>
                  <Text className="text-[#052558] font-semibold text-[13px] tracking-tight">Forgot password?</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity className="w-full rounded-[20px] overflow-hidden shadow-[0_8px_15px_rgba(5,37,88,0.15)] elevation-5" onPress={handleLogin} disabled={loading}>
                <LinearGradient
                  colors={['#1c3a63', '#396395']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="w-full py-[18px] items-center"
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white font-bold text-[13px] p-4 text-center tracking-[2.5px] uppercase">Login</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

          </SafeAreaView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* FORGOT PASSWORD MODAL */}
      <Modal visible={forgotPasswordStep > 0} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
          <View className="flex-1 bg-[#011023]/30 justify-center items-center p-5">
            <View className="w-full max-w-[400px] bg-white rounded-[30px] p-10 shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden">
              
              <View className="flex-row justify-center items-center mt-5 mb-[30px] relative">
                <Text className="text-[18px] font-bold text-[#011023] tracking-[-0.5px]">ACCOUNT RECOVERY</Text>
                <TouchableOpacity onPress={() => setForgotPasswordStep(0)} className="absolute right-0 p-2 bg-slate-50 rounded-full">
                  <X size={20} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              {/* Step 1: ID & Email */}
              {forgotPasswordStep === 1 && (
                <View className="items-center">
                  <Text className="text-[13px] text-slate-400 text-center font-semibold mb-[30px] px-5 leading-5">Enter your Employee ID and registered email to receive a secure OTP.</Text>
                  
                  <View className="mb-5 w-full">
                    <Text className="text-[10px] font-bold text-slate-400 tracking-[1.5px] mb-2 ml-1">EMPLOYEE ID</Text>
                    <TextInput
                      className="w-full bg-white/10 border border-white rounded-2xl py-4 pl-4 pr-4 text-[15px] font-semibold text-[#011023]"
                      placeholder="Enter 9-digit ID"
                      keyboardType="numeric"
                      maxLength={9}
                      value={resetEmployeeId}
                      onChangeText={(text) => setResetEmployeeId(text.replace(/[^0-9]/g, ''))}
                    />
                  </View>

                  <View className="mb-5 w-full">
                    <Text className="text-[10px] font-bold text-slate-400 tracking-[1.5px] mb-2 ml-1">REGISTERED EMAIL</Text>
                    <TextInput
                      className="w-full bg-white/80 border border-white rounded-2xl py-4 pl-4 pr-4 text-[15px] font-semibold text-[#011023]"
                      placeholder="e.g. employee@vc.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={resetEmail}
                      onChangeText={setResetEmail}
                    />
                  </View>

                  <TouchableOpacity className="w-full bg-[#052558] rounded-2xl py-[18px] items-center mt-2.5" onPress={handleSendResetOtp} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-black text-[12px] tracking-[2px]">GENERATE OTP</Text>}
                  </TouchableOpacity>
                </View>
              )}

              {/* Step 2: Verify OTP */}
              {forgotPasswordStep === 2 && (
                <View className="items-center">
                  <Text className="text-[13px] text-slate-400 text-center font-semibold mb-[30px] px-5 leading-5">Enter the 6-digit code sent to{'\n'}<Text className="text-[#052558] font-bold">{resetEmail}</Text></Text>
                  
                  <View className="flex-row justify-center gap-2 mb-5 w-full">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <TextInput
                        key={index}
                        ref={(ref) => { otpRefs.current[index] = ref; }}
                        className="w-[45px] h-[55px] bg-white border border-slate-200 rounded-xl text-[24px] font-bold text-[#011023] text-center"
                        maxLength={1}
                        keyboardType="numeric"
                        value={resetOtp[index]}
                        onChangeText={(val) => handleOtpChange(val, index)}
                        onKeyPress={(e) => handleOtpKeyPress(e, index)}
                      />
                    ))}
                  </View>

                  <TouchableOpacity onPress={handleSendResetOtp} className="mb-5">
                    <Text className="text-[11px] font-bold text-slate-400 uppercase tracking-[1px]">Didn't get the code? <Text className="text-[#052558] font-bold">Resend OTP</Text></Text>
                  </TouchableOpacity>

                  <TouchableOpacity className="w-full bg-[#052558] rounded-2xl py-[18px] items-center mt-2.5" onPress={handleVerifyOtp} disabled={loading || resetOtp.join('').length !== 6}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-black text-[12px] tracking-[2px]">VERIFY & CONTINUE</Text>}
                  </TouchableOpacity>
                </View>
              )}

              {/* Step 3: New Password */}
              {forgotPasswordStep === 3 && (
                <View className="items-center">
                  <Text className="text-[13px] text-slate-400 text-center font-semibold mb-[30px] px-5 leading-5">Create a new password for your account</Text>
                  
                  <View className="mb-5 w-full">
                    <Text className="text-[10px] font-bold text-slate-400 tracking-[1.5px] mb-2 ml-1">NEW PASSWORD</Text>
                    <View className="relative justify-center w-full">
                      <TextInput
                        className="w-full bg-white/80 border border-white rounded-2xl py-4 pl-4 pr-11 text-[15px] font-semibold text-[#011023]"
                        placeholder="••••••••"
                        secureTextEntry={!showNewPassword}
                        value={newPassword}
                        onChangeText={setNewPassword}
                      />
                      <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 z-10 p-1">
                        {showNewPassword ? <EyeOff size={18} color="#94a3b8" /> : <Eye size={18} color="#94a3b8" />}
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View className="mb-5 w-full">
                    <Text className="text-[10px] font-bold text-slate-400 tracking-[1.5px] mb-2 ml-1">CONFIRM PASSWORD</Text>
                    <View className="relative justify-center w-full">
                      <TextInput
                        className="w-full bg-white/80 border border-white rounded-2xl py-4 pl-4 pr-11 text-[15px] font-semibold text-[#011023]"
                        placeholder="••••••••"
                        secureTextEntry={!showConfirmPassword}
                        value={confirmNewPassword}
                        onChangeText={setConfirmNewPassword}
                      />
                      <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 z-10 p-1">
                        {showConfirmPassword ? <EyeOff size={18} color="#94a3b8" /> : <Eye size={18} color="#94a3b8" />}
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity className="w-full bg-[#052558] rounded-2xl py-[18px] items-center mt-2.5" onPress={handleResetPassword} disabled={loading || !newPassword}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-black text-[12px] tracking-[2px]">UPDATE PASSWORD</Text>}
                  </TouchableOpacity>
                </View>
              )}

            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}


