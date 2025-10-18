// components/ui/ControlledModal.tsx
import React, { useEffect } from 'react';
import { useTheme } from '@/context/theme/ThemeContext';
import { X } from 'lucide-react';

interface ControlledModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg';
}

export const ControlledModal: React.FC<ControlledModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'md'
}) => {
    const { mode, theme } = useTheme();

    const getSizeClasses = () => {
        switch (size) {
            case 'sm': return 'w-64';
            case 'md': return 'w-80';
            case 'lg': return 'w-96';
            default: return 'w-80';
        }
    };

    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    const styles = {
        background: mode === 'dark'
            ? theme.colors?.dark?.background?.primary || '#1a1a1a'
            : theme.colors?.light?.background?.primary || '#ffffff',
        border: mode === 'dark' ? '#374151' : '#e5e7eb',
        text: {
            primary: mode === 'dark'
                ? theme.colors?.dark?.text?.primary || '#ffffff'
                : theme.colors?.light?.text?.primary || '#1a1a1a',
            secondary: mode === 'dark'
                ? theme.colors?.dark?.text?.secondary || '#a0a0a0'
                : theme.colors?.light?.text?.secondary || '#6c757d',
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 ${getSizeClasses()} rounded-lg shadow-xl border`}
                style={{
                    background: styles.background,
                    borderColor: styles.border
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: styles.border }}>
                    <h3 className="font-semibold" style={{ color: styles.text.primary }}>
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                        style={{ color: styles.text.secondary }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 max-h-96 overflow-y-auto">
                    {children}
                </div>
            </div>
        </>
    );
};