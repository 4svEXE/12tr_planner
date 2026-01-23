
import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, User } from '../services/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>({ 
    uid: 'local-user', 
    displayName: 'Локальний Гравець', 
    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=LocalHero' 
  });
  const [loading, setLoading] = useState(false);

  // В локальному режимі ми просто тримаємо сесію завжди активною
  const login = async () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
  };

  const logout = async () => {
    alert("Локальний режим: Вихід не видаляє дані, лише очищує сесію браузера.");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
