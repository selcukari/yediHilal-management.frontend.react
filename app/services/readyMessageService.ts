import { createApi } from './api';
import { useAuth } from '~/authContext';

interface DutyDataParams {
  message?: string;
  subject?: string;
  body?: string;
}

export function useReadyMessageService(controller: string) {
  const { getCurrentToken, logout } = useAuth();
  const api = createApi(getCurrentToken() ?? undefined, logout);

  const getReadyMessages = async () => {

    try {
      const res = await api.get(`/${controller}/getReadyMessages`);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  const getReadyMessagesMail = async () => {

    try {
      const res = await api.get(`/${controller}/getReadyMessagesMail`);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  const addReadyMessage = async (params: DutyDataParams) => {

    try {
      const res = await api.post(`/${controller}/addReadyMessage`, params);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  const addReadyMessageMail = async (params: DutyDataParams) => {

    try {
      const res = await api.post(`/${controller}/addReadyMessageMail`, params);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  const updateReadyMessage = async (params: DutyDataParams) => {

    try {
      const res = await api.put(`/${controller}/updateReadyMessage`, params);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  const updateReadyMessageMail = async (params: DutyDataParams) => {

    try {
      const res = await api.put(`/${controller}/updateReadyMessageMail`, params);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  return { getReadyMessages, addReadyMessage, addReadyMessageMail, updateReadyMessageMail, getReadyMessagesMail, updateReadyMessage };
}
