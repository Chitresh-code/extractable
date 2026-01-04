import { create } from "zustand";
import { toast } from "sonner";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  timestamp: number;
  read: boolean;
}

interface NotificationStore {
  notifications: Notification[];
  addNotification: (
    notification: Omit<Notification, "id" | "timestamp" | "read">,
  ) => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
  unreadCount: number;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  unreadCount: 0,
  addNotification: (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: Date.now(),
      read: false,
    };
    
    // Show toast notification
    const toastMessage = notification.message || notification.title;
    switch (notification.type) {
      case "success":
        toast.success(notification.title, {
          description: notification.message,
        });
        break;
      case "error":
        toast.error(notification.title, {
          description: notification.message,
        });
        break;
      case "warning":
        toast.warning(notification.title, {
          description: notification.message,
        });
        break;
      default:
        toast.info(notification.title, {
          description: notification.message,
        });
    }
    
    // Store in notification log
    set((state) => ({
      notifications: [newNotification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },
  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },
  clearAll: () => {
    set({
      notifications: [],
      unreadCount: 0,
    });
  },
}));
