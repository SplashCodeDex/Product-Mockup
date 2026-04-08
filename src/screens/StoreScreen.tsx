import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, Modal } from '../components/ReactNative';
import { ChevronLeft, PlayCircle, Play, CreditCard } from 'lucide-react';
import { NativeStackScreenProps } from '../components/Navigation';
import { RootStackParamList } from '../types';
import { useEconomy } from '../providers/EconomyProvider';
import { useAlert } from '../providers/AlertProvider';
import { iapService, Product } from '../services/iapService';
import { adService } from '../services/adService';
import { REWARD_AD_CREDITS } from '../constants';
import { Header, AdTimer, Button } from '../components/ui/SharedUI';
import { Haptics, NotificationFeedbackType } from '../services/haptics';

export const StoreScreen = ({ navigation }: NativeStackScreenProps<RootStackParamList, 'Store'>) => {
  const { credits, addCredits } = useEconomy();
  const { alert } = useAlert();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [adState, setAdState] = useState<{ visible: boolean, onComplete: (success: boolean) => void } | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const items = await iapService.getProducts();
        setProducts(items);
      } catch (e) {
        console.error("Failed to load products", e);
      }
    };
    init();

    // Register Ad callback for web sandbox
    adService.onShowAd = (onComplete) => {
        setAdState({ visible: true, onComplete });
    };
  }, []);

  // TODO: Replace this simulated ad flow with a real rewarded video ad integration.
  const handleWatchAd = async () => {
    setLoadingId('ad');
    try {
        const rewardGranted = await adService.showRewardedAd();
        if (rewardGranted) {
             await addCredits(REWARD_AD_CREDITS);
             alert("Reward Earned", `You received ${REWARD_AD_CREDITS} credits!`);
        }
    } catch (e) {
        alert("Ad Error", "Video could not be loaded.");
    } finally {
        setLoadingId(null);
    }
  };

  const handlePurchase = async (product: Product) => {
    setLoadingId(product.id);
    try {
        const result = await iapService.purchase(product.id);
        if (!result.success) {
            alert("Purchase Failed", "The transaction could not be completed.");
            setLoadingId(null);
        }
        // If success, it redirects to Stripe, so we don't need to clear loading state or show alert here
    } catch (e) {
        alert("Purchase Failed", "The transaction could not be completed.");
        setLoadingId(null);
    }
  };

  return (
    <SafeAreaView className="bg-black flex-1">
      <Header 
        title="Store" 
        leftAction={{ icon: <ChevronLeft color="white" />, onPress: navigation.goBack }} 
      />
      
      <ScrollView className="p-4">
        <View className="bg-zinc-900 p-6 rounded-2xl items-center mb-8 border border-zinc-800">
           <Text className="text-zinc-400 font-medium mb-1">Current Balance</Text>
           <View className="flex-row items-end">
              <Text className="text-5xl font-black text-white">{credits}</Text>
              <Text className="text-indigo-400 font-bold mb-2 ml-2">CR</Text>
           </View>
        </View>

        <Text className="text-zinc-500 uppercase text-xs font-bold mb-4 px-2">Free Rewards</Text>
        <TouchableOpacity 
          onPress={handleWatchAd}
          disabled={loadingId !== null}
          className="bg-zinc-900 border border-indigo-500/30 p-4 rounded-xl flex-row items-center justify-between mb-8 active:scale-95 transition-transform"
        >
           <View className="flex-row items-center">
              <View className="w-12 h-12 bg-indigo-900/40 rounded-full items-center justify-center mr-4">
                 {loadingId === 'ad' ? (
                     <ActivityIndicator color="#818cf8" />
                 ) : (
                     <PlayCircle size={24} className="text-indigo-400" />
                 )}
              </View>
              <View>
                 <Text className="text-white font-bold text-lg">Watch Video Ad</Text>
                 <Text className="text-zinc-400">+{REWARD_AD_CREDITS} Credits</Text>
              </View>
           </View>
           <View className="bg-indigo-600 px-3 py-1 rounded-full">
              <Text className="text-white font-bold text-xs">FREE</Text>
           </View>
        </TouchableOpacity>

        <Text className="text-zinc-500 uppercase text-xs font-bold mb-4 px-2">Credit Packs</Text>
        <View className="space-y-4">
           {products.length === 0 ? (
               <View className="p-8 items-center">
                   <ActivityIndicator color="#71717a" />
                   <Text className="text-zinc-600 mt-2">Loading Store...</Text>
               </View>
           ) : products.map((pack) => (
             <TouchableOpacity 
               key={pack.id}
               onPress={() => handlePurchase(pack)}
               disabled={loadingId !== null}
               className={`bg-zinc-900 p-4 rounded-xl flex-row items-center justify-between border ${pack.popular ? 'border-amber-500/50' : 'border-zinc-800'} ${loadingId === pack.id ? 'opacity-50' : ''}`}
             >
                <View>
                   <Text className="text-white font-bold text-lg">{pack.title}</Text>
                   <Text className="text-zinc-400">{pack.credits} Credits</Text>
                </View>
                <View className="items-end">
                   {pack.popular && (
                      <Text className="text-amber-500 text-[10px] font-bold uppercase mb-1">Most Popular</Text>
                   )}
                   <View className="bg-zinc-800 px-4 py-2 rounded-lg">
                      {loadingId === pack.id ? (
                          <ActivityIndicator color="white" />
                      ) : (
                          <Text className="text-white font-bold">{pack.price}</Text>
                      )}
                   </View>
                </View>
             </TouchableOpacity>
           ))}
        </View>
      </ScrollView>

      {/* Web Sandbox Modals */}
      {adState && (
        <Modal visible={adState.visible} transparent animationType="fade">
            <View className="flex-1 bg-black items-center justify-center p-6">
                <View className="w-full max-w-md bg-zinc-900 rounded-3xl p-8 items-center shadow-2xl border border-zinc-800">
                    <View className="w-16 h-16 bg-indigo-600/20 rounded-full items-center justify-center mb-6">
                        <Play size={32} className="text-indigo-500" />
                    </View>
                    <Text className="text-white text-xl font-bold mb-2">Claiming Free Reward</Text>
                    <Text className="text-zinc-400 text-center mb-8">
                        {/* TODO: Update this text when real ads are integrated */}
                        (Simulated Ad) The reward will be granted in a moment.
                    </Text>
                    
                    <AdTimer onComplete={() => {
                        adState.onComplete(true);
                        setAdState(null);
                    }} />
                </View>
            </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};
