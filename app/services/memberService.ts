import { createApi } from './api';
import { useAuth } from '~/authContext';

interface UserDataParams {
  fullName: string;
  countryCode?: string;
  isActive: boolean;
  countryId?: number;
  provinceId?: number;
  identificationNumber?: string;
  typeIds: string;
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
  programTypeId: number | null;
  dateRange: [string | null, string | null];
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
      return error;
    }
  };

  const updateMember = async (params: UserDataParams) => {

    try {
      const res = await api.put(`/${controller}/updateMember`, params);

      return res.data.data;
    } catch (error: any) {

      return error;
    }
  };

  const addMember = async (params: UserDataParams) => {

    try {
      const res = await api.post(`/${controller}/addMember`, params);

      return res.data.data;
    } catch (error: any) {

      return error;
    }
  };

  const addExternalMember = async (params: UserDataParams) => {

    try {
      const res = await api.post(`/${controller}/addExternalMember`, params);

      return res.data.data;
    } catch (error: any) {

      return error;
    }
  };

  
  const members = async (params: MemberParams) => {
    try {
      const newParams = {
        ...params,
        dateRange: {
          startDate: params.dateRange[0],
          endDate: params.dateRange[1],
        }
      };
      
      const res = await api.get(`/${controller}/getMembersBy`,{
        params: newParams
      });

      return res.data.data;
    } catch (error: any) {
      return error;
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
      return error;
    }
  };

  return { addMember, members, updateMember, deleteMember, membersInCache, addExternalMember };
}
