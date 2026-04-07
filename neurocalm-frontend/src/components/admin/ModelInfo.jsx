import appConfig from '../../config/appConfig';

const defaultInfo = [
  { label: 'Model Type', value: 'Random Forest' },
  { label: 'Version', value: 'v2.1.0' },
  { label: 'Accuracy', value: '95.3%' },
  { label: 'Features', value: '1,222' },
  { label: 'Training Data', value: '10,450 samples' },
  { label: 'Last Updated', value: 'Jan 15, 2026' },
];

export default function ModelInfo({ info }) {
  const excludedKeys = new Set(['feature_cols', 'evaluation_subjects']);
  const items = info
    ? Object.entries(info)
      .filter(([key]) => !excludedKeys.has(key))
      .map(([key, value]) => ({
        label: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        value: String(value),
      }))
    : (appConfig.useMockDataEnabled ? defaultInfo : []);

  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <p className="text-sm text-text-secondary">Model metadata is unavailable.</p>
      )}
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between py-2 border-b border-border-color/50 last:border-0">
          <span className="text-sm text-text-secondary">{item.label}</span>
          <span className="text-sm font-semibold text-text-primary">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
