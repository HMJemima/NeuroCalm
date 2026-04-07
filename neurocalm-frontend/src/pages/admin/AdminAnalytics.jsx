import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AdminSidebar from '../../components/layout/AdminSidebar';
import Card from '../../components/common/Card';
import useAuthStore from '../../store/authStore';
import useSidebarStore from '../../store/sidebarStore';
import { useAdmin } from '../../hooks/useAdmin';

export default function AdminAnalytics() {
  const { user } = useAuthStore();
  const isSidebarCollapsed = useSidebarStore((state) => state.isCollapsed);
  const { analytics, fetchAnalytics, error } = useAdmin();

  useEffect(() => {
    fetchAnalytics().catch(() => {});
  }, [user?.id]);

  const distribution = analytics?.distribution || [];

  return (
    <div className="min-h-screen bg-bg-primary">
      <AdminSidebar />

      <main className={`px-4 py-6 pb-28 sm:px-6 md:p-8 md:pb-8 transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-[92px]' : 'md:ml-[260px]'}`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div>
            <h1 className="text-2xl font-display font-bold text-text-primary">Analytics</h1>
            <p className="text-sm text-text-secondary mt-1">
              Platform usage and analysis metrics
            </p>
          </div>

          {error && (
            <p className="text-sm text-accent-red">{error}</p>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card hover={false}>
              <p className="text-xs text-text-muted mb-1">This Week</p>
              <p className="text-2xl font-display font-bold text-text-primary">{analytics?.total_this_week ?? 0}</p>
            </Card>
            <Card hover={false}>
              <p className="text-xs text-text-muted mb-1">This Month</p>
              <p className="text-2xl font-display font-bold text-text-primary">{analytics?.total_this_month ?? 0}</p>
            </Card>
            <Card hover={false}>
              <p className="text-xs text-text-muted mb-1">Avg Stress Score</p>
              <p className="text-2xl font-display font-bold text-text-primary">{analytics?.avg_stress_score ?? 0}</p>
            </Card>
          </div>

          <Card hover={false}>
            <h3 className="text-lg font-semibold font-display text-text-primary mb-6">
              Weekly Analysis Volume
            </h3>
            <div className="h-72 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics?.daily || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: '#111827',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '12px',
                      color: '#f9fafb',
                    }}
                  />
                  <Bar dataKey="analyses" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card hover={false}>
            <h3 className="text-lg font-semibold font-display text-text-primary mb-4">
              Stress Score Distribution
            </h3>
            <div className="space-y-3">
              {distribution.map((item) => (
                <div key={item.range} className="flex items-center gap-3 sm:gap-4">
                  <span className="w-20 text-sm text-text-secondary">{item.range}</span>
                  <div className="flex-1 h-2 bg-bg-glass rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-accent-blue to-accent-purple rounded-full"
                      style={{ width: `${Math.min(item.count * 5, 100)}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-sm text-text-primary">{item.count}</span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
