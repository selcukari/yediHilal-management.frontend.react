import { createApi } from './api';
import { useAuth } from '~/authContext';

export function useUniversityBranchReportForHeadService(controller: string) {
  const { getCurrentToken, logout } = useAuth();
  const api = createApi(getCurrentToken() ?? undefined, logout);

  const getUniversityBranchReportForHeads = async () => {

    try {
      const res = await api.get(`/${controller}/getUniversityBranchReportForHeads`);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  return { getUniversityBranchReportForHeads };
}
