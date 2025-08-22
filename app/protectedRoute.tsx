import { useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { LoadingOverlay } from '@mantine/core';
import { useAuth } from './authContext';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isLoggedIn, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
      console.log('User component 4');

    console.log("sdfdf:", location.pathname)
    if (!loading && !isLoggedIn) {
      // Sadece giriş yapmamış kullanıcıları login'e yönlendir
      navigate("/login", { 
        replace: true,
        state: { from: location.pathname }
      });
    }
      console.log('User component 3');

    if (location.pathname === '/login') setTimeout(() => {navigate("/")}, 1500);

  }, [isLoggedIn, loading, navigate, location]);

  if (loading) {
    return <LoadingOverlay
            visible={true}
            zIndex={1000}
            overlayProps={{ radius: 'sm', blur: 2 }}
            loaderProps={{ color: 'pink', type: 'bars' }}
          />;
  }

      console.log('User component 5');

  // Giriş yapmışsa children'ı render et
  return <>{children}</>;
}

export default ProtectedRoute;