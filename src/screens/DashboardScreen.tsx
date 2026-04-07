import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, SafeAreaView } from '../components/ReactNative';
import { Package, Wallet, Settings2, FileEdit, ChevronRight, Plus, Camera as CameraIcon, Image as ImageIcon, Wand2, Sparkles } from 'lucide-react';
import { NativeStackScreenProps } from '../components/Navigation';
import { RootStackParamList } from '../types';
import { useAuth } from '../providers/AuthProvider';
import { useEconomy } from '../providers/EconomyProvider';
import { useData } from '../providers/DataProvider';
import { APP_NAME } from '../constants';
import { Button } from '../components/ui/SharedUI';

export const DashboardScreen = ({ navigation }: NativeStackScreenProps<RootStackParamList, 'Dashboard'>) => {
  const { user } = useAuth();
  const { credits } = useEconomy();
  const { draft } = useData();

  return (
    <SafeAreaView className="bg-black flex-1 animate-slide-in">
      <ScrollView className="flex-1 px-6 pt-10">
        <View className="flex-row justify-between mb-4">
           {/* User Profile Info */}
           <View className="flex-row items-center">
              <Image 
                source={{ uri: user?.uid ? `https://ui-avatars.com/api/?name=${user?.email || 'User'}&background=4f46e5&color=fff` : '' }} 
                className="w-10 h-10 rounded-full border border-zinc-800 mr-3"
              />
              <View>
                 <Text className="text-white font-bold text-sm">Hello!</Text>
                 <Text className="text-zinc-500 text-[10px]">{user?.email}</Text>
              </View>
           </View>

           <View className="flex-row items-center space-x-2">
              {/* Wallet Badge */}
              <TouchableOpacity 
                  onPress={() => navigation.navigate('Store')}
                  className="flex-row items-center bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-800"
              >
                  <Wallet size={16} className="text-indigo-400 mr-2" />
                  <Text className="text-white font-bold mr-1">{credits}</Text>
                  <View className="w-2 h-2 rounded-full bg-green-500" />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate('Settings')} className="p-2 bg-zinc-900 rounded-full">
                  <Settings2 size={24} className="text-zinc-400" />
              </TouchableOpacity>
           </View>
        </View>
        
        <View className="items-center mb-12">
          <View className="w-20 h-20 bg-indigo-900/30 rounded-3xl items-center justify-center mb-6 border border-indigo-500/30">
            <Package size={40} className="text-indigo-400" />
          </View>
          <Text className="text-4xl font-black text-white text-center mb-2">{APP_NAME}</Text>
          <Text className="text-zinc-400 text-center text-lg px-4 leading-6">
            Create professional merchandise mockups in seconds with AI.
          </Text>
        </View>

        <View className="space-y-4 mb-8">
          {/* Resume Project Conditional Card */}
          {draft && (draft.productId || draft.layers.length > 0) && (
             <TouchableOpacity 
                onPress={() => navigation.navigate('Studio')}
                className="w-full bg-indigo-900/20 border border-indigo-500/50 p-4 rounded-xl flex-row items-center justify-between"
             >
                <View className="flex-row items-center">
                    <FileEdit size={24} className="text-indigo-400 mr-4" />
                    <View>
                        <Text className="text-white font-bold text-base">Resume Project</Text>
                        <Text className="text-zinc-400 text-xs">Continue where you left off</Text>
                    </View>
                </View>
                <ChevronRight size={20} className="text-indigo-400" />
             </TouchableOpacity>
          )}

          <Button onPress={() => navigation.navigate('Assets')} icon={<Plus size={20} />} className="w-full h-16">
            Start New Project
          </Button>
          <Button onPress={() => navigation.navigate('TryOn')} variant="secondary" icon={<CameraIcon size={20} />} className="w-full h-14">
            AR Camera Try-On
          </Button>
          <Button onPress={() => navigation.navigate('Gallery')} variant="ghost" icon={<ImageIcon size={20} />} className="w-full h-14">
            View Gallery
          </Button>
        </View>

        <View className="flex-row justify-between mb-8">
          <TouchableOpacity onPress={() => navigation.navigate('Studio')} className="bg-zinc-900 rounded-xl p-4 flex-1 mr-2 items-center border border-zinc-800 active:bg-zinc-800">
            <Wand2 size={24} className="text-purple-400 mb-2" />
            <Text className="text-zinc-400 text-xs font-bold uppercase">Smart Blend</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Assets')} className="bg-zinc-900 rounded-xl p-4 flex-1 ml-2 items-center border border-zinc-800 active:bg-zinc-800">
            <Sparkles size={24} className="text-amber-400 mb-2" />
            <Text className="text-zinc-400 text-xs font-bold uppercase">AI Generated</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
