import axios from 'axios';

export const createApi = (token?: string, onUnauthorized?: () => void) => {
  const api = axios.create({
    baseURL: import.meta.env.VITE_APP_API,
  });

  // Request interceptor
  api.interceptors.request.use(
    (config) => {
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401 && onUnauthorized) {
        onUnauthorized();
      }
      return Promise.reject(error);
    }
  );

  return api;
};
