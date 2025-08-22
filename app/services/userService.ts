import { createApi } from './api';
import { useAuth } from '~/authContext';

interface UserDataParams {
  fullName: string;
  countryCode?: string;
  isActive: boolean;
  countryId?: number;
  provinceId?: number;
  identificationNumber?: string;
  telephone?: string;
  email?: string;
  dateOfBirth?: string;
  createdDate?: string;
  updateDate?: string;
  deleteMessageTitle?: string;
}

type MemberParams = {
  countryId?: string | null;
  isActive: boolean;
  provinceId?: string | null;
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
      console.log("error:", error)
      return error.response.data;
    }
  };

  const deleteUser = async (userId: number, deleteMessageTitle: string) => {

    try {
      const res = await api.put(`/${controller}/deleteUser?id=${userId}&deleteMessageTitle=${deleteMessageTitle}`, null);

      return res.data.data;
    } catch (error: any) {
      console.log("error:", error)
      return error.response.data;
    }
  };

  const addUser = async (params: UserDataParams) => {

    try {
      const res = await api.post(`/${controller}/addUser`, params);

      return res.data.data;
    } catch (error: any) {
      console.log("error:", error)
      return error.response.data;
    }
  };

  
  const users = async (params: MemberParams) => {
    try {

      const res = await api.get(`/${controller}/getUsersBy`,{
        params
      });

      return res.data.data;
    } catch (error: any) {
      console.log("error:", error)
      return error.response.data;
    }
  };

  return { addUser, users, deleteUser, updateUser };
}
