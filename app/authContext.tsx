import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useNavigate } from "react-router";
import { createApi } from './services/api';
import { setWithExpiry, getWithExpiry } from './utils/useLocalStorage';


interface AuthContextType {
  currentUser: any;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
  isLoggedIn: boolean;
  getCurrentToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const api = createApi();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState<any>(() => {
    const storedUser = getWithExpiry("currentUser");
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch {
        localStorage.removeItem("currentUser");
      }
    }
    return null;
  });

  useEffect(() => {
    if (!currentUser) {
    const storedUser = getWithExpiry('currentUser');
    if (storedUser) {
      try {
        const user =  JSON.parse(storedUser);
        setCurrentUser(user);

      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('currentUser');
        setCurrentUser(null);
      }
    }
  }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await api.get(`/managementUser/login?email=${email}&password=${password}`);
      const getUser = response.data;

      if (getUser?.errors) {
        throw new Error('Kullanıcı bulunamadı veya şifre yanlış.');
      }

      setCurrentUser(getUser.data);
      setWithExpiry('currentUser', JSON.stringify(getUser.data), 86400000 * 7); // a week

      return true;
    } catch (error: any) {
      setCurrentUser(null);
      localStorage.removeItem('currentUser');

      return !!error.data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');

    navigate("login")
  };

  const getCurrentToken = () => {
    return currentUser?.token || null;
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      login,
      logout,
      loading,
      isLoggedIn: !!currentUser,
      getCurrentToken,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    // throw new Error("useAuth must be used within an AuthProvider");
    return {
      currentUser: null,
      login: async () => false,
      logout: () => {},
      loading: false,
      isLoggedIn: false,
      getCurrentToken: () => null,
    };
  }
  return context;
}
