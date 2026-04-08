/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { Component, useState, useRef, useEffect, useCallback, createContext, useContext, PropsWithChildren } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  TextInput,
  StatusBar,
  Modal,
  Alert,
  ActivityIndicator,
  Slider,
  KeyboardAvoidingView,
  Camera,
  Share
} from './components/ReactNative';
import { 
  Box, 
  Wand2, 
  Image as ImageIcon, 
  ArrowRight, 
  Sparkles, 
  Plus, 
  Trash2, 
  Settings2, 
  RotateCcw, 
  Share2,
  Package,
  ChevronLeft,
  Check,
  Camera as CameraIcon,
  Aperture,
  SwitchCamera,
  Info,
  LogOut,
  Database,
  ChevronRight,
  Maximize2,
  Wallet,
  PlayCircle, 
  Play,
  CreditCard,
  Coins,
  DownloadCloud,
  FileEdit,
  Eraser,
  Copy,
  Layers,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

import { 
  generateMockup, 
  generateAsset, 
  generateRealtimeComposite 
} from './services/geminiService';
import { uploadImage, deleteImage } from './services/storageService';
import { 
  Asset, 
  GeneratedMockup, 
  PlacedLayer, 
  GlobalContextType, 
  Draft,
  UserProfile
} from './types';
import { launchImageLibraryAsync } from './services/imagePicker';
import { NavigationContainer, createNativeStackNavigator, NativeStackScreenProps } from './components/Navigation';
import { AsyncStorage } from './services/storage';
import { Haptics, ImpactFeedbackStyle, NotificationFeedbackType } from './services/haptics';
import { DEMO_ASSETS } from './services/demoData';
import { adService } from './services/adService';
import { iapService, Product } from './services/iapService';
import { generateId } from './services/utils';

// --- Firebase ---
import { INITIAL_CREDITS, GENERATION_COST, REWARD_AD_CREDITS, APP_NAME } from './constants';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  collection, 
  query, 
  orderBy, 
  deleteDoc, 
  updateDoc,
  increment,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';

// --- Types ---

type RootStackParamList = {
  Dashboard: undefined;
  Assets: undefined;
  Studio: undefined;
  Result: { result: GeneratedMockup };
  Gallery: undefined;
  TryOn: undefined;
  Settings: undefined;
  Store: undefined;
};

// --- Store / Global State ---

const GlobalStateContext = createContext<GlobalContextType | null>(null);

const useGlobalState = () => {
  const context = useContext(GlobalStateContext);
  if (!context) throw new Error("useGlobalState must be used within GlobalStateProvider");
  return context;
};

// --- Components ---

class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    (this as any).state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if ((this as any).state.hasError) {
      let displayError = "An unexpected error occurred.";
      try {
        const parsed = JSON.parse((this as any).state.error.message);
        if (parsed.error) displayError = parsed.error;
      } catch (e) {
        displayError = (this as any).state.error.message || displayError;
      }

      return (
        <View className="flex-1 bg-black items-center justify-center p-8">
          <View className="w-16 h-16 bg-red-900/20 rounded-full items-center justify-center mb-6">
            <Info size={32} className="text-red-500" />
          </View>
          <Text className="text-2xl font-black text-white mb-2 text-center">Something went wrong</Text>
          <Text className="text-zinc-400 text-center mb-8 leading-6">{displayError}</Text>
          <Button onPress={() => window.location.reload()} className="bg-indigo-600 px-8">
            Reload Application
          </Button>
        </View>
      );
    }

    return (this as any).props.children;
  }
}

const LoginScreen = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error("Login failed", e);
      Alert.alert("Login Failed", "Could not sign in with Google.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-black items-center justify-center px-8">
       <View className="w-24 h-24 bg-indigo-600 rounded-3xl items-center justify-center mb-8 shadow-2xl shadow-indigo-500/20">
          <Package size={48} className="text-white" />
       </View>
       <Text className="text-4xl font-black text-white mb-2">{APP_NAME}</Text>
       <Text className="text-zinc-400 text-center mb-12 text-lg leading-6 px-4">
          Sign in to sync your designs across devices and access AI features.
       </Text>
       
       <TouchableOpacity 
         onPress={handleLogin}
         disabled={isLoading}
         className="w-full bg-white flex-row items-center justify-center py-4 rounded-2xl active:scale-95 transition-transform"
       >
          {isLoading ? (
            <ActivityIndicator color="black" />
          ) : (
            <>
              <Image 
                source={{ uri: "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" }} 
                className="w-6 h-6 mr-3"
              />
              <Text className="text-black font-bold text-lg">Continue with Google</Text>
            </>
          )}
       </TouchableOpacity>
       
       <Text className="text-zinc-600 text-xs mt-8 text-center px-8">
          By continuing, you agree to our <TouchableOpacity onPress={() => Alert.alert("Terms of Service", "...")}><Text className="underline">Terms of Service</Text></TouchableOpacity> and <TouchableOpacity onPress={() => Alert.alert("Privacy Policy", "...")}><Text className="underline">Privacy Policy</Text></TouchableOpacity>.
       </Text>
    </View>
  );
};

const SplashScreen = () => {
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

const GlobalStateProvider = ({ children }: PropsWithChildren<{}>) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [savedMockups, setSavedMockups] = useState<GeneratedMockup[]>([]);
  const [credits, setCredits] = useState(0);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isDataReady, setIsDataReady] = useState(false);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Ensure user document exists
        const userRef = doc(db, 'users', firebaseUser.uid);
        try {
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            const newUser: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              credits: INITIAL_CREDITS, // Initial credits from constants
              createdAt: Date.now()
            };
            await setDoc(userRef, newUser);
          }
        } catch (e) {
          handleFirestoreError(e, OperationType.GET, `users/${firebaseUser.uid}`);
        }
      } else {
        setUserProfile(null);
        setAssets([]);
        setSavedMockups([]);
        setCredits(0);
        setDraft(null);
      }
      setIsAuthReady(true);
    });
    return unsubscribe;
  }, []);

  // Firestore Listeners
  useEffect(() => {
    if (!auth.currentUser) {
      setIsDataReady(true);
      return;
    }

    const uid = auth.currentUser.uid;
    const userRef = doc(db, 'users', uid);
    const assetsRef = collection(db, 'users', uid, 'assets');
    const mockupsRef = collection(db, 'users', uid, 'mockups');
    const draftsRef = collection(db, 'users', uid, 'drafts');

    // User Profile & Credits
    const unsubUser = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        setUserProfile(data);
        setCredits(data.credits);
      }
    }, (e) => handleFirestoreError(e, OperationType.GET, `users/${uid}`));

    // Assets
    const unsubAssets = onSnapshot(query(assetsRef, orderBy('createdAt', 'desc')), (snap) => {
      const items = snap.docs.map(d => d.data() as Asset);
      setAssets(items);
    }, (e) => handleFirestoreError(e, OperationType.GET, `users/${uid}/assets`));

    // Mockups
    const unsubMockups = onSnapshot(query(mockupsRef, orderBy('createdAt', 'desc')), (snap) => {
      const items = snap.docs.map(d => d.data() as GeneratedMockup);
      setSavedMockups(items);
    }, (e) => handleFirestoreError(e, OperationType.GET, `users/${uid}/mockups`));

    // Current Draft (we'll just use the first one or a specific ID)
    const unsubDrafts = onSnapshot(query(draftsRef, orderBy('lastModified', 'desc')), (snap) => {
      if (!snap.empty) {
        setDraft(snap.docs[0].data() as Draft);
      } else {
        setDraft(null);
      }
      setIsDataReady(true);
    }, (e) => handleFirestoreError(e, OperationType.GET, `users/${uid}/drafts`));

    return () => {
      unsubUser();
      unsubAssets();
      unsubMockups();
      unsubDrafts();
    };
  }, [isAuthReady]);

  const logout = async () => {
    await signOut(auth);
  };

  const addAsset = async (a: Asset) => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    
    try {
      let finalData = a.data;
      // If it's a base64 string, upload to storage
      if (a.data.startsWith('data:')) {
        finalData = await uploadImage(uid, 'assets', a.data);
      }
      
      const assetRef = doc(db, 'users', uid, 'assets', a.id);
      await setDoc(assetRef, { ...a, data: finalData, uid, createdAt: Date.now() });
      Haptics.notificationAsync(NotificationFeedbackType.Success);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${uid}/assets/${a.id}`);
    }
  };

  const removeAsset = async (id: string) => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const asset = assets.find(a => a.id === id);
    const assetRef = doc(db, 'users', uid, 'assets', id);
    try {
      if (asset && asset.data.startsWith('http')) {
        await deleteImage(asset.data);
      }
      await deleteDoc(assetRef);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `users/${uid}/assets/${id}`);
    }
  };

  const saveMockup = async (m: GeneratedMockup) => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    
    try {
      let finalUrl = m.imageUrl;
      // If it's a base64 string, upload to storage
      if (m.imageUrl.startsWith('data:')) {
        finalUrl = await uploadImage(uid, 'mockups', m.imageUrl);
      }
      
      const mockupRef = doc(db, 'users', uid, 'mockups', m.id);
      await setDoc(mockupRef, { ...m, imageUrl: finalUrl, uid });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${uid}/mockups/${m.id}`);
    }
  };

  const updateDraft = async (updates: Partial<Draft>) => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const draftId = draft?.id || generateId();
    const draftRef = doc(db, 'users', uid, 'drafts', draftId);
    
    try {
      const updated: Draft = {
        id: draftId,
        uid,
        productId: updates.productId !== undefined ? updates.productId : (draft?.productId || null),
        layers: updates.layers !== undefined ? updates.layers : (draft?.layers || []),
        lastModified: Date.now()
      };
      await setDoc(draftRef, updated);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${uid}/drafts/${draftId}`);
    }
  };

  const clearDraft = async () => {
    if (!auth.currentUser || !draft) return;
    const uid = auth.currentUser.uid;
    const draftRef = doc(db, 'users', uid, 'drafts', draft.id);
    try {
      await deleteDoc(draftRef);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `users/${uid}/drafts/${draft.id}`);
    }
  };

  const resetData = async () => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const batch = writeBatch(db);
    assets.forEach(a => batch.delete(doc(db, 'users', uid, 'assets', a.id)));
    savedMockups.forEach(m => batch.delete(doc(db, 'users', uid, 'mockups', m.id)));
    if (draft) batch.delete(doc(db, 'users', uid, 'drafts', draft.id));
    batch.update(doc(db, 'users', uid), { credits: INITIAL_CREDITS });
    
    try {
      await batch.commit();
      Haptics.notificationAsync(NotificationFeedbackType.Success);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${uid}/reset`);
    }
  };

  const deleteAccount = async () => {
    if (!auth.currentUser) return;
    const user = auth.currentUser;
    const uid = user.uid;
    
    try {
      // 1. Delete all user data
      const batch = writeBatch(db);
      assets.forEach(a => batch.delete(doc(db, 'users', uid, 'assets', a.id)));
      savedMockups.forEach(m => batch.delete(doc(db, 'users', uid, 'mockups', m.id)));
      if (draft) batch.delete(doc(db, 'users', uid, 'drafts', draft.id));
      batch.delete(doc(db, 'users', uid));
      
      await batch.commit();
      
      // 2. Delete auth user
      await user.delete();
      Haptics.notificationAsync(NotificationFeedbackType.Success);
    } catch (e: any) {
      if (e.code === 'auth/requires-recent-login') {
        Alert.alert("Re-authentication Required", "Please sign out and sign in again to delete your account.");
      } else {
        handleFirestoreError(e, OperationType.DELETE, `users/${uid}`);
      }
    }
  };

  const loadTemplates = async () => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const batch = writeBatch(db);
    DEMO_ASSETS.forEach(a => {
      const ref = doc(db, 'users', uid, 'assets', a.id);
      batch.set(ref, { ...a, uid, createdAt: Date.now() });
    });
    try {
      await batch.commit();
      Haptics.notificationAsync(NotificationFeedbackType.Success);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${uid}/templates`);
    }
  };

  const addCredits = async (amount: number) => {
    if (!auth.currentUser) return;
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch('/api/credits/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount })
      });
      if (!response.ok) throw new Error('Failed to add credits');
      Haptics.notificationAsync(NotificationFeedbackType.Success);
    } catch (e) {
      console.error('Error adding credits:', e);
      Alert.alert("Error", "Failed to add credits. Please try again.");
    }
  };

  const spendCredits = async (amount: number): Promise<boolean> => {
    if (!auth.currentUser || credits < amount) return false;
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch('/api/credits/spend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount })
      });
      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error === 'Insufficient credits') {
          Alert.alert("Insufficient Credits", "You don't have enough credits for this action.");
        }
        return false;
      }
      return true;
    } catch (e) {
      console.error('Error spending credits:', e);
      return false;
    }
  };

  useEffect(() => {
    // Register Ad and IAP callbacks for web sandbox
    adService.onShowAd = (onComplete) => {
        setAdState({ visible: true, onComplete });
    };
    iapService.onShowPurchase = (productId, onComplete) => {
        setPurchaseState({ visible: true, productId, onComplete });
    };
  }, []);

  const [adState, setAdState] = useState<{ visible: boolean, onComplete: (success: boolean) => void } | null>(null);
  const [purchaseState, setPurchaseState] = useState<{ visible: boolean, productId: string, onComplete: (success: boolean) => void } | null>(null);

  if (!isAuthReady || (auth.currentUser && !isDataReady)) {
    return <SplashScreen />;
  }

  if (!auth.currentUser) {
    return <LoginScreen />;
  }

  return (
    <GlobalStateContext.Provider value={{ 
      user: userProfile,
      logout,
      assets, addAsset, removeAsset, 
      savedMockups, saveMockup, resetData, deleteAccount, loadTemplates,
      credits, addCredits, spendCredits,
      draft, updateDraft, clearDraft
    }}>
      {children}
      
      {/* Web Sandbox Modals */}
      {adState && (
        <Modal visible={adState.visible} transparent animationType="fade">
            <View className="flex-1 bg-black items-center justify-center p-6">
                <View className="w-full max-w-md bg-zinc-900 rounded-3xl p-8 items-center shadow-2xl border border-zinc-800">
                    <View className="w-16 h-16 bg-indigo-600/20 rounded-full items-center justify-center mb-6">
                        <Play size={32} className="text-indigo-500" />
                    </View>
                    <Text className="text-white text-xl font-bold mb-2">Watching Sponsored Video</Text>
                    <Text className="text-zinc-400 text-center mb-8">
                        The reward will be granted after the video ends.
                    </Text>
                    
                    <AdTimer onComplete={() => {
                        adState.onComplete(true);
                        setAdState(null);
                    }} />
                </View>
            </View>
        </Modal>
      )}

      {purchaseState && (
        <Modal visible={purchaseState.visible} transparent animationType="slide">
            <View className="flex-1 justify-end">
                <TouchableOpacity 
                    activeOpacity={1} 
                    onPress={() => {
                        purchaseState.onComplete(false);
                        setPurchaseState(null);
                    }}
                    className="absolute inset-0 bg-black/60" 
                />
                <View className="bg-zinc-900 rounded-t-[32px] p-8 pb-12 border-t border-zinc-800">
                    <View className="w-12 h-1 bg-zinc-800 rounded-full self-center mb-8" />
                    
                    <View className="flex-row items-center mb-6">
                        <View className="w-12 h-12 bg-indigo-600/20 rounded-xl items-center justify-center mr-4">
                            <CreditCard size={24} className="text-indigo-500" />
                        </View>
                        <View>
                            <Text className="text-white text-lg font-bold">Confirm Purchase</Text>
                            <Text className="text-zinc-400 text-sm">Secure payment via App Store</Text>
                        </View>
                    </View>

                    <View className="bg-black/40 p-4 rounded-2xl mb-8 border border-zinc-800/50">
                        <View className="flex-row justify-between items-center mb-2">
                            <Text className="text-zinc-400">Product</Text>
                            <Text className="text-white font-medium">{iapService.products.find(p => p.id === purchaseState.productId)?.title}</Text>
                        </View>
                        <View className="flex-row justify-between items-center">
                            <Text className="text-zinc-400">Price</Text>
                            <Text className="text-indigo-400 font-bold text-lg">{iapService.products.find(p => p.id === purchaseState.productId)?.price}</Text>
                        </View>
                    </View>

                    <Button 
                        onPress={() => {
                            Haptics.notificationAsync(NotificationFeedbackType.Success);
                            purchaseState.onComplete(true);
                            setPurchaseState(null);
                        }}
                        className="bg-indigo-600 mb-4"
                    >
                        Pay Now
                    </Button>
                    <Button 
                        variant="secondary" 
                        onPress={() => {
                            purchaseState.onComplete(false);
                            setPurchaseState(null);
                        }}
                        className="border-zinc-800"
                    >
                        Cancel
                    </Button>
                </View>
            </View>
        </Modal>
      )}
    </GlobalStateContext.Provider>
  );
};

// --- Components ---

const Toast = ({ message, visible, onHide }: { message: string, visible: boolean, onHide: () => void }) => {
  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(NotificationFeedbackType.Success);
      const timer = setTimeout(onHide, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, onHide]);

  if (!visible) return null;

  return (
    <View className="absolute top-12 left-4 right-4 z-[90] animate-toast-in items-center">
      <View className="bg-zinc-800 border border-zinc-700 rounded-full px-6 py-3 flex-row items-center shadow-xl">
         <Check size={16} className="text-green-500 mr-2" />
         <Text className="text-white font-medium text-sm">{message}</Text>
      </View>
    </View>
  );
};

const InputModal = ({ 
  visible, 
  title, 
  placeholder, 
  onSubmit, 
  onCancel 
}: { 
  visible: boolean, 
  title: string, 
  placeholder: string, 
  onSubmit: (text: string) => void, 
  onCancel: () => void 
}) => {
  const [text, setText] = useState('');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
       <KeyboardAvoidingView behavior="padding" className="w-full px-8 items-center justify-center">
          <View className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl p-6 shadow-2xl">
            <Text className="text-xl font-bold text-white mb-2">{title}</Text>
            <TextInput 
              className="w-full bg-zinc-950 text-white p-4 rounded-xl border border-zinc-800 mb-6"
              placeholder={placeholder}
              value={text}
              onChange={(e) => setText(e.target.value)}
              autoFocus
            />
            <View className="flex-row justify-end space-x-4">
              <TouchableOpacity onPress={() => { setText(''); onCancel(); }} className="px-4 py-2">
                <Text className="text-zinc-400 font-bold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { onSubmit(text); setText(''); }} className="bg-indigo-600 px-6 py-2 rounded-xl">
                <Text className="text-white font-bold">Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
       </KeyboardAvoidingView>
    </Modal>
  );
};

const ErrorModal = ({ 
  visible, 
  error, 
  onRetry, 
  onRefund,
  isRetrying
}: { 
  visible: boolean, 
  error: string | null, 
  onRetry: () => void, 
  onRefund: () => void,
  isRetrying?: boolean
}) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <Modal visible={visible} transparent animationType="fade">
       <View className="flex-1 bg-black/80 items-center justify-center px-6">
          <View className="w-full bg-zinc-900 border border-red-900/30 rounded-2xl p-6 shadow-2xl">
            <View className="items-center mb-4">
               <View className="w-16 h-16 bg-red-900/20 rounded-full items-center justify-center mb-4">
                  <Info size={32} className="text-red-500" />
               </View>
               <Text className="text-2xl font-black text-white text-center">Generation Failed</Text>
               <Text className="text-zinc-400 text-center mt-2 px-4">
                  We encountered an issue while processing your request. Would you like to try again or get a refund?
               </Text>
            </View>

            {error && (
              <View className="mb-6">
                <TouchableOpacity 
                  onPress={() => setShowDetails(!showDetails)}
                  className="flex-row items-center justify-center mb-2"
                >
                  <Text className="text-zinc-500 text-xs font-bold uppercase mr-1">Error Details</Text>
                  <ChevronRight size={12} className={`text-zinc-500 transition-transform ${showDetails ? 'rotate-90' : ''}`} />
                </TouchableOpacity>
                {showDetails && (
                  <View className="bg-black/40 p-3 rounded-lg border border-zinc-800">
                    <Text className="text-red-400/80 text-xs font-mono leading-relaxed">{error}</Text>
                  </View>
                )}
              </View>
            )}

            <View className="space-y-3">
              <Button 
                onPress={onRetry} 
                isLoading={isRetrying}
                className="bg-indigo-600 w-full"
                icon={<RotateCcw size={18} />}
              >
                Retry Generation
              </Button>
              <Button 
                onPress={onRefund} 
                variant="secondary"
                className="w-full border-zinc-800"
                icon={<RotateCcw size={18} className="text-zinc-400" />}
              >
                Refund & Close
              </Button>
            </View>
            
            <Text className="text-zinc-600 text-[10px] text-center mt-4">
              Retrying will not cost additional credits.
            </Text>
          </View>
       </View>
    </Modal>
  );
};

const AdTimer = ({ onComplete }: { onComplete: () => void }) => {
    const [timeLeft, setTimeLeft] = useState(5);

    useEffect(() => {
        if (timeLeft === 0) {
            onComplete();
            return;
        }
        const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
        return () => clearTimeout(timer);
    }, [timeLeft]);

    return (
        <View className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden mb-4">
            <View 
                className="bg-indigo-600 h-full" 
                style={{ width: `${(5 - timeLeft) / 5 * 100}%` }} 
            />
            <View className="absolute inset-0 items-center justify-center">
                <Text className="text-[8px] text-white font-bold">{timeLeft}s</Text>
            </View>
        </View>
    );
};

const Header = ({ title, leftAction, rightAction }: { title: string, leftAction?: { icon: React.ReactNode, onPress: () => void }, rightAction?: { icon: React.ReactNode, onPress: () => void } }) => (
  <View className="pt-[env(safe-area-inset-top)] bg-zinc-950 border-b border-zinc-800 shrink-0 z-50">
    <View className="h-14 flex-row items-center justify-between px-4">
      <View className="flex-row items-center flex-1 pr-4 min-w-0">
        {leftAction && (
          <TouchableOpacity 
            onPress={() => {
              Haptics.impactAsync(ImpactFeedbackStyle.Light);
              leftAction.onPress();
            }} 
            className="mr-4 p-1"
          >
            {leftAction.icon}
          </TouchableOpacity>
        )}
        <Text numberOfLines={1} className="text-lg font-bold text-white flex-1">{title}</Text>
      </View>
      {rightAction ? (
        <TouchableOpacity 
          onPress={() => {
            Haptics.impactAsync(ImpactFeedbackStyle.Light);
            rightAction.onPress();
          }} 
          className="p-1"
        >
          {rightAction.icon}
        </TouchableOpacity>
      ) : <View className="w-8" />}
    </View>
  </View>
);

const ProcessingModal = ({ visible, message }: { visible: boolean, message: string }) => (
  <Modal visible={visible} transparent animationType="fade">
    <View className="flex-1 bg-black/80 items-center justify-center p-8">
      <View className="bg-zinc-900 p-8 rounded-3xl items-center border border-zinc-800 shadow-2xl">
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text className="text-white font-bold text-lg mt-6 text-center">{message}</Text>
        <Text className="text-zinc-500 text-xs mt-2 text-center">Please wait while we process your request</Text>
      </View>
    </View>
  </Modal>
);

const Button = ({ 
  onPress, 
  children, 
  variant = 'primary', 
  icon,
  disabled,
  isLoading,
  className = ''
}: { 
  onPress: () => void, 
  children?: React.ReactNode, 
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost', 
  icon?: React.ReactNode,
  disabled?: boolean,
  isLoading?: boolean,
  className?: string
}) => {
  const bgColors = {
    primary: 'bg-indigo-600',
    secondary: 'bg-zinc-800 border border-zinc-700',
    danger: 'bg-red-600',
    ghost: 'bg-transparent'
  };

  const handlePress = () => {
    if (disabled || isLoading) return;
    Haptics.impactAsync(ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <TouchableOpacity 
      onPress={handlePress} 
      disabled={disabled || isLoading}
      activeOpacity={0.8}
      className={`${bgColors[variant]} flex-row items-center justify-center px-4 py-3 rounded-xl ${disabled ? 'opacity-50' : ''} ${className}`}
    >
      {isLoading ? (
        <ActivityIndicator color="white" />
      ) : (
        <>
          {icon && <View className="mr-2">{icon}</View>}
          <Text className={`${variant === 'ghost' ? 'text-zinc-400' : 'text-white'} font-bold text-base`}>{children}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

// --- Screens ---

const StoreScreen = ({ navigation }: NativeStackScreenProps<RootStackParamList, 'Store'>) => {
  const { credits, addCredits } = useGlobalState();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

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
  }, []);

  const handleWatchAd = async () => {
    setLoadingId('ad');
    try {
        const rewardGranted = await adService.showRewardedAd();
        if (rewardGranted) {
             await addCredits(REWARD_AD_CREDITS);
             Alert.alert("Reward Earned", `You received ${REWARD_AD_CREDITS} credits!`);
        }
    } catch (e) {
        Alert.alert("Ad Error", "Video could not be loaded.");
    } finally {
        setLoadingId(null);
    }
  };

  const handlePurchase = async (product: Product) => {
    setLoadingId(product.id);
    try {
        const result = await iapService.purchaseProduct(product.id);
        if (result.success) {
            await addCredits(result.credits);
            Alert.alert("Purchase Successful", `You received ${result.credits} credits!`);
        }
    } catch (e) {
        Alert.alert("Purchase Failed", "The transaction could not be completed.");
    } finally {
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
                <View className="flex-row items-center">
                   <View className="w-12 h-12 bg-zinc-800 rounded-full items-center justify-center mr-4">
                      {loadingId === pack.id ? (
                          <ActivityIndicator color="white" />
                      ) : (
                          <Coins size={24} className={pack.popular ? "text-amber-400" : "text-white"} />
                      )}
                   </View>
                   <View>
                      <Text className="text-white font-bold text-lg">{pack.title}</Text>
                      {pack.popular && <Text className="text-amber-500 text-xs font-bold">MOST POPULAR</Text>}
                   </View>
                </View>
                <View className="bg-white px-4 py-2 rounded-full">
                   <Text className="text-black font-bold">{pack.price}</Text>
                </View>
             </TouchableOpacity>
           ))}
        </View>

        <View className="mt-8 p-4 items-center">
           <Text className="text-zinc-600 text-xs text-center">
             Sandbox Environment Active
           </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const DashboardScreen = ({ navigation }: NativeStackScreenProps<RootStackParamList, 'Dashboard'>) => {
  const { credits, draft, user } = useGlobalState();

  return (
    <SafeAreaView className="bg-black flex-1 animate-slide-in">
      <ScrollView className="flex-1 px-6 pt-10">
        <View className="flex-row justify-between mb-4">
           {/* User Profile Info */}
           <View className="flex-row items-center">
              <Image 
                source={{ uri: auth.currentUser?.photoURL || `https://ui-avatars.com/api/?name=${user?.email || 'User'}&background=4f46e5&color=fff` }} 
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

const SettingsScreen = ({ navigation }: NativeStackScreenProps<RootStackParamList, 'Settings'>) => {
  const { resetData, deleteAccount, loadTemplates, logout } = useGlobalState();

  const handleReset = () => {
    Alert.alert(
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
    Alert.alert(
      "Delete Account",
      "Are you sure? This will permanently delete your account and all your data. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: () => {
            deleteAccount();
          }
        }
      ]
    );
  };

  const handleLoadTemplates = () => {
    Alert.alert(
      "Load Demo Templates",
      "This will import example products and logos into your library.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Load",
          onPress: () => {
             loadTemplates();
             Haptics.notificationAsync(NotificationFeedbackType.Success);
             Alert.alert("Success", "Templates loaded to Assets library.");
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
               onPress={() => Alert.alert("About", `${APP_NAME} v2.2\nProduction Build`)} 
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
                 Alert.alert("Sign Out", "Are you sure you want to sign out?", [
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

const AssetsScreen = ({ navigation }: NativeStackScreenProps<RootStackParamList, 'Assets'>) => {
  const { assets, addAsset, removeAsset, spendCredits, addCredits, clearDraft } = useGlobalState();
  const [activeTab, setActiveTab] = useState<'product' | 'logo'>('product');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  
  // Error Handling State
  const [errorState, setErrorState] = useState<{
    visible: boolean;
    message: string | null;
    lastPrompt: string | null;
  }>({
    visible: false,
    message: null,
    lastPrompt: null
  });

  const handlePickImage = async () => {
    const result = await launchImageLibraryAsync({ mediaTypes: 'Images', base64: true });
    if (!result.canceled && result.assets) {
      const asset = result.assets[0];
      
      // Check size (approx 10MB limit)
      const base64Data = asset.base64?.split(',')[1] || '';
      const sizeInBytes = (base64Data.length * 3) / 4;
      if (sizeInBytes > 10 * 1024 * 1024) {
          Alert.alert("File Too Large", "Please select an image smaller than 10MB.");
          return;
      }

      addAsset({
        id: generateId(),
        type: activeTab,
        name: asset.fileName || 'Upload',
        data: asset.base64 || asset.uri,
        mimeType: asset.mimeType || 'image/png'
      });
    }
  };

  const performGeneration = async (prompt: string) => {
    setIsGenerating(true);
    try {
      const b64 = await generateAsset(prompt, activeTab);
      addAsset({
        id: generateId(),
        type: activeTab,
        name: `AI ${activeTab}`,
        data: b64,
        mimeType: 'image/png'
      });
      Haptics.notificationAsync(NotificationFeedbackType.Success);
      setErrorState({ visible: false, message: null, lastPrompt: null });
    } catch (e: any) {
      Haptics.notificationAsync(NotificationFeedbackType.Error);
      setErrorState({
        visible: true,
        message: e.message || "An unexpected error occurred during generation.",
        lastPrompt: prompt
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateConfirm = async (prompt: string) => {
    setShowPrompt(false);
    if (!prompt) return;

    if (!(await spendCredits(1))) {
        Alert.alert(
            "Insufficient Credits",
            "You need 1 credit to generate an asset.",
            [
                { text: "Cancel", style: 'cancel' },
                { text: "Get Credits", onPress: () => navigation.navigate('Store') }
            ]
        );
        return;
    }

    await performGeneration(prompt);
  };

  const handleRetry = () => {
    if (errorState.lastPrompt) {
      performGeneration(errorState.lastPrompt);
    }
  };

  const handleRefund = async () => {
    await addCredits(1);
    setErrorState({ visible: false, message: null, lastPrompt: null });
    Haptics.impactAsync(ImpactFeedbackStyle.Light);
  };

  const filteredAssets = assets.filter(a => a.type === activeTab);

  const handleStartNew = () => {
      // Starting fresh logic: Clear Draft
      clearDraft();
      navigation.navigate('Studio');
  };

  return (
    <SafeAreaView className="bg-black flex-1">
      <Header 
        title="Assets Library" 
        leftAction={{ icon: <ChevronLeft color="white" />, onPress: navigation.goBack }} 
        rightAction={{ icon: <Wallet size={20} className="text-indigo-400" />, onPress: () => navigation.navigate('Store') }}
      />

      <InputModal 
        visible={showPrompt}
        title={`Generate ${activeTab}`}
        placeholder={`Describe your ${activeTab} (Costs 1 Credit)...`}
        onSubmit={handleGenerateConfirm}
        onCancel={() => setShowPrompt(false)}
      />

      <ErrorModal 
        visible={errorState.visible}
        error={errorState.message}
        onRetry={handleRetry}
        onRefund={handleRefund}
        isRetrying={isGenerating}
      />

      <View className="flex-row px-4 py-4 space-x-4">
        <TouchableOpacity 
          key="tab-product"
          onPress={() => {
             Haptics.selectionAsync();
             setActiveTab('product');
          }}
          className={`flex-1 py-3 rounded-lg items-center ${activeTab === 'product' ? 'bg-indigo-600' : 'bg-zinc-900'}`}
        >
          <Text className={`font-bold ${activeTab === 'product' ? 'text-white' : 'text-zinc-400'}`}>Products</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          key="tab-logo"
          onPress={() => {
            Haptics.selectionAsync();
            setActiveTab('logo');
          }}
          className={`flex-1 py-3 rounded-lg items-center ${activeTab === 'logo' ? 'bg-indigo-600' : 'bg-zinc-900'}`}
        >
          <Text className={`font-bold ${activeTab === 'logo' ? 'text-white' : 'text-zinc-400'}`}>Logos</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4">
        <View className="flex-row flex-wrap justify-between pb-24">
          <TouchableOpacity 
            onPress={handlePickImage}
            className="w-[48%] aspect-square bg-zinc-900 rounded-xl border-2 border-dashed border-zinc-700 items-center justify-center mb-4"
          >
            <Plus size={32} className="text-zinc-500 mb-2" />
            <Text className="text-zinc-500 text-sm">Upload</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => setShowPrompt(true)}
            disabled={isGenerating}
            className="w-[48%] aspect-square bg-zinc-900 rounded-xl border-2 border-dashed border-zinc-700 items-center justify-center mb-4"
          >
             {isGenerating ? <ActivityIndicator size="small" color="#f59e0b" /> : (
               <>
                 <Sparkles size={32} className="text-amber-500 mb-2" />
                 <Text className="text-amber-500 text-sm">Generate AI</Text>
                 <Text className="text-zinc-600 text-xs mt-1">1 Credit</Text>
               </>
             )}
          </TouchableOpacity>

          {filteredAssets.length === 0 && (
             <View className="w-full py-8 items-center">
                 <Text className="text-zinc-500 text-center">No assets found.</Text>
                 <Text className="text-zinc-600 text-xs text-center mt-2">Upload or Generate new assets<br/>or load templates in Settings.</Text>
             </View>
          )}

          {filteredAssets.map(asset => (
            <View key={asset.id} className="w-[48%] aspect-square bg-zinc-800 rounded-xl overflow-hidden mb-4 relative">
              <Image source={{ uri: asset.data }} className="w-full h-full" resizeMode="contain" />
              <TouchableOpacity 
                onPress={() => removeAsset(asset.id)}
                className="absolute top-1 right-1 bg-black/50 p-1 rounded-full"
              >
                <Trash2 size={14} className="text-white" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 bg-zinc-950/90 border-t border-zinc-800 p-4 pb-8">
        <Button 
          onPress={handleStartNew} 
          disabled={assets.filter(a => a.type === 'product').length === 0}
          icon={<ArrowRight size={20} />}
        >
          Start New Studio Project
        </Button>
      </View>
    </SafeAreaView>
  );
};

// Helper for multi-touch
const getDistance = (t1: React.Touch, t2: React.Touch) => {
  const dx = t1.clientX - t2.clientX;
  const dy = t1.clientY - t2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
};

const getAngle = (t1: React.Touch, t2: React.Touch) => {
  const dx = t1.clientX - t2.clientX;
  const dy = t1.clientY - t2.clientY;
  return (Math.atan2(dy, dx) * 180) / Math.PI;
};

// Helper for Snap Rotation
const snapRotation = (rotation: number): number => {
  const normalized = (rotation % 360 + 360) % 360; 
  const snapAngles = [0, 90, 180, 270, 360];
  const threshold = 5;

  for (const angle of snapAngles) {
    if (Math.abs(normalized - angle) < threshold) {
      if (Math.abs(normalized - angle) > 0.1) { 
         Haptics.impactAsync(ImpactFeedbackStyle.Light);
      }
      return angle % 360;
    }
  }
  return normalized;
};

const StudioScreen = ({ navigation }: NativeStackScreenProps<RootStackParamList, 'Studio'>) => {
  const { assets, spendCredits, addCredits, draft, updateDraft, clearDraft, user } = useGlobalState();
  
  // Initialize state from draft if available, otherwise defaults
  const [selectedProduct, setSelectedProduct] = useState<string | null>(
      draft?.productId || null
  );
  const [layers, setLayers] = useState<PlacedLayer[]>(
      draft?.layers || []
  );
  
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");
  
  // Error Handling State
  const [errorState, setErrorState] = useState<{
    visible: boolean;
    message: string | null;
  }>({
    visible: false,
    message: null
  });

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
      // Debounce could be added here for performance, but simple state set is fine for this scale
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

  const handleClearCanvas = () => {
      Alert.alert("Clear Canvas", "Remove all layers and reset draft?", [
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
      rotation: 0
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

  const performGeneration = async () => {
    if (!selectedProduct || layers.length === 0) return;
    setIsProcessing(true);
    setProcessingMessage("Generating mockup...");
    try {
      const productAsset = assets.find(a => a.id === selectedProduct)!;
      
      const resultUrl = await generateMockup(productAsset, layers.map(l => ({
        asset: assets.find(a => a.id === l.assetId)!,
        placement: l
      })), "Create a realistic DeXify mockup.");
      
      Haptics.notificationAsync(NotificationFeedbackType.Success);
      setErrorState({ visible: false, message: null });
      navigation.navigate('Result', { 
        result: {
          id: generateId(),
          uid: auth.currentUser?.uid || 'anonymous',
          imageUrl: resultUrl,
          prompt: "Composite Mockup",
          createdAt: Date.now()
        }
      });
    } catch (e: any) {
      Haptics.notificationAsync(NotificationFeedbackType.Error);
      setErrorState({
        visible: true,
        message: e.message || "Failed to generate mockup. The AI model might be busy or the request was blocked."
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedProduct || layers.length === 0) return;
    
    if (!(await spendCredits(GENERATION_COST))) {
        Alert.alert(
            "Insufficient Credits",
            `You need ${GENERATION_COST} credit to generate a mockup.`,
            [
                { text: "Cancel", style: 'cancel' },
                { text: "Get Credits", onPress: () => navigation.navigate('Store') }
            ]
        );
        return;
    }

    await performGeneration();
  };

  const handleRetry = () => {
    performGeneration();
  };

  const handleRefund = async () => {
    await addCredits(1);
    setErrorState({ visible: false, message: null });
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
      <ProcessingModal visible={isProcessing} message={processingMessage} />
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
        isRetrying={isProcessing}
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
                <TouchableOpacity onPress={undo} disabled={historyIndex === 0} className="w-10 h-10 bg-zinc-800/80 rounded-full items-center justify-center shadow-lg">
                    <RotateCcw size={18} className="text-white" />
                </TouchableOpacity>
            </View>
        </View>
      </View>

      {/* Controls Panel - Flexible height */}
      <View className="bg-zinc-950 border-t border-zinc-800 flex-shrink-0 pb-[env(safe-area-inset-bottom)]">
        {activeLayer ? (
          <View className="p-4 h-56">
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
          </View>
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
           <Button onPress={handleGenerate} isLoading={isProcessing} icon={<Wand2 size={18} />}>
             Generate Mockup (1 CR)
           </Button>
        </View>
      </View>
    </SafeAreaView>
  );
};

const TryOnScreen = ({ navigation }: NativeStackScreenProps<RootStackParamList, 'TryOn'>) => {
  const { assets, spendCredits, addCredits, user } = useGlobalState();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [selectedOverlay, setSelectedOverlay] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");
  const [cameraType, setCameraType] = useState<'back' | 'front'>('back');

  // Error Handling State
  const [errorState, setErrorState] = useState<{
    visible: boolean;
    message: string | null;
    lastComposite: string | null;
  }>({
    visible: false,
    message: null,
    lastComposite: null
  });

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

  const performProcessing = async (compositeBase64: string) => {
    setIsProcessing(true);
    setProcessingMessage("Processing AR composite...");
    try {
      const resultUrl = await generateRealtimeComposite(compositeBase64, "Make the overlay look like it's naturally printed on the surface in the photo.");

      Haptics.notificationAsync(NotificationFeedbackType.Success);
      setErrorState({ visible: false, message: null, lastComposite: null });
      navigation.navigate('Result', { 
        result: {
          id: generateId(),
          uid: auth.currentUser?.uid || 'anonymous',
          imageUrl: resultUrl,
          prompt: "AR Try-On Composite",
          createdAt: Date.now()
        }
      });
    } catch (e: any) {
      Haptics.notificationAsync(NotificationFeedbackType.Error);
      setErrorState({
        visible: true,
        message: e.message || "Failed to process AR composite.",
        lastComposite: compositeBase64
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const captureAndProcess = async () => {
    if (!videoRef.current || !selectedOverlay) {
        Alert.alert("Select Overlay", "Please select a logo or product to try on.");
        return;
    }

    if (!(await spendCredits(GENERATION_COST))) {
        Alert.alert(
            "Insufficient Credits",
            `You need ${GENERATION_COST} credit to perform AR Try-On.`,
            [
                { text: "Cancel", style: 'cancel' },
                { text: "Get Credits", onPress: () => navigation.navigate('Store') }
            ]
        );
        return;
    }

    setProcessingMessage("Capturing frame...");
    setIsProcessing(true);
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
      await performProcessing(compositeBase64);
      
    } catch (e) {
      console.error(e);
      addCredits(GENERATION_COST);
      Alert.alert("Error", "Failed to capture AR frame. Credit refunded.");
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    if (errorState.lastComposite) {
      performProcessing(errorState.lastComposite);
    }
  };

  const handleRefund = () => {
    addCredits(GENERATION_COST);
    setErrorState({ visible: false, message: null, lastComposite: null });
    Haptics.impactAsync(ImpactFeedbackStyle.Light);
  };

  return (
    <View className="flex-1 bg-black relative">
       <ProcessingModal visible={isProcessing} message={processingMessage} />
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
           isRetrying={isProcessing}
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
                disabled={isProcessing}
                className="w-20 h-20 rounded-full border-4 border-white items-center justify-center bg-white/20 active:scale-95 transition-transform"
              >
                {isProcessing ? <ActivityIndicator color="white" /> : <View className="w-16 h-16 bg-white rounded-full" />}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setCameraType(t => t === 'back' ? 'front' : 'back')} className="p-4 rounded-full bg-zinc-800/50">
                <SwitchCamera color="white" size={24} />
              </TouchableOpacity>
          </View>
       </View>
    </View>
  );
}

const ResultScreen = ({ navigation, route }: NativeStackScreenProps<RootStackParamList, 'Result'>) => {
  const { result } = route.params;
  const { saveMockup } = useGlobalState();
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

const GalleryScreen = ({ navigation }: NativeStackScreenProps<RootStackParamList, 'Gallery'>) => {
    const { savedMockups } = useGlobalState();

    return (
        <SafeAreaView className="bg-black flex-1">
            <Header 
                title="Gallery" 
                leftAction={{ icon: <ChevronLeft color="white" />, onPress: navigation.goBack }} 
            />
            {savedMockups.length === 0 ? (
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

// --- Main App & Providers ---

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <ErrorBoundary>
      <GlobalStateProvider>
        <StatusBar barStyle="light-content" />
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Dashboard" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="Assets" component={AssetsScreen} />
            <Stack.Screen name="Studio" component={StudioScreen} />
            <Stack.Screen name="Result" component={ResultScreen} />
            <Stack.Screen name="Gallery" component={GalleryScreen} />
            <Stack.Screen name="TryOn" component={TryOnScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Store" component={StoreScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </GlobalStateProvider>
    </ErrorBoundary>
  );
}
