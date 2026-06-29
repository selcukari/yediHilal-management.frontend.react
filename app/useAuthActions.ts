import { useNavigate } from 'react-router';
import { useAuthStore } from './authContext';

export const useAuthActions = () => {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = (redirectTo: string = '/loginSelection') => {
    logout(() => {
      navigate(redirectTo);
    });
  };

  // İleride buraya handleRefresh ve benzeri auth fonksiyonları da eklenebilir
  return {
    handleLogout,
  };
};