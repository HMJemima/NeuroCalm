import { Upload, UserPlus, FileCheck, AlertTriangle } from 'lucide-react';
import appConfig from '../../config/appConfig';

const defaultActivities = [
  { icon: Upload, text: 'New file uploaded by John D.', time: '2m ago', color: 'bg-accent-blue/10 text-accent-blue' },
  { icon: UserPlus, text: 'New user registered', time: '15m ago', color: 'bg-accent-green/10 text-accent-green' },
  { icon: FileCheck, text: 'Analysis completed #1847', time: '23m ago', color: 'bg-accent-purple/10 text-accent-purple' },
  { icon: AlertTriangle, text: 'High stress detected', time: '1h ago', color: 'bg-accent-yellow/10 text-accent-yellow' },
  { icon: Upload, text: 'Batch upload by Admin', time: '2h ago', color: 'bg-accent-blue/10 text-accent-blue' },
];

const levelStyles = {
  INFO: { icon: Upload, color: 'bg-accent-blue/10 text-accent-blue' },
  WARN: { icon: AlertTriangle, color: 'bg-accent-yellow/10 text-accent-yellow' },
  ERROR: { icon: AlertTriangle, color: 'bg-accent-red/10 text-accent-red' },
};

function normalizeActivities(activities = []) {
  if (!activities.length) {
    return appConfig.useMockDataEnabled ? defaultActivities : [];
  }

  return activities.map((activity) => {
    if (activity.icon) {
      return activity;
    }

    const style = levelStyles[activity.level] || levelStyles.INFO;
    return {
      icon: style.icon,
      text: activity.message,
      time: activity.time,
      color: style.color,
    };
  });
}

export default function ActivityFeed({ activities = [] }) {
  const items = normalizeActivities(activities);

  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <p className="text-sm text-text-secondary">No recent activity yet.</p>
      )}
      {items.map((activity, i) => (
        <div key={i} className="flex items-start gap-3 py-2">
          <div className={`w-8 h-8 rounded-lg ${activity.color} flex items-center justify-center shrink-0`}>
            <activity.icon size={14} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-text-primary">{activity.text}</p>
            <p className="text-[11px] text-text-muted mt-0.5">{activity.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
