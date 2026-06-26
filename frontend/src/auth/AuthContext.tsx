import {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { authApi } from '../api/auth.api';
import { TOKEN_STORAGE_KEY } from '../api/axios';
import { LoginCredentials, UserProfile } from '../types/auth';

interface AuthContextValue {
  user: UserProfile | null;
  isAuthenticated: boolean;
  /** True while restoring an existing session on app start. */
  isInitialising: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isInitialising, setIsInitialising] = useState(true);

  // On mount, if a token exists, validate it by fetching the profile.
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      setIsInitialising(false);
      return;
    }
    authApi
      .getProfile()
      .then((profile) => setUser(profile))
      .catch(() => {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setUser(null);
      })
      .finally(() => setIsInitialising(false));
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const response = await authApi.login(credentials);
    localStorage.setItem(TOKEN_STORAGE_KEY, response.accessToken);
    setUser(response.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isInitialising,
      login,
      logout,
    }),
    [user, isInitialising, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
