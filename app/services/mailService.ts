import { createApi } from './api';
import { useAuth } from '~/authContext';

interface EmailParams {
  subject: string;
  toUsers: Array<string>;
  toEmails: Array<string>;
  body: string;
  count: number;
}

export function useMailService(controller: string) {
  const { getCurrentToken, logout } = useAuth();
  const api = createApi(getCurrentToken() ?? undefined, logout);

  const getMails = async (type: number) => {

    try {
      const res = await api.get(`/${controller}/getMails`, {
        params: {type},
      });

      return res.data.data;
    } catch (error: any) {
      return error.error;
    }
  };

  const sendMail = async (params: EmailParams) => {

    try {
      const res = await api.post(`/${controller}/sendMail`, params);

      return res.data.data;
    } catch (error: any) {
      return error.error;
    }
  };

  return { getMails, sendMail };
}
