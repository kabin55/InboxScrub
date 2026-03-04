import React, { createContext, useContext, useState, type ReactNode, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast, ToastContainer, type ToastOptions } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useTheme } from './ThemeContext';

export type ToastType = "success" | "error" | "info" | "warning";

export interface Notification {
    id: string;
    type: ToastType;
    message: string;
    timestamp: number;
    read: boolean;
}

interface NotificationContextType {
    notifications: Notification[];
    addToast: (type: ToastType, message: string, options?: ToastOptions) => void;
    addNotification: (type: ToastType, message: string) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearNotifications: () => void;
    removeNotification: (id: string) => void;
    unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const { theme } = useTheme();

    // Load notifications from localStorage
    const [notifications, setNotifications] = useState<Notification[]>(() => {
        try {
            const saved = localStorage.getItem('notifications');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    // Save notifications to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('notifications', JSON.stringify(notifications));
    }, [notifications]);

    const addToast = (type: ToastType, message: string, options?: ToastOptions) => {
        // Map our custom ToastType to react-toastify methods
        switch (type) {
            case 'success':
                toast.success(message, options);
                break;
            case 'error':
                toast.error(message, options);
                break;
            case 'info':
                toast.info(message, options);
                break;
            case 'warning':
                toast.warn(message, options);
                break;
            default:
                toast(message, options);
        }
    };

    const addNotification = (type: ToastType, message: string) => {
        // Add to history
        const newNotification: Notification = {
            id: uuidv4(),
            type,
            message,
            timestamp: Date.now(),
            read: false,
        };
        setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep last 50

        // Also show a toast
        addToast(type, message);
    };

    const markAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const clearNotifications = () => {
        setNotifications([]);
    };

    const removeNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    // Resolve 'system' theme to light or dark
    const getEffectiveTheme = () => {
        if (theme === 'system') {
            return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        }
        return theme;
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            addToast,
            addNotification,
            markAsRead,
            markAllAsRead,
            clearNotifications,
            removeNotification,
            unreadCount
        }}>
            {children}
            <ToastContainer
                position="top-center"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme={getEffectiveTheme()}
            />
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};
