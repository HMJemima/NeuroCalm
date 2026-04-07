const variants = {
  default: 'bg-accent-blue/10 text-accent-blue border-accent-blue/20',
  success: 'bg-accent-green/10 text-accent-green border-accent-green/20',
  danger: 'bg-accent-red/10 text-accent-red border-accent-red/20',
  warning: 'bg-accent-yellow/10 text-accent-yellow border-accent-yellow/20',
  purple: 'bg-accent-purple/10 text-accent-purple border-accent-purple/20',
};

export default function Badge({ children, variant = 'default', className = '' }) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5
        rounded-full text-xs font-semibold border
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
