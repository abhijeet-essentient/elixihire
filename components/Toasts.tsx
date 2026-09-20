'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';
import { useToast, type ToastTone } from '@/lib/toast';

const TONE_STYLE: Record<ToastTone, string> = {
  success: 'border-jade/30 bg-jade/10 text-jade-dark',
  info: 'border-info-border bg-info-bg text-info-fg',
  warn: 'border-warn-border bg-warn-bg text-warn-fg',
};

const TONE_ICON = {
  success: CheckCircle2,
  info: Info,
  warn: TriangleAlert,
} as const;

/** Bottom-right stack. Announced politely so screen readers hear the outcome too. */
export function Toasts() {
  const { toasts, dismiss } = useToast();

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const Icon = TONE_ICON[toast.tone];
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className={`pointer-events-auto flex items-start gap-2.5 rounded-xl border px-3 py-2.5 shadow-pop backdrop-blur ${
                TONE_STYLE[toast.tone]
              }`}
            >
              <Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{toast.title}</p>
                {toast.detail ? <p className="mt-0.5 text-xs opacity-90">{toast.detail}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss notification"
                className="rounded p-0.5 opacity-60 transition-opacity hover:opacity-100"
              >
                <X aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
