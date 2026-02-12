import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from '../services/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (isOpen: boolean) => void;
  login: () => Promise<void>;
  loginWithEmail: (e: string, p: string) => Promise<void>;
  registerWithEmail: (e: string, p: string) => Promise<void>;
  sendResetEmail: (e: string) => Promise<void>;
  logout: () => Promise<void>;
  continueAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isGuest, setIsGuest] = useState(() => {
    const saved = localStorage.getItem('12tr_guest_mode');
    return saved === null ? true : saved === 'true';
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        setIsGuest(false);
        setIsAuthModalOpen(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      localStorage.setItem('12tr_guest_mode', 'false');
      setIsGuest(false);
    } catch (error) {
      console.error("Google login failed", error);
      throw error;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      localStorage.setItem('12tr_guest_mode', 'false');
      setIsGuest(false);
    } catch (error) {
      console.error("Email login failed", error);
      throw error;
    }
  };

  const registerWithEmail = async (email: string, pass: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
      localStorage.setItem('12tr_guest_mode', 'false');
      setIsGuest(false);
    } catch (error) {
      console.error("Registration failed", error);
      throw error;
    }
  };

  const sendResetEmail = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error("Reset email failed", error);
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
    localStorage.setItem('12tr_guest_mode', 'true');
    setIsGuest(true);
    setUser(null);
  };

  const continueAsGuest = () => {
    localStorage.setItem('12tr_guest_mode', 'true');
    setIsGuest(true);
    setIsAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider value={{ 
      user, loading, isGuest, isAuthModalOpen, setIsAuthModalOpen, 
      login, loginWithEmail, registerWithEmail, sendResetEmail, logout, continueAsGuest 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};