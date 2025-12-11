import { createApi } from './api';
import { useAuth } from '~/authContext';

type MeetingType = {
  id?: number;
  name: string;
  participantCount: number;
  responsibleFullName: string | null;
  meetingTypeId: number;
  provinceId: number;
  districtId: number;
  agendas: string;
  time?: string | null;
  notes?: string | null;
  participants?: string | null;
  isActive?: boolean;
  files?: any[]
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
    // FormData oluştur
    const formData = new FormData()
    try {
        // Temel proje verilerini ekle
        formData.append('name', params.name);
        formData.append('participantCount', params.participantCount?.toString() || '0');
        formData.append('responsibleFullName', params.responsibleFullName?.toString() || '');
        formData.append('meetingTypeId', params.meetingTypeId?.toString() || '');
        formData.append('provinceId', params.provinceId?.toString() || "");
        formData.append('districtId', params.districtId?.toString() || "");
        formData.append('agendas', params.agendas || '');
        formData.append('time', params.time || '');
        formData.append('notes', params.notes || '');
        formData.append('participants', params.participants || '');
        // Dosyaları ekle
        (params.files || []).forEach((file: File) => {
          formData.append('files', file);
        });
        
      const res = await api.post(`/${controller}/addMeeting`, formData);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  const updateMeeting = async (params: MeetingType) => {
    const formData = new FormData()

    try {
      formData.append('id', params.id?.toString() || "");
      formData.append('name', params.name);
      formData.append('participantCount', params.participantCount?.toString() || '0');
      formData.append('responsibleFullName', params.responsibleFullName?.toString() || '');
      formData.append('meetingTypeId', params.meetingTypeId?.toString() || '');
      formData.append('provinceId', params.provinceId?.toString() || "");
      formData.append('districtId', params.districtId?.toString() || "");
      formData.append('agendas', params.agendas || '');
      formData.append('time', params.time || '');
      formData.append('notes', params.notes || '');
      formData.append('participants', params.participants || '');
      // Dosyaları ekle
      (params.files || []).forEach((file: File) => {
        formData.append('files', file);
      });

      const res = await api.put(`/${controller}/updateMeeting`, formData);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  return { getMeetings, deleteMeeting, addMeeting, updateMeeting };
}
