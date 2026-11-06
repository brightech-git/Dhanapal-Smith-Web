'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

interface ToastContextType {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const router = useRouter();

    const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).substring(2, 9);
        const newToast: Toast = { ...toast, id };

        setToasts(prev => [...prev, newToast]);

        // Auto remove after 5 seconds
        setTimeout(() => {
            removeToast(id);
        }, 5000);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
            {children}
            <ToastContainer />
        </ToastContext.Provider>
    );
};

// Toast Container Component
const ToastContainer: React.FC = () => {
    const { toasts, removeToast } = useContext(ToastContext)!;

    const getIcon = (type: ToastType) => {
        switch (type) {
            case 'success':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'error':
                return <XCircle className="w-5 h-5 text-red-500" />;
            case 'warning':
                return <AlertCircle className="w-5 h-5 text-yellow-500" />;
            case 'info':
                return <Info className="w-5 h-5 text-primary-text" />;
            default:
                return <Info className="w-5 h-5 text-muted-foreground" />;
        }
    };

    const getBackgroundColor = (type: ToastType) => {
        switch (type) {
            case 'success':
                return 'border-l-green-500';
            case 'error':
                return 'border-l-red-500';
            case 'warning':
                return 'border-l-amber-500';
            case 'info':
                return 'border-l-primary';
            default:
                return 'border-l-border';
        }
    };

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-[1400] space-y-3 max-w-sm">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`p-4 rounded-xl border border-border border-l-4 bg-card shadow-lg ${getBackgroundColor(toast.type)} animate-in slide-in-from-right-full duration-300`}
                >
                    <div className="flex items-start space-x-3">
                        {getIcon(toast.type)}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{toast.title}</p>
                            <p className="text-sm text-muted-foreground mt-1">{toast.message}</p>
                            {toast.action && (
                                <button
                                    onClick={toast.action.onClick}
                                    className="text-sm font-medium text-primary-text hover:opacity-80 mt-2"
                                >
                                    {toast.action.label} →
                                </button>
                            )}
                        </div>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export const useToast = (): ToastContextType => {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};