import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, FileText, Download, X } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import HistoryTable from '../components/dashboard/HistoryTable';
import AnalysisResult from '../components/dashboard/AnalysisResult';
import BandPowerChart from '../components/dashboard/BandPowerChart';
import { useAnalysis } from '../hooks/useAnalysis';
import useAuthStore from '../store/authStore';
import useSidebarStore from '../store/sidebarStore';
import { formatDate, getStressLevelValue, getStressLevelOptions } from '../utils/helpers';
import { getAnalysisBandPowers } from '../utils/analysisPresentation';

const RESULT_FILTERS = [
  { value: 'all', label: 'All Results' },
  ...getStressLevelOptions().map((level) => ({
    value: level.label.toLowerCase().replace(/\s+/g, '-'),
    label: level.label,
  })),
];

const DATE_FILTERS = [
  { value: 'all', label: 'Any Time' },
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
];

const FILE_TYPE_FILTERS = [
  { value: 'all', label: 'All Types' },
  { value: '.csv', label: 'CSV' },
  { value: '.nir', label: 'NIR' },
  { value: '.oxy', label: 'OXY' },
  { value: '.mat', label: 'MAT' },
  { value: '.edf', label: 'EDF' },
];

function getFileExtension(filename = '') {
  const dotIndex = filename.lastIndexOf('.');
  if (dotIndex < 0) {
    return '';
  }
  return filename.slice(dotIndex).toLowerCase();
}

function matchesDateRange(dateValue, range) {
  if (range === 'all') {
    return true;
  }

  const createdAt = new Date(dateValue);
  if (Number.isNaN(createdAt.getTime())) {
    return false;
  }

  const now = new Date();
  if (range === 'today') {
    return createdAt.toDateString() === now.toDateString();
  }

  const rangeToDays = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
  };
  const days = rangeToDays[range];
  if (!days) {
    return true;
  }

  return now.getTime() - createdAt.getTime() <= days * 24 * 60 * 60 * 1000;
}

export default function HistoryPage() {
  const { user } = useAuthStore();
  const isSidebarCollapsed = useSidebarStore((state) => state.isCollapsed);
  const {
    history,
    fetchHistory,
    getAnalysisDetails,
    deleteAnalysis,
    downloadReportJson,
  } = useAnalysis();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [resultFilter, setResultFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [fileTypeFilter, setFileTypeFilter] = useState('all');

  useEffect(() => {
    fetchHistory().catch(() => {});
  }, [user?.email]);

  const handleView = async (item) => {
    setSelected(item);

    try {
      const details = await getAnalysisDetails(item.id);
      setSelected(details);
    } catch {
      // Keep the lightweight row data visible if the detail request fails.
    }
  };

  const activeFilterCount = [resultFilter, dateFilter, fileTypeFilter].filter((value) => value !== 'all').length;

  const filteredHistory = history.filter((item) => {
    const filename = item.filename || item.file_name || '';
    const stressLevel = getStressLevelValue(item);
    const query = search.trim().toLowerCase();
    const searchHaystack = [
      filename,
      item.user_name || '',
      item.user_email || '',
      formatDate(item.created_at || item.date || ''),
      stressLevel,
    ]
      .join(' ')
      .toLowerCase();

    if (query && !searchHaystack.includes(query)) {
      return false;
    }

    if (resultFilter !== 'all' && stressLevel !== resultFilter) {
      return false;
    }

    if (fileTypeFilter !== 'all' && getFileExtension(filename) !== fileTypeFilter) {
      return false;
    }

    return matchesDateRange(item.created_at || item.date, dateFilter);
  });

  const emptyMessage = history.length === 0
    ? 'No analyses yet. Upload your first fNIRS file!'
    : 'No analyses match your current search or filters.';

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
            <h1 className="text-2xl font-display font-bold text-text-primary">
              Analysis History
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              View and manage your past stress analyses
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="relative w-full sm:max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search files..."
                className="w-full pl-9 pr-4 py-2.5 bg-bg-glass border border-border-color rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue"
              />
            </div>
            <button
              onClick={() => setShowFilters((value) => !value)}
              className={`flex w-full items-center justify-center gap-2 px-4 py-2.5 bg-bg-glass border rounded-xl text-sm transition-all sm:w-auto ${
                showFilters || activeFilterCount > 0
                  ? 'border-accent-blue/40 text-accent-blue'
                  : 'border-border-color text-text-secondary hover:border-accent-blue/30'
              }`}
            >
              <Filter size={16} />
              Filters
              {activeFilterCount > 0 && (
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-accent-blue px-1.5 py-0.5 text-[11px] font-semibold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card hover={false}>
                <div className="flex flex-col items-stretch gap-6 sm:flex-row sm:flex-wrap sm:items-start">
                  <div className="space-y-3">
                    <p className="text-[11px] uppercase tracking-wider text-text-muted">Result</p>
                    <div className="flex flex-wrap gap-2">
                      {RESULT_FILTERS.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setResultFilter(option.value)}
                          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                            resultFilter === option.value
                              ? 'bg-accent-blue text-white'
                              : 'border border-border-color bg-bg-glass text-text-secondary hover:border-accent-blue/30'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[11px] uppercase tracking-wider text-text-muted">Date Range</p>
                    <div className="flex flex-wrap gap-2">
                      {DATE_FILTERS.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setDateFilter(option.value)}
                          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                            dateFilter === option.value
                              ? 'bg-accent-blue text-white'
                              : 'border border-border-color bg-bg-glass text-text-secondary hover:border-accent-blue/30'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[11px] uppercase tracking-wider text-text-muted">File Type</p>
                    <div className="flex flex-wrap gap-2">
                      {FILE_TYPE_FILTERS.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setFileTypeFilter(option.value)}
                          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                            fileTypeFilter === option.value
                              ? 'bg-accent-blue text-white'
                              : 'border border-border-color bg-bg-glass text-text-secondary hover:border-accent-blue/30'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setResultFilter('all');
                      setDateFilter('all');
                      setFileTypeFilter('all');
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-border-color px-3 py-2 text-sm text-text-secondary transition-all hover:border-accent-blue/30 hover:text-text-primary sm:ml-auto"
                  >
                    <X size={14} />
                    Clear filters
                  </button>
                </div>
              </Card>
            </motion.div>
          )}

          <div className="flex flex-col gap-2 px-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-text-secondary">
              Showing <span className="font-semibold text-text-primary">{filteredHistory.length}</span> of{' '}
              <span className="font-semibold text-text-primary">{history.length}</span> analyses
            </p>
            {(search || activeFilterCount > 0) && (
              <button
                onClick={() => {
                  setSearch('');
                  setResultFilter('all');
                  setDateFilter('all');
                  setFileTypeFilter('all');
                }}
                className="text-sm text-accent-blue transition-colors hover:text-accent-cyan"
              >
                Reset view
              </button>
            )}
          </div>

          <Card hover={false}>
            <HistoryTable
              items={filteredHistory}
              onView={handleView}
              onDownload={(item) => downloadReportJson(item.id, item)}
              onDelete={deleteAnalysis}
              emptyMessage={emptyMessage}
            />
          </Card>
        </motion.div>
      </main>

      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title="Analysis Details"
        wide
      >
        {selected && (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 px-1 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="w-10 h-10 bg-accent-blue/10 rounded-xl flex items-center justify-center">
                  <FileText size={18} className="text-accent-blue" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary break-words">
                    {selected.filename || selected.file_name}
                  </p>
                  <p className="text-xs text-text-muted">
                    {formatDate(selected.created_at || selected.date)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => downloadReportJson(selected.id, selected)}
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
                <AnalysisResult result={selected} />
              </div>
              <div>
                <h4 className="text-sm font-medium text-text-muted mb-4 uppercase tracking-wider">
                  Band Power Breakdown
                </h4>
                <BandPowerChart bandPowers={getAnalysisBandPowers(selected)} />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
