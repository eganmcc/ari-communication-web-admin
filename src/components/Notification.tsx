import clsx from 'clsx';
import { useEffect, useState } from 'react';

interface NotificationProps {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: (id: string) => void;
}

export function Notification({ id, message, type, onClose }: NotificationProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onClose(id), 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [id, onClose]);

  return (
    <div
      className={clsx(
        'px-4 py-3 rounded-lg shadow-lg border flex items-center justify-between gap-3 min-w-[300px] transition-all duration-300',
        !isExiting ? 'animate-slide-in-right' : 'animate-slide-out-right opacity-0',
        type === 'success' && 'bg-green-50 border-green-200 text-green-800',
        type === 'error' && 'bg-red-50 border-red-200 text-red-800',
        type === 'info' && 'bg-blue-50 border-blue-200 text-blue-800'
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">
          {type === 'success' && '✅'}
          {type === 'error' && '❌'}
          {type === 'info' && 'ℹ️'}
        </span>
        <span className="text-sm font-medium">{message}</span>
      </div>
      <button
        onClick={() => {
          setIsExiting(true);
          setTimeout(() => onClose(id), 300);
        }}
        className="text-gray-400 hover:text-gray-600 transition-colors"
      >
        ✕
      </button>
    </div>
  );
}

interface NotificationContainerProps {
  notifications: Array<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }>;
  onClose: (id: string) => void;
}

export function NotificationContainer({ notifications, onClose }: NotificationContainerProps) {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {notifications.map(notification => (
        <Notification
          key={notification.id}
          id={notification.id}
          message={notification.message}
          type={notification.type}
          onClose={onClose}
        />
      ))}
    </div>
  );
}
