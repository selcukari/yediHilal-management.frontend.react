import { createApi } from './api';
import { useAuth } from '~/authContext';

export function useRoleService(controller: string) {
  const { getCurrentToken, logout } = useAuth();
  const api = createApi(getCurrentToken() ?? undefined, logout);

  const getRoles = async () => {

    try {
      const res = await api.get(`/${controller}/getRoles`);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  return { getRoles };
}
