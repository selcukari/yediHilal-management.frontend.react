import { createApi } from './api';
import { useAuth } from '~/authContext';

interface UserDataParams {
  fullName: string;
  countryCode?: string;
  isActive: boolean;
  countryId?: number;
  provinceId?: number;
  identificationNumber?: string;
  typeId: number;
  telephone?: string;
  isSms: boolean;
  isMail: boolean;
  email?: string;
  referenceId?: number;
  dateOfBirth?: string;
  createdDate?: string;
  updateDate?: string;
  deleteMessageTitle?: string;
}

type MemberParams = {
  countryId?: string | null;
  isActive: boolean;
  provinceIds?: string | null;
  searchText?: string;
};

export function useMemberService(controller: string) {
  const { getCurrentToken, logout } = useAuth();
  const api = createApi(getCurrentToken() ?? undefined, logout);

  const deleteMember = async (userId: number, deleteMessageTitle: string) => {

    try {
      const res = await api.put(`/${controller}/deleteMember?id=${userId}&deleteMessageTitle=${deleteMessageTitle}`, null);

      return res.data.data;
    } catch (error: any) {
      return error.response.data;
    }
  };

  const updateMember = async (params: UserDataParams) => {

    try {
      const res = await api.put(`/${controller}/updateMember`, params);

      return res.data.data;
    } catch (error: any) {
      return error.response.data;
    }
  };

  const addMember = async (params: UserDataParams) => {

    try {
      const res = await api.post(`/${controller}/addMember`, params);

      return res.data.data;
    } catch (error: any) {
      return error.response.data;
    }
  };

  
  const members = async (params: MemberParams) => {
    try {

      const res = await api.get(`/${controller}/getMembersBy`,{
        params
      });

      return res.data.data;
    } catch (error: any) {
      return error.response.data;
    }
  };

  const membersInCache = async (countryId?: string) => {
    const turkeyCountryId = 1;

    try {

      const res = await api.get(`/${controller}/getMembers`,{
        params: {
          ...(countryId ? { countryId: parseInt(countryId)} : { countryId: turkeyCountryId }),
        }
      });

      return res.data.data;
    } catch (error: any) {
      return error.response.data;
    }
  };

  return { addMember, members, updateMember, deleteMember, membersInCache };
}
