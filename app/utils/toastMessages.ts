import { notifications } from '@mantine/notifications';

export const toast = {
  success: (message: string, title: string = 'Başarılı!') => {
    notifications.show({
      title,
      message,
      color: 'green',
    });
  },

  error: (message: string, title: string = 'Hata!') => {
    notifications.show({
      title,
      message,
      color: 'red',
    });
  },

  warning: (message: string, title: string = 'Uyarı!') => {
    notifications.show({
      title,
      message,
      color: 'yellow',
    });
  },

  info: (message: string, title: string = 'Bilgi') => {
    notifications.show({
      title,
      message,
      color: 'blue',
    });
  },
};