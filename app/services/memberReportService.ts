import { createApi } from './api';
import { useAuth } from '~/authContext';

export function useReportService(controller: string) {
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

  const getUserReport = async () => {

    try {
      const res = await api.get(`/${controller}/getUserReports`);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  return { getMemberReport, getUserReport };
}
