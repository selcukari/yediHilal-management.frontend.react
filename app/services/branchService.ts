import { createApi } from './api';
import { useAuth } from '~/authContext';

interface BranchDataParams {
  id?: number;
  branchName: string;
  provinceId?: string;
  branchHeadId?: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  socialMedias?: string | null;
  openingDate?: string | null;
  leaseAgreementDate?: string | null;
  updateDate?: string | null;
  createDate?: string | null;
  branchSancaktars?: string | null;
  rentalPrice?: number;
  isRent: boolean;
  files?: any[];
}

export function useBranchService(controller: string) {
  const { getCurrentToken, logout } = useAuth();
  const api = createApi(getCurrentToken() ?? undefined, logout);

  const getBranches = async (headId?: number) => {

    try {
      const res = await api.get(`/${controller}/getBranches`, {
        params: {
          headId: headId || null,
        }
      });

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  const getBranchesForRapor = async () => {

    try {
      const res = await api.get(`/${controller}/getBranchesForRapor`);

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
    // FormData oluştur
    const formData = new FormData()

    try {
      // Temel proje verilerini ekle
      formData.append('branchName', params.branchName);
      formData.append('branchHeadId', params.branchHeadId || '');
      formData.append('provinceId', params.provinceId || '');
      formData.append('address', params.address || '');
      formData.append('phone', params.phone || "");
      formData.append('email', params?.email || '');
      formData.append('socialMedias', params.socialMedias || '');
      formData.append('openingDate', params.openingDate || '');
      formData.append('leaseAgreementDate', params.leaseAgreementDate || '');
      formData.append('rentalPrice', params.rentalPrice?.toString() || '0');
      formData.append('isRent', params.isRent ? "1" : '');

      // Dosyaları ekle
      (params.files || []).forEach((file: File) => {
        formData.append('files', file);
      });

      const res = await api.post(`/${controller}/addBranch`, formData);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  const updateBranch = async (params: BranchDataParams) => {
    // FormData oluştur
    const formData = new FormData()
    try {
      // Temel proje verilerini ekle
      formData.append('id', params.id?.toString() || "");
      formData.append('branchName', params.branchName);
      formData.append('branchHeadId', params.branchHeadId || '');
      formData.append('address', params.address || '');
      formData.append('phone', params.phone || "");
      formData.append('email', params?.email || '');
      formData.append('socialMedias', params.socialMedias || '');
      formData.append('openingDate', params.openingDate || '');
      formData.append('leaseAgreementDate', params.leaseAgreementDate || '');
      formData.append('rentalPrice', params.rentalPrice?.toString() || '0');
      formData.append('branchSancaktars', params.branchSancaktars || '');
      formData.append('isRent', params.isRent ? "1" : '');

      // Dosyaları ekle
      (params.files || []).forEach((file: File) => {
        formData.append('files', file);
      });
      const res = await api.put(`/${controller}/updateBranch`, formData);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  return { getBranches, deleteBranch, addBranch, updateBranch, getBranchesForRapor };
}
