import { createApi } from './api';
import { useAuth } from '~/authContext';

interface StockItem {
  name: string;
  key: string;
  count: number;
  color: string;
}

interface StockDataParams {
  id: number;
  updateUserId: number;
  items?: string;
}

export function useStockService(controller: string) {
  const { getCurrentToken, logout } = useAuth();
  const api = createApi(getCurrentToken() ?? undefined, logout);

  const getStock = async () => {

    try {
      const res = await api.get(`/${controller}/getStock`);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

   const updateStock = async (params: StockDataParams) => {

    try {
      const res = await api.put(`/${controller}/updateStock`, params);

      return res.data.data;
    } catch (error: any) {

      return error;
    }
  };

  return { getStock, updateStock };
}
