import React, { createContext, useContext, useState, useEffect, PropsWithChildren } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile, AuthContextType } from '../types';
import { INITIAL_CREDITS } from '../constants';
import { Haptics, NotificationFeedbackType } from '../services/haptics';
import { useAlert } from './AlertProvider';

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export const AuthProvider = ({ children }: PropsWithChildren<{}>) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const { alert } = useAlert();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        try {
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            const newUser: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              credits: INITIAL_CREDITS,
              createdAt: Date.now()
            };
            await setDoc(userRef, newUser);
            setUser(newUser);
          } else {
            setUser(userSnap.data() as UserProfile);
          }
        } catch (e) {
          handleFirestoreError(e, OperationType.GET, `users/${firebaseUser.uid}`);
        }
      } else {
        setUser(null);
      }
      setIsAuthReady(true);
    });
    return unsubscribe;
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  const deleteAccount = async () => {
    if (!auth.currentUser) return;
    const currentUser = auth.currentUser;
    const uid = currentUser.uid;
    
    try {
      // 1. Delete all user data (this should ideally be a Cloud Function, but we'll keep it here for now)
      // Note: DataProvider will handle its own cleanup via resetData, but auth deletion must happen here.
      // We will rely on DataProvider's resetData to clear assets/mockups/drafts before calling this,
      // or we can trigger it here. For now, we just delete the user doc and auth.
      await deleteDoc(doc(db, 'users', uid));
      await currentUser.delete();
      Haptics.notificationAsync(NotificationFeedbackType.Success);
    } catch (e: any) {
      if (e.code === 'auth/requires-recent-login') {
        alert("Re-authentication Required", "Please sign out and sign in again to delete your account.");
      } else {
        handleFirestoreError(e, OperationType.DELETE, `users/${uid}`);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthReady, logout, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
};
