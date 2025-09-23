import { createApi } from './api';
import { useAuth } from '~/authContext';

interface PhoneNumbersWithCountryCode {
  telephone: string;
  countryCode: string;
}
interface SmsParams {
  message: string;
  toUsers: Array<string>;
  toPhoneNumbersWithCountryCode: Array<PhoneNumbersWithCountryCode>;
  count: number;
  personType?: number;
  smsType: string;
}

export function useSmsService(controller: string) {
  const { getCurrentToken, logout } = useAuth();
  const api = createApi(getCurrentToken() ?? undefined, logout);

  const getSms = async (personType: number) => {

    try {
      const res = await api.get(`/${controller}/getSms`, {
        params: {personType},
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
      return error;
    }
  };

  return { getSms, sendSms };
}
