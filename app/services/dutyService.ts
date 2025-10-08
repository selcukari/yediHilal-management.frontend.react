import { createApi } from './api';
import { useAuth } from '~/authContext';

interface DutyDataParams {
  name: string;
}

export function useDutyService(controller: string) {
  const { getCurrentToken, logout } = useAuth();
  const api = createApi(getCurrentToken() ?? undefined, logout);

  const getDuties = async () => {

    try {
      const res = await api.get(`/${controller}/getDuties`);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  const deleteDuty = async (id: number) => {

    try {
      const res = await api.put(`/${controller}/deleteDuty?id=${id}`, null);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  const addDuty = async (params: DutyDataParams) => {

    try {
      const res = await api.post(`/${controller}/addDuty`, params);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  const updateDuty = async (params: DutyDataParams) => {

    try {
      const res = await api.put(`/${controller}/updateDuty`, params);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  return { getDuties, deleteDuty, addDuty, updateDuty };
}
