import { create } from 'zustand';
import { createApi } from './services/api';
import { setWithExpiry, getWithExpiry } from './utils/useLocalStorage';

// 1. State Arayüzünü Tanımlıyoruz
interface AuthState {
  currentUser: any;
  loading: boolean;
  isLoggedIn: boolean;
  login: (email: string, password: string, loginType: string, dutyId?: string, userType?: string) => Promise<boolean>;
  memberLogin: (email: string, password: string) => Promise<boolean>;
  logout: (onLogout?: () => void) => void;
  getCurrentToken: () => string | null;
  initializeAuth: () => void; // useEffect yerine ilk yüklemede tetiklenecek fonksiyon
}

const api = createApi();

// 2. İlk Yükleme Esnasında LocalStorage Kontrolü
const getInitialUser = () => {
  const storedUser = getWithExpiry("currentUser");
  if (storedUser) {
    try {
      return JSON.parse(storedUser);
    } catch {
      localStorage.removeItem("currentUser");
    }
  }
  return null;
};

const initialUser = getInitialUser();

// 3. Zustand Store Oluşturulması
export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: initialUser,
  loading: false, // İlk kullanıcı senkron alındığı için direkt false başlatılabilir
  isLoggedIn: !!initialUser,

  // Uygulama ayağa kalktığında veya sayfa değiştiğinde güncelliği korumak için opsiyonel tetikleyici
  initializeAuth: () => {
    const storedUser = getWithExpiry('currentUser');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        set({ currentUser: user, isLoggedIn: true, loading: false });
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('currentUser');
        set({ currentUser: null, isLoggedIn: false, loading: false });
      }
    } else {
      set({ loading: false });
    }
  },

  login: async (email, password, loginType, dutyId, userType) => {
    set({ loading: true });
    try {
      const response = await api.get(
        `/${import.meta.env.VITE_APP_API_USER_CONTROLLER}/userLogin?email=${email}&password=${password}&dutyId=${dutyId || ''}&loginType=${userType || ""}`
      );
      const getUser = response.data;
      getUser.data["userType"] = loginType;

      if (getUser?.errors) {
        throw new Error('Kullanıcı bulunamadı veya şifre yanlış.');
      }

      setWithExpiry('currentUser', JSON.stringify(getUser.data), 86400000 * 7); // 1 hafta
      set({ currentUser: getUser.data, isLoggedIn: true });
      return true;
    } catch (error: any) {
      localStorage.removeItem('currentUser');
      set({ currentUser: null, isLoggedIn: false });
      return !!error?.data;
    } finally {
      set({ loading: false });
    }
  },

  memberLogin: async (email, password) => {
    set({ loading: true });
    try {
      const response = await api.get(
        `/${import.meta.env.VITE_APP_API_USER_CONTROLLER}/memberLogin?email=${email}&password=${password}`
      );
      const getUser = response.data;
      getUser.data["userType"] = "memberLogin";

      if (getUser?.errors) {
        throw new Error('Kullanıcı bulunamadı veya şifre yanlış.');
      }

      setWithExpiry('currentUser', JSON.stringify(getUser.data), 86400000 * 7);
      set({ currentUser: getUser.data, isLoggedIn: true });
      return true;
    } catch (error: any) {
      localStorage.removeItem('currentUser');
      set({ currentUser: null, isLoggedIn: false });
      return !!error?.data;
    } finally {
      set({ loading: false });
    }
  },

  logout: (onLogout) => {
    localStorage.removeItem('currentUser');
    set({ currentUser: null, isLoggedIn: false });
    
    // Eğer dışarıdan bir yönlendirme aksiyonu gönderildiyse çalıştır
    if (onLogout) {
      onLogout();
    }
  },

  getCurrentToken: () => {
    // get() fonksiyonu store'un o anki güncel durumuna erişmemizi sağlar
    return get().currentUser?.token || null;
  },
}));