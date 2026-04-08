import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, SafeAreaView } from '../components/ReactNative';
import { ChevronLeft, Package } from 'lucide-react';
import { NativeStackScreenProps } from '../components/Navigation';
import { RootStackParamList } from '../types';
import { useData } from '../providers/DataProvider';
import { Header } from '../components/ui/SharedUI';

export const GalleryScreen = ({ navigation }: NativeStackScreenProps<RootStackParamList, 'Gallery'>) => {
    const { savedMockups, isDataReady } = useData();

    return (
        <SafeAreaView className="bg-black flex-1">
            <Header 
                title="Gallery" 
                leftAction={{ icon: <ChevronLeft color="white" size={24} />, onPress: navigation.goBack }} 
            />
            {!isDataReady ? (
                <ScrollView className="p-4">
                    <View className="flex-row flex-wrap justify-between">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <View key={i} className="w-[48%] aspect-square bg-zinc-900 rounded-xl mb-4 overflow-hidden animate-pulse" />
                        ))}
                    </View>
                </ScrollView>
            ) : savedMockups.length === 0 ? (
                <View className="flex-1 items-center justify-center">
                    <Package size={48} className="text-zinc-700 mb-4" />
                    <Text className="text-zinc-500">No saved mockups yet</Text>
                </View>
            ) : (
                <ScrollView className="p-4">
                    <View className="flex-row flex-wrap justify-between">
                         {savedMockups.map(mockup => (
                             <View key={mockup.id} className="w-[48%] aspect-square bg-zinc-900 rounded-xl mb-4 overflow-hidden">
                                 <Image source={{uri: mockup.imageUrl}} className="w-full h-full" resizeMode="cover" />
                             </View>
                         ))}
                    </View>
                </ScrollView>
            )}
        </SafeAreaView>
    );
};
