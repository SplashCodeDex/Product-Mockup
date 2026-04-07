import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, SafeAreaView } from '../components/ReactNative';
import { ChevronLeft, Package, Share2 } from 'lucide-react';
import { NativeStackScreenProps } from '../components/Navigation';
import { RootStackParamList } from '../types';
import { useData } from '../providers/DataProvider';
import { APP_NAME } from '../constants';
import { Button, Toast } from '../components/ui/SharedUI';

// Mock Share API for web
const Share = {
  share: async (options: any) => {
    if (navigator.share) {
      try {
        await navigator.share(options);
      } catch (e) {
        console.log('Share failed', e);
      }
    } else {
      console.log('Share not supported', options);
      alert(`Sharing: ${options.url}`);
    }
  }
};

export const ResultScreen = ({ navigation, route }: NativeStackScreenProps<RootStackParamList, 'Result'>) => {
  const { result } = route.params;
  const { saveMockup } = useData();
  const [showToast, setShowToast] = useState(false);

  const handleSave = async () => {
    await saveMockup(result);
    setShowToast(true);
  };

  const handleShare = async () => {
    await Share.share({
      title: 'Check out this mockup!',
      message: `Created with ${APP_NAME}: ${result.prompt}`,
      url: result.imageUrl
    });
  };

  return (
    <SafeAreaView className="bg-black flex-1">
      <Toast message="Saved to Gallery" visible={showToast} onHide={() => setShowToast(false)} />
      
      <View className="flex-1 items-center justify-center bg-zinc-900 m-4 rounded-2xl overflow-hidden relative">
        <Image source={{ uri: result.imageUrl }} className="w-full h-full" resizeMode="contain" />
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          className="absolute left-4 bg-black/50 p-2 rounded-full"
          style={{ top: 'calc(env(safe-area-inset-top) + 1rem)' }}
        >
          <ChevronLeft color="white" size={24} />
        </TouchableOpacity>
      </View>
      <View className="p-4 space-y-4">
         <View className="bg-zinc-900 p-4 rounded-xl">
            <Text className="text-zinc-400 text-xs uppercase mb-1">Prompt Used</Text>
            <Text className="text-white text-sm" numberOfLines={2}>{result.prompt || 'Auto-generated'}</Text>
         </View>
         <View className="flex-row space-x-4">
            <Button variant="secondary" onPress={handleSave} className="flex-1" icon={<Package size={18} />}>
               Save
            </Button>
            <Button onPress={handleShare} className="flex-1" icon={<Share2 size={18} />}>
               Share
            </Button>
         </View>
      </View>
    </SafeAreaView>
  );
};
