import { createApi } from './api';
import { useAuth } from '~/authContext';

interface AutomaticSmsFieldsDataParams {
  id: number;
  message: string;
  isActive: boolean;
}


export function useAutomaticSmsFieldService(controller: string) {
  const { getCurrentToken, logout } = useAuth();
  const api = createApi(getCurrentToken() ?? undefined, logout);

  const getAutomaticSmsFields = async () => {

    try {
      const res = await api.get(`/${controller}/getAutomaticSmsFields`);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

   const updateAutomaticSmsFields = async (params: AutomaticSmsFieldsDataParams) => {

    try {
      const res = await api.put(`/${controller}/updateAutomaticSmsFields`, params);

      return res.data.data;
    } catch (error: any) {

      return error;
    }
  };

  return { getAutomaticSmsFields, updateAutomaticSmsFields };
}
