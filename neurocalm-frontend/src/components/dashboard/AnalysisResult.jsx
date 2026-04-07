import { motion } from 'framer-motion';
import { getStressLevel } from '../../utils/helpers';
import { STRESS_LEVEL_LIST } from '../../utils/constants';

export default function AnalysisResult({ result }) {
  if (!result) return null;

  const score = result.stress_score ?? result.score ?? 0;
  const confidence = result.confidence ?? 87;
  const stressProb = result.stress_probability ?? (100 - confidence);
  const features = result.features_count ?? 1222;
  const level = getStressLevel(score, result.workload_class);
  const classProbabilities = Array.isArray(result.class_probabilities)
    ? result.class_probabilities
    : [];

  // SVG circle math
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Stress Ring */}
      <div className="relative">
        <svg width="180" height="180" className="-rotate-90">
          {/* Background ring */}
          <circle
            cx="90"
            cy="90"
            r={radius}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="14"
            fill="none"
          />
          {/* Progress ring */}
          <motion.circle
            cx="90"
            cy="90"
            r={radius}
            stroke={level.color}
            strokeWidth="14"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-5xl font-display font-bold"
            style={{ color: level.color }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            {score}
          </motion.span>
          <span className="text-base font-semibold mt-1" style={{ color: level.color }}>
            {level.label}
          </span>
        </div>
      </div>

      {/* Confidence badge */}
      <span className="px-4 py-1.5 bg-bg-glass border border-border-color rounded-full text-xs text-text-secondary font-medium">
        {confidence}% confidence
      </span>

      {/* Bottom stats */}
      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-6">
        {[
          { value: `${confidence}%`, label: 'Confidence' },
          { value: `${stressProb}%`, label: 'Stress Prob' },
          { value: features.toLocaleString(), label: 'Features' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border-color/60 bg-bg-glass/40 px-3 py-2 text-center sm:border-0 sm:bg-transparent sm:p-0">
            <p className="text-lg font-display font-bold text-text-primary">{stat.value}</p>
            <p className="text-xs text-text-muted mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {classProbabilities.length > 0 && (
        <div className="w-full rounded-2xl border border-border-color bg-bg-secondary/95 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-secondary">
              Model class probabilities
            </p>
            <span className="text-[11px] text-text-muted">4-class output</span>
          </div>
          <div className="space-y-3">
            {STRESS_LEVEL_LIST.map((classLevel, index) => {
              const probability = Number(classProbabilities[index] ?? 0);
              const percent = probability <= 1 ? probability * 100 : probability;
              const isPredicted = classLevel.classId === Number(result.workload_class);

              return (
                <div key={classLevel.label} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="flex min-w-0 items-center gap-2 font-medium text-text-primary">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${classLevel.ringClass}`} />
                      <span className="truncate">{classLevel.label}</span>
                      {isPredicted && (
                        <span className={`${classLevel.bgClass} ${classLevel.textClass} rounded-full px-2 py-0.5 text-[10px] font-semibold`}>
                          Predicted
                        </span>
                      )}
                    </span>
                    <span className={`shrink-0 font-semibold ${isPredicted ? classLevel.textClass : 'text-text-secondary'}`}>
                      {percent.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-bg-primary">
                    <div
                      className={`h-full rounded-full ${classLevel.ringClass}`}
                      style={{ width: `${Math.max(2, Math.min(percent, 100))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
