import { createApi } from './api';
import { useAuth } from '~/authContext';

interface DutyDataParams {
  name: string;
}

export function useUserDutyService(controller: string) {
  const { getCurrentToken, logout } = useAuth();
  const api = createApi(getCurrentToken() ?? undefined, logout);

  const getUserDuties = async () => {

    try {
      const res = await api.get(`/${controller}/getUserDuties`);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  const deleteUserDuty = async (id: number) => {

    try {
      const res = await api.put(`/${controller}/deleteUserDuty?id=${id}`, null);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  const addUserDuty = async (params: DutyDataParams) => {

    try {
      const res = await api.post(`/${controller}/addUserDuty`, params);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  const updateUserDuty = async (params: DutyDataParams) => {

    try {
      const res = await api.put(`/${controller}/updateUserDuty`, params);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  return { getUserDuties, deleteUserDuty, addUserDuty, updateUserDuty };
}
