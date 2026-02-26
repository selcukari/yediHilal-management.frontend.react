import { createApi } from './api';
import { useAuth } from '~/authContext';
interface StockDataParams {
  updateUserId: number;
  expirationDate?: string | null;
  name: string;
  isActive: boolean;
  unitPrice: number;
  totalPrice?: number;
  count?: number;
  description?: string;
  fromWhere?: string;
}

interface StockRequestDataParams {
  requestStocks: {
    productId: number;
    updateUserId: number;
    count: number;
    description?: string;
  }[];
}

export function useStockService(controller: string) {
  const { getCurrentToken, logout } = useAuth();
  const api = createApi(getCurrentToken() ?? undefined, logout);

  const getStocks = async () => {

    try {
      const res = await api.get(`/${controller}/getStocks`);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  const createStockRequest = async (params: StockRequestDataParams) => {

    try {
      const res = await api.post(`/${controller}/addRequestStocks`, params);

      return res.data.data;
    } catch (error: any) {

      return error;
    }
  };
  const addStock = async (params: StockDataParams) => {

    try {
      const res = await api.post(`/${controller}/addStock`, params);

      return res.data.data;
    } catch (error: any) {

      return error;
    }
  };
  const deleteStock = async (stockId: number) => {

    try {
      const res = await api.put(`/${controller}/deleteStock?id=${stockId}`, null);

      return res.data.data;
    } catch (error: any) {
      console.log("hata:", error)
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

  return { getStocks, addStock, deleteStock, updateStock, createStockRequest };
}
