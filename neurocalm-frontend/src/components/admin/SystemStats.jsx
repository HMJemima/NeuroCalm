import appConfig from '../../config/appConfig';

const defaultStats = [
  { label: 'CPU Usage', value: 45, color: 'bg-accent-blue' },
  { label: 'Memory', value: 62, color: 'bg-accent-purple' },
  { label: 'Storage', value: 38, color: 'bg-accent-green' },
  { label: 'GPU', value: 71, color: 'bg-accent-yellow' },
];

function normalizeStatValue(stat) {
  if (typeof stat.value === 'number') {
    return { ...stat, percent: stat.value, displayValue: `${stat.value}%` };
  }

  if (typeof stat.bar === 'number') {
    return { ...stat, percent: stat.bar, displayValue: stat.value };
  }

  return { ...stat, percent: 0, displayValue: stat.value ?? '--' };
}

export default function SystemStats({ stats = [] }) {
  const source = stats.length ? stats : (appConfig.useMockDataEnabled ? defaultStats : []);
  const items = source.map(normalizeStatValue);

  return (
    <div className="space-y-4">
      {items.length === 0 && (
        <p className="text-sm text-text-secondary">No system metrics available yet.</p>
      )}
      {items.map((stat) => (
        <div key={stat.label}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm text-text-secondary">{stat.label}</span>
            <span className="text-sm font-semibold text-text-primary">{stat.displayValue}</span>
          </div>
          <div className="h-2 bg-bg-glass rounded-full overflow-hidden">
            <div
              className={`h-full ${stat.color || 'bg-accent-blue'} rounded-full transition-all`}
              style={{ width: `${stat.percent}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
