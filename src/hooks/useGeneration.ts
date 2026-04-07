import { useState } from 'react';
import { useEconomy } from '../providers/EconomyProvider';
import { useData } from '../providers/DataProvider';
import { useAlert } from '../providers/AlertProvider';
import { generateAsset as apiGenerateAsset, generateMockup as apiGenerateMockup, generateRealtimeComposite as apiGenerateRealtimeComposite } from '../services/geminiService';
import { Asset, PlacedLayer, GeneratedMockup } from '../types';
import { generateId } from '../services/utils';
import { Haptics, NotificationFeedbackType } from '../services/haptics';

export const useGeneration = () => {
  const { spendCredits } = useEconomy();
  const { addAsset, saveMockup } = useData();
  const { alert } = useAlert();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [processingMessage, setProcessingMessage] = useState<string | null>(null);
  const [errorState, setErrorState] = useState<{ visible: boolean; message: string | null; lastPrompt: string | null }>({
    visible: false,
    message: null,
    lastPrompt: null
  });

  const clearError = () => setErrorState({ visible: false, message: null, lastPrompt: null });

  const generateAsset = async (prompt: string, type: 'logo' | 'product', cost: number = 1): Promise<boolean> => {
    setIsGenerating(true);
    setProcessingMessage(`Generating ${type}...`);
    try {
      if (!(await spendCredits(cost))) {
        alert("Insufficient Credits", `You need ${cost} credit(s) to generate.`);
        setIsGenerating(false);
        return false;
      }

      const b64 = await apiGenerateAsset(prompt, type);
      await addAsset({
        id: generateId(),
        uid: 'anonymous',
        type,
        name: `AI ${type}`,
        data: b64,
        mimeType: 'image/png'
      });
      
      Haptics.notificationAsync(NotificationFeedbackType.Success);
      clearError();
      return true;
    } catch (e: any) {
      Haptics.notificationAsync(NotificationFeedbackType.Error);
      setErrorState({
        visible: true,
        message: e.message || "An unexpected error occurred during generation.",
        lastPrompt: prompt
      });
      return false;
    } finally {
      setIsGenerating(false);
      setProcessingMessage(null);
    }
  };

  const generateMockup = async (
    productAsset: Asset, 
    layers: { asset: Asset; placement: PlacedLayer }[], 
    prompt: string,
    cost: number = 1
  ): Promise<GeneratedMockup | null> => {
    setIsGenerating(true);
    setProcessingMessage("Generating mockup...");
    try {
      if (!(await spendCredits(cost))) {
        alert("Insufficient Credits", `You need ${cost} credit(s) to generate.`);
        setIsGenerating(false);
        return null;
      }

      const resultUrl = await apiGenerateMockup(productAsset, layers, prompt);
      
      Haptics.notificationAsync(NotificationFeedbackType.Success);
      clearError();
      
      const mockup: GeneratedMockup = {
        id: generateId(),
        uid: 'anonymous', // will be overwritten by saveMockup
        imageUrl: resultUrl,
        prompt,
        createdAt: Date.now()
      };
      
      return mockup;
    } catch (e: any) {
      Haptics.notificationAsync(NotificationFeedbackType.Error);
      setErrorState({
        visible: true,
        message: e.message || "An unexpected error occurred during mockup generation.",
        lastPrompt: prompt
      });
      return null;
    } finally {
      setIsGenerating(false);
      setProcessingMessage(null);
    }
  };

  const generateRealtimeComposite = async (
    compositeImageBase64: string,
    prompt: string = "Make this look like a real photo",
    cost: number = 1
  ): Promise<GeneratedMockup | null> => {
    setIsGenerating(true);
    setProcessingMessage("Processing AR composite...");
    try {
      if (!(await spendCredits(cost))) {
        alert("Insufficient Credits", `You need ${cost} credit(s) to process AR.`);
        setIsGenerating(false);
        return null;
      }

      const resultUrl = await apiGenerateRealtimeComposite(compositeImageBase64, prompt);
      
      Haptics.notificationAsync(NotificationFeedbackType.Success);
      clearError();
      
      const mockup: GeneratedMockup = {
        id: generateId(),
        uid: 'anonymous', // will be overwritten by saveMockup
        imageUrl: resultUrl,
        prompt: "AR Try-On",
        createdAt: Date.now()
      };
      
      return mockup;
    } catch (e: any) {
      Haptics.notificationAsync(NotificationFeedbackType.Error);
      setErrorState({
        visible: true,
        message: e.message || "An unexpected error occurred during AR processing.",
        lastPrompt: prompt
      });
      return null;
    } finally {
      setIsGenerating(false);
      setProcessingMessage(null);
    }
  };

  return {
    isGenerating,
    processingMessage,
    errorState,
    clearError,
    generateAsset,
    generateMockup,
    generateRealtimeComposite
  };
};
