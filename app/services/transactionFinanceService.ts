import { createApi } from './api';
import { useAuthStore } from '~/authContext';

interface FinanceParams {
  status?: string;
  paymentTypeIds?: string;
}

interface FinanceRecord {
  id: string;
  paymentType: string;
  amount: string;
  transactionDate: string;
  status: string; // 'Ödendi' | 'Bekliyor'
  sender: string; // gonderici
  receiver: string; //alici
  userId: number; // üye id
}

export function useTransactionFinanceService(controller: string) {
  const { getCurrentToken, logout } = useAuthStore();
  const api = createApi(getCurrentToken() ?? undefined, logout);

  const getPaymentTypes = async () => {

    try {
      const res = await api.get(`/${controller}/getPaymentTypes`);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  const getFinanceCurrentBalance = async () => {

    try {
      const res = await api.get(`/${controller}/getFinanceCurrentBalance`);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  const getFinances = async (params: FinanceParams) => {

    try {
      const res = await api.get(`/${controller}/getFinances`, {
        params: {
          ...(params.paymentTypeIds ? { paymentTypeIds: params.paymentTypeIds} : {}),
          ...(params.status ? { status: params.status} : {}),
        }
      });

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  const addFinance = async (params: FinanceRecord) => {

    try {
      const res = await api.post(`/${controller}/addFinance`, params);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  return { getPaymentTypes, addFinance, getFinances, getFinanceCurrentBalance };
}
