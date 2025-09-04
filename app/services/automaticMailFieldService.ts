import { createApi } from './api';
import { useAuth } from '~/authContext';

interface AutomaticSmsFieldsDataParams {
  id: number;
  subject: string;
  body: string;
  isActive: boolean;
}


export function useAutomaticMailFieldService(controller: string) {
  const { getCurrentToken, logout } = useAuth();
  const api = createApi(getCurrentToken() ?? undefined, logout);

  const getAutomaticMailFields = async () => {

    try {
      const res = await api.get(`/${controller}/getAutomaticMailFields`);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

   const updateAutomaticMailFields = async (params: AutomaticSmsFieldsDataParams) => {

    try {
      const res = await api.put(`/${controller}/updateAutomaticMailFields`, params);

      return res.data.data;
    } catch (error: any) {

      return error;
    }
  };

  return { getAutomaticMailFields, updateAutomaticMailFields };
}
