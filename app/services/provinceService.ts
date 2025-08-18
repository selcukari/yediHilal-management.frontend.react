import { createApi } from './api';
import { useAuth } from '~/authContext';

export function useProvinceService(controller: string) {
  const { getCurrentToken, logout } = useAuth();
  const api = createApi(getCurrentToken() ?? undefined, logout);

  const getProvinces = async () => {

    try {
      const res = await api.get(`/${controller}/getProvinces`);

      return res.data.data;
    } catch (error: any) {
      return error.error;
    }
  };

  return { getProvinces };
}
