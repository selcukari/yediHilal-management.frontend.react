import { createApi } from './api';
import { useAuth } from '~/authContext';
interface WarehouseDataParams {
  updateUserId: number;
  name: string;
  isActive?: boolean;
  description?: string;
  rowsMax?: number;
  columnsMax?: number;
  warehouseId?: number;
}

interface UpdatRequestStockParams {
  count?: number;
  productId: number;
  managerUserId?: number;
  status?: string;
  managerNote?: string;
}

export function useWarehouseService(controller: string) {
  const { getCurrentToken, logout } = useAuth();
  const api = createApi(getCurrentToken() ?? undefined, logout);
 
  // taleb stock işlemleri
  const getRequestStocks = async (userId?: number) => {

    try {
      const res = await api.get(`/${controller}/getRequestStocks`,{
        params: {
          id: userId || null,
        }
      });

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  // depot işlemleri
  const getWarehouses = async () => {

    try {
      const res = await api.get(`/${controller}/getWarehouses`);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };
  const addWarehouse = async (params: WarehouseDataParams) => {

    try {
      const res = await api.post(`/${controller}/addWarehouse`, params);

      return res.data.data;
    } catch (error: any) {

      return error;
    }
  };
  const deleteWarehouse = async (stockId: number) => {

    try {
      const res = await api.put(`/${controller}/deleteWarehouse?id=${stockId}`, null);

      return res.data.data;
    } catch (error: any) {
      console.log("hata:", error)
      return error;
    }
  };
  const updateWarehouse = async (params: WarehouseDataParams) => {

    try {
      const res = await api.put(`/${controller}/updateWarehouse`, params);

      return res.data.data;
    } catch (error: any) {

      return error;
    }
  };
  // depo işlemleri sonu
  const getShelves = async () => {

    try {
      const res = await api.get(`/${controller}/getShelves`);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };
  const addShelve = async (params: WarehouseDataParams) => {

    try {
      const res = await api.post(`/${controller}/addShelve`, params);

      return res.data.data;
    } catch (error: any) {

      return error;
    }
  };
  const deleteShelve = async (stockId: number) => {

    try {
      const res = await api.put(`/${controller}/deleteShelve?id=${stockId}`, null);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };
  const updateShelve = async (params: WarehouseDataParams) => {

    try {
      const res = await api.put(`/${controller}/updateShelve`, params);

      return res.data.data;
    } catch (error: any) {

      return error;
    }
  };
  // raf işlemleri sonu

  // taleb stock işlemleri sonu
  const updatRequestStock = async (params: UpdatRequestStockParams) => {

    try {
      const res = await api.put(`/${controller}/updatRequestStock`, params);

      return res.data.data;
    } catch (error: any) {

      return error;
    }
  };


  return { getWarehouses, addWarehouse, deleteWarehouse, updateWarehouse, updatRequestStock,
    getShelves, updateShelve, deleteShelve, addShelve, getRequestStocks };
}
