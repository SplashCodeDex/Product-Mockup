import React, { useState, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator } from '../components/ReactNative';
import { Camera } from '../components/ReactNative';
import { ChevronLeft, SwitchCamera } from 'lucide-react';
import { NativeStackScreenProps } from '../components/Navigation';
import { RootStackParamList } from '../types';
import { useData } from '../providers/DataProvider';
import { useEconomy } from '../providers/EconomyProvider';
import { useAuth } from '../providers/AuthProvider';
import { useGeneration } from '../hooks/useGeneration';
import { useAlert } from '../providers/AlertProvider';
import { GENERATION_COST } from '../constants';
import { generateId } from '../services/utils';
import { Haptics, ImpactFeedbackStyle, NotificationFeedbackType } from '../services/haptics';
import { ProcessingModal, ErrorModal } from '../components/ui/SharedUI';
import { getDistance, getAngle, snapRotation } from '../lib/utils';

export const TryOnScreen = ({ navigation }: NativeStackScreenProps<RootStackParamList, 'TryOn'>) => {
  const { assets } = useData();
  const { spendCredits, addCredits } = useEconomy();
  const { user } = useAuth();
  const { isGenerating, processingMessage, errorState, clearError, generateRealtimeComposite } = useGeneration();
  const { alert } = useAlert();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [selectedOverlay, setSelectedOverlay] = useState<string | null>(null);
  const [cameraType, setCameraType] = useState<'back' | 'front'>('back');

  // Interactive Placement State
  const [placement, setPlacement] = useState<{x: number, y: number, scale: number, rotation: number}>({
    x: 50, y: 50, scale: 1, rotation: 0
  });

  const [gestureState, setGestureState] = useState<{
    mode: 'drag' | 'pinch';
    startX: number;
    startY: number;
    startScale: number;
    startRotation: number;
    initX: number;
    initY: number;
    initDist: number;
    initAngle: number;
  } | null>(null);

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (!selectedOverlay) return;
    
    const isTouch = 'touches' in e;
    
    if (isTouch && (e as React.TouchEvent).touches.length === 2) {
      const t1 = (e as React.TouchEvent).touches[0];
      const t2 = (e as React.TouchEvent).touches[1];
      const dist = getDistance(t1, t2);
      const angle = getAngle(t1, t2);

      setGestureState({
        mode: 'pinch',
        startX: 0, startY: 0,
        startScale: placement.scale,
        startRotation: placement.rotation,
        initX: 0, initY: 0,
        initDist: dist,
        initAngle: angle
      });
      return;
    }

    const clientX = isTouch ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = isTouch ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;

    setGestureState({
      mode: 'drag',
      startX: clientX,
      startY: clientY,
      startScale: placement.scale,
      startRotation: placement.rotation,
      initX: placement.x,
      initY: placement.y,
      initDist: 0,
      initAngle: 0
    });
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!gestureState || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const isTouch = 'touches' in e;

    if (gestureState.mode === 'pinch' && isTouch && (e as React.TouchEvent).touches.length === 2) {
       const t1 = (e as React.TouchEvent).touches[0];
       const t2 = (e as React.TouchEvent).touches[1];
       const currentDist = getDistance(t1, t2);
       const currentAngle = getAngle(t1, t2);
       const scaleFactor = currentDist / gestureState.initDist;
       const rotationDelta = currentAngle - gestureState.initAngle;

       setPlacement(p => ({
         ...p,
         scale: Math.max(0.1, Math.min(5, gestureState.startScale * scaleFactor)),
         rotation: snapRotation(gestureState.startRotation + rotationDelta)
       }));
       return;
    }

    if (gestureState.mode === 'drag') {
       const clientX = isTouch ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
       const clientY = isTouch ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
       const deltaX = clientX - gestureState.startX;
       const deltaY = clientY - gestureState.startY;
       const moveX = (deltaX / rect.width) * 100;
       const moveY = (deltaY / rect.height) * 100;

       setPlacement(p => ({
         ...p,
         x: Math.max(0, Math.min(100, gestureState.initX + moveX)),
         y: Math.max(0, Math.min(100, gestureState.initY + moveY))
       }));
    }
  };

  const handleTouchEnd = () => {
    setGestureState(null);
  };

  const captureAndProcess = async () => {
    if (!videoRef.current || !selectedOverlay) {
        alert("Select Overlay", "Please select a logo or product to try on.");
        return;
    }

    Haptics.notificationAsync(NotificationFeedbackType.Success);

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("No Context");

      if (cameraType === 'front') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      const overlayAsset = assets.find(a => a.id === selectedOverlay);
      if (overlayAsset) {
        const img = new window.Image();
        await new Promise((resolve) => {
            img.onload = resolve;
            img.src = overlayAsset.data;
        });

        const centerX = (placement.x / 100) * canvas.width;
        const centerY = (placement.y / 100) * canvas.height;
        
        const baseW = canvas.width * 0.4; 
        const w = baseW * placement.scale;
        const h = w * (img.height / img.width);

        ctx.translate(centerX, centerY);
        ctx.rotate((placement.rotation * Math.PI) / 180);
        ctx.drawImage(img, -w/2, -h/2, w, h);
      }

      const compositeBase64 = canvas.toDataURL('image/png');
      
      const result = await generateRealtimeComposite(compositeBase64, "Make the overlay look like it's naturally printed on the surface in the photo.", GENERATION_COST);
      
      if (result) {
          navigation.navigate('Result', { result });
      } else if (!errorState.visible) {
          alert(
              "Insufficient Credits",
              `You need ${GENERATION_COST} credit to perform AR Try-On.`,
              [
                  { text: "Cancel", style: 'cancel' },
                  { text: "Get Credits", onPress: () => navigation.navigate('Store') }
              ]
          );
      }
      
    } catch (e) {
      console.error(e);
      alert("Error", "Failed to capture AR frame.");
    }
  };

  const handleRetry = async () => {
    if (errorState.lastPrompt) {
      clearError();
      const result = await generateRealtimeComposite(errorState.lastPrompt, "Make the overlay look like it's naturally printed on the surface in the photo.", 0);
      if (result) {
          navigation.navigate('Result', { result });
      }
    }
  };

  const handleRefund = async () => {
    await addCredits(GENERATION_COST);
    clearError();
    Haptics.impactAsync(ImpactFeedbackStyle.Light);
  };

  return (
    <View className="flex-1 bg-black relative">
       <ProcessingModal visible={isGenerating} message={processingMessage || "Processing AR composite..."} />
       <View 
         ref={containerRef}
         className="flex-1 relative overflow-hidden"
         style={{ touchAction: 'none' }}
         onTouchStart={handleTouchStart}
         onTouchMove={handleTouchMove}
         onTouchEnd={handleTouchEnd}
         onMouseDown={handleTouchStart}
         onMouseMove={handleTouchMove}
         onMouseUp={handleTouchEnd}
         onMouseLeave={handleTouchEnd}
       >
         <Camera 
           ref={videoRef}
           type={cameraType}
           className="absolute inset-0 w-full h-full" 
           style={{ objectFit: 'cover' }}
         />

         <ErrorModal 
           visible={errorState.visible}
           error={errorState.message}
           onRetry={handleRetry}
           onRefund={handleRefund}
           isRetrying={isGenerating}
         />
         
         {selectedOverlay && (
            <View 
              className="absolute w-40 h-40 border-2 border-white/50 border-dashed rounded-lg"
              style={{
                left: `${placement.x}%`,
                top: `${placement.y}%`,
                transform: `translate(-50%, -50%) scale(${placement.scale}) rotate(${placement.rotation}deg)`,
                pointerEvents: 'none'
              }}
            >
              {(() => {
                 const a = assets.find(x => x.id === selectedOverlay);
                 return a ? <Image source={{uri: a.data}} className="w-full h-full" resizeMode="contain" /> : null;
              })()}
              
              <View className="absolute -bottom-6 w-full items-center">
                 <Text className="text-white/70 text-[10px] font-bold bg-black/50 px-2 rounded">DRAG • PINCH • ROTATE</Text>
              </View>
            </View>
         )}
       </View>
       
       <View className="absolute bottom-0 left-0 right-0 z-20">
          <View className="h-24 mb-4">
              <ScrollView horizontal className="pl-4" showsHorizontalScrollIndicator={false}>
                {assets.map(a => (
                    <TouchableOpacity 
                      key={a.id}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setSelectedOverlay(a.id);
                      }}
                      className={`w-16 h-16 mr-4 rounded-full border-2 overflow-hidden bg-black/50 flex-shrink-0 ${selectedOverlay === a.id ? 'border-indigo-500 scale-110' : 'border-white/30'}`}
                    >
                      <Image source={{uri: a.data}} className="w-full h-full" />
                    </TouchableOpacity>
                ))}
              </ScrollView>
          </View>

          <View className="h-32 bg-black/60 flex-row items-center justify-around pb-6 backdrop-blur-md">
              <TouchableOpacity onPress={() => navigation.goBack()} className="p-4 rounded-full bg-zinc-800/50">
                <ChevronLeft color="white" size={24} />
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={captureAndProcess}
                disabled={isGenerating}
                className="w-20 h-20 rounded-full border-4 border-white items-center justify-center bg-white/20 active:scale-95 transition-transform"
              >
                {isGenerating ? <ActivityIndicator color="white" /> : <View className="w-16 h-16 bg-white rounded-full" />}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setCameraType(t => t === 'back' ? 'front' : 'back')} className="p-4 rounded-full bg-zinc-800/50">
                <SwitchCamera color="white" size={24} />
              </TouchableOpacity>
          </View>
       </View>
    </View>
  );
}
