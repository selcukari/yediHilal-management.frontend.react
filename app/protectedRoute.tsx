import { useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { useAuth } from './authContext';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isLoggedIn, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
    }
  }, [isLoggedIn, navigate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
}

export default ProtectedRoute;