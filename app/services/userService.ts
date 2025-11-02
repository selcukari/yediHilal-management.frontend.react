import { createApi } from './api';
import { useAuth } from '~/authContext';

interface UserDataParams {
  fullName: string;
  countryCode?: string;
  isActive: boolean;
  countryId?: number;
  provinceId?: number;
  districtId?: number;
  identificationNumber?: string;
  telephone?: string;
  email?: string;
  dateOfBirth?: string;
  createdDate?: string;
  updateDate?: string;
  duties?: string;
  deleteMessageTitle?: string;
  dutyIds?: string;
}

type UserParams = {
  countryId?: string | null;
  isActive: boolean;
  provinceIds?: string | null;
  searchText?: string;
};

export function useUserService(controller: string) {
  const { getCurrentToken, logout } = useAuth();
  const api = createApi(getCurrentToken() ?? undefined, logout);

  const turkeyCountryId = 1;

  const updateUser = async (params: UserDataParams) => {

    try {
      const res = await api.put(`/${controller}/updateUser`, params);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  const deleteUser = async (userId: number, deleteMessageTitle: string) => {

    try {
      const res = await api.put(`/${controller}/deleteUser?id=${userId}&deleteMessageTitle=${deleteMessageTitle}`, null);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  const addUser = async (params: UserDataParams) => {

    try {
      const res = await api.post(`/${controller}/addUser`, params);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  
  const users = async (params: UserParams) => {
    try {

      const res = await api.get(`/${controller}/getUsersBy`,{
        params
      });

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  const user = async (userId: number) => {
    try {

      const res = await api.get(`/${controller}/getUser`,{
        params: { userId }
      });

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  }
  const usersInCache = async (countryId?: string) => {

    try {

      const res = await api.get(`/${controller}/getUsers`,{
        params: {
          ...(countryId ? { countryId: parseInt(countryId)} : { countryId: turkeyCountryId }),
        }
      });

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  return { addUser, users, deleteUser, updateUser, user, usersInCache };
}
