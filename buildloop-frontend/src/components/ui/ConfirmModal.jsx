import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

/**
 * Reusable confirmation modal for destructive actions.
 * Rendered via portal to document.body so it always paints above
 * Radix UI stacking contexts (Dialog, Sheet, etc.).
 *
 * Props:
 *  - open        {boolean}   — whether the modal is visible
 *  - onClose     {Function}  — called when the user cancels
 *  - onConfirm   {Function}  — called when the user confirms
 *  - title       {string}    — modal heading
 *  - description {string}    — body text
 *  - confirmLabel{string}    — label on the confirm button (default: "Delete")
 *  - loading     {boolean}   — shows spinner on confirm button
 */
export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description = 'This action cannot be undone.',
  confirmLabel = 'Delete',
  loading = false,
}) {
  const portalRoot = useRef(null);

  // Create a dedicated portal container once and clean up on unmount
  useEffect(() => {
    const el = document.createElement('div');
    el.setAttribute('data-confirm-portal', '');
    document.body.appendChild(el);
    portalRoot.current = el;
    return () => {
      document.body.removeChild(el);
    };
  }, []);

  if (!portalRoot.current) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="confirm-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !loading && onClose()}
            style={{ position: 'fixed', inset: 0, zIndex: 99998, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          />

          {/* Modal card */}
          <motion.div
            key="confirm-modal"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
              pointerEvents: 'none',
            }}
          >
            <div style={{ pointerEvents: 'auto' }} className="w-full max-w-sm bg-white rounded-3xl shadow-[0_30px_80px_-10px_rgba(0,0,0,0.25)] p-8 flex flex-col items-center gap-5">
              {/* Text */}
              <div className="text-center space-y-1.5">
                <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 w-full mt-1">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 h-11 rounded-xl border border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className="flex-1 h-11 rounded-xl bg-gray-900 hover:bg-black text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    portalRoot.current,
  );
}
