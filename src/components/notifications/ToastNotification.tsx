'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationStore, type Notification, type NotificationType } from '@/store';

const ICONS: Record<NotificationType, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
};

const COLORS: Record<NotificationType, { bg: string; border: string; icon: string }> = {
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: 'bg-green-100 text-green-600',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: 'bg-red-100 text-red-600',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'bg-blue-100 text-blue-600',
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    icon: 'bg-yellow-100 text-yellow-600',
  },
};

function Toast({ notification }: { notification: Notification }) {
  const { removeNotification } = useNotificationStore();
  const colors = COLORS[notification.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg ${colors.bg} ${colors.border}`}
    >
      {/* Icon */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold ${colors.icon}`}>
        {ICONS[notification.type]}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900">{notification.title}</p>
        {notification.message && (
          <p className="text-sm text-gray-600 mt-0.5">{notification.message}</p>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={() => removeNotification(notification.id)}
        className="flex-shrink-0 p-1 rounded hover:bg-black/5 transition-colors"
      >
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </motion.div>
  );
}

export function ToastContainer() {
  const { notifications } = useNotificationStore();

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => (
          <Toast key={notification.id} notification={notification} />
        ))}
      </AnimatePresence>
    </div>
  );
}
