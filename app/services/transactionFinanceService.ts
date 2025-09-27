import { createApi } from './api';
import { useAuth } from '~/authContext';

interface FinanceParams {
  status?: string;
  paymentTypeIds?: string;
}

export function useTransactionFinanceService(controller: string) {
  const { getCurrentToken, logout } = useAuth();
  const api = createApi(getCurrentToken() ?? undefined, logout);

  const getPaymentTypes = async () => {

    try {
      const res = await api.get(`/${controller}/getPaymentTypes`);

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

  return { getPaymentTypes, getFinances };
}
