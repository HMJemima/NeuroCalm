import { forwardRef } from 'react';

const Input = forwardRef(({ label, icon: Icon, error, className = '', ...props }, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs uppercase tracking-wider text-text-muted mb-2 font-medium">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-text-muted" />
        )}
        <input
          ref={ref}
          className={`
            w-full py-3.5 px-4 ${Icon ? 'pl-11' : ''}
            bg-bg-glass border border-border-color rounded-xl
            text-text-primary text-sm placeholder:text-text-muted
            focus:outline-none focus:border-accent-blue focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]
            transition-all duration-200
            ${error ? 'border-accent-red focus:border-accent-red focus:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-accent-red">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
