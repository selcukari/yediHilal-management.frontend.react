import { createApi } from './api';
import { useAuth } from '~/authContext';

interface BranchDataParams {
  branchName: string;
  provinceId?: number;
  branchHeadId: number;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  socialMedias?: string | null;
  openingDate?: string | null;
  updateDate?: string | null;
  createDate?: string | null;
  rentalPrice?: number;
  isRent: boolean;
}

export function useBranchService(controller: string) {
  const { getCurrentToken, logout } = useAuth();
  const api = createApi(getCurrentToken() ?? undefined, logout);

  const getBranches = async () => {

    try {
      const res = await api.get(`/${controller}/getBranches`);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  const deleteBranch = async (id: number) => {

    try {
      const res = await api.put(`/${controller}/deleteBranch?id=${id}`, null);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  const addBranch = async (params: BranchDataParams) => {

    try {
      const res = await api.post(`/${controller}/addBranch`, params);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  const updateBranch = async (params: BranchDataParams) => {

    try {
      const res = await api.put(`/${controller}/updateBranch`, params);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  return { getBranches, deleteBranch, addBranch, updateBranch };
}
