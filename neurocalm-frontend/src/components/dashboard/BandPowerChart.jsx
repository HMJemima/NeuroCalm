import { motion } from 'framer-motion';
import { BAND_COLORS } from '../../utils/constants';

const defaultBands = {
  delta: 35,
  theta: 25,
  alpha: 20,
  beta: 12,
  gamma: 8,
};

export default function BandPowerChart({ bandPowers = defaultBands }) {
  return (
    <div className="space-y-4">
      {Object.entries(BAND_COLORS).map(([key, band], i) => {
        const value = bandPowers[key] ?? 0;
        return (
          <div key={key} className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: band.color }}
            />
            <div className="w-20 shrink-0">
              <p className="text-[13px] font-medium text-text-primary">{band.label}</p>
              <p className="text-[11px] text-text-muted">{band.freq}</p>
            </div>
            <div className="flex-1 h-2.5 bg-bg-glass rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: band.color }}
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                transition={{ duration: 1, delay: i * 0.1, ease: 'easeOut' }}
              />
            </div>
            <span className="w-[50px] text-right text-[13px] font-semibold text-text-primary">
              {value}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
