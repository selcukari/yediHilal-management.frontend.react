import { createApi } from './api';
import { useAuth } from '~/authContext';

export function useMemberReportService(controller: string) {
  const { getCurrentToken, logout } = useAuth();
  const api = createApi(getCurrentToken() ?? undefined, logout);

  const getMemberReport = async () => {

    try {
      const res = await api.get(`/${controller}/getMemberReports`);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  return { getMemberReport };
}
