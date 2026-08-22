import { createApi } from './api';
import { useAuthStore } from '~/authContext';

export function useLlmService(controller: string) {
  const { getCurrentToken, logout } = useAuthStore();
  const api = createApi(getCurrentToken() ?? undefined, logout);

  const getMembersByText = async (searchText: string) => {

    try {
      const res = await api.get(`/${controller}/getMembersByText`,{
        params: { searchText },
      });

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  return { getMembersByText };
}
