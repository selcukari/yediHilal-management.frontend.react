// src/services/auth.ts
import { createContext, useContext, useState, useEffect } from 'react';
import api from './services/api';
import { setWithExpiry, getWithExpiry } from './utils/useLocalStorage';

type User = {
  token?: string;
  // Diğer kullanıcı özellikleri
} | null;

interface AuthContextType {
  currentUser: User;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isLoggedIn: boolean;
  getCurrentToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  // Başlangıçta kullanıcıyı yükle
  useEffect(() => {
    const initializeAuth = async () => {
      const storedUser = getWithExpiry('currentUser');
      if (storedUser) {
        try {
          const user = typeof storedUser === "string" ? JSON.parse(storedUser) : storedUser;
          setCurrentUser(user);
        } catch (error) {
          console.error('Error parsing stored user:', error);
          localStorage.removeItem('currentUser');
        }
      }
      setLoading(false);
    };
    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      const response = await api.get(
        `/managementUser/login?email=${email}&password=${password}`
      );
      
      const getUser = response.data;
      
      if (getUser?.errors) {
        throw new Error('Kullanıcı bulunamadı veya şifre yanlış.');
      }
      
      setCurrentUser(getUser.data);
      setWithExpiry('currentUser', JSON.stringify(getUser.data), 86400000 * 7); // 7 gün TTL
    } catch (error: any) {
      setCurrentUser(null);
      localStorage.removeItem('currentUser');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  const isLoggedIn = currentUser !== null;

  const getCurrentToken = () => {
    return currentUser?.token || null;
  };

  return (
    <AuthContext.Provider 
      value={{ 
        currentUser, 
        login, 
        logout, 
        loading,
        isLoggedIn,
        getCurrentToken
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};