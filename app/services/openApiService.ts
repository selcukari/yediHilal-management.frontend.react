import { createApi } from './api';
import { useAuth } from '~/authContext';

interface MessageOpenApiParams {
  message: string;
  context?: string | null;
}

export function useOpenApiService(controller: string) {
  const { getCurrentToken, logout } = useAuth();
  const api = createApi(getCurrentToken() ?? undefined, logout);

  const sendMessageOpenApi = async (params: MessageOpenApiParams) => {

    try {
      const res = await api.post(`/${controller}/sendMessageOpenApi`, params);

      return res.data.data;
    } catch (error: any) {
      return error;
    }
  };

  return { sendMessageOpenApi };
}
