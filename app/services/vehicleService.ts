import { createApi } from './api';
import { useAuth } from '~/authContext';

type VehicleParams = {
  plate: string;
  brand: string;
  model: string;
  color?: string | null;
  // motor numarası
  engineNumber?: string | null;
  // kilometresi
  mileage?: number;
  // yakıt tipi(Gasoline/Diesel/Electric/Hybrid)
  fuelType: string | null;
  //Manual/Automatic
  transmission: string | null;
  // sigortaTarih
  insuranceDate?: string | null;
  // muane tarihi
  inspectionDate?: string | null;
  year: number | null;
  userId: number;
  fuelLevel: string | null;
  note?: string | null;
};

export function useVehicleService(controller: string) {
  const { getCurrentToken, logout } = useAuth();
  const api = createApi(getCurrentToken() ?? undefined, logout);

  const addVehicle = async (params: VehicleParams) => {

    try {
      const res = await api.post(`/${controller}/addVehicle`, params);

      return res.data.data;
    } catch (error: any) {

      return error;
    }
  };
  const editVehicle = async (params: VehicleParams) => {

    try {
      const res = await api.put(`/${controller}/updateVehicle`, params);

      return res.data.data;
    } catch (error: any) {

      return error;
    }
  };
  const getVehicles = async () => {

    try {
      const res = await api.get(`/${controller}/getVehicles`);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };
  const getVehicleDeposits = async () => {

    try {
      const res = await api.get(`/${controller}/getVehicleDeposits`);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };
  const deleteVehicle = async (vehicleId: number) => {

    try {
      const res = await api.put(`/${controller}/deleteVehicle?id=${vehicleId}`, null);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  return { getVehicles, editVehicle, deleteVehicle, getVehicleDeposits, addVehicle };
}
