import { useEffect } from 'react';
import appConfig from '../config/appConfig';
import { authService } from '../services/authService';
import useAuthStore from '../store/authStore';

const MOCK_USERS = [
  {
    id: '1',
    email: 'admin@neurocalm.com',
    password: 'admin123',
    full_name: 'Dr. Sarah Admin',
    role: 'admin',
    is_active: true,
    created_at: '2025-06-15T10:00:00Z',
    auth_provider: 'local',
  },
  {
    id: '2',
    email: 'user@neurocalm.com',
    password: 'user123',
    full_name: 'John Doe',
    role: 'user',
    is_active: true,
    created_at: '2025-09-20T14:30:00Z',
    auth_provider: 'local',
  },
];

const USER_STORAGE_KEY = 'neurocalm_user';

function readSavedUser() {
  const raw = localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function persistUser(user, setUser, providerOverride = null) {
  const savedUser = readSavedUser();
  const enrichedUser = {
    ...user,
    auth_provider: providerOverride || user?.auth_provider || savedUser?.auth_provider || 'local',
  };

  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(enrichedUser));
  setUser(enrichedUser);
}

export function useAuth() {
  const { user, isAuthenticated, isLoading, setUser, logout, setLoading } = useAuthStore();

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      if (appConfig.useMockDataEnabled) {
        const savedUser = readSavedUser();
        if (!savedUser) {
          if (!cancelled) {
            setLoading(false);
          }
          return;
        }

        try {
          if (!cancelled) {
            setUser(savedUser);
          }
        } catch {
          if (!cancelled) {
            logout();
          }
        }
        return;
      }

      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        localStorage.removeItem(USER_STORAGE_KEY);
        if (!cancelled) {
          setLoading(false);
        }
        return;
      }

      try {
        const me = await authService.getMe();
        if (!cancelled) {
          persistUser(me, setUser);
        }
      } catch {
        if (!cancelled) {
          logout();
        }
      }
    }

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email, password) => {
    if (appConfig.useMockDataEnabled) {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const found = MOCK_USERS.find(
        (candidate) => candidate.email === email && candidate.password === password,
      );

      if (!found) {
        throw { response: { data: { detail: 'Invalid email or password.' } } };
      }

      const { password: _password, ...userData } = found;
      localStorage.setItem('access_token', `mock-token-${found.id}`);
      persistUser(userData, setUser, 'local');
      return userData;
    }

    const tokens = await authService.login(email, password);
    localStorage.setItem('access_token', tokens.access_token);
    localStorage.setItem('refresh_token', tokens.refresh_token);

    const me = await authService.getMe();
    persistUser(me, setUser, 'local');
    return me;
  };

  const register = async (formData) => {
    if (appConfig.useMockDataEnabled) {
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (MOCK_USERS.find((candidate) => candidate.email === formData.email)) {
        throw { response: { data: { detail: 'Email already registered.' } } };
      }

      const newUser = {
        id: String(Date.now()),
        email: formData.email,
        full_name: formData.full_name,
        role: 'user',
        is_active: true,
        created_at: new Date().toISOString(),
        auth_provider: 'local',
      };

      localStorage.setItem('access_token', `mock-token-${newUser.id}`);
      persistUser(newUser, setUser, 'local');
      return newUser;
    }

    await authService.register(formData);
    return login(formData.email, formData.password);
  };

  const handleLogout = () => {
    logout();
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout: handleLogout,
  };
}
