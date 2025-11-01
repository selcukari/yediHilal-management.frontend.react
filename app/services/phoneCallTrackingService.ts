import { createApi } from './api';
import { useAuth } from '~/authContext';

interface PhoneCallTrackingDataParams {
  id?: number;
  name?: string;
  responsibleId?: number;
  responsibleFullName?: string;
  note?: string | null;
  members?: string | null;
}

export function usePhoneCallTrackingService(controller: string) {
  const { getCurrentToken, logout } = useAuth();
  const api = createApi(getCurrentToken() ?? undefined, logout);

  const getPhoneCallTrackings = async (responsibleId?: number) => {

    try {
      const res = await api.get(`/${controller}/getPhoneCallTrackings`, {
        params: {
          responsibleId: responsibleId || null,
        }
      });

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  const deletePhoneCallTracking = async (id: number) => {

    try {
      const res = await api.put(`/${controller}/deletePhoneCallTracking?id=${id}`, null);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  const addPhoneCallTracking = async (params: PhoneCallTrackingDataParams) => {
    try {

      const res = await api.post(`/${controller}/addPhoneCallTracking`, params);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  const updatePhoneCallTracking = async (params: PhoneCallTrackingDataParams) => {
    try {

      const res = await api.put(`/${controller}/updatePhoneCallTracking`, params);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  return { getPhoneCallTrackings, deletePhoneCallTracking, addPhoneCallTracking, updatePhoneCallTracking };
}
