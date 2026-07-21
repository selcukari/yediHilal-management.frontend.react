// src/context/SignalRContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';

const SignalRContext = createContext(null);

export const SignalRProvider = ({ children }) => {
  const [connection, setConnection] = useState(null);

  useEffect(() => {
    // Backend'de Program.cs'e yazdığımız endpoint adresi
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${import.meta.env.VITE_APP_API}/notifications`) // Kendi API portunuzla değiştirin
      .withAutomaticReconnect() // Bağlantı koparsa otomatik yeniden bağlanmayı sağlar
      .configureLogging(signalR.LogLevel.Information)
      .build();

    setConnection(newConnection);
  }, []);

  useEffect(() => {
     console.log('SignalR Bağlantısı Başladı');

    if (connection) {
      connection?
        .start()
        .then(() => console.log('SignalR Bağlantısı Başarılı! ✅'))
        .catch((error) => console.error('SignalR Bağlantı Hatası: ❌', error));

      // Bileşen silindiğinde bağlantıyı temizle
      return () => {
        connection.stop();
      };
    }
  }, [connection]);

  return (
    <SignalRContext.Provider value={connection}>
      {children}
    </SignalRContext.Provider>
  );
};

// Kolay kullanım için custom hook
export const useSignalR = () => useContext(SignalRContext);