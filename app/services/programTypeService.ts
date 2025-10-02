import { createApi } from './api';
import { useAuth } from '~/authContext';

export function useProgramTypeService(controller: string) {
  const { getCurrentToken, logout } = useAuth();
  const api = createApi(getCurrentToken() ?? undefined, logout);

  const getProgramTypes = async () => {

    try {
      const res = await api.get(`/${controller}/getProgramTypes`);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  return { getProgramTypes };
}
