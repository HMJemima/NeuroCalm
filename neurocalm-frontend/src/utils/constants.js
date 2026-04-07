export const VALID_FILE_EXTENSIONS = ['.mat', '.edf', '.csv', '.nir', '.oxy'];

export const STRESS_LEVELS = {
  VERY_RELAXED: {
    min: 0,
    max: 25,
    classId: 0,
    label: 'Very Relaxed',
    color: '#22c55e',
    textClass: 'text-emerald-300',
    bgClass: 'bg-emerald-400/10',
    ringClass: 'bg-emerald-400',
  },
  RELAXED: {
    min: 26,
    max: 50,
    classId: 1,
    label: 'Relaxed',
    color: '#06b6d4',
    textClass: 'text-cyan-300',
    bgClass: 'bg-cyan-400/10',
    ringClass: 'bg-cyan-400',
  },
  MODERATE: {
    min: 51,
    max: 75,
    classId: 2,
    label: 'Moderate',
    color: '#f59e0b',
    textClass: 'text-accent-yellow',
    bgClass: 'bg-accent-yellow/10',
    ringClass: 'bg-accent-yellow',
  },
  STRESSED: {
    min: 76,
    max: 100,
    classId: 3,
    label: 'Stressed',
    color: '#ef4444',
    textClass: 'text-accent-red',
    bgClass: 'bg-accent-red/10',
    ringClass: 'bg-accent-red',
  },
};

export const STRESS_LEVEL_LIST = [
  STRESS_LEVELS.VERY_RELAXED,
  STRESS_LEVELS.RELAXED,
  STRESS_LEVELS.MODERATE,
  STRESS_LEVELS.STRESSED,
];

export const BAND_COLORS = {
  delta: { color: '#6366f1', label: 'Delta', freq: '0.5-4 Hz' },
  theta: { color: '#8b5cf6', label: 'Theta', freq: '4-8 Hz' },
  alpha: { color: '#06b6d4', label: 'Alpha', freq: '8-13 Hz' },
  beta: { color: '#10b981', label: 'Beta', freq: '13-30 Hz' },
  gamma: { color: '#f59e0b', label: 'Gamma', freq: '30-100 Hz' },
};
