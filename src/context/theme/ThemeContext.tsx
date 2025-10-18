'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Theme, ThemeMode } from '@/types/theme';
import { colors } from '@/utils/colors';
import { useResponsive } from '@/hooks/responsive/useResponsive';

const defaultTheme: Theme = {
    colors: {
        ...colors,
        light: {
            background: {
                primary: '#ffffff',
                secondary: '#f8f9fa',
                tertiary: '#e9ecef',
            },
            text: {
                primary: '#1a1a1a',
                secondary: '#6c757d',
                tertiary: '#495057',
            }
        },
        dark: {
            background: {
                primary: '#1a1a1a',
                secondary: '#2d2d2d',
                tertiary: '#3d3d3d',
            },
            text: {
                primary: '#ffffff',
                secondary: '#a0a0a0',
                tertiary: '#707070',
            }
        }
    },
    // These will be dynamically set by useResponsive hook
    spacing: {} as any,
    fontSize: {} as any,
    borderRadius: {
        sm: '0.125rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px',
    },
};

interface ThemeContextType {
    theme: Theme;
    mode: ThemeMode;
    toggleMode: () => void;
    setMode: (mode: ThemeMode) => void;
    getTableStyles: () => {
        headerBg: string;
        headerText: string;
        bodyBg: string;
        bodyText: string;
        border: string;
        stripedBg: string;
        hoverBg: string;
    };
    responsive: ReturnType<typeof useResponsive>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [mode, setMode] = useState<ThemeMode>('light');
    const responsive = useResponsive();

    // Update theme with responsive values
    const currentTheme: Theme = {
        ...defaultTheme,
        spacing: responsive.spacing,
        fontSize: responsive.fontSize,
    };

    useEffect(() => {
        const storedMode = localStorage.getItem('theme-mode') as ThemeMode;
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (storedMode) {
            setMode(storedMode);
        } else if (systemPrefersDark) {
            setMode('dark');
        }
    }, []);

    const toggleMode = () => {
        const newMode = mode === 'light' ? 'dark' : 'light';
        setMode(newMode);
        localStorage.setItem('theme-mode', newMode);
    };

    const getTableStyles = () => {
        if (mode === 'dark') {
            return {
                headerBg: 'bg-gray-800',
                headerText: 'text-white',
                bodyBg: 'bg-gray-900',
                bodyText: 'text-gray-100',
                border: 'border-gray-700',
                stripedBg: 'bg-gray-800',
                hoverBg: 'hover:bg-gray-700',
            };
        }

        return {
            headerBg: 'bg-primary-600',
            headerText: 'text-white',
            bodyBg: 'bg-white',
            bodyText: 'text-gray-700',
            border: 'border-gray-200',
            stripedBg: 'bg-gray-50',
            hoverBg: 'hover:bg-primary-50',
        };
    };

    const value: ThemeContextType = {
        theme: currentTheme,
        mode,
        toggleMode,
        setMode: (newMode: ThemeMode) => {
            setMode(newMode);
            localStorage.setItem('theme-mode', newMode);
        },
        getTableStyles,
        responsive,
    };

    return (
        <ThemeContext.Provider value={value}>
            <div
                data-theme={mode}
                data-screen-size={
                    responsive.isSmallMobile ? 'smallMobile' :
                        responsive.isMobile ? 'mobile' :
                            responsive.isTablet ? 'tablet' : 'desktop'
                }
                className="min-h-screen"
            >
                {children}
            </div>
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};