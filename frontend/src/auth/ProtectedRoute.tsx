import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loading } from '../components/Loading';
import { useAuth } from './useAuth';

/**
 * Guards protected routes. While the session is being restored a loader is
 * shown; unauthenticated users are redirected to /login (preserving the
 * attempted location so they can be returned after login).
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isInitialising } = useAuth();
  const location = useLocation();

  if (isInitialising) {
    return <Loading message="Restoring session…" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
