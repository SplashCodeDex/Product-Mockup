import React, { createContext, useContext, useState, useEffect, PropsWithChildren } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { EconomyContextType } from '../types';
import { useAuth } from './AuthProvider';
import { useAlert } from './AlertProvider';
import { Haptics, NotificationFeedbackType } from '../services/haptics';

const EconomyContext = createContext<EconomyContextType | null>(null);

export const useEconomy = () => {
  const context = useContext(EconomyContext);
  if (!context) throw new Error("useEconomy must be used within EconomyProvider");
  return context;
};

export const EconomyProvider = ({ children }: PropsWithChildren<{}>) => {
  const { user, isAuthReady } = useAuth();
  const [credits, setCredits] = useState(0);
  const { alert } = useAlert();

  useEffect(() => {
    if (!isAuthReady || !user) {
      setCredits(0);
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        setCredits(docSnap.data().credits || 0);
      }
    }, (e) => {
      handleFirestoreError(e, OperationType.GET, `users/${user.uid}`);
    });

    return unsubscribe;
  }, [user, isAuthReady]);

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
      alert("Error", "Failed to add credits. Please try again.");
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
        throw new Error(errorData.error || 'Failed to spend credits');
      }
      return true;
    } catch (e: any) {
      console.error('Error spending credits:', e);
      alert("Error", e.message || "Failed to process credits. Please try again.");
      return false;
    }
  };

  return (
    <EconomyContext.Provider value={{ credits, addCredits, spendCredits }}>
      {children}
    </EconomyContext.Provider>
  );
};
