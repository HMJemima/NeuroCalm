import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Users, FileText, Cpu, BarChart3, UserPlus, Download, RefreshCw, Shield,
} from 'lucide-react';
import { useEffect } from 'react';
import AdminSidebar from '../../components/layout/AdminSidebar';
import Card from '../../components/common/Card';
import StatsCard from '../../components/dashboard/StatsCard';
import UploadZone from '../../components/dashboard/UploadZone';
import AnalysisResult from '../../components/dashboard/AnalysisResult';
import BandPowerChart from '../../components/dashboard/BandPowerChart';
import UsersTable from '../../components/admin/UsersTable';
import SystemStats from '../../components/admin/SystemStats';
import ActivityFeed from '../../components/admin/ActivityFeed';
import ModelInfo from '../../components/admin/ModelInfo';
import useAuthStore from '../../store/authStore';
import useSidebarStore from '../../store/sidebarStore';
import { useAdmin } from '../../hooks/useAdmin';
import { useAnalysis } from '../../hooks/useAnalysis';

const quickActions = [
  { icon: UserPlus, label: 'Add User', color: 'bg-accent-blue/10 text-accent-blue' },
  { icon: Download, label: 'Export Data', color: 'bg-accent-green/10 text-accent-green' },
  { icon: RefreshCw, label: 'Update Model', color: 'bg-accent-purple/10 text-accent-purple' },
  { icon: Shield, label: 'Security', color: 'bg-accent-yellow/10 text-accent-yellow' },
];

const container = { animate: { transition: { staggerChildren: 0.08 } } };
const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const isSidebarCollapsed = useSidebarStore((state) => state.isCollapsed);
  const { stats, users, modelInfo, serverStatus, deleteUser, fetchServerStatus, error } = useAdmin();
  const {
    currentAnalysis,
    isAnalyzing,
    uploadProgress,
    uploadAndAnalyze,
    clearAnalysis,
  } = useAnalysis();
  const navigate = useNavigate();

  const openAddUserFlow = () => {
    navigate('/admin/users?create=1');
  };

  useEffect(() => {
    fetchServerStatus().catch(() => {});
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-bg-primary">
      <AdminSidebar />

      {/* Main Content */}
      <main className={`px-4 py-6 pb-28 sm:px-6 md:p-8 md:pb-8 transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-[92px]' : 'md:ml-[260px]'}`}>
        <motion.div variants={container} initial="initial" animate="animate" className="space-y-8">
          {/* Header */}
          <motion.div variants={fadeUp}>
            <h1 className="text-2xl font-display font-bold text-text-primary">Admin Dashboard</h1>
            <p className="text-sm text-text-secondary mt-1">
              System overview and management tools
            </p>
          </motion.div>

          {error && (
            <motion.p variants={fadeUp} className="text-sm text-accent-red">
              {error}
            </motion.p>
          )}

          {/* Stats Grid */}
          <motion.div variants={fadeUp} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatsCard
              icon={Users}
              label="Total Users"
              value={stats?.total_users ?? '1,248'}
              change="+12%"
              iconBg="bg-accent-blue/10"
              iconColor="text-accent-blue"
            />
            <StatsCard
              icon={FileText}
              label="Total Analyses"
              value={stats?.total_analyses ?? '8,439'}
              change="+23%"
              iconBg="bg-accent-green/10"
              iconColor="text-accent-green"
            />
            <StatsCard
              icon={Cpu}
              label="Avg Processing"
              value={stats?.avg_processing_time ?? '12.4s'}
              change="-8%"
              iconBg="bg-accent-purple/10"
              iconColor="text-accent-purple"
            />
            <StatsCard
              icon={BarChart3}
              label="Model Accuracy"
              value={stats?.model_accuracy ?? '95.3%'}
              change="+2%"
              iconBg="bg-accent-cyan/10"
              iconColor="text-accent-cyan"
            />
          </motion.div>

          {/* Main Grid */}
          <motion.div variants={fadeUp} className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_400px]">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Upload Zone */}
              <Card hover={false}>
                <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-lg font-semibold font-display text-text-primary">
                    Quick Analysis
                  </h3>
                  {currentAnalysis && (
                    <button
                      onClick={clearAnalysis}
                      className="text-sm text-accent-blue hover:underline"
                    >
                      New Upload
                    </button>
                  )}
                </div>
                <UploadZone
                  onAnalyze={uploadAndAnalyze}
                  isAnalyzing={isAnalyzing}
                  uploadProgress={uploadProgress}
                  resultId={currentAnalysis?.id}
                />
              </Card>

              {/* Analysis Result (shown after upload) */}
              {currentAnalysis && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-1 gap-4 xl:grid-cols-2"
                >
                  <Card hover={false}>
                    <h3 className="text-sm font-semibold font-display text-text-primary mb-4">
                      Stress Detection
                    </h3>
                    <AnalysisResult result={currentAnalysis} />
                  </Card>
                  <Card hover={false}>
                    <h3 className="text-sm font-semibold font-display text-text-primary mb-4">
                      Band Power
                    </h3>
                    <BandPowerChart bandPowers={currentAnalysis.band_powers} />
                  </Card>
                </motion.div>
              )}

              <Card hover={false}>
                <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-lg font-semibold font-display text-text-primary">Users</h3>
                  <button
                    type="button"
                    onClick={openAddUserFlow}
                    className="text-sm text-accent-blue hover:underline flex items-center gap-1"
                  >
                    <UserPlus size={14} />
                    Add User
                  </button>
                </div>
                <UsersTable users={users} onDelete={deleteUser} />
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <Card hover={false}>
                <h3 className="text-lg font-semibold font-display text-text-primary mb-4">
                  Activity Feed
                </h3>
                <ActivityFeed activities={serverStatus?.logs} />
              </Card>

              <Card hover={false}>
                <h3 className="text-lg font-semibold font-display text-text-primary mb-4">
                  System Status
                </h3>
                <SystemStats stats={serverStatus?.resources} />
              </Card>

              <Card hover={false}>
                <h3 className="text-lg font-semibold font-display text-text-primary mb-4">
                  ML Model Info
                </h3>
                <ModelInfo info={modelInfo} />
              </Card>

              <Card hover={false}>
                <h3 className="text-lg font-semibold font-display text-text-primary mb-4">
                  Quick Actions
                </h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
                  {quickActions.map((action) => (
                    <button
                      key={action.label}
                      type="button"
                      onClick={action.label === 'Add User' ? openAddUserFlow : undefined}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border border-border-color hover:border-accent-blue/30 transition-all`}
                    >
                      <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center`}>
                        <action.icon size={18} />
                      </div>
                      <span className="text-xs font-medium text-text-secondary">{action.label}</span>
                    </button>
                  ))}
                </div>
              </Card>
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
