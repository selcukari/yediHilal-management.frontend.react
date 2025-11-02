import { createApi } from './api';
import { useAuth } from '~/authContext';

export function useDistrictService(controller: string) {
  const { getCurrentToken, logout } = useAuth();
  const api = createApi(getCurrentToken() ?? undefined, logout);

  const turkeyProvinceId = 1;

  const getDistricts = async (provinceId?: string | null) => {

    try {
      const res = await api.get(`/${controller}/getDistrictsByProvince`, {
         params: {
          ...(provinceId ? { provinceId: parseInt(provinceId)} : { provinceId: turkeyProvinceId }),
        }
      });

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  return { getDistricts };
}
