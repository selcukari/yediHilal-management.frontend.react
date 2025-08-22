import { createApi } from './api';
import { useAuth } from '~/authContext';

export function useSmsService(controller: string) {
  const { getCurrentToken, logout } = useAuth();
  const api = createApi(getCurrentToken() ?? undefined, logout);

  const getSms = async (type: number) => {

    try {
      const res = await api.get(`/${controller}/getSms`, {
        params: {type},
      });

      return res.data.data;
    } catch (error: any) {
      return error.error;
    }
  };

  return { getSms };
}
