import React from 'react';
import { View, Text, ActivityIndicator } from '../components/ReactNative';
import { Package } from 'lucide-react';
import { APP_NAME } from '../constants';

export const SplashScreen = () => {
  return (
    <View className="flex-1 bg-black items-center justify-center overflow-hidden">
       {/* Animated Logo Container */}
       <View className="items-center justify-center">
          <View className="w-24 h-24 bg-indigo-600 rounded-3xl items-center justify-center mb-6 animate-hop-in shadow-xl shadow-indigo-500/30">
             <Package size={48} className="text-white" />
          </View>
          <Text className="text-4xl font-black text-white mb-2 animate-swoop-in">
             {APP_NAME}
          </Text>
          <Text className="text-zinc-400 text-lg animate-pop-in" style={{ animationDelay: '0.5s' }}>
             AI Product Visualization
          </Text>
       </View>
       
       <View className="absolute bottom-12 items-center animate-spin-appear" style={{ animationDelay: '1s' }}>
          <ActivityIndicator color="#4f46e5" />
       </View>
    </View>
  );
};
