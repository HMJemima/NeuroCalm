import { motion } from 'framer-motion';

export default function StatsCard({ icon: Icon, label, value, change, iconBg = 'bg-accent-blue/10', iconColor = 'text-accent-blue' }) {
  const isPositive = change && parseFloat(change) > 0;

  return (
    <motion.div
      whileHover={{ y: -2, borderColor: 'rgba(59, 130, 246, 0.3)' }}
      className="bg-bg-card backdrop-blur-[20px] border border-border-color rounded-2xl p-5 transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon size={20} className={iconColor} />
        </div>
        {change && (
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-lg ${
              isPositive
                ? 'bg-accent-green/10 text-accent-green'
                : 'bg-accent-red/10 text-accent-red'
            }`}
          >
            {isPositive ? '+' : ''}{change}
          </span>
        )}
      </div>
      <p className="font-display text-[28px] font-bold text-text-primary">{value}</p>
      <p className="text-[13px] text-text-secondary mt-1">{label}</p>
    </motion.div>
  );
}
