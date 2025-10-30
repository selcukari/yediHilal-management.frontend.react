import { createApi } from './api';
import { useAuth } from '~/authContext';

type ProjectType = {
  id?: number;
  name: string;
  responsibleId?: string;
  responsibleFullName?: string;
  numberOfParticipant: number;
  note: string;
  isActive?: boolean;
  priority: string;
  finisDate?: string | null;
  budget?: string | null;
  files?: any[];
};

export function useProjectService(controller: string) {
  const { getCurrentToken, logout } = useAuth();
  const api = createApi(getCurrentToken() ?? undefined, logout);

  const getProjects = async (responsibleId?: number) => {

    try {
      const res = await api.get(`/${controller}/getProjects`, {
        params: {
          responsibleId: responsibleId || null,
        }
      });

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  const deleteProject = async (id: number) => {

    try {
      const res = await api.put(`/${controller}/deleteProject?id=${id}`, null);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  const addProject = async (params: ProjectType) => {
    // FormData oluştur
    const formData = new FormData();

    try {
      // Temel proje verilerini ekle
      formData.append('name', params.name);
      formData.append('note', params.note || '');
      formData.append('finisDate', params.finisDate || '');
      formData.append('budget', params.budget?.toString() || '0');
      formData.append('priority', params.priority);
      formData.append('responsibleFullName', params?.responsibleFullName || '');
      formData.append('responsibleId', params.responsibleId?.toString() || '');
      formData.append('numberOfParticipant', params.numberOfParticipant?.toString() || '0');

       // Dosyaları ekle
      (params.files || []).forEach((file: File) => {
        formData.append('files', file);
      });

      const res = await api.post(`/${controller}/addProject`, formData);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  const updateProject = async (params: ProjectType) => {
    const formData = new FormData();

    try {
      // Temel proje verilerini ekle
      formData.append('id', params.id?.toString() || "");
      formData.append('name', params.name);
      formData.append('note', params.note || '');
      formData.append('finisDate', params.finisDate || '');
      formData.append('budget', params.budget?.toString() || '');
      formData.append('priority', params.priority);
      formData.append('numberOfParticipant', params.numberOfParticipant?.toString() || '0');

      // Dosyaları ekle
      (params.files || []).forEach((file: File) => {
        formData.append('files', file);
      });

      const res = await api.put(`/${controller}/updateProject`, formData);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  return { getProjects, deleteProject, addProject, updateProject };
}
