import { createApi } from './api';
import { useAuth } from '~/authContext';

interface MeetingTypeDataParams {
  name: string;
}

export function useMeetingTypeService(controller: string) {
  const { getCurrentToken, logout } = useAuth();
  const api = createApi(getCurrentToken() ?? undefined, logout);

  const getMeetingTypes = async () => {

    try {
      const res = await api.get(`/${controller}/getMeetingTypes`);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  const deleteMeetingType = async (id: number) => {

    try {
      const res = await api.put(`/${controller}/deleteMeetingType?id=${id}`, null);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  const addMeetingType = async (params: MeetingTypeDataParams) => {

    try {
      const res = await api.post(`/${controller}/addMeetingType`, params);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  const updateMeetingType = async (params: MeetingTypeDataParams) => {

    try {
      const res = await api.put(`/${controller}/updateMeetingType`, params);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  return { getMeetingTypes, deleteMeetingType, addMeetingType, updateMeetingType };
}
