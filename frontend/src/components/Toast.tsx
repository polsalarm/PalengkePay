import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { CheckCircle, XCircle, Info, X, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface Toast {
  id: number;
  type: ToastType;
  message: string;
  action?: ToastAction;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, action?: ToastAction) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let counter = 0;
const MAX_TOASTS = 3;

const TOAST_STYLES: Record<ToastType, string> = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error:   'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  info:    'bg-slate-50 border-slate-200 text-slate-800',
};

const TOAST_ACTION_STYLES: Record<ToastType, string> = {
  success: 'text-green-700 hover:text-green-900 border-green-300',
  error:   'text-red-700 hover:text-red-900 border-red-300',
  warning: 'text-amber-700 hover:text-amber-900 border-amber-300',
  info:    'text-teal-700 hover:text-teal-900 border-teal-300',
};

function ToastIcon({ type }: { type: ToastType }) {
  const cls = 'shrink-0';
  if (type === 'success') return <CheckCircle size={16} className={cls} />;
  if (type === 'error')   return <XCircle size={16} className={cls} />;
  if (type === 'warning') return <AlertTriangle size={16} className={cls} />;
  return <Info size={16} className={cls} />;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info', action?: ToastAction) => {
    const id = ++counter;
    setToasts((prev) => {
      const next = [...prev, { id, type, message, action }];
      return next.length > MAX_TOASTS ? next.slice(next.length - MAX_TOASTS) : next;
    });
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border pointer-events-auto animate-toast ${TOAST_STYLES[toast.type]}`}
          >
            <ToastIcon type={toast.type} />
            <span className="text-sm font-medium flex-1">{toast.message}</span>
            {toast.action && (
              <button
                onClick={() => { toast.action!.onClick(); dismiss(toast.id); }}
                className={`shrink-0 text-xs font-bold border rounded-md px-2 py-0.5 transition-colors ${TOAST_ACTION_STYLES[toast.type]}`}
              >
                {toast.action.label}
              </button>
            )}
            <button onClick={() => dismiss(toast.id)} className="shrink-0 opacity-40 hover:opacity-80 transition-opacity ml-0.5">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx;
}
