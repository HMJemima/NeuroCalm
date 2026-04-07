import { Eye, Download, Trash2, FileText, CheckCircle, AlertCircle, Brain } from 'lucide-react';
import Avatar from '../common/Avatar';
import { formatDate } from '../../utils/helpers';
import { getStressLevel } from '../../utils/helpers';

const LEVEL_STYLES = {
  'Very Relaxed': {
    className: 'bg-emerald-400/10 text-emerald-300',
    Icon: CheckCircle,
  },
  Relaxed: {
    className: 'bg-cyan-400/10 text-cyan-300',
    Icon: CheckCircle,
  },
  Moderate: {
    className: 'bg-amber-400/10 text-amber-300',
    Icon: AlertCircle,
  },
  Stressed: {
    className: 'bg-accent-red/10 text-accent-red',
    Icon: Brain,
  },
};

export default function HistoryTable({
  items = [],
  onView,
  onDownload,
  onDelete,
  emptyMessage = 'No analyses yet. Upload your first EEG file!',
}) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText size={48} className="mx-auto text-text-muted mb-3 opacity-50" />
        <p className="text-text-secondary text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px]">
        <thead>
          <tr className="border-b border-border-color">
            {['File Name', 'Analyzed By', 'Date', 'Result', 'Confidence', 'Actions'].map((col) => (
              <th
                key={col}
                className="text-left py-3 px-4 text-[11px] uppercase tracking-wider text-text-muted font-medium"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const stressLevel = getStressLevel(item.stress_score ?? item.score ?? 0, item.workload_class);
            const levelStyle = LEVEL_STYLES[stressLevel.label] || LEVEL_STYLES.Stressed;
            const LevelIcon = levelStyle.Icon;
            return (
              <tr
                key={item.id}
                className="border-b border-border-color/50 hover:bg-bg-glass transition-colors"
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-accent-blue/10 rounded-lg flex items-center justify-center">
                      <FileText size={16} className="text-accent-blue" />
                    </div>
                    <span className="text-sm text-text-primary">{item.filename || item.file_name}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={item.user_name || 'Unknown'} size={28} className="rounded-lg text-[10px]" />
                    <div>
                      <p className="text-sm text-text-primary leading-tight">{item.user_name || 'Unknown'}</p>
                      <p className="text-[11px] text-text-muted leading-tight">{item.user_email || ''}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-text-secondary">
                  {formatDate(item.created_at || item.date)}
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${levelStyle.className}`}
                  >
                    <LevelIcon size={12} />
                    {stressLevel.label}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-text-primary">
                  {item.confidence ?? '--'}%
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    {[
                      { icon: Eye, onClick: () => onView?.(item), label: 'View' },
                      { icon: Download, onClick: () => onDownload?.(item), label: 'Download' },
                      { icon: Trash2, onClick: () => onDelete?.(item.id), label: 'Delete' },
                    ].map(({ icon: ActionIcon, onClick, label }) => (
                      <button
                        key={label}
                        onClick={onClick}
                        className="w-8 h-8 rounded-lg border border-border-color flex items-center justify-center
                          text-text-muted hover:border-accent-blue hover:text-accent-blue transition-all"
                        title={label}
                      >
                        <ActionIcon size={14} />
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
