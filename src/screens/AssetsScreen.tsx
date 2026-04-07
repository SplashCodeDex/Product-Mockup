import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, SafeAreaView } from '../components/ReactNative';
import { Plus, Trash2, Camera as CameraIcon, Wand2, ChevronLeft } from 'lucide-react';
import { NativeStackScreenProps } from '../components/Navigation';
import { RootStackParamList } from '../types';
import { useData } from '../providers/DataProvider';
import { useEconomy } from '../providers/EconomyProvider';
import { useGeneration } from '../hooks/useGeneration';
import { useAlert } from '../providers/AlertProvider';
import { launchImageLibraryAsync } from '../services/imagePicker';
import { generateId } from '../services/utils';
import { Haptics, ImpactFeedbackStyle } from '../services/haptics';
import { Header, InputModal, ErrorModal, ProcessingModal, Button } from '../components/ui/SharedUI';

export const AssetsScreen = ({ navigation }: NativeStackScreenProps<RootStackParamList, 'Assets'>) => {
  const { assets, addAsset, removeAsset, clearDraft } = useData();
  const { spendCredits, addCredits } = useEconomy();
  const { isGenerating, processingMessage, errorState, clearError, generateAsset } = useGeneration();
  const { alert } = useAlert();
  
  const [activeTab, setActiveTab] = useState<'product' | 'logo'>('product');
  const [showPrompt, setShowPrompt] = useState(false);

  const handlePickImage = async () => {
    const result = await launchImageLibraryAsync({ mediaTypes: 'Images', base64: true });
    if (!result.canceled && result.assets) {
      const asset = result.assets[0];
      
      // Check size (approx 10MB limit)
      const base64Data = asset.base64?.split(',')[1] || '';
      const sizeInBytes = (base64Data.length * 3) / 4;
      if (sizeInBytes > 10 * 1024 * 1024) {
          alert("File Too Large", "Please select an image smaller than 10MB.");
          return;
      }

      addAsset({
        id: generateId(),
        type: activeTab,
        name: asset.fileName || 'Upload',
        data: asset.base64 || asset.uri,
        uid: 'anonymous', // Handled by DataProvider
        mimeType: asset.mimeType || 'image/png'
      });
    }
  };

  const handleGenerateConfirm = async (prompt: string) => {
    setShowPrompt(false);
    if (!prompt) return;

    const success = await generateAsset(prompt, activeTab, 1);
    if (!success && !errorState.visible) {
        // If it failed but no error modal is showing, it means insufficient credits
        // The hook already shows an alert, but we can offer navigation
        alert(
            "Insufficient Credits",
            "You need 1 credit to generate an asset.",
            [
                { text: "Cancel", style: 'cancel' },
                { text: "Get Credits", onPress: () => navigation.navigate('Store') }
            ]
        );
    }
  };

  const handleRetry = async () => {
    if (errorState.lastPrompt) {
      clearError();
      // We don't charge again for retry in this flow, but the hook charges by default.
      // Actually, our hook charges first. If it fails, we need to refund or not charge.
      // Let's just use the hook's generateAsset and charge 0 for retry.
      await generateAsset(errorState.lastPrompt, activeTab, 0);
    }
  };

  const handleRefund = async () => {
    await addCredits(1);
    clearError();
    Haptics.impactAsync(ImpactFeedbackStyle.Light);
  };

  const filteredAssets = assets.filter(a => a.type === activeTab);

  const handleStartNew = () => {
      clearDraft();
      navigation.navigate('Studio');
  };

  return (
    <SafeAreaView className="bg-black flex-1">
      <Header 
        title="Assets" 
        leftAction={{ icon: <ChevronLeft size={24} color="white" />, onPress: () => navigation.goBack() }}
      />
      
      <View className="flex-row p-4 space-x-2">
        <TouchableOpacity 
          onPress={() => setActiveTab('product')}
          className={`flex-1 py-3 rounded-xl items-center ${activeTab === 'product' ? 'bg-indigo-600' : 'bg-zinc-900'}`}
        >
          <Text className={`font-bold ${activeTab === 'product' ? 'text-white' : 'text-zinc-400'}`}>Products</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setActiveTab('logo')}
          className={`flex-1 py-3 rounded-xl items-center ${activeTab === 'logo' ? 'bg-indigo-600' : 'bg-zinc-900'}`}
        >
          <Text className={`font-bold ${activeTab === 'logo' ? 'text-white' : 'text-zinc-400'}`}>Logos / Art</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4">
        <View className="flex-row flex-wrap justify-between">
          <TouchableOpacity 
            onPress={handlePickImage}
            className="w-[48%] aspect-square bg-zinc-900 rounded-2xl items-center justify-center mb-4 border border-zinc-800 border-dashed"
          >
            <CameraIcon size={32} className="text-zinc-500 mb-2" />
            <Text className="text-zinc-500 font-bold">Upload</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => setShowPrompt(true)}
            className="w-[48%] aspect-square bg-indigo-900/20 rounded-2xl items-center justify-center mb-4 border border-indigo-500/30"
          >
            <Wand2 size={32} className="text-indigo-400 mb-2" />
            <Text className="text-indigo-400 font-bold">Generate AI</Text>
          </TouchableOpacity>

          {filteredAssets.map(asset => (
            <View key={asset.id} className="w-[48%] aspect-square bg-zinc-900 rounded-2xl mb-4 overflow-hidden border border-zinc-800 relative">
              <Image source={{ uri: asset.data }} className="w-full h-full" resizeMode="contain" />
              <TouchableOpacity 
                onPress={() => removeAsset(asset.id)}
                className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full items-center justify-center"
              >
                <Trash2 size={16} className="text-white" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      <View className="p-6 pt-2 bg-zinc-950 border-t border-zinc-900">
          <Button 
            onPress={handleStartNew} 
            disabled={assets.filter(a => a.type === 'product').length === 0}
            className="w-full h-14"
          >
            Continue to Studio
          </Button>
      </View>

      <InputModal 
        visible={showPrompt}
        title={`Generate ${activeTab === 'product' ? 'Product' : 'Logo'}`}
        placeholder="Describe what you want to create..."
        onSubmit={handleGenerateConfirm}
        onCancel={() => setShowPrompt(false)}
      />

      <ProcessingModal visible={isGenerating} message={processingMessage || "Generating..."} />
      
      <ErrorModal 
        visible={errorState.visible}
        error={errorState.message}
        onRetry={handleRetry}
        onRefund={handleRefund}
        isRetrying={isGenerating}
      />
    </SafeAreaView>
  );
};
