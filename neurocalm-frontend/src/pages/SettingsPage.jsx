import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Bell, Shield, Save } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Avatar from '../components/common/Avatar';
import appConfig from '../config/appConfig';
import { authService } from '../services/authService';
import useAuthStore from '../store/authStore';
import useSidebarStore from '../store/sidebarStore';
import useToastStore from '../store/toastStore';

const DEFAULT_NOTIFICATIONS = {
  email_notifications: true,
  analysis_complete: true,
  weekly_summary: true,
};

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const isSidebarCollapsed = useSidebarStore((state) => state.isCollapsed);
  const [activeTab, setActiveTab] = useState('profile');
  const showToast = useToastStore((state) => state.showToast);

  const [profileForm, setProfileForm] = useState({
    full_name: '',
    email: '',
  });
  const [profileError, setProfileError] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [securityError, setSecurityError] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [notificationPrefs, setNotificationPrefs] = useState(DEFAULT_NOTIFICATIONS);
  const [notificationsLoaded, setNotificationsLoaded] = useState(appConfig.useMockDataEnabled);
  const [notificationsError, setNotificationsError] = useState('');
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  const authProvider = user?.auth_provider || 'local';
  const providerLabel = {
    google: 'Google',
    github: 'GitHub',
    microsoft: 'Microsoft',
    social: 'your identity provider',
    local: 'Email',
  }[authProvider] || authProvider;

  useEffect(() => {
    setProfileForm({
      full_name: user?.full_name || '',
      email: user?.email || '',
    });
  }, [user?.full_name, user?.email]);

  useEffect(() => {
    let cancelled = false;

    async function loadNotifications() {
      if (activeTab !== 'notifications' || notificationsLoaded) {
        return;
      }

      if (appConfig.useMockDataEnabled) {
        setNotificationsLoaded(true);
        return;
      }

      try {
        setNotificationsError('');
        const prefs = await authService.getNotificationPreferences();
        if (!cancelled) {
          setNotificationPrefs({
            email_notifications: !!prefs.email_notifications,
            analysis_complete: !!prefs.analysis_complete,
            weekly_summary: !!prefs.weekly_summary,
          });
          setNotificationsLoaded(true);
        }
      } catch (err) {
        if (!cancelled) {
          setNotificationsError(err?.response?.data?.detail || 'Failed to load notification preferences.');
        }
      }
    }

    loadNotifications();
    return () => {
      cancelled = true;
    };
  }, [activeTab, notificationsLoaded]);

  const updateSecurityField = (field, value) => {
    setSecurityError('');
    setSecurityForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateProfileField = (field, value) => {
    setProfileError('');
    setProfileForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateNotificationField = (field, value) => {
    setNotificationsError('');
    setNotificationPrefs((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleProfileSave = async () => {
    setProfileError('');

    if (!profileForm.full_name.trim() || !profileForm.email.trim()) {
      setProfileError('Full name and email are required.');
      return;
    }

    if (appConfig.useMockDataEnabled) {
      const updatedUser = {
        ...user,
        full_name: profileForm.full_name.trim(),
        email: profileForm.email.trim(),
      };
      localStorage.setItem('neurocalm_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      showToast({
        title: 'Profile updated',
        message: 'Your profile changes were saved in mock mode.',
      });
      return;
    }

    try {
      setIsSavingProfile(true);
      const updatedUser = await authService.updateMe({
        full_name: profileForm.full_name.trim(),
        email: profileForm.email.trim(),
      });
      localStorage.setItem('neurocalm_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      showToast({
        title: 'Profile updated',
        message: 'Your profile changes were saved successfully.',
      });
    } catch (err) {
      const message = err?.response?.data?.detail || 'Failed to save profile changes.';
      setProfileError(message);
      showToast({
        title: 'Profile update failed',
        message,
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordUpdate = async () => {
    setSecurityError('');

    if (!securityForm.currentPassword || !securityForm.newPassword || !securityForm.confirmPassword) {
      setSecurityError('Please fill in all password fields.');
      return;
    }

    if (securityForm.newPassword.length < 6) {
      setSecurityError('New password must be at least 6 characters.');
      return;
    }

    if (securityForm.newPassword !== securityForm.confirmPassword) {
      setSecurityError("New passwords don't match.");
      return;
    }

    if (appConfig.useMockDataEnabled) {
      showToast({
        title: 'Mock mode limitation',
        message: 'Password updates are disabled in mock mode. Switch to live backend mode to test this flow.',
      });
      return;
    }

    try {
      setIsUpdatingPassword(true);
      await authService.changePassword({
        current_password: securityForm.currentPassword,
        new_password: securityForm.newPassword,
      });

      setSecurityForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      showToast({
        title: 'Password updated',
        message: 'Your password has been changed successfully.',
      });
    } catch (err) {
      const message = err?.response?.data?.detail || 'Failed to update password. Please try again.';
      setSecurityError(message);
      showToast({
        title: 'Password update failed',
        message,
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleNotificationSave = async () => {
    setNotificationsError('');

    if (appConfig.useMockDataEnabled) {
      showToast({
        title: 'Preferences saved',
        message: 'Notification settings were saved in mock mode.',
      });
      return;
    }

    try {
      setIsSavingNotifications(true);
      const saved = await authService.updateNotificationPreferences(notificationPrefs);
      setNotificationPrefs({
        email_notifications: !!saved.email_notifications,
        analysis_complete: !!saved.analysis_complete,
        weekly_summary: !!saved.weekly_summary,
      });
      showToast({
        title: 'Preferences saved',
        message: 'Your notification settings were updated successfully.',
      });
    } catch (err) {
      const message = err?.response?.data?.detail || 'Failed to save notification preferences.';
      setNotificationsError(message);
      showToast({
        title: 'Preferences update failed',
        message,
      });
    } finally {
      setIsSavingNotifications(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      <Sidebar />

      <main className={`px-4 py-6 pb-28 sm:px-6 md:p-8 md:pb-8 transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-[92px]' : 'md:ml-[260px]'}`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div>
            <h1 className="text-2xl font-display font-bold text-text-primary">Settings</h1>
            <p className="text-sm text-text-secondary mt-1">Manage your account preferences</p>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${activeTab === tab.id
                    ? 'bg-accent-blue/10 text-accent-blue'
                    : 'text-text-secondary hover:bg-bg-glass hover:text-text-primary'
                  }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'profile' && (
            <Card hover={false} className="max-w-2xl">
              <div className="flex flex-col gap-4 mb-8 sm:flex-row sm:items-center">
                <Avatar name={user?.full_name || 'User'} size={64} className="rounded-2xl" />
                <div>
                  <h3 className="text-lg font-semibold text-text-primary">
                    {user?.full_name || 'User'}
                  </h3>
                  <p className="text-sm text-text-secondary">{user?.email || 'user@example.com'}</p>
                </div>
              </div>

              <div className="space-y-5">
                <Input
                  label="Full Name"
                  icon={User}
                  value={profileForm.full_name}
                  onChange={(e) => updateProfileField('full_name', e.target.value)}
                  placeholder="Your full name"
                />
                <Input
                  label="Email"
                  icon={Mail}
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => updateProfileField('email', e.target.value)}
                  placeholder="Your email"
                  error={profileError}
                />
                <Button onClick={handleProfileSave} disabled={isSavingProfile}>
                  <Save size={16} className="mr-2 inline" />
                  {isSavingProfile ? 'Saving Changes...' : 'Save Changes'}
                </Button>
              </div>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card hover={false} className="max-w-2xl">
              <h3 className="text-lg font-semibold font-display text-text-primary mb-6">
                Change Password
              </h3>
              {authProvider !== 'local' ? (
                <div className="rounded-2xl border border-accent-blue/20 bg-accent-blue/5 p-5">
                  <p className="text-sm font-medium text-text-primary">
                    Password managed by {providerLabel}
                  </p>
                  <p className="text-sm text-text-secondary mt-2 leading-6">
                    You signed in with {providerLabel}. Please manage your password through {providerLabel}.
                  </p>
                  <Button className="mt-5" variant="ghost" disabled>
                    Change Password Unavailable
                  </Button>
                </div>
              ) : (
                <div className="space-y-5">
                  <Input
                    label="Current Password"
                    icon={Lock}
                    type="password"
                    placeholder="Enter current password"
                    value={securityForm.currentPassword}
                    onChange={(e) => updateSecurityField('currentPassword', e.target.value)}
                  />
                  <Input
                    label="New Password"
                    icon={Lock}
                    type="password"
                    placeholder="Enter new password"
                    value={securityForm.newPassword}
                    onChange={(e) => updateSecurityField('newPassword', e.target.value)}
                  />
                  <Input
                    label="Confirm New Password"
                    icon={Lock}
                    type="password"
                    placeholder="Confirm new password"
                    value={securityForm.confirmPassword}
                    onChange={(e) => updateSecurityField('confirmPassword', e.target.value)}
                    error={securityError}
                  />
                  <Button onClick={handlePasswordUpdate} disabled={isUpdatingPassword}>
                    {isUpdatingPassword ? 'Updating Password...' : 'Update Password'}
                  </Button>
                </div>
              )}
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card hover={false} className="max-w-2xl">
              <h3 className="text-lg font-semibold font-display text-text-primary mb-6">
                Notification Preferences
              </h3>
              {notificationsError && (
                <p className="mb-4 text-sm text-accent-red">{notificationsError}</p>
              )}
              <div className="space-y-4">
                {[
                  {
                    key: 'email_notifications',
                    label: 'Email notifications',
                    desc: 'Receive analysis results via email',
                  },
                  {
                    key: 'analysis_complete',
                    label: 'Analysis complete',
                    desc: 'Get notified when analysis is done',
                  },
                  {
                    key: 'weekly_summary',
                    label: 'Weekly summary',
                    desc: 'Weekly overview of your stress patterns',
                  },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between gap-4 py-3 border-b border-border-color/50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{item.label}</p>
                      <p className="text-xs text-text-muted mt-0.5">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!notificationPrefs[item.key]}
                        onChange={(e) => updateNotificationField(item.key, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-6 bg-bg-glass rounded-full peer peer-checked:bg-accent-blue transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4" />
                    </label>
                  </div>
                ))}
              </div>
              <Button className="mt-6" onClick={handleNotificationSave} disabled={isSavingNotifications}>
                {isSavingNotifications ? 'Saving Preferences...' : 'Save Preferences'}
              </Button>
            </Card>
          )}
        </motion.div>
      </main>
    </div>
  );
}
