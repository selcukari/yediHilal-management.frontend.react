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
  isSms: boolean;
  isMail: boolean;
  email?: string;
  reference?: string;
  moduleRoles?: string
  dateOfBirth?: number;
  createdDate?: string;
  updateDate?: string;
}

export function useMemberService(controller: string) {
  const { getCurrentToken, logout } = useAuth();
  const api = createApi(getCurrentToken() ?? undefined, logout);

  const turkeyCountryId = 1;

  const addMember = async (params: UserDataParams) => {

    try {
      const res = await api.post(`/${controller}/addMember`, params);

      return res.data.data;
    } catch (error: any) {
      console.log("error:", error)
      return error.response.data;
    }
  };

  return { addMember };
}
