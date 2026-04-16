import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Download, Calendar, TrendingDown,
  Brain, BarChart3, ArrowRight, CheckCircle, AlertCircle,
} from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import AnalysisResult from '../components/dashboard/AnalysisResult';
import { useAnalysis } from '../hooks/useAnalysis';
import useAuthStore from '../store/authStore';
import useSidebarStore from '../store/sidebarStore';
import { formatDate, getStressLevel, getStressLevelOptions, getStressLevelValue } from '../utils/helpers';

const levelConfig = {
  'Very Relaxed': { color: 'bg-emerald-400/10 text-emerald-300', icon: CheckCircle },
  Relaxed: { color: 'bg-cyan-400/10 text-cyan-300', icon: CheckCircle },
  Moderate: { color: 'bg-accent-yellow/10 text-accent-yellow', icon: AlertCircle },
  Stressed: { color: 'bg-accent-red/10 text-accent-red', icon: Brain },
};

function average(values) {
  if (!values.length) {
    return 0;
  }
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function buildSummaryStats(history) {
  const avgScore = average(history.map((item) => item.stress_score ?? item.score ?? 0));
  const avgConfidence = average(history.map((item) => item.confidence ?? 0));
  const lowStateCount = history.filter((item) => ['very-relaxed', 'relaxed'].includes(getStressLevelValue(item))).length;

  return [
    { label: 'Total Reports', value: String(history.length), icon: FileText, color: 'bg-accent-blue/10 text-accent-blue' },
    { label: 'Avg Stress Score', value: String(avgScore), icon: Brain, color: 'bg-accent-green/10 text-accent-green' },
    { label: 'Avg Confidence', value: `${avgConfidence}%`, icon: BarChart3, color: 'bg-accent-purple/10 text-accent-purple' },
    { label: 'Calm Results', value: `${history.length ? Math.round((lowStateCount / history.length) * 100) : 0}%`, icon: TrendingDown, color: 'bg-accent-cyan/10 text-accent-cyan' },
  ];
}

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export default function ReportsPage() {
  const { user } = useAuthStore();
  const isSidebarCollapsed = useSidebarStore((state) => state.isCollapsed);
  const {
    history,
    fetchHistory,
    getAnalysisDetails,
    downloadReportJson,
    downloadReportPdf,
  } = useAnalysis();
  const [filter, setFilter] = useState('all');
  const [viewReport, setViewReport] = useState(null);
  const summaryStats = buildSummaryStats(history);

  useEffect(() => {
    fetchHistory().catch(() => {});
  }, [user?.email]);

  const filteredReports = history.filter((item) => {
    if (filter === 'all') {
      return true;
    }

    const level = getStressLevelValue(item);
    return level === filter;
  });

  const handleView = async (item) => {
    setViewReport(item);

    try {
      const details = await getAnalysisDetails(item.id);
      setViewReport(details);
    } catch {
      // Keep the lightweight row data visible if the detail request fails.
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      <Sidebar />

      <main className={`px-4 py-6 pb-28 sm:px-6 md:p-8 md:pb-8 transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-[92px]' : 'md:ml-[260px]'}`}>
        <motion.div
          initial="initial"
          animate="animate"
          className="space-y-6"
        >
          <motion.div variants={fadeUp} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold text-text-primary">Reports</h1>
              <p className="text-sm text-text-secondary mt-1">
                Downloadable analysis reports generated from your saved results
              </p>
            </div>
            <Button size="sm" onClick={() => fetchHistory().catch(() => {})}>
              <ArrowRight size={16} className="mr-2 inline" />
              Refresh
            </Button>
          </motion.div>

          <motion.div variants={fadeUp} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {summaryStats.map((stat) => (
              <Card key={stat.label} hover={false} className="!p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}>
                    <stat.icon size={18} />
                  </div>
                  <div>
                    <p className="text-xl font-display font-bold text-text-primary">{stat.value}</p>
                    <p className="text-xs text-text-secondary">{stat.label}</p>
                  </div>
                </div>
              </Card>
            ))}
          </motion.div>

          <motion.div variants={fadeUp} className="flex gap-2 overflow-x-auto pb-1">
            {[
              { id: 'all', label: 'All Reports' },
              ...getStressLevelOptions().map((level) => ({
                id: level.label.toLowerCase().replace(/\s+/g, '-'),
                label: level.label,
              })),
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all
                  ${filter === tab.id
                    ? 'bg-accent-blue/10 text-accent-blue'
                    : 'text-text-secondary hover:bg-bg-glass hover:text-text-primary'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </motion.div>

          <motion.div variants={fadeUp} className="space-y-4">
            {filteredReports.length === 0 && (
              <Card hover={false}>
                <div className="py-10 text-center">
                  <FileText size={42} className="mx-auto mb-3 text-text-muted opacity-50" />
                  <p className="text-sm text-text-secondary">
                    No saved reports match this filter yet.
                  </p>
                </div>
              </Card>
            )}

            {filteredReports.map((report) => {
              const score = report.stress_score ?? report.score ?? 0;
              const level = getStressLevel(score, report.workload_class);
              const config = levelConfig[level.label] || levelConfig.Stressed;
              const LevelIcon = config.icon;

              return (
                <Card key={report.id} className="!p-5">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
                    <div className={`w-12 h-12 rounded-xl ${config.color} flex items-center justify-center shrink-0`}>
                      <LevelIcon size={22} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-1">
                        <h3 className="min-w-0 break-words text-base font-semibold text-text-primary">{report.filename || report.file_name}</h3>
                        <Badge variant={['Very Relaxed', 'Relaxed'].includes(level.label) ? 'success' : 'default'} className="text-[10px] py-0.5">
                          {level.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-text-secondary mb-3">
                        Stress score {score}/100 with {report.confidence ?? '--'}% confidence. Export JSON or PDF for the full report.
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted sm:gap-6">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={12} />
                          {formatDate(report.created_at || report.date)}
                        </span>
                        <span>{report.user_name || 'Unknown user'}</span>
                        <span className={`flex items-center gap-1 font-semibold ${level.textClass}`}>
                          <Brain size={12} />
                          Score: {score}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        onClick={() => downloadReportPdf(report.id, report)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border-color text-sm text-text-secondary hover:border-accent-blue hover:text-accent-blue transition-all"
                      >
                        <Download size={14} />
                        PDF
                      </button>
                      <button
                        onClick={() => downloadReportJson(report.id, report)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border-color text-sm text-text-secondary hover:border-accent-green hover:text-accent-green transition-all"
                      >
                        <Download size={14} />
                        JSON
                      </button>
                      <button
                        onClick={() => handleView(report)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent-blue/10 text-sm text-accent-blue hover:bg-accent-blue/20 transition-all"
                      >
                        View
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </motion.div>
        </motion.div>
      </main>

      <Modal
        isOpen={!!viewReport}
        onClose={() => setViewReport(null)}
        title="Report Details"
        wide
      >
        {viewReport && (() => {
          const score = viewReport.stress_score ?? viewReport.score ?? 0;
          const level = getStressLevel(score, viewReport.workload_class);
          const config = levelConfig[level.label] || levelConfig.Stressed;
          const LevelIcon = config.icon;

          return (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className={`w-12 h-12 rounded-xl ${config.color} flex items-center justify-center shrink-0`}>
                  <LevelIcon size={22} />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-1">
                    <h3 className="min-w-0 break-words text-lg font-semibold font-display text-text-primary">{viewReport.filename || viewReport.file_name}</h3>
                    <Badge variant={['Very Relaxed', 'Relaxed'].includes(level.label) ? 'success' : 'default'} className="text-[10px] py-0.5">
                      {level.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-text-secondary">
                    Full analysis report with stress score, confidence, and saved result details.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <Card hover={false}>
                  <h4 className="text-sm font-medium text-text-muted mb-4 uppercase tracking-wider">
                    Stress Analysis
                  </h4>
                  <AnalysisResult result={viewReport} />
                </Card>
              </div>

              <div className="flex flex-col gap-2 text-sm text-text-secondary border-t border-border-color pt-4 sm:flex-row sm:items-center sm:gap-6">
                <span className="flex items-center gap-2">
                  <Calendar size={14} className="text-text-muted" />
                  {formatDate(viewReport.created_at || viewReport.date)}
                </span>
                <span>{viewReport.user_name || 'Unknown user'}</span>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => downloadReportPdf(viewReport.id, viewReport)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border-color text-sm text-text-secondary hover:border-accent-blue hover:text-accent-blue transition-all"
                >
                  <Download size={16} />
                  Download PDF
                </button>
                <button
                  onClick={() => downloadReportJson(viewReport.id, viewReport)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border-color text-sm text-text-secondary hover:border-accent-green hover:text-accent-green transition-all"
                >
                  <Download size={16} />
                  Download JSON
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
