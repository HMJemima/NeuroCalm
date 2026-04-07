import { motion } from 'framer-motion';
import { Server, CheckCircle } from 'lucide-react';
import { useEffect } from 'react';
import AdminSidebar from '../../components/layout/AdminSidebar';
import Card from '../../components/common/Card';
import useAuthStore from '../../store/authStore';
import useSidebarStore from '../../store/sidebarStore';
import { useAdmin } from '../../hooks/useAdmin';

const levelColors = {
  INFO: 'text-accent-blue',
  WARN: 'text-accent-yellow',
  ERROR: 'text-accent-red',
};

const container = { animate: { transition: { staggerChildren: 0.08 } } };
const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

export default function AdminServer() {
  const { user } = useAuthStore();
  const isSidebarCollapsed = useSidebarStore((state) => state.isCollapsed);
  const { serverStatus, fetchServerStatus, error } = useAdmin();

  useEffect(() => {
    fetchServerStatus().catch(() => {});
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-bg-primary">
      <AdminSidebar />

      <main className={`px-4 py-6 pb-28 sm:px-6 md:p-8 md:pb-8 transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-[92px]' : 'md:ml-[260px]'}`}>
        <motion.div variants={container} initial="initial" animate="animate" className="space-y-6">
          <motion.div variants={fadeUp}>
            <h1 className="text-2xl font-display font-bold text-text-primary">Server Status</h1>
            <p className="text-sm text-text-secondary mt-1">
              Infrastructure monitoring and system health
            </p>
          </motion.div>

          {error && (
            <motion.p variants={fadeUp} className="text-sm text-accent-red">
              {error}
            </motion.p>
          )}

          <motion.div variants={fadeUp} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {(serverStatus?.resources || []).map((resource) => (
              <Card key={resource.label} hover={false}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-accent-blue/10 text-accent-blue flex items-center justify-center">
                    <Server size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">{resource.label}</p>
                    <p className="text-sm font-semibold text-text-primary">{resource.value}</p>
                  </div>
                </div>
                <div className="h-2 bg-bg-glass rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      resource.bar > 80 ? 'bg-accent-red' : resource.bar > 60 ? 'bg-accent-yellow' : 'bg-accent-blue'
                    }`}
                    style={{ width: `${resource.bar}%` }}
                  />
                </div>
              </Card>
            ))}
          </motion.div>

          <motion.div variants={fadeUp}>
            <Card hover={false}>
              <h3 className="text-lg font-semibold font-display text-text-primary mb-4">
                Services
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead>
                    <tr className="border-b border-border-color">
                      <th className="text-left py-3 px-4 text-xs font-medium text-text-muted uppercase tracking-wider">Service</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-text-muted uppercase tracking-wider">Status</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-text-muted uppercase tracking-wider">Uptime</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-text-muted uppercase tracking-wider">Port</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(serverStatus?.services || []).map((service) => (
                      <tr key={service.name} className="border-b border-border-color/50 hover:bg-bg-glass/50 transition-colors">
                        <td className="py-3 px-4 text-sm text-text-primary">{service.name}</td>
                        <td className="py-3 px-4">
                          <span className={`flex items-center gap-1.5 text-xs font-medium ${service.status === 'running' ? 'text-accent-green' : 'text-accent-red'}`}>
                            <CheckCircle size={12} />
                            {service.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-text-secondary">{service.uptime}</td>
                        <td className="py-3 px-4 text-sm text-text-muted font-mono">{service.port}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Card hover={false}>
              <h3 className="text-lg font-semibold font-display text-text-primary mb-4">
                Recent Logs
              </h3>
              <div className="space-y-2 font-mono text-xs">
                {(serverStatus?.logs || []).map((log, index) => (
                  <div key={`${log.time}-${index}`} className="flex min-w-0 flex-col gap-1 px-3 py-2 rounded-lg bg-bg-primary/50 sm:flex-row sm:gap-4">
                    <span className="text-text-muted flex-shrink-0">{log.time}</span>
                    <span className={`flex-shrink-0 w-12 ${levelColors[log.level] || 'text-text-muted'}`}>{log.level}</span>
                    <span className="break-words text-text-secondary">{log.message}</span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
