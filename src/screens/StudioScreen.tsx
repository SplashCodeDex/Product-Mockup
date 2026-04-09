import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, SafeAreaView } from '../components/ReactNative';
import { ChevronLeft, Wallet, Settings2, ArrowDown, ArrowUp, Copy, Trash2, Plus, Wand2, Eraser, RotateCcw, RotateCw } from 'lucide-react';
import { NativeStackScreenProps } from '../components/Navigation';
import { RootStackParamList, PlacedLayer, Asset } from '../types';
import { useData } from '../providers/DataProvider';
import { useEconomy } from '../providers/EconomyProvider';
import { useAuth } from '../providers/AuthProvider';
import { useGeneration } from '../hooks/useGeneration';
import { useAlert } from '../providers/AlertProvider';
import { GENERATION_COST } from '../constants';
import { generateId } from '../services/utils';
import { Haptics, ImpactFeedbackStyle, NotificationFeedbackType } from '../services/haptics';
import { Header, ProcessingModal, ErrorModal, Button } from '../components/ui/SharedUI';
import { Slider } from '../components/ReactNative';

import { getDistance, getAngle, snapRotation } from '../lib/utils';

export const StudioScreen = ({ navigation }: NativeStackScreenProps<RootStackParamList, 'Studio'>) => {
  const { assets, draft, updateDraft, clearDraft } = useData();
  const { spendCredits, addCredits } = useEconomy();
  const { user } = useAuth();
  const { isGenerating, processingMessage, errorState, clearError, generateMockup } = useGeneration();
  const { alert } = useAlert();
  
  // Initialize state from draft if available, otherwise defaults
  const [selectedProduct, setSelectedProduct] = useState<string | null>(
      draft?.productId || null
  );
  const [layers, setLayers] = useState<PlacedLayer[]>(
      draft?.layers || []
  );
  
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);

  const [history, setHistory] = useState<PlacedLayer[][]>([draft?.layers || []]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Auto-Select first product if nothing is selected and no draft
  useEffect(() => {
    if (!selectedProduct) {
        const firstProduct = assets.find(a => a.type === 'product');
        if (firstProduct) setSelectedProduct(firstProduct.id);
    }
  }, []);

  // Auto-Save Draft
  useEffect(() => {
      if (selectedProduct || layers.length > 0) {
          updateDraft({
              productId: selectedProduct,
              layers: layers
          });
      }
  }, [layers, selectedProduct]);

  const commitHistory = (newLayers: PlacedLayer[]) => {
    const next = history.slice(0, historyIndex + 1);
    next.push(newLayers);
    setHistory(next);
    setHistoryIndex(next.length - 1);
    setLayers(newLayers);
  };

  const undo = () => {
    if (historyIndex > 0) {
      Haptics.impactAsync(ImpactFeedbackStyle.Medium);
      const prev = historyIndex - 1;
      setHistoryIndex(prev);
      setLayers(history[prev]);
      setActiveLayerId(null);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      Haptics.impactAsync(ImpactFeedbackStyle.Medium);
      const next = historyIndex + 1;
      setHistoryIndex(next);
      setLayers(history[next]);
      setActiveLayerId(null);
    }
  };

  const handleClearCanvas = () => {
      alert("Clear Canvas", "Remove all layers and reset draft?", [
          { text: "Cancel", style: "cancel"},
          { text: "Clear", style: "destructive", onPress: () => {
              setLayers([]);
              setSelectedProduct(null);
              setHistory([[]]);
              setHistoryIndex(0);
              clearDraft();
          }}
      ])
  };

  const addLayer = (assetId: string) => {
    Haptics.selectionAsync();
    const newLayer: PlacedLayer = {
      uid: generateId(),
      assetId,
      x: 50,
      y: 50,
      scale: 1,
      rotation: 0,
      opacity: 1,
      blendMode: 'normal'
    };
    const newLayers = [...layers, newLayer];
    commitHistory(newLayers);
    setActiveLayerId(newLayer.uid);
  };

  const updateLayer = (uid: string, updates: Partial<PlacedLayer>) => {
    const newLayers = layers.map(l => l.uid === uid ? { ...l, ...updates } : l);
    setLayers(newLayers);
  };

  const duplicateLayer = () => {
    if (!activeLayerId) return;
    const layer = layers.find(l => l.uid === activeLayerId);
    if (layer) {
        const newLayer = { ...layer, uid: generateId(), x: layer.x + 5, y: layer.y + 5 };
        const newLayers = [...layers, newLayer];
        commitHistory(newLayers);
        setActiveLayerId(newLayer.uid);
        Haptics.selectionAsync();
    }
  };

  const bringToFront = () => {
    if (!activeLayerId) return;
    const index = layers.findIndex(l => l.uid === activeLayerId);
    if (index === -1 || index === layers.length - 1) return;
    
    const newLayers = [...layers];
    const [item] = newLayers.splice(index, 1);
    newLayers.push(item);
    commitHistory(newLayers);
    Haptics.selectionAsync();
  };

  const sendToBack = () => {
    if (!activeLayerId) return;
    const index = layers.findIndex(l => l.uid === activeLayerId);
    if (index <= 0) return;
    
    const newLayers = [...layers];
    const [item] = newLayers.splice(index, 1);
    newLayers.unshift(item);
    commitHistory(newLayers);
    Haptics.selectionAsync();
  };
  
  const handleLayerChangeEnd = () => {
    commitHistory(layers);
  };

  const handleGenerate = async () => {
    if (!selectedProduct || layers.length === 0) return;
    
    const productAsset = assets.find(a => a.id === selectedProduct)!;
    
    const result = await generateMockup(productAsset, layers.map(l => ({
      asset: assets.find(a => a.id === l.assetId)!,
      placement: l
    })), "Create a realistic DeXify mockup.", GENERATION_COST);

    if (result) {
        navigation.navigate('Result', { result });
    } else if (!errorState.visible) {
        alert(
            "Insufficient Credits",
            `You need ${GENERATION_COST} credit to generate a mockup.`,
            [
                { text: "Cancel", style: 'cancel' },
                { text: "Get Credits", onPress: () => navigation.navigate('Store') }
            ]
        );
    }
  };

  const handleRetry = async () => {
    if (!selectedProduct || layers.length === 0) return;
    const productAsset = assets.find(a => a.id === selectedProduct)!;
    
    clearError();
    const result = await generateMockup(productAsset, layers.map(l => ({
      asset: assets.find(a => a.id === l.assetId)!,
      placement: l
    })), "Create a realistic DeXify mockup.", 0); // 0 cost for retry

    if (result) {
        navigation.navigate('Result', { result });
    }
  };

  const handleRefund = async () => {
    await addCredits(GENERATION_COST);
    clearError();
    Haptics.impactAsync(ImpactFeedbackStyle.Light);
  };

  // Dragging & Gestures Logic
  const canvasRef = useRef<HTMLDivElement>(null);
  const [gestureState, setGestureState] = useState<{
    id: string;
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

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent, layer: PlacedLayer) => {
    e.stopPropagation();
    Haptics.selectionAsync();
    setActiveLayerId(layer.uid);
    
    const isTouch = 'touches' in e;
    
    if (isTouch && (e as React.TouchEvent).touches.length === 2) {
      const t1 = (e as React.TouchEvent).touches[0];
      const t2 = (e as React.TouchEvent).touches[1];
      const dist = getDistance(t1, t2);
      const angle = getAngle(t1, t2);

      setGestureState({
        id: layer.uid,
        mode: 'pinch',
        startX: 0, 
        startY: 0,
        startScale: layer.scale,
        startRotation: layer.rotation,
        initX: 0,
        initY: 0,
        initDist: dist,
        initAngle: angle
      });
      return;
    }

    const clientX = isTouch ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = isTouch ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;

    setGestureState({
      id: layer.uid,
      mode: 'drag',
      startX: clientX,
      startY: clientY,
      startScale: layer.scale,
      startRotation: layer.rotation,
      initX: layer.x,
      initY: layer.y,
      initDist: 0,
      initAngle: 0
    });
  };

  const handleCanvasMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!gestureState || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const isTouch = 'touches' in e;

    if (gestureState.mode === 'pinch' && isTouch && (e as React.TouchEvent).touches.length === 2) {
       const t1 = (e as React.TouchEvent).touches[0];
       const t2 = (e as React.TouchEvent).touches[1];
       const currentDist = getDistance(t1, t2);
       const currentAngle = getAngle(t1, t2);

       const scaleFactor = currentDist / gestureState.initDist;
       const rotationDelta = currentAngle - gestureState.initAngle;

       const newRotation = snapRotation(gestureState.startRotation + rotationDelta);

       const newLayers = layers.map(l => {
         if (l.uid !== gestureState.id) return l;
         return {
           ...l,
           scale: Math.max(0.1, Math.min(5, gestureState.startScale * scaleFactor)),
           rotation: newRotation
         };
       });
       setLayers(newLayers);
       return;
    }

    if (gestureState.mode === 'drag') {
       const clientX = isTouch ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
       const clientY = isTouch ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;

       const deltaX = clientX - gestureState.startX;
       const deltaY = clientY - gestureState.startY;
    
       const moveX = (deltaX / rect.width) * 100;
       const moveY = (deltaY / rect.height) * 100;

       const newLayers = layers.map(l => {
         if (l.uid !== gestureState.id) return l;
         return {
           ...l,
           x: Math.max(0, Math.min(100, gestureState.initX + moveX)),
           y: Math.max(0, Math.min(100, gestureState.initY + moveY))
         };
       });
       setLayers(newLayers);
    }
  };

  const handleCanvasEnd = () => {
    if (gestureState) {
      commitHistory(layers);
      setGestureState(null);
    }
  };

  const activeLayer = layers.find(l => l.uid === activeLayerId);
  const productAsset = assets.find(a => a.id === selectedProduct);

  return (
    <SafeAreaView className="bg-black flex-1">
      <ProcessingModal visible={isGenerating} message={processingMessage || "Generating..."} />
      <Header 
        title="Studio" 
        leftAction={{ icon: <ChevronLeft color="white" />, onPress: navigation.goBack }} 
        rightAction={{ icon: <Wallet size={20} className="text-indigo-400" />, onPress: () => navigation.navigate('Store') }}
      />

      <ErrorModal 
        visible={errorState.visible}
        error={errorState.message}
        onRetry={handleRetry}
        onRefund={handleRefund}
        isRetrying={isGenerating}
      />

      {/* Canvas Area Container - Centered */}
      <View className="flex-1 bg-zinc-950 items-center justify-center p-4 min-h-0 w-full overflow-hidden">
        {/* Enforce 1:1 Aspect Ratio Workspace. We set width to fit, and aspect ratio handles height. Max height constrains vertical growth. */}
        <View 
            className="aspect-square bg-zinc-900 overflow-hidden relative border border-zinc-800 rounded-sm shadow-2xl"
            style={{ 
                touchAction: 'none', 
                width: '100%',
                maxWidth: '500px', 
                // Ensure the canvas doesn't overflow vertically if the device is short (landscape)
                maxHeight: '100%',
                aspectRatio: '1/1'
            }}
            ref={canvasRef}
            onTouchMove={handleCanvasMove}
            onTouchEnd={handleCanvasEnd}
            onMouseMove={handleCanvasMove}
            onMouseUp={handleCanvasEnd}
            onMouseLeave={handleCanvasEnd}
        >
            <TouchableOpacity 
                activeOpacity={1} 
                onPress={() => setActiveLayerId(null)} 
                className="w-full h-full items-center justify-center"
            >
                {productAsset ? (
                    <Image 
                    source={{ uri: productAsset.data }} 
                    className="w-full h-full" 
                    resizeMode="contain" 
                    />
                ) : (
                    <Text className="text-zinc-600 font-bold">Select a Product below</Text>
                )}

                {layers.map(layer => {
                    const asset = assets.find(a => a.id === layer.assetId);
                    if (!asset) return null;
                    const isSelected = activeLayerId === layer.uid;

                    return (
                    <View
                        key={layer.uid}
                        className={`absolute w-24 h-24 ${isSelected ? 'border-2 border-indigo-500' : ''}`}
                        style={{
                        left: `${layer.x}%`,
                        top: `${layer.y}%`,
                        transform: `translate(-50%, -50%) scale(${layer.scale}) rotate(${layer.rotation}deg)`,
                        opacity: layer.opacity ?? 1,
                        mixBlendMode: (layer.blendMode as any) || 'normal',
                        cursor: 'move',
                        touchAction: 'none'
                        }}
                        onTouchStart={(e) => handleTouchStart(e, layer)}
                        onMouseDown={(e) => handleTouchStart(e, layer)}
                    >
                        <Image source={{ uri: asset.data }} className="w-full h-full" resizeMode="contain" />
                    </View>
                    );
                })}
            </TouchableOpacity>

            {/* Toolbar Overlay - Absolute to Canvas */}
            <View className="absolute top-4 right-4 flex-row space-x-2 pointer-events-auto">
                <TouchableOpacity onPress={handleClearCanvas} className="w-10 h-10 bg-zinc-800/80 rounded-full items-center justify-center shadow-lg">
                    <Eraser size={18} className="text-red-400" />
                </TouchableOpacity>
                <TouchableOpacity onPress={undo} disabled={historyIndex === 0} className={`w-10 h-10 rounded-full items-center justify-center shadow-lg ${historyIndex === 0 ? 'bg-zinc-800/40' : 'bg-zinc-800/80'}`}>
                    <RotateCcw size={18} className={historyIndex === 0 ? 'text-zinc-600' : 'text-white'} />
                </TouchableOpacity>
                <TouchableOpacity onPress={redo} disabled={historyIndex === history.length - 1} className={`w-10 h-10 rounded-full items-center justify-center shadow-lg ${historyIndex === history.length - 1 ? 'bg-zinc-800/40' : 'bg-zinc-800/80'}`}>
                    <RotateCw size={18} className={historyIndex === history.length - 1 ? 'text-zinc-600' : 'text-white'} />
                </TouchableOpacity>
            </View>
        </View>
      </View>

      {/* Controls Panel - Flexible height */}
      <View className="bg-zinc-950 border-t border-zinc-800 flex-shrink-0 pb-[env(safe-area-inset-bottom)]">
        {activeLayer ? (
          <ScrollView className="p-4 h-72">
             <View className="flex-row justify-between items-center mb-4">
               <Text className="font-bold text-white flex-row items-center"><Settings2 size={16} className="mr-2"/> Edit Layer</Text>
               <View className="flex-row items-center space-x-2">
                   {/* Layer Ordering Controls */}
                   <TouchableOpacity onPress={sendToBack} className="p-2 bg-zinc-900 rounded-lg border border-zinc-800">
                     <ArrowDown size={18} className="text-zinc-400" />
                   </TouchableOpacity>
                   <TouchableOpacity onPress={bringToFront} className="p-2 bg-zinc-900 rounded-lg border border-zinc-800">
                     <ArrowUp size={18} className="text-zinc-400" />
                   </TouchableOpacity>

                   <View className="w-px h-6 bg-zinc-800 mx-2" />

                   <TouchableOpacity onPress={duplicateLayer} className="mr-2">
                     <Copy size={20} className="text-indigo-400" />
                   </TouchableOpacity>
                   <TouchableOpacity onPress={() => {
                     const newLayers = layers.filter(l => l.uid !== activeLayer.uid);
                     commitHistory(newLayers);
                     setActiveLayerId(null);
                   }}>
                     <Trash2 size={20} className="text-red-500" />
                   </TouchableOpacity>
               </View>
             </View>
             
             <View className="flex-row items-center mb-4 space-x-4">
                <Text className="text-zinc-400 w-16">Scale</Text>
                <Slider 
                  value={activeLayer.scale}
                  minimumValue={0.2}
                  maximumValue={3}
                  step={0.1}
                  onValueChange={(val) => updateLayer(activeLayer.uid, { scale: val })}
                  onSlidingComplete={handleLayerChangeEnd}
                  className="flex-1"
                />
             </View>
             <View className="flex-row items-center mb-4 space-x-4">
                <Text className="text-zinc-400 w-16">Rotate</Text>
                <Slider 
                  value={activeLayer.rotation}
                  minimumValue={0}
                  maximumValue={360}
                  step={15}
                  onValueChange={(val) => updateLayer(activeLayer.uid, { rotation: val })}
                  onSlidingComplete={handleLayerChangeEnd}
                  className="flex-1"
                />
             </View>
             <View className="flex-row items-center mb-4 space-x-4">
                <Text className="text-zinc-400 w-16">Opacity</Text>
                <Slider 
                  value={activeLayer.opacity ?? 1}
                  minimumValue={0.1}
                  maximumValue={1}
                  step={0.05}
                  onValueChange={(val) => updateLayer(activeLayer.uid, { opacity: val })}
                  onSlidingComplete={handleLayerChangeEnd}
                  className="flex-1"
                />
             </View>
             <View className="mb-6">
                <Text className="text-zinc-400 mb-2">Blend Mode</Text>
                <View className="flex-row space-x-2">
                   {['normal', 'multiply', 'screen', 'overlay'].map(mode => (
                      <TouchableOpacity 
                        key={mode}
                        onPress={() => {
                          updateLayer(activeLayer.uid, { blendMode: mode as any });
                          handleLayerChangeEnd();
                        }}
                        className={`px-3 py-1.5 rounded-lg border ${activeLayer.blendMode === mode || (!activeLayer.blendMode && mode === 'normal') ? 'bg-indigo-600 border-indigo-500' : 'bg-zinc-900 border-zinc-700'}`}
                      >
                        <Text className="text-white text-xs capitalize">{mode}</Text>
                      </TouchableOpacity>
                   ))}
                </View>
             </View>
          </ScrollView>
        ) : (
          <View className="h-56">
             {/* Product Selection List */}
             <ScrollView horizontal className="p-4 border-b border-zinc-900 h-24 max-h-24 min-h-[6rem]">
                {assets.filter(a => a.type === 'product').length === 0 ? (
                    <Text className="text-zinc-600 self-center">No Products</Text>
                ) : assets.filter(a => a.type === 'product').map(p => (
                   <TouchableOpacity 
                     key={p.id} 
                     onPress={() => setSelectedProduct(p.id)}
                     className={`w-16 h-16 mr-3 rounded-lg border-2 bg-zinc-900 p-1 flex-shrink-0 ${selectedProduct === p.id ? 'border-indigo-500' : 'border-zinc-800'}`}
                   >
                      <Image source={{ uri: p.data }} className="w-full h-full" resizeMode="contain" />
                   </TouchableOpacity>
                ))}
             </ScrollView>

             {/* Logo Add List */}
             <ScrollView horizontal className="p-4 h-24 max-h-24 min-h-[6rem]">
                <TouchableOpacity onPress={() => navigation.navigate('Assets')} className="w-16 h-16 mr-3 rounded-lg border border-dashed border-zinc-700 items-center justify-center flex-shrink-0">
                   <Plus size={20} className="text-zinc-500" />
                </TouchableOpacity>
                {assets.filter(a => a.type === 'logo').map(l => (
                   <TouchableOpacity 
                     key={l.id} 
                     onPress={() => addLayer(l.id)}
                     className="w-16 h-16 mr-3 rounded-lg border border-zinc-800 bg-zinc-900 p-1 flex-shrink-0"
                   >
                      <Image source={{ uri: l.data }} className="w-full h-full" resizeMode="contain" />
                   </TouchableOpacity>
                ))}
             </ScrollView>
          </View>
        )}

        <View className="px-4 pb-6 pt-2">
           <Button onPress={handleGenerate} isLoading={isGenerating} icon={<Wand2 size={18} />}>
             Generate Mockup ({GENERATION_COST} CR)
           </Button>
        </View>
      </View>
    </SafeAreaView>
  );
};
