import axios from 'axios';
interface MessageOpenApiParams {
  message: string;
  context?: string | null;
}

interface ChatStreamParams {
  session_id: string;
  query: string;
}

export function useOpenApiService() {
  const baseUrl = import.meta.env.VITE_APP_OPENAPI;
  const defaultUser = import.meta.env.VITE_APP_OPENAPI_USER;

  /**
   * Standart POST istekleri için (Oturum oluşturma, Geçmiş çekme vb.)
   */
  const sendMessageOpenApi = async (endpoint: string, params: any) => {
    try {
     
      const res = await axios.post(`${baseUrl}/${endpoint}`, params);
      return res.data;
    } catch (error: any) {
      console.error("API Hatası:", error);
      throw error;
    }
  };

  /**
   * Streaming (Akış) Chat isteği için
   * @param params { session_id, query }
   * @param onChunk Gelen her metin parçası için çalışacak callback
   * @param signal İstek iptali (AbortController) için
   */
  const streamChat = async (
    params: ChatStreamParams,
    onChunk: (chunk: string) => void,
    signal?: AbortSignal
  ) => {
    try {
      const response = await fetch(`${baseUrl}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
        signal: signal
      });

      if (!response.ok) {
        throw new Error(`HTTP Hata! Durum: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("Yanıt gövdesi (body) okunamıyor.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        onChunk(chunk); // Gelen her parçayı React bileşenine ilet
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log("İstek kullanıcı tarafından durduruldu.");
      } else {
        console.error("Stream Hatası:", error);
        throw error;
      }
    }
  };

  /**
   * Yeni bir sohbet oturumu oluşturur
   */
  const createSession = async (userId: string = defaultUser, title: string = "Yeni Sohbet") => {
    return await sendMessageOpenApi("sessions/create", { user_id: userId, title });
  };

  return { 
    sendMessageOpenApi, 
    streamChat, 
    createSession, 
  };
}