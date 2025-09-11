import { createApi } from './api';
import { useAuth } from '~/authContext';

export function useDutyService(controller: string) {
  const { getCurrentToken, logout } = useAuth();
  const api = createApi(getCurrentToken() ?? undefined, logout);

  const getDuties = async () => {

    try {
      const res = await api.get(`/${controller}/getDuties`);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  return { getDuties };
}
