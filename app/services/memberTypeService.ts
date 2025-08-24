import { createApi } from './api';
import { useAuth } from '~/authContext';

export function useMemberTypeService(controller: string) {
  const { getCurrentToken, logout } = useAuth();
  const api = createApi(getCurrentToken() ?? undefined, logout);

  const getMemberTypes = async () => {

    try {
      const res = await api.get(`/${controller}/getMemberTypes`);

      return res.data.data;
    } catch (error: any) {
      return error.error;
    }
  };

  return { getMemberTypes };
}
