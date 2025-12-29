import { useState, useEffect } from 'react';
import { toastManager } from '../lib/toast/globalToast';
import type { Toast } from '../components/common/Toast';

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    return toastManager.subscribe(setToasts);
  }, []);

  return {
    toasts,
    success: toastManager.success,
    error: toastManager.error,
    info: toastManager.info,
    loading: toastManager.loading,
    close: toastManager.close,
    closeAll: toastManager.closeAll,
  };
};
