import { AnimatePresence, motion } from 'framer-motion';
import { Info, X } from 'lucide-react';
import useToastStore from '../../store/toastStore';

const variantStyles = {
  info: {
    border: 'border-accent-blue/30',
    iconBg: 'bg-accent-blue/15',
    iconText: 'text-accent-blue',
  },
};

export default function ToastViewport() {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  return (
    <div className="pointer-events-none fixed top-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-3 px-4 sm:px-0">
      <AnimatePresence>
        {toasts.map((toast) => {
          const styles = variantStyles[toast.variant] || variantStyles.info;

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.96 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={`pointer-events-auto rounded-2xl border ${styles.border} bg-bg-card/95 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${styles.iconBg}`}>
                  <Info size={18} className={styles.iconText} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-text-primary">{toast.title}</p>
                  <p className="mt-1 text-sm leading-5 text-text-secondary">{toast.message}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="rounded-lg p-1 text-text-muted transition-colors hover:bg-bg-glass hover:text-text-primary"
                  aria-label="Dismiss notification"
                >
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
