import { createApi } from './api';
import { useAuth } from '~/authContext';

interface DutyDataParams {
  name: string;
}

export function useBranchDutyService(controller: string) {
  const { getCurrentToken, logout } = useAuth();
  const api = createApi(getCurrentToken() ?? undefined, logout);

  const getBranchDuties = async () => {

    try {
      const res = await api.get(`/${controller}/getBranchDuties`);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  const deleteBranchDuty = async (id: number) => {

    try {
      const res = await api.put(`/${controller}/deleteBranchDuty?id=${id}`, null);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  const addBranchDuty = async (params: DutyDataParams) => {

    try {
      const res = await api.post(`/${controller}/addBranchDuty`, params);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  const updateBranchDuty = async (params: DutyDataParams) => {

    try {
      const res = await api.put(`/${controller}/updateBranchDuty`, params);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  return { getBranchDuties, deleteBranchDuty, addBranchDuty, updateBranchDuty };
}
