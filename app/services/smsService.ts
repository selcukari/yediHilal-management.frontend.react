import { createApi } from './api';
import { useAuth } from '~/authContext';

interface SmsParams {
  message: string;
  toUsers: Array<string>;
  count: number;
  type: number;
}

export function useSmsService(controller: string) {
  const { getCurrentToken, logout } = useAuth();
  const api = createApi(getCurrentToken() ?? undefined, logout);

  const getSms = async (type: number) => {

    try {
      const res = await api.get(`/${controller}/getSms`, {
        params: {type},
      });

      return res.data.data;
    } catch (error: any) {
      return error.error;
    }
  };

  const sendSms = async (params: SmsParams) => {

    try {
      const res = await api.post(`/${controller}/sendSms`, params);

      return res.data.data;
    } catch (error: any) {
      return error.error;
    }
  };

  return { getSms, sendSms };
}
