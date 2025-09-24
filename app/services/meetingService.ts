import { createApi } from './api';
import { useAuth } from '~/authContext';

type MeetingType = {
  name: string;
  participantCount: number;
  responsibleId: number;
  meetingTypeId: number;
  provinceId: number;
  participants: string;
  time?: string | null;
  notes?: string | null;
  address?: string | null;
  priority: string;
  isActive?: boolean;
  duration?: number;
};

export function useMeetingService(controller: string) {
  const { getCurrentToken, logout } = useAuth();
  const api = createApi(getCurrentToken() ?? undefined, logout);

  const getMeetings = async () => {

    try {
      const res = await api.get(`/${controller}/getMeetings`);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  const deleteMeeting = async (id: number) => {

    try {
      const res = await api.put(`/${controller}/deleteMeeting?id=${id}`, null);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  const addMeeting = async (params: MeetingType) => {

    try {
      const res = await api.post(`/${controller}/addMeeting`, params);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  const updateMeeting = async (params: MeetingType) => {

    try {
      const res = await api.put(`/${controller}/updateMeeting`, params);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  return { getMeetings, deleteMeeting, addMeeting, updateMeeting };
}
