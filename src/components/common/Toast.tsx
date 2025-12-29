import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, Loader2 } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'loading';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (toast.type !== 'loading' && toast.duration !== 0) {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => onClose(toast.id), 300);
      }, toast.duration || 3000);

      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.type, toast.duration, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
    loading: <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />,
  };

  const bgColors = {
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    loading: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  };

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg transition-all duration-300 ${
        bgColors[toast.type]
      } ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}`}
    >
      {icons[toast.type]}
      <span className="flex-1 text-sm text-gray-800 dark:text-gray-200">
        {toast.message}
      </span>
      {toast.type !== 'loading' && (
        <button
          onClick={() => {
            setIsExiting(true);
            setTimeout(() => onClose(toast.id), 300);
          }}
          className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      )}
    </div>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  return (
    <div className="fixed bottom-12 right-4 z-50 flex flex-col gap-2 max-w-md">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
};
