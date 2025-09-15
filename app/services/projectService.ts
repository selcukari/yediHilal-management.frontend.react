import { createApi } from './api';
import { useAuth } from '~/authContext';

interface DutyDataParams {
  name: string;
  isActive: boolean;
}

type ProjectType = {
  name: string;
  responsibleId?: number;
  responsibleFullName?: string;
  numberOfParticipant: number;
  note: string;
  isActive: boolean;
  priority: string;
  finisDate?: string | null;
};

export function useProjectService(controller: string) {
  const { getCurrentToken, logout } = useAuth();
  const api = createApi(getCurrentToken() ?? undefined, logout);

  const getProjects = async () => {

    try {
      const res = await api.get(`/${controller}/getProjects`);

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

    try {
      const res = await api.post(`/${controller}/addProject`, params);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  const updateProject = async (params: DutyDataParams) => {

    try {
      const res = await api.put(`/${controller}/updateProject`, params);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  return { getProjects, deleteProject, addProject, updateProject };
}
