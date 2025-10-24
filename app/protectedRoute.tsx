import { useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { LoadingOverlay } from '@mantine/core';
import { useAuth } from './authContext';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isLoggedIn, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {

    if (["/memberCreate", "/privacyPolicy"].includes(location.pathname)) {
      // Sadece dişlink icin üye eklemek
      navigate(location.pathname)
      return;
    }

    if (!isLoggedIn) {
      // Sadece giriş yapmamış kullanıcıları login'e yönlendir
      if(["/userLogin", "/memberLogin"].includes(location.pathname)) {
      navigate(location.pathname)

        return;
      }
      navigate("loginSelection");

      return;
    }

    if (location.pathname === '/loginSelection') {
      navigate("/")

      return;
    }
      navigate("/")

      return;

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