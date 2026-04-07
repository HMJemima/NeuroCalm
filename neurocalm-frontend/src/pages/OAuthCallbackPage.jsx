import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { authService } from '../services/authService';
import useAuthStore from '../store/authStore';
import useToastStore from '../store/toastStore';

function readOAuthParams() {
  const hash = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash;

  const combined = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(hash);

  hashParams.forEach((value, key) => {
    combined.set(key, value);
  });

  return combined;
}

export default function OAuthCallbackPage() {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);
  const showToast = useToastStore((state) => state.showToast);

  useEffect(() => {
    let cancelled = false;

    async function restoreAuthenticatedUser() {
      const pendingProvider = localStorage.getItem('neurocalm_pending_oauth_provider');
      const me = await authService.getMe();
      if (cancelled) {
        return;
      }

      const enrichedUser = {
        ...me,
        auth_provider: me.auth_provider || pendingProvider || 'social',
      };

      localStorage.setItem('neurocalm_user', JSON.stringify(enrichedUser));
      localStorage.removeItem('neurocalm_pending_oauth_provider');
      setUser(enrichedUser);
      window.history.replaceState({}, document.title, window.location.pathname);
      navigate(enrichedUser.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    }

    async function finalizeOAuth() {
      const params = readOAuthParams();
      const error = params.get('error');
      if (error) {
        localStorage.removeItem('neurocalm_pending_oauth_provider');
        window.history.replaceState({}, document.title, window.location.pathname);
        showToast({
          title: 'Social sign-in failed',
          message: error,
        });
        navigate('/login', { replace: true });
        return;
      }

      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (!accessToken || !refreshToken) {
        const existingAccessToken = localStorage.getItem('access_token');
        const existingRefreshToken = localStorage.getItem('refresh_token');

        if (existingAccessToken && existingRefreshToken) {
          try {
            await restoreAuthenticatedUser();
            return;
          } catch {
            if (cancelled) {
              return;
            }
          }
        }

        showToast({
          title: 'Social sign-in failed',
          message: 'The login response was incomplete. Please try again.',
        });
        localStorage.removeItem('neurocalm_pending_oauth_provider');
        navigate('/login', { replace: true });
        return;
      }

      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);

      try {
        await restoreAuthenticatedUser();
      } catch {
        if (cancelled) {
          return;
        }

        logout();
        localStorage.removeItem('neurocalm_pending_oauth_provider');
        showToast({
          title: 'Social sign-in failed',
          message: 'We could not load your account after login. Please try again.',
        });
        navigate('/login', { replace: true });
      }
    }

    finalizeOAuth();
    return () => {
      cancelled = true;
    };
  }, [logout, navigate, setUser, showToast]);

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size={42} />
        <p className="text-sm text-text-secondary">Finishing your sign-in...</p>
      </div>
    </div>
  );
}
