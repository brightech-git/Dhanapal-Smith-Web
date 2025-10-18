// components/ui/ModalDropdown.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/context/theme/ThemeContext';
import { X, ChevronDown } from 'lucide-react';

interface ModalDropdownProps {
    trigger: React.ReactNode;
    title: string;
    children: React.ReactNode;
    position?: 'left' | 'right' | 'center';
    size?: 'sm' | 'md' | 'lg';
}

export const ModalDropdown: React.FC<ModalDropdownProps> = ({
    trigger,
    title,
    children,
    position = 'center',
    size = 'md'
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);
    const { mode, theme } = useTheme();

    const getPositionClasses = () => {
        switch (position) {
            case 'left': return 'left-0';
            case 'right': return 'right-0';
            case 'center': return 'left-1/2 transform -translate-x-1/2';
            default: return 'left-1/2 transform -translate-x-1/2';
        }
    };

    const getSizeClasses = () => {
        switch (size) {
            case 'sm': return 'w-64';
            case 'md': return 'w-80';
            case 'lg': return 'w-96';
            default: return 'w-80';
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

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
    console.log(isOpen ,'true')

    return (
        <div className="relative inline-block z-100" ref={modalRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="focus:outline-none"
            >
                {trigger}
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 z-40"
                        onClick={() => setIsOpen(false)}
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
                                onClick={() => setIsOpen(false)}
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
            )}
        </div>
    );
};

// Compact trigger component for table cells
export const CompactModalTrigger: React.FC<{
    value: string;
    onClick: () => void;
}> = ({ value, onClick }) => (
    <button
        onClick={onClick}
        className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 transition-colors px-2 py-1 rounded border border-transparent hover:border-blue-200"
    >
        <span>{value}</span>
        <ChevronDown size={12} />
    </button>
);