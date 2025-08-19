import { useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { LoadingOverlay } from '@mantine/core';
import { useAuth } from './authContext';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isLoggedIn, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
    } else {
      navigate("/")
    }
  }, [isLoggedIn, navigate]);

  if (loading) {
    return <LoadingOverlay
            visible={true}
            zIndex={1000}
            overlayProps={{ radius: 'sm', blur: 2 }}
            loaderProps={{ color: 'pink', type: 'bars' }}
          />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;