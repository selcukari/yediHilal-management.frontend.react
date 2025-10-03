import { createApi } from './api';
import { useAuth } from '~/authContext';

interface DocumentTrackingDataParams {
  id?: number;
  name: string;
  responsibleId?: string;
  responsibleFullName?: string;
  note?: string | null;
  files?: any[];
}

export function useDocumentTrackingService(controller: string) {
  const { getCurrentToken, logout } = useAuth();
  const api = createApi(getCurrentToken() ?? undefined, logout);

  const getDocumentTrackings = async () => {

    try {
      const res = await api.get(`/${controller}/getDocumentTrackings`);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  const deleteDocumentTracking = async (id: number) => {

    try {
      const res = await api.put(`/${controller}/deleteDocumentTracking?id=${id}`, null);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  const addDocumentTracking = async (params: DocumentTrackingDataParams) => {
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

      const res = await api.post(`/${controller}/addDocumentTracking`, formData);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  const updateDocumentTracking = async (params: DocumentTrackingDataParams) => {
    // FormData oluştur
    const formData = new FormData()
    try {
      // Temel DocumentTracking verilerini ekle
      formData.append('id', params.id?.toString() || "");
      formData.append('name', params.name);
      formData.append('responsibleId', params.responsibleId || '');
      formData.append('responsibleFullName', params.responsibleFullName || '');
      formData.append('note', params.note || '');

      // Dosyaları ekle
      (params.files || []).forEach((file: File) => {
        formData.append('files', file);
      });
      const res = await api.put(`/${controller}/updateDocumentTracking`, formData);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  return { getDocumentTrackings, deleteDocumentTracking, addDocumentTracking, updateDocumentTracking };
}
