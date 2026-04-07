import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, FileText, Clock, TrendingUp, Search, Bell, Download } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Modal from '../components/common/Modal';
import Card from '../components/common/Card';
import StatsCard from '../components/dashboard/StatsCard';
import UploadZone from '../components/dashboard/UploadZone';
import AnalysisResult from '../components/dashboard/AnalysisResult';
import BandPowerChart from '../components/dashboard/BandPowerChart';
import HistoryTable from '../components/dashboard/HistoryTable';
import useAuthStore from '../store/authStore';
import useSidebarStore from '../store/sidebarStore';
import { useAnalysis } from '../hooks/useAnalysis';
import { formatDate, getStressLevelValue } from '../utils/helpers';
import { getAnalysisBandPowers } from '../utils/analysisPresentation';

function average(values) {
  if (!values.length) {
    return 0;
  }
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function formatRelativeTime(dateStr) {
  if (!dateStr) {
    return 'No data';
  }

  const diffMs = Math.max(0, Date.now() - new Date(dateStr).getTime());
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);

  if (minutes < 60) {
    return `${Math.max(minutes, 1)}m ago`;
  }
  if (hours < 24) {
    return `${hours}h ago`;
  }
  return `${Math.max(days, 1)}d ago`;
}

function buildQuickStats(items) {
  const totalAnalyses = items.length;
  const avgStress = average(items.map((item) => item.stress_score ?? item.score ?? 0));
  const recentAvg = average(items.slice(0, 3).map((item) => item.stress_score ?? item.score ?? 0));
  const previousAvg = average(items.slice(3, 6).map((item) => item.stress_score ?? item.score ?? 0));
  const improvement = previousAvg > 0 ? previousAvg - recentAvg : null;
  const lastAnalysis = items[0]?.created_at;
  const trendLabel = avgStress <= 40 ? 'Calmer' : avgStress <= 60 ? 'Stable' : 'Elevated';

  return [
    { icon: FileText, label: 'Total Analyses', value: String(totalAnalyses), iconBg: 'bg-accent-blue/10', iconColor: 'text-accent-blue' },
    { icon: Activity, label: 'Avg Stress Score', value: String(avgStress), change: improvement === null ? null : `${improvement}`, iconBg: 'bg-accent-green/10', iconColor: 'text-accent-green' },
    { icon: Clock, label: 'Last Analysis', value: formatRelativeTime(lastAnalysis), iconBg: 'bg-accent-purple/10', iconColor: 'text-accent-purple' },
    { icon: TrendingUp, label: 'Trend', value: trendLabel, change: improvement === null ? null : `${improvement}`, iconBg: 'bg-accent-cyan/10', iconColor: 'text-accent-cyan' },
  ];
}

function buildBreakdownStats(items) {
  const total = items.length;
  const veryRelaxed = items.filter((item) => getStressLevelValue(item) === 'very-relaxed').length;
  const relaxed = items.filter((item) => getStressLevelValue(item) === 'relaxed').length;
  const moderate = items.filter((item) => getStressLevelValue(item) === 'moderate').length;
  const stressed = items.filter((item) => getStressLevelValue(item) === 'stressed').length;
  const avgConfidence = average(items.map((item) => item.confidence ?? 0));

  return [
    { label: 'Very Relaxed Results', displayValue: String(veryRelaxed), width: total ? (veryRelaxed / total) * 100 : 0, color: 'bg-emerald-400' },
    { label: 'Relaxed Results', displayValue: String(relaxed), width: total ? (relaxed / total) * 100 : 0, color: 'bg-cyan-400' },
    { label: 'Moderate Results', displayValue: String(moderate), width: total ? (moderate / total) * 100 : 0, color: 'bg-accent-yellow' },
    { label: 'Stressed Results', displayValue: String(stressed), width: total ? (stressed / total) * 100 : 0, color: 'bg-accent-red' },
    { label: 'Avg Confidence', displayValue: `${avgConfidence}%`, width: avgConfidence, color: 'bg-accent-blue' },
  ];
}

const container = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const isSidebarCollapsed = useSidebarStore((state) => state.isCollapsed);
  const {
    currentAnalysis,
    isAnalyzing,
    uploadProgress,
    history,
    uploadAndAnalyze,
    fetchHistory,
    getAnalysisDetails,
    deleteAnalysis,
    downloadReportJson,
    error,
  } = useAnalysis();
  const [viewItem, setViewItem] = useState(null);
  const quickStats = buildQuickStats(history);
  const breakdownStats = buildBreakdownStats(history);

  useEffect(() => {
    fetchHistory().catch(() => {});
  }, [user?.email]);

  const handleView = async (item) => {
    setViewItem(item);

    try {
      const details = await getAnalysisDetails(item.id);
      setViewItem(details);
    } catch {
      // Keep the lightweight row data visible if the detail request fails.
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      <Sidebar />

      <main className={`px-4 py-6 pb-28 sm:px-6 md:p-8 md:pb-8 transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-[92px]' : 'md:ml-[260px]'}`}>
        <motion.div
          variants={container}
          initial="initial"
          animate="animate"
          className="space-y-8"
        >
          <motion.div variants={fadeUp} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold text-text-primary">
                Welcome back, {user?.full_name?.split(' ')[0] || 'User'}
              </h1>
              <p className="text-sm text-text-secondary mt-1">
                Here&apos;s an overview of your brain analysis activity
              </p>
            </div>
            <div className="flex w-full items-center gap-3 sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  placeholder="Search..."
                  className="w-full pl-9 pr-4 py-2 bg-bg-glass border border-border-color rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue sm:w-48"
                />
              </div>
              <button className="relative w-10 h-10 rounded-xl border border-border-color flex items-center justify-center text-text-muted hover:text-text-primary hover:border-accent-blue/30 transition-all">
                <Bell size={18} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-accent-red rounded-full" />
              </button>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {quickStats.map((stat) => (
              <StatsCard key={stat.label} {...stat} />
            ))}
          </motion.div>

          <motion.div variants={fadeUp} className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_400px]">
            <Card hover={false}>
              <h3 className="text-lg font-semibold font-display text-text-primary mb-4">
                Upload Analysis File
              </h3>
              <UploadZone
                onAnalyze={uploadAndAnalyze}
                isAnalyzing={isAnalyzing}
                uploadProgress={uploadProgress}
                resultId={currentAnalysis?.id}
              />
              {error && (
                <p className="mt-4 text-sm text-accent-red">{error}</p>
              )}
            </Card>

            <Card hover={false}>
              <h3 className="text-lg font-semibold font-display text-text-primary mb-4">
                Quick Stats
              </h3>
              <div className="space-y-4">
                {breakdownStats.map((stat) => (
                  <div key={stat.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-text-secondary">{stat.label}</span>
                      <span className="text-sm font-semibold text-text-primary">{stat.displayValue}</span>
                    </div>
                    <div className="h-2 bg-bg-glass rounded-full overflow-hidden">
                      <div
                        className={`h-full ${stat.color} rounded-full transition-all`}
                        style={{ width: `${stat.width}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {currentAnalysis && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 gap-6 xl:grid-cols-2"
            >
              <Card hover={false}>
                <h3 className="text-lg font-semibold font-display text-text-primary mb-6">
                  Stress Analysis Result
                </h3>
                <AnalysisResult result={currentAnalysis} />
              </Card>

              <Card hover={false}>
                <h3 className="text-lg font-semibold font-display text-text-primary mb-6">
                  Band Power Analysis
                </h3>
                <BandPowerChart bandPowers={currentAnalysis.band_powers} />
              </Card>
            </motion.div>
          )}

          <motion.div variants={fadeUp}>
            <Card hover={false}>
              <h3 className="text-lg font-semibold font-display text-text-primary mb-4">
                Recent Analyses
              </h3>
              <HistoryTable
                items={history}
                onView={handleView}
                onDownload={(item) => downloadReportJson(item.id, item)}
                onDelete={deleteAnalysis}
              />
            </Card>
          </motion.div>
        </motion.div>
      </main>

      <Modal
        isOpen={!!viewItem}
        onClose={() => setViewItem(null)}
        title="Analysis Details"
        wide
      >
        {viewItem && (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 px-1 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="w-10 h-10 bg-accent-blue/10 rounded-xl flex items-center justify-center">
                  <FileText size={18} className="text-accent-blue" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary break-words">
                    {viewItem.filename || viewItem.file_name}
                  </p>
                  <p className="text-xs text-text-muted">
                    {formatDate(viewItem.created_at || viewItem.date)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => downloadReportJson(viewItem.id, viewItem)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border-color text-sm text-text-secondary hover:border-accent-blue hover:text-accent-blue transition-all"
              >
                <Download size={14} />
                Export JSON
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <h4 className="text-sm font-medium text-text-muted mb-4 uppercase tracking-wider">
                  Stress Analysis
                </h4>
                <AnalysisResult result={viewItem} />
              </div>
              <div>
                <h4 className="text-sm font-medium text-text-muted mb-4 uppercase tracking-wider">
                  Band Power Breakdown
                </h4>
                <BandPowerChart bandPowers={getAnalysisBandPowers(viewItem)} />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
