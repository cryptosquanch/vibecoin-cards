import { create } from 'zustand';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number; // ms, default 5000
  createdAt: number;
}

interface NotificationState {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => string;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

let notificationId = 0;

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],

  addNotification: (notification) => {
    const id = `notification-${++notificationId}`;
    const newNotification: Notification = {
      ...notification,
      id,
      createdAt: Date.now(),
      duration: notification.duration ?? 5000,
    };

    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }));

    // Auto remove after duration
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        get().removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  clearNotifications: () => {
    set({ notifications: [] });
  },
}));

// Helper functions for common notification types
export const notify = {
  success: (title: string, message?: string) => {
    return useNotificationStore.getState().addNotification({
      type: 'success',
      title,
      message,
    });
  },
  error: (title: string, message?: string) => {
    return useNotificationStore.getState().addNotification({
      type: 'error',
      title,
      message,
      duration: 8000, // Errors stay longer
    });
  },
  info: (title: string, message?: string) => {
    return useNotificationStore.getState().addNotification({
      type: 'info',
      title,
      message,
    });
  },
  warning: (title: string, message?: string) => {
    return useNotificationStore.getState().addNotification({
      type: 'warning',
      title,
      message,
      duration: 6000,
    });
  },
};
