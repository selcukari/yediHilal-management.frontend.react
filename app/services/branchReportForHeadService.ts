import { createApi } from './api';
import { useAuth } from '~/authContext';

export function useBranchReportForHeadService(controller: string) {
  const { getCurrentToken, logout } = useAuth();
  const api = createApi(getCurrentToken() ?? undefined, logout);

  const getBranchReportForHeads = async () => {

    try {
      const res = await api.get(`/${controller}/getBranchReportForHeads`);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  return { getBranchReportForHeads };
}
