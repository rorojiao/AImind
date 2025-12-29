import type { Toast } from '../../components/common/Toast';

// 全局 Toast 管理器
class ToastManager {
  private listeners: Set<(toasts: Toast[]) => void> = new Set();
  private toasts: Toast[] = [];
  private id = 0;

  subscribe = (listener: (toasts: Toast[]) => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private notify = () => {
    this.listeners.forEach((listener) => listener([...this.toasts]));
  };

  show = (message: string, type: Toast['type'] = 'info', duration: number = 3000): string => {
    const id = `toast-${++this.id}`;
    const toast: Toast = { id, message, type, duration };
    this.toasts.push(toast);
    this.notify();

    if (type !== 'loading' && duration > 0) {
      setTimeout(() => {
        this.close(id);
      }, duration);
    }

    return id;
  };

  success = (message: string, duration?: number) => {
    return this.show(message, 'success', duration);
  };

  error = (message: string, duration?: number) => {
    return this.show(message, 'error', duration);
  };

  info = (message: string, duration?: number) => {
    return this.show(message, 'info', duration);
  };

  loading = (message: string) => {
    return this.show(message, 'loading', 0);
  };

  close = (id: string) => {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.notify();
  };

  closeAll = () => {
    this.toasts = [];
    this.notify();
  };
}

export const toastManager = new ToastManager();

// 便捷函数
export const toast = {
  success: (message: string, duration?: number) => toastManager.success(message, duration),
  error: (message: string, duration?: number) => toastManager.error(message, duration),
  info: (message: string, duration?: number) => toastManager.info(message, duration),
  loading: (message: string) => toastManager.loading(message),
  close: (id: string) => toastManager.close(id),
  closeAll: () => toastManager.closeAll(),
};
