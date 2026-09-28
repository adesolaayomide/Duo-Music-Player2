'use client';

import { useUIStore } from '@/store/uiStore';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);
  const removeToast = useUIStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="fixed bottom-24 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-md shadow-xl text-sm font-medium text-white border transition-all animate-slide-up',
            toast.type === 'error' && 'bg-bg-elevated border-danger/40 text-danger',
            toast.type === 'success' && 'bg-bg-elevated border-accent/40 text-accent',
            toast.type === 'info' && 'bg-bg-elevated border-bg-hover text-white'
          )}
        >
          {toast.type === 'error' && <AlertCircle size={18} className="flex-shrink-0 text-danger" />}
          {toast.type === 'success' && <CheckCircle size={18} className="flex-shrink-0 text-accent" />}
          {toast.type === 'info' && <Info size={18} className="flex-shrink-0 text-text-secondary" />}

          <p className="flex-1 text-white text-xs leading-snug">{toast.message}</p>

          <button
            type="button"
            onClick={() => removeToast(toast.id)}
            aria-label="Dismiss toast"
            className="text-text-muted hover:text-white p-0.5 rounded transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
