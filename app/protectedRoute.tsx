import { useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { LoadingOverlay } from '@mantine/core';
import { useAuth } from './authContext';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isLoggedIn, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {

    if (location.pathname == "/memberCreate") {
      // Sadece dişlink icin üye eklemek
      navigate("memberCreate");

      return;
    }

    if (!isLoggedIn) {
      // Sadece giriş yapmamış kullanıcıları login'e yönlendir
      navigate("login");

      return;
    }

    if (location.pathname === '/login') {
      navigate("/")

      return;
    }

  }, [isLoggedIn]);

  if (isLoggedIn) {
    return <>{children}</>;
  }

  if (loading) {
    return <LoadingOverlay
            visible={true}
            zIndex={1000}
            overlayProps={{ radius: 'sm', blur: 2 }}
            loaderProps={{ color: 'pink', type: 'bars' }}
          />;
  }

  // Giriş yapmışsa children'ı render et
  return <>{children}</>;
}

export default ProtectedRoute;