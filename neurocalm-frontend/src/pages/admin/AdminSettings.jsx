import { motion } from 'framer-motion';
import { Save, Shield, Globe, Database } from 'lucide-react';
import { useEffect, useState } from 'react';
import AdminSidebar from '../../components/layout/AdminSidebar';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import useAuthStore from '../../store/authStore';
import useSidebarStore from '../../store/sidebarStore';
import { useAdmin } from '../../hooks/useAdmin';

const container = { animate: { transition: { staggerChildren: 0.08 } } };
const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

function Toggle({ enabled, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={`relative w-11 h-6 rounded-full transition-colors ${
        enabled ? 'bg-accent-blue' : 'bg-bg-glass border border-border-color'
      }`}
    >
      <span
        className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-5' : ''
        }`}
      />
    </button>
  );
}

export default function AdminSettings() {
  const { user } = useAuthStore();
  const isSidebarCollapsed = useSidebarStore((state) => state.isCollapsed);
  const { settings, fetchSettings, saveSettings, error } = useAdmin();
  const [saved, setSaved] = useState(false);
  const [formState, setFormState] = useState({
    maintenance_mode: false,
    allow_registration: true,
    max_upload_size_mb: 50,
    rate_limit_per_minute: 60,
    storage_backend: 'local',
    auto_delete_days: 90,
  });

  useEffect(() => {
    fetchSettings().catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    if (settings) {
      setFormState(settings);
    }
  }, [settings]);

  const handleSave = async () => {
    await saveSettings({
      maintenance_mode: formState.maintenance_mode,
      allow_registration: formState.allow_registration,
      max_upload_size_mb: Number(formState.max_upload_size_mb),
      rate_limit_per_minute: Number(formState.rate_limit_per_minute),
      storage_backend: formState.storage_backend,
      auto_delete_days: Number(formState.auto_delete_days),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateSetting = (key, value) => {
    setFormState((current) => ({ ...current, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      <AdminSidebar />

      <main className={`px-4 py-6 pb-28 sm:px-6 md:p-8 md:pb-8 transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-[92px]' : 'md:ml-[260px]'}`}>
        <motion.div variants={container} initial="initial" animate="animate" className="space-y-6">
          <motion.div variants={fadeUp} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold text-text-primary">Settings</h1>
              <p className="text-sm text-text-secondary mt-1">
                Backend system configuration and limits
              </p>
            </div>
            <Button size="sm" onClick={handleSave} variant={saved ? 'success' : 'primary'}>
              {saved ? 'Saved!' : (
                <>
                  <Save size={16} className="mr-2 inline" />
                  Save Changes
                </>
              )}
            </Button>
          </motion.div>

          {error && (
            <motion.p variants={fadeUp} className="text-sm text-accent-red">
              {error}
            </motion.p>
          )}

          <motion.div variants={fadeUp}>
            <Card hover={false}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-accent-blue/10 flex items-center justify-center">
                  <Globe size={18} className="text-accent-blue" />
                </div>
                <h3 className="text-lg font-semibold font-display text-text-primary">General</h3>
              </div>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="block text-sm text-text-secondary mb-2">Storage Backend</label>
                  <input
                    value={formState.storage_backend}
                    onChange={(e) => updateSetting('storage_backend', e.target.value)}
                    className="w-full px-4 py-2.5 bg-bg-primary border border-border-color rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-2">Max Upload Size (MB)</label>
                  <input
                    type="number"
                    value={formState.max_upload_size_mb}
                    onChange={(e) => updateSetting('max_upload_size_mb', e.target.value)}
                    className="w-full px-4 py-2.5 bg-bg-primary border border-border-color rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-blue"
                  />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Card hover={false}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-accent-purple/10 flex items-center justify-center">
                  <Shield size={18} className="text-accent-purple" />
                </div>
                <h3 className="text-lg font-semibold font-display text-text-primary">Security & Access</h3>
              </div>
              <div className="space-y-4">
                {[
                  { key: 'allow_registration', label: 'Allow Registration', desc: 'Permit new users to create accounts' },
                  { key: 'maintenance_mode', label: 'Maintenance Mode', desc: 'Restrict the app for admin-only maintenance work' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between gap-4 py-3 border-b border-border-color/50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{item.label}</p>
                      <p className="text-xs text-text-muted mt-0.5">{item.desc}</p>
                    </div>
                    <Toggle
                      enabled={!!formState[item.key]}
                      onToggle={() => updateSetting(item.key, !formState[item.key])}
                    />
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Card hover={false}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-accent-green/10 flex items-center justify-center">
                  <Database size={18} className="text-accent-green" />
                </div>
                <h3 className="text-lg font-semibold font-display text-text-primary">Rate Limits & Retention</h3>
              </div>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="block text-sm text-text-secondary mb-2">Rate Limit Per Minute</label>
                  <input
                    type="number"
                    value={formState.rate_limit_per_minute}
                    onChange={(e) => updateSetting('rate_limit_per_minute', e.target.value)}
                    className="w-full px-4 py-2.5 bg-bg-primary border border-border-color rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-2">Auto Delete After (days)</label>
                  <input
                    type="number"
                    value={formState.auto_delete_days}
                    onChange={(e) => updateSetting('auto_delete_days', e.target.value)}
                    className="w-full px-4 py-2.5 bg-bg-primary border border-border-color rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-blue"
                  />
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
