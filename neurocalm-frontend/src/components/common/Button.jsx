import { motion } from 'framer-motion';

const variants = {
  primary: 'bg-gradient-to-br from-accent-blue to-accent-purple text-white shadow-[0_4px_20px_rgba(59,130,246,0.3)] hover:shadow-[0_6px_30px_rgba(59,130,246,0.4)]',
  ghost: 'bg-transparent border border-border-color text-text-secondary hover:border-accent-blue hover:bg-accent-blue/10 hover:text-text-primary',
  success: 'bg-gradient-to-br from-accent-green to-accent-cyan text-white shadow-[0_4px_20px_rgba(16,185,129,0.3)]',
  danger: 'bg-accent-red/10 text-accent-red border border-accent-red/30 hover:bg-accent-red/20',
};

const sizes = {
  sm: 'px-4 py-2 text-xs',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-base',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  fullWidth = false,
  onClick,
  type = 'button',
  ...props
}) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-300 cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.button>
  );
}
