// src/services/api.ts
import axios from 'axios';
import { useAuth } from '../authContext';
import { getWithExpiry } from '../utils/useLocalStorage'

// Axios instance oluşturma
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // Vite ortam değişkeni
});

// Request interceptor - Angular'daki AuthInterceptor gibi
api.interceptors.request.use(
  (config: any) => {
    const token = localStorage.getItem('token') || getWithExpiry('currentUser')?.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Hata yönetimi için
api.interceptors.response.use(
  (response: any) => response,
  (error: any) => {
    if (error.response?.status === 401) {
      // Token süresi dolmuşsa veya geçersizse
      const { logout } = useAuth();
      logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;