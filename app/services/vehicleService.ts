import { createApi } from './api';
import { useAuth } from '~/authContext';

export function useVehicleService(controller: string) {
  const { getCurrentToken, logout } = useAuth();
  const api = createApi(getCurrentToken() ?? undefined, logout);

  const getVehicles = async () => {

    try {
      const res = await api.get(`/${controller}/getVehicles`);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  return { getVehicles };
}
