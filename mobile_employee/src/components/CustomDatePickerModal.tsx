// import React, { useState, useEffect } from 'react';
// import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
// 
// export const CustomDatePickerModal = ({ visible, onClose, onSelect, minDateStr, title }: any) => {
//   const today = new Date();
//   
//   let minYear = today.getFullYear();
//   let minMonth = today.getMonth() + 1;
//   let minDay = today.getDate();
// 
//   if (minDateStr) {
//     const parts = minDateStr.split('-');
//     if (parts.length === 3) {
//       minYear = parseInt(parts[0], 10);
//       minMonth = parseInt(parts[1], 10);
//       minDay = parseInt(parts[2], 10);
//     }
//   }
// 
//   const [selYear, setSelYear] = useState(minYear);
//   const [selMonth, setSelMonth] = useState(minMonth);
//   const [selDay, setSelDay] = useState(minDay);
// 
//   useEffect(() => {
//     if (visible) {
//       setSelYear(minYear);
//       setSelMonth(minMonth);
//       setSelDay(minDay);
//     }
//   }, [visible, minYear, minMonth, minDay]);
// 
//   const maxDateObj = new Date(minYear, minMonth - 1 + 2, minDay);
//   const maxYear = maxDateObj.getFullYear();
//   const maxMonth = maxDateObj.getMonth() + 1;
//   const maxDay = maxDateObj.getDate();
// 
//   const years = [];
//   for (let i = minYear; i <= maxYear; i++) years.push(i);
//   
//   const getMonths = () => {
//     const months = [];
//     const startM = selYear === minYear ? minMonth : 1;
//     const endM = selYear === maxYear ? maxMonth : 12;
//     for (let i = startM; i <= endM; i++) months.push(i);
//     return months;
//   };
//   const months = getMonths();
// 
//   useEffect(() => {
//     if (selYear === minYear && selMonth < minMonth) setSelMonth(minMonth);
//     if (selYear === maxYear && selMonth > maxMonth) setSelMonth(maxMonth);
//   }, [selYear, minYear, minMonth, maxYear, maxMonth]);
// 
//   const getDaysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();
//   
//   const getDays = () => {
//     const days = [];
//     let maxDaysInSelectedMonth = getDaysInMonth(selYear, selMonth);
//     
//     if (selYear === maxYear && selMonth === maxMonth && maxDaysInSelectedMonth > maxDay) {
//        maxDaysInSelectedMonth = maxDay;
//     }
//     
//     const startD = (selYear === minYear && selMonth === minMonth) ? minDay : 1;
//     for (let i = startD; i <= maxDaysInSelectedMonth; i++) days.push(i);
//     return days;
//   };
//   const days = getDays();
// 
//   useEffect(() => {
//     const validDays = getDays();
//     if (validDays.length > 0) {
//       if (selDay < validDays[0]) setSelDay(validDays[0]);
//       if (selDay > validDays[validDays.length - 1]) setSelDay(validDays[validDays.length - 1]);
//     }
//   }, [selMonth, selYear, minYear, minMonth, minDay, maxYear, maxMonth, maxDay]);
// 
//   const handleConfirm = () => {
//     const mStr = selMonth.toString().padStart(2, '0');
//     const dStr = selDay.toString().padStart(2, '0');
//     onSelect(`${selYear}-${mStr}-${dStr}`);
//     onClose();
//   };
// 
//   const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// 
//   if (!visible) return null;
// 
//   return (
//     <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 9999, elevation: 9999, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' }}>
//       <TouchableOpacity activeOpacity={1} onPress={onClose} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} />
//       <View className="bg-white rounded-[28px] overflow-hidden w-[90%] shadow-2xl">
//         <View className="bg-[#011023] py-5 px-6 items-center">
//           <Text className="font-bold text-white text-[16px] uppercase tracking-widest">{title}</Text>
//           <Text className="text-slate-300 text-[11px] mt-1.5 uppercase tracking-widest font-semibold">Select your timeframe</Text>
//         </View>
//         
//         <View className="flex-row justify-between h-56 px-4 py-4 bg-slate-50">
//           <View className="flex-1 px-1.5">
//             <Text className="text-center font-bold text-slate-400 text-[10px] uppercase tracking-widest mb-3">Year</Text>
//             <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center', paddingBottom: 20 }}>
//               {years.map(y => (
//                 <TouchableOpacity key={y} onPress={() => setSelYear(y)} className={`py-3 my-1 rounded-2xl w-full items-center ${selYear === y ? 'bg-[#011023] shadow-md' : 'bg-white border border-slate-200'}`}>
//                   <Text className={`font-bold text-[13px] tracking-widest ${selYear === y ? 'text-white' : 'text-slate-600'}`}>{y}</Text>
//                 </TouchableOpacity>
//               ))}
//             </ScrollView>
//           </View>
// 
//           <View className="flex-1 px-1.5">
//             <Text className="text-center font-bold text-slate-400 text-[10px] uppercase tracking-widest mb-3">Month</Text>
//             <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center', paddingBottom: 20 }}>
//               {months.map(m => (
//                 <TouchableOpacity key={m} onPress={() => setSelMonth(m)} className={`py-3 my-1 rounded-2xl w-full items-center ${selMonth === m ? 'bg-[#011023] shadow-md' : 'bg-white border border-slate-200'}`}>
//                   <Text className={`font-bold text-[13px] tracking-widest ${selMonth === m ? 'text-white' : 'text-slate-600'}`}>{monthNames[m-1]}</Text>
//                 </TouchableOpacity>
//               ))}
//             </ScrollView>
//           </View>
// 
//           <View className="flex-1 px-1.5">
//             <Text className="text-center font-bold text-slate-400 text-[10px] uppercase tracking-widest mb-3">Date</Text>
//             <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center', paddingBottom: 20 }}>
//               {days.map(d => (
//                 <TouchableOpacity key={d} onPress={() => setSelDay(d)} className={`py-3 my-1 rounded-2xl w-full items-center ${selDay === d ? 'bg-[#011023] shadow-md' : 'bg-white border border-slate-200'}`}>
//                   <Text className={`font-bold text-[13px] tracking-widest ${selDay === d ? 'text-white' : 'text-slate-600'}`}>{d.toString().padStart(2, '0')}</Text>
//                 </TouchableOpacity>
//               ))}
//             </ScrollView>
//           </View>
//         </View>
// 
//         <View className="flex-row bg-white">
//           <TouchableOpacity onPress={onClose} className="flex-1 py-5 items-center justify-center border-t border-r border-slate-100">
//             <Text className="font-bold text-slate-500 uppercase text-[13px] tracking-widest">Cancel</Text>
//           </TouchableOpacity>
//           <TouchableOpacity onPress={handleConfirm} className="flex-1 py-5 items-center justify-center bg-[#011023]">
//             <Text className="font-bold text-white uppercase text-[13px] tracking-widest">Confirm</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     </View>
//   );
// };
