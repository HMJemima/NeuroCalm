import { motion } from 'framer-motion';

export default function Card({ children, className = '', hover = true, ...props }) {
  return (
    <motion.div
      whileHover={hover ? {
        y: -4,
        boxShadow: '0 0 60px rgba(59, 130, 246, 0.15)',
        borderColor: 'rgba(59, 130, 246, 0.3)',
      } : {}}
      className={`
        bg-bg-card backdrop-blur-[20px] border border-border-color
        rounded-2xl p-5 transition-all duration-300 sm:p-6
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.div>
  );
}
