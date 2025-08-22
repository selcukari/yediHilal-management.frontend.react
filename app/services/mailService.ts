import { createApi } from './api';
import { useAuth } from '~/authContext';

export function useMailService(controller: string) {
  const { getCurrentToken, logout } = useAuth();
  const api = createApi(getCurrentToken() ?? undefined, logout);

  const getRoles = async (type: number) => {

    try {
      const res = await api.get(`/${controller}/getMails`, {
        params: {type},
      });

      return res.data.data;
    } catch (error: any) {
      return error.error;
    }
  };

  return { getRoles };
}
