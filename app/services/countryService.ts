import { createApi } from './api';
import { useAuth } from '~/authContext';

export function useCountryService(controller: string) {
  const { getCurrentToken, logout } = useAuth();
  const api = createApi(getCurrentToken() ?? undefined, logout);

  const getCountries = async () => {

    try {
      const res = await api.get(`/${controller}/getCountries`);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  return { getCountries };
}
