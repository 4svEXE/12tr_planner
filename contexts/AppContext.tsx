import React, { useEffect, useRef } from 'react';
import { db, doc, setDoc, getDoc, onSnapshot } from '../services/firebase';
import { useAuth } from './AuthContext';
import { useAppStore } from '../store/useAppStore';

const DATA_STORAGE_KEY = '12tr_engine_data_v4';

const sanitizeData = (obj: any): any => {
  if (Array.isArray(obj)) return obj.map(sanitizeData);
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).filter(([_, v]) => v !== undefined).map(([k, v]) => [k, sanitizeData(v)])
    );
  }
  return obj;
};

export const AppProvider: React.FC<{ children: React.ReactNode; userId: string }> = ({ children }) => {
  const { user } = useAuth();
  const isUpdatingFromFirebase = useRef(false);
  const isInitialized = useRef(false);

  useEffect(() => {
    const init = async () => {
      let local = localStorage.getItem(DATA_STORAGE_KEY);
      if (local) {
        try {
          useAppStore.getState().setState(JSON.parse(local));
        } catch (e) { }
      }

      if (user) {
        try {
          const docSnap = await getDoc(doc(db, "users", user.uid));
          if (docSnap.exists()) {
            useAppStore.getState().setState(docSnap.data());
          }
        } catch (e) {
          console.error("Firebase load error", e);
        }
      }
      isInitialized.current = true;
    };
    init();
  }, [user]);

  useEffect(() => {
    // Sync state changes to localStorage and Firebase outside of React render cycle
    const unsub = useAppStore.subscribe((state, prevState) => {
      if (!isInitialized.current || !state.updatedAt || isUpdatingFromFirebase.current) return;
      if (state.updatedAt === prevState.updatedAt) return; // Only sync on explicit updates

      localStorage.setItem(DATA_STORAGE_KEY, JSON.stringify(state));

      if (user) {
        const cleanData = sanitizeData({
          tasks: state.tasks, projects: state.projects, people: state.people, character: state.character,
          hobbies: state.hobbies, tags: state.tags, diary: state.diary, shoppingStores: state.shoppingStores,
          shoppingItems: state.shoppingItems, timeBlocks: state.timeBlocks, routinePresets: state.routinePresets,
          reportTemplate: state.reportTemplate, reportPresets: state.reportPresets, cycle: state.cycle,
          inboxCategories: state.inboxCategories,
          updatedAt: state.updatedAt
        });
        setDoc(doc(db, "users", user.uid), cleanData).catch(err => console.error("Firebase save config", err));
      }
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists() && !isUpdatingFromFirebase.current) {
        const firebaseData = docSnap.data();
        const currentState = useAppStore.getState();
        if ((firebaseData.updatedAt || 0) > (currentState.updatedAt || 0)) {
          isUpdatingFromFirebase.current = true;
          currentState.setState(firebaseData);
          setTimeout(() => { isUpdatingFromFirebase.current = false; }, 100);
        }
      }
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    // @ts-ignore
    useAppStore.setState({
      syncData: async () => {
        if (!user) return;
        useAppStore.getState().setSyncStatus(true, useAppStore.getState().lastSyncTime);
        try {
          const docSnap = await getDoc(doc(db, "users", user.uid));
          if (docSnap.exists()) {
            const firebaseData = docSnap.data();
            useAppStore.getState().setState(firebaseData);
            localStorage.setItem(DATA_STORAGE_KEY, JSON.stringify(firebaseData));
            useAppStore.getState().setSyncStatus(false, Date.now());
          }
        } catch (e) {
          console.error("Manual sync error:", e);
          useAppStore.getState().setSyncStatus(false, useAppStore.getState().lastSyncTime);
        }
      }
    });
  }, [user]);

  return <>{children}</>;
};

export const useApp = useAppStore;
