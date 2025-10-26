import { createApi } from './api';
import { useAuth } from '~/authContext';

interface UniversityBranchDataParams {
  id?: number;
  universityName: string;
  provinceId?: string;
  branchHeadId?: string;
  socialMedias?: string | null;
  email?: string | null;
  openingDate?: string | null;
  updateDate?: string | null;
  createDate?: string | null;
  branchSancaktars?: string | null;
  files?: any[];
}

export function useUniversityBranchService(controller: string) {
  const { getCurrentToken, logout } = useAuth();
  const api = createApi(getCurrentToken() ?? undefined, logout);

  const getUniversityBranches = async () => {

    try {
      const res = await api.get(`/${controller}/getUniversityBranches`);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  const getUniversityBranchesForRapor = async () => {

    try {
      const res = await api.get(`/${controller}/getUniversityBranchesForRapor`);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  const deleteUniversityBranch = async (id: number) => {

    try {
      const res = await api.put(`/${controller}/deleteUniversityBranch?id=${id}`, null);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  const addUniversityBranch = async (params: UniversityBranchDataParams) => {
    // FormData oluştur
    const formData = new FormData()

    try {
      // Temel proje verilerini ekle
      formData.append('universityName', params.universityName);
      formData.append('branchHeadId', params.branchHeadId || '');
      formData.append('provinceId', params.provinceId || '');
      formData.append('socialMedias', params.socialMedias || '');
      formData.append('email', params.email || '');

      // Dosyaları ekle
      (params.files || []).forEach((file: File) => {
        formData.append('files', file);
      });

      const res = await api.post(`/${controller}/addUniversityBranch`, formData);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  const updateUniversityBranch = async (params: UniversityBranchDataParams) => {
    // FormData oluştur
    const formData = new FormData()
    try {
      // Temel proje verilerini ekle
      formData.append('id', params.id?.toString() || "");
      formData.append('universityName', params.universityName);
      formData.append('branchHeadId', params.branchHeadId?.toString() || '');
      formData.append('socialMedias', params.socialMedias || '');
      formData.append('email', params.email || '');
      formData.append('branchSancaktars', params.branchSancaktars || '');

      // Dosyaları ekle
      (params.files || []).forEach((file: File) => {
        formData.append('files', file);
      });
      const res = await api.put(`/${controller}/updateUniversityBranch`, formData);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  return { getUniversityBranches, deleteUniversityBranch, getUniversityBranchesForRapor, addUniversityBranch, updateUniversityBranch };
}
