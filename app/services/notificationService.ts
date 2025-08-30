import { createApi } from './api';
import { useAuth } from '~/authContext';

interface NotificationParams {
  message: string; // user aldıgında, getirdiginde, getirmediginde, neler aldıgını mesaj olarak al
  userFullName: string;
  userPhone: string;
  responsibleId: number;
}

export function useSmsService(controller: string) {
  const { getCurrentToken, logout } = useAuth();
  const api = createApi(getCurrentToken() ?? undefined, logout);

  const getNotifications = async (userId: number) => {

    try {
      const res = await api.get(`/${controller}/getNotifications`, {
        params: {userId},
      });

      return res.data.data;
    } catch (error: any) {
      return error.error;
    }
  };

  const addNotification = async (params: NotificationParams) => {

    try {
      const res = await api.post(`/${controller}/addNotification`, params);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  return { getNotifications, addNotification };
}
