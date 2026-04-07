import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from '../components/ReactNative';
import { ChevronLeft, ChevronRight, Info, DownloadCloud, Database, LogOut, Trash2 } from 'lucide-react';
import { NativeStackScreenProps } from '../components/Navigation';
import { RootStackParamList } from '../types';
import { useData } from '../providers/DataProvider';
import { useAuth } from '../providers/AuthProvider';
import { useAlert } from '../providers/AlertProvider';
import { APP_NAME } from '../constants';
import { Haptics, NotificationFeedbackType } from '../services/haptics';
import { Header } from '../components/ui/SharedUI';

export const SettingsScreen = ({ navigation }: NativeStackScreenProps<RootStackParamList, 'Settings'>) => {
  const { resetData, loadTemplates } = useData();
  const { deleteAccount, logout } = useAuth();
  const { alert } = useAlert();

  const handleReset = () => {
    alert(
      "Reset App Data",
      "Are you sure? This will delete all your saved mockups and assets.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Reset", 
          style: "destructive", 
          onPress: () => {
            resetData();
            Haptics.notificationAsync(NotificationFeedbackType.Success);
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    alert(
      "Delete Account",
      "Are you sure? This will permanently delete your account and all your data. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            await resetData();
            await deleteAccount();
          }
        }
      ]
    );
  };

  const handleLoadTemplates = () => {
    alert(
      "Load Demo Templates",
      "This will import example products and logos into your library.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Load",
          onPress: () => {
             loadTemplates();
             Haptics.notificationAsync(NotificationFeedbackType.Success);
             alert("Success", "Templates loaded to Assets library.");
          }
        }
      ]
    );
  };

  const SettingsItem = ({ icon, label, onPress, destructive }: any) => (
    <TouchableOpacity 
      onPress={onPress} 
      className="flex-row items-center justify-between p-4 bg-zinc-900 border-b border-zinc-800 active:bg-zinc-800"
    >
       <View className="flex-row items-center">
          <View className={`mr-4 ${destructive ? 'text-red-500' : 'text-zinc-400'}`}>
            {icon}
          </View>
          <Text className={`font-medium text-base ${destructive ? 'text-red-500' : 'text-white'}`}>{label}</Text>
       </View>
       <ChevronRight size={20} className="text-zinc-600" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="bg-black flex-1">
       <Header 
         title="Settings" 
         leftAction={{ icon: <ChevronLeft color="white" />, onPress: navigation.goBack }} 
       />
       <ScrollView className="flex-1 pt-4">
          <View className="px-4 mb-2"><Text className="text-zinc-500 uppercase text-xs font-bold">General</Text></View>
          <View className="rounded-xl overflow-hidden mx-4 mb-6">
             <SettingsItem 
               icon={<Info size={20} />} 
               label={`About ${APP_NAME}`} 
               onPress={() => alert("About", `${APP_NAME} v2.2\nProduction Build`)} 
             />
             <SettingsItem 
               icon={<DownloadCloud size={20} />} 
               label="Load Demo Templates" 
               onPress={handleLoadTemplates} 
             />
          </View>

          <View className="px-4 mb-2"><Text className="text-zinc-500 uppercase text-xs font-bold">Data</Text></View>
          <View className="rounded-xl overflow-hidden mx-4 mb-6">
             <SettingsItem 
               icon={<Database size={20} />} 
               label="Reset to Defaults" 
               onPress={handleReset} 
               destructive
             />
          </View>

          <View className="px-4 mb-2"><Text className="text-zinc-500 uppercase text-xs font-bold">Account</Text></View>
          <View className="rounded-xl overflow-hidden mx-4">
             <SettingsItem 
               icon={<LogOut size={20} />} 
               label="Sign Out" 
               onPress={() => {
                 alert("Sign Out", "Are you sure you want to sign out?", [
                   { text: "Cancel", style: "cancel" },
                   { text: "Sign Out", style: "destructive", onPress: logout }
                 ]);
               }} 
               destructive
             />
             <SettingsItem 
               icon={<Trash2 size={20} />} 
               label="Delete Account" 
               onPress={handleDeleteAccount} 
               destructive
             />
          </View>
          
          <View className="p-8 items-center">
             <Text className="text-zinc-600 text-xs">Build 2024.11.06</Text>
          </View>
       </ScrollView>
    </SafeAreaView>
  );
};
