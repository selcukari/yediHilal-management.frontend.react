import { createApi } from './api';
import { useAuth } from '~/authContext';

interface PhoneCallTrackingDataParams {
  id?: number;
  name: string;
  responsibleId?: string;
  responsibleFullName?: string;
  isCompleted?: boolean;
  note?: string | null;
  files?: any[];
}

export function usePhoneCallTrackingService(controller: string) {
  const { getCurrentToken, logout } = useAuth();
  const api = createApi(getCurrentToken() ?? undefined, logout);

  const getPhoneCallTrackings = async () => {

    try {
      const res = await api.get(`/${controller}/getPhoneCallTrackings`);

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
    // FormData oluştur
    const formData = new FormData()

    try {
      // Temel DocumentTracking verilerini ekle
      formData.append('name', params.name);
      formData.append('responsibleId', params.responsibleId || '');
      formData.append('responsibleFullName', params.responsibleFullName || '');
      formData.append('note', params.note || '');

      // Dosyaları ekle
      (params.files || []).forEach((file: File) => {
        formData.append('files', file);
      });

      const res = await api.post(`/${controller}/addPhoneCallTracking`, formData);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  const updatePhoneCallTracking = async (params: PhoneCallTrackingDataParams) => {
    // FormData oluştur
    const formData = new FormData()
    try {
      // Temel DocumentTracking verilerini ekle
      formData.append('id', params.id?.toString() || "");
      formData.append('name', params.name);
      formData.append('responsibleId', params.responsibleId || '');
      formData.append('responsibleFullName', params.responsibleFullName || '');
      formData.append('isCompleted', params.isCompleted ? "1" : '');
      formData.append('note', params.note || '');

      // Dosyaları ekle
      (params.files || []).forEach((file: File) => {
        formData.append('files', file);
      });
      const res = await api.put(`/${controller}/updatePhoneCallTracking`, formData);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  return { getPhoneCallTrackings, deletePhoneCallTracking, addPhoneCallTracking, updatePhoneCallTracking };
}
