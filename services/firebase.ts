
// Тимчасово відключено для локальної роботи
export const auth = {
  currentUser: { uid: 'local-user', displayName: 'Гравець' }
} as any;

export const db = {} as any;
export const googleProvider = {};

export const signInWithPopup = async () => {};
export const signOut = async () => {};
export const onAuthStateChanged = (auth: any, callback: any) => {
  callback({ uid: 'local-user', displayName: 'Локальний Гравець', photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Local' });
  return () => {};
};

export const doc = (...args: any[]) => ({});
export const getDoc = async () => ({ exists: () => false });
export const setDoc = async () => {};
export const onSnapshot = (docRef: any, callback: any) => {
  return () => {}; // No-op unsubscribe
};

export type User = {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
};
