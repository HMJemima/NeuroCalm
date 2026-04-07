import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, wide, children }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-end justify-center p-3 pointer-events-none sm:items-center sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} bg-bg-secondary border border-border-color
                rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.3)] max-h-[88vh] overflow-y-auto pointer-events-auto sm:p-6 sm:max-h-[85vh]`}
            >
              <div className="flex items-center justify-between gap-4 mb-4">
                <h3 className="text-base font-semibold font-display sm:text-lg">{title}</h3>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-bg-glass text-text-muted hover:text-text-primary transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              {children}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
