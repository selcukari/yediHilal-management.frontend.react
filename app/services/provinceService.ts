import { createApi } from './api';
import { useAuth } from '~/authContext';

export function useProvinceService(controller: string) {
  const { getCurrentToken, logout } = useAuth();
  const api = createApi(getCurrentToken() ?? undefined, logout);

  const turkeyCountryId = 1;

  const getProvinces = async (countryId?: string | null) => {

    try {
      const res = await api.get(`/${controller}/getProvincesByCountry`, {
         params: {
          ...(countryId ? { countryId: parseInt(countryId)} : { countryId: turkeyCountryId }),
        }
      });

      return res.data.data;
    } catch (error: any) {
      return error.error;
    }
  };

  return { getProvinces };
}
