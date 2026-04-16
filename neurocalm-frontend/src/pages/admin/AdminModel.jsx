import { motion } from 'framer-motion';
import {
  RefreshCw, CheckCircle, Clock, Activity,
} from 'lucide-react';
import { useEffect } from 'react';
import appConfig from '../../config/appConfig';
import AdminSidebar from '../../components/layout/AdminSidebar';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import useAuthStore from '../../store/authStore';
import useSidebarStore from '../../store/sidebarStore';
import { useAdmin } from '../../hooks/useAdmin';

const trainingHistory = [
  { version: 'v2.1.0', date: 'Jan 15, 2026', accuracy: '95.3%', samples: '10,450', status: 'active' },
  { version: 'v2.0.0', date: 'Dec 01, 2025', accuracy: '93.8%', samples: '8,200', status: 'archived' },
  { version: 'v1.5.0', date: 'Oct 10, 2025', accuracy: '91.2%', samples: '6,500', status: 'archived' },
  { version: 'v1.0.0', date: 'Aug 01, 2025', accuracy: '88.5%', samples: '4,000', status: 'archived' },
];

const container = { animate: { transition: { staggerChildren: 0.08 } } };
const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

export default function AdminModel() {
  const { user } = useAuthStore();
  const isSidebarCollapsed = useSidebarStore((state) => state.isCollapsed);
  const { modelInfo, stats, serverStatus, fetchServerStatus, error } = useAdmin();

  useEffect(() => {
    fetchServerStatus().catch(() => {});
  }, [user?.id]);

  const apiService = serverStatus?.services?.find((service) => service.name === 'API Server');
  const modelMetrics = [
    { label: 'Accuracy', value: modelInfo?.accuracy || '95.3%', icon: CheckCircle, color: 'bg-accent-green/10 text-accent-green' },
    { label: 'Avg Inference', value: stats?.avg_processing_time || '12.4s', icon: Clock, color: 'bg-accent-blue/10 text-accent-blue' },
    { label: 'Total Predictions', value: stats?.total_analyses || '0', icon: Activity, color: 'bg-accent-purple/10 text-accent-purple' },
    { label: 'Uptime', value: apiService?.uptime || 'N/A', icon: CheckCircle, color: 'bg-accent-cyan/10 text-accent-cyan' },
  ];
  const featureColumns = Array.isArray(modelInfo?.feature_cols) ? modelInfo.feature_cols : [];
  const evaluationSubjects = Array.isArray(modelInfo?.evaluation_subjects) ? modelInfo.evaluation_subjects : [];
  const liveEvaluationItems = [
    { label: 'F1 Score', value: modelInfo?.f1_score || 'N/A' },
    { label: 'Kappa', value: modelInfo?.kappa || 'N/A' },
    { label: 'Timesteps', value: modelInfo?.timesteps || 'N/A' },
    { label: 'Channels', value: modelInfo?.n_channels || 'N/A' },
    { label: 'Classes', value: modelInfo?.n_classes || 'N/A' },
    { label: 'Evaluation Timestamp', value: modelInfo?.evaluation_timestamp || 'N/A' },
  ];

  return (
    <div className="min-h-screen bg-bg-primary">
      <AdminSidebar />

      <main className={`px-4 py-6 pb-28 sm:px-6 md:p-8 md:pb-8 transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-[92px]' : 'md:ml-[260px]'}`}>
        <motion.div variants={container} initial="initial" animate="animate" className="space-y-6">
          <motion.div variants={fadeUp} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold text-text-primary">ML Model</h1>
              <p className="text-sm text-text-secondary mt-1">
                Model configuration, performance metrics, and training history
              </p>
            </div>
            <Button size="sm">
              <RefreshCw size={16} className="mr-2 inline" />
              Retrain Model
            </Button>
          </motion.div>

          {error && (
            <motion.p variants={fadeUp} className="text-sm text-accent-red">
              {error}
            </motion.p>
          )}

          <motion.div variants={fadeUp} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {modelMetrics.map((metric) => (
              <Card key={metric.label} hover={false}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${metric.color} flex items-center justify-center`}>
                    <metric.icon size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">{metric.label}</p>
                    <p className="text-lg font-display font-bold text-text-primary">{metric.value}</p>
                  </div>
                </div>
              </Card>
            ))}
          </motion.div>

          <motion.div variants={fadeUp}>
            <Card hover={false}>
              <h3 className="text-lg font-semibold font-display text-text-primary mb-4">
                Active Model
              </h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {[
                  { label: 'Model Type', value: modelInfo?.model_type || 'Random Forest' },
                  { label: 'Version', value: modelInfo?.version || 'v2.1.0' },
                  { label: 'Features Used', value: modelInfo?.features || '1,222' },
                  { label: 'Training Samples', value: modelInfo?.training_data || '10,450 samples' },
                  { label: 'Last Updated', value: modelInfo?.last_updated || 'Jan 15, 2026' },
                  { label: 'Accuracy', value: modelInfo?.accuracy || '95.3%' },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-xs text-text-muted mb-1">{item.label}</p>
                    <p className="text-sm font-medium text-text-primary">{item.value}</p>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {appConfig.useMockDataEnabled ? (
            <>
              <motion.div variants={fadeUp}>
                <Card hover={false}>
                  <h3 className="text-lg font-semibold font-display text-text-primary mb-4">
                    Top Feature Importance
                  </h3>
                  <div className="space-y-3">
                    {[
                      { name: 'Frontal Signal Mean', importance: 92 },
                      { name: 'Oxygenation Variance', importance: 87 },
                      { name: 'Channel Correlation Index', importance: 78 },
                      { name: 'Temporal Slope Feature', importance: 65 },
                      { name: 'Windowed Energy Summary', importance: 52 },
                      { name: 'Baseline Drift Measure', importance: 41 },
                    ].map((feature) => (
                      <div key={feature.name} className="flex items-center gap-4">
                        <span className="text-sm text-text-secondary w-56 flex-shrink-0">{feature.name}</span>
                        <div className="flex-1 h-2 bg-bg-glass rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-accent-blue to-accent-purple rounded-full"
                            style={{ width: `${feature.importance}%` }}
                          />
                        </div>
                        <span className="text-xs text-text-muted w-10 text-right">{feature.importance}%</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>

              <motion.div variants={fadeUp}>
                <Card hover={false}>
                  <h3 className="text-lg font-semibold font-display text-text-primary mb-4">
                    Training History
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px]">
                      <thead>
                        <tr className="border-b border-border-color">
                          <th className="text-left py-3 px-4 text-xs font-medium text-text-muted uppercase tracking-wider">Version</th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-text-muted uppercase tracking-wider">Date</th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-text-muted uppercase tracking-wider">Accuracy</th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-text-muted uppercase tracking-wider">Samples</th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-text-muted uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trainingHistory.map((trainingRun) => (
                          <tr key={trainingRun.version} className="border-b border-border-color/50 hover:bg-bg-glass/50 transition-colors">
                            <td className="py-3 px-4 text-sm text-text-primary font-mono">{trainingRun.version}</td>
                            <td className="py-3 px-4 text-sm text-text-secondary">{trainingRun.date}</td>
                            <td className="py-3 px-4 text-sm text-text-primary font-medium">{trainingRun.accuracy}</td>
                            <td className="py-3 px-4 text-sm text-text-secondary">{trainingRun.samples}</td>
                            <td className="py-3 px-4">
                              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                                trainingRun.status === 'active'
                                  ? 'bg-accent-green/10 text-accent-green'
                                  : 'bg-bg-glass text-text-muted'
                              }`}>
                                {trainingRun.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </motion.div>
            </>
          ) : (
            <>
              <motion.div variants={fadeUp}>
                <Card hover={false}>
                  <h3 className="text-lg font-semibold font-display text-text-primary mb-4">
                    Feature Schema
                  </h3>
                  {featureColumns.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {featureColumns.map((feature) => (
                        <span
                          key={feature}
                          className="rounded-full border border-accent-blue/20 bg-accent-blue/10 px-3 py-1 text-xs font-medium text-accent-blue"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-text-secondary">
                      Feature schema is not available from the backend yet.
                    </p>
                  )}
                </Card>
              </motion.div>

              <motion.div variants={fadeUp}>
                <Card hover={false}>
                  <h3 className="text-lg font-semibold font-display text-text-primary mb-4">
                    Latest Evaluation Snapshot
                  </h3>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {liveEvaluationItems.map((item) => (
                      <div key={item.label}>
                        <p className="text-xs text-text-muted mb-1">{item.label}</p>
                        <p className="text-sm font-medium text-text-primary">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>

              <motion.div variants={fadeUp}>
                <Card hover={false}>
                  <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-lg font-semibold font-display text-text-primary">
                      Subject Evaluation Scores
                    </h3>
                    <span className="text-xs text-text-muted">
                      {evaluationSubjects.length} subjects shown
                    </span>
                  </div>
                  {evaluationSubjects.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[560px]">
                      <thead>
                        <tr className="border-b border-border-color">
                          <th className="text-left py-3 px-4 text-xs font-medium text-text-muted uppercase tracking-wider">Subject</th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-text-muted uppercase tracking-wider">Accuracy</th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-text-muted uppercase tracking-wider">F1 Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {evaluationSubjects.map((subject) => (
                          <tr key={subject.subject} className="border-b border-border-color/50 hover:bg-bg-glass/50 transition-colors">
                            <td className="py-3 px-4 text-sm text-text-primary">{subject.subject}</td>
                            <td className="py-3 px-4 text-sm text-text-secondary">{subject.accuracy || 'N/A'}</td>
                            <td className="py-3 px-4 text-sm text-text-secondary">{subject.f1 || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-text-secondary">
                      Evaluation subject scores are not available from the backend yet.
                    </p>
                  )}
                </Card>
              </motion.div>
            </>
          )}
        </motion.div>
      </main>
    </div>
  );
}
