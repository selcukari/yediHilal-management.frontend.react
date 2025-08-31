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

interface StockUsedExpenseParams {
  buyerId: number;
  items?: string;
  isDelivery: boolean;
  type: string;
}

interface UpdateStockUsedExpenseParams {
  id: number;
  buyerId: number;
  items?: string;
  isDelivery: boolean;
  type: string;
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

    const getStockUsed = async (type: string, buyerId?: number) => {

    try {
      const res = await api.get(`/${controller}/getStockUseds`, {
        params: {
          type,
          ...(buyerId ? { buyerId } : { }),
        }
      });

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  const addStockUsed = async (params: StockUsedExpenseParams) => {

    try {
      const res = await api.post(`/${controller}/addStockUsed`, params);

      return res.data.data;
    } catch (error: any) {

      return error;
    }
  };
  const updateStockUsedExpense = async (params: UpdateStockUsedExpenseParams) => {

    try {
      const res = await api.put(`/${controller}/updateStockUsed`, params);

      return res.data.data;
    } catch (error: any) {

      return error;
    }
  };

    const deleteStockUsed = async (stockId: number) => {

    try {
      const res = await api.put(`/${controller}/deleteStockUsed?id=${stockId}`, null);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  return { getStock, updateStock, addStockUsed, getStockUsed, updateStockUsedExpense, deleteStockUsed };
}
