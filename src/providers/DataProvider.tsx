import React, { createContext, useContext, useState, useEffect, PropsWithChildren } from 'react';
import { collection, doc, onSnapshot, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { DataContextType, Asset, GeneratedMockup, Draft } from '../types';
import { useAuth } from './AuthProvider';
import { uploadImage, deleteImage } from '../services/storageService';
import { generateId } from '../services/utils';
import { INITIAL_CREDITS } from '../constants';
import { DEMO_ASSETS } from '../services/demoData';
import { Haptics, NotificationFeedbackType } from '../services/haptics';

const DataContext = createContext<DataContextType | null>(null);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
};

export const DataProvider = ({ children }: PropsWithChildren<{}>) => {
  const { user, isAuthReady } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [savedMockups, setSavedMockups] = useState<GeneratedMockup[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [isDataReady, setIsDataReady] = useState(false);

  useEffect(() => {
    if (!isAuthReady || !user) {
      setAssets([]);
      setSavedMockups([]);
      setDraft(null);
      setIsDataReady(true);
      return;
    }

    const uid = user.uid;
    const assetsRef = collection(db, 'users', uid, 'assets');
    const mockupsRef = collection(db, 'users', uid, 'mockups');
    const draftsRef = collection(db, 'users', uid, 'drafts');

    const unsubAssets = onSnapshot(assetsRef, (snapshot) => {
      setAssets(snapshot.docs.map(d => d.data() as Asset).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
    }, (e) => handleFirestoreError(e, OperationType.LIST, `users/${uid}/assets`));

    const unsubMockups = onSnapshot(mockupsRef, (snapshot) => {
      setSavedMockups(snapshot.docs.map(d => d.data() as GeneratedMockup).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
    }, (e) => handleFirestoreError(e, OperationType.LIST, `users/${uid}/mockups`));

    const unsubDrafts = onSnapshot(draftsRef, (snapshot) => {
      if (!snapshot.empty) {
        setDraft(snapshot.docs[0].data() as Draft);
      } else {
        setDraft(null);
      }
      setIsDataReady(true);
    }, (e) => handleFirestoreError(e, OperationType.LIST, `users/${uid}/drafts`));

    return () => {
      unsubAssets();
      unsubMockups();
      unsubDrafts();
    };
  }, [user, isAuthReady]);

  const addAsset = async (a: Asset) => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    
    try {
      let finalData = a.data;
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
      if (m.imageUrl.startsWith('data:')) {
        finalUrl = await uploadImage(uid, 'mockups', m.imageUrl);
      }
      
      const mockupRef = doc(db, 'users', uid, 'mockups', m.id);
      await setDoc(mockupRef, { ...m, imageUrl: finalUrl, uid });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${uid}/mockups/${m.id}`);
    }
  };

  const updateDraft = async (d: Partial<Draft>) => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const draftId = draft?.id || generateId();
    const draftRef = doc(db, 'users', uid, 'drafts', draftId);
    
    const newDraft = {
      ...draft,
      ...d,
      id: draftId,
      uid,
      lastModified: Date.now()
    };
    
    try {
      await setDoc(draftRef, newDraft);
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
    
    for (const a of assets) {
      if (a.data.startsWith('http')) {
        await deleteImage(a.data).catch(console.error);
      }
      batch.delete(doc(db, 'users', uid, 'assets', a.id));
    }
    
    for (const m of savedMockups) {
      if (m.imageUrl.startsWith('http')) {
        await deleteImage(m.imageUrl).catch(console.error);
      }
      batch.delete(doc(db, 'users', uid, 'mockups', m.id));
    }
    
    if (draft) batch.delete(doc(db, 'users', uid, 'drafts', draft.id));
    batch.update(doc(db, 'users', uid), { credits: INITIAL_CREDITS });
    
    try {
      await batch.commit();
      Haptics.notificationAsync(NotificationFeedbackType.Success);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${uid}/reset`);
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

  return (
    <DataContext.Provider value={{
      isDataReady,
      assets,
      addAsset,
      removeAsset,
      savedMockups,
      saveMockup,
      draft,
      updateDraft,
      clearDraft,
      loadTemplates,
      resetData
    }}>
      {children}
    </DataContext.Provider>
  );
};
