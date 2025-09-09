import { createApi } from './api';
import { useAuth } from '~/authContext';

interface SafeParams {
  status?: string;
  paymentTypeIds?: string;
}

export function useTransactionSafeService(controller: string) {
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

  const getSafe = async (params: SafeParams) => {

    try {
      const res = await api.get(`/${controller}/getSafe`, {
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

  return { getPaymentTypes, getSafe };
}
