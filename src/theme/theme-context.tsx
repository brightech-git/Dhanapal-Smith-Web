'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Theme, ThemeMode } from '@/src/theme/theme.types';
import { colors } from '@/src/theme/colors';
import { useResponsive } from '@/hooks/use-responsive';
import { DEFAULT_THEME_PRESET, THEME_PRESET_STORAGE_KEY } from '@/src/theme/presets';

// Same storage key and DOM contract as the Saving Scheme frontend:
// dark mode is a `.dark` class on <html>, set before paint by ThemeScript.
export const THEME_MODE_STORAGE_KEY = 'theme-mode';

const defaultTheme: Theme = {
    colors: {
        ...colors,
        light: {
            background: { primary: '#f6f8fb', secondary: '#ffffff', tertiary: '#eef2f7' },
            text: { primary: '#0f172a', secondary: '#64748b', tertiary: '#475569' },
        },
        dark: {
            background: { primary: '#0f141c', secondary: '#161c26', tertiary: '#1e2632' },
            text: { primary: '#f1f5f9', secondary: '#94a3b8', tertiary: '#cbd5e1' },
        },
    },
    // Filled from useResponsive below.
    spacing: {} as any,
    fontSize: {} as any,
    borderRadius: { sm: '0.125rem', md: '0.375rem', lg: '0.5rem', xl: '0.75rem', full: '9999px' },
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

function applyModeClass(mode: ThemeMode) {
    const root = document.documentElement;
    root.classList.toggle('dark', mode === 'dark');
    root.dataset.theme = mode;
    root.style.colorScheme = mode;
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Start as "light" so the static HTML and first client render match,
    // then pick up what ThemeScript already applied to <html>. The page
    // itself is colored by the `.dark` class, so there is no flash.
    const [mode, setModeState] = useState<ThemeMode>('light');
    const [ready, setReady] = useState(false);
    const responsive = useResponsive();

    useEffect(() => {
        setModeState(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
        setReady(true);
    }, []);

    useEffect(() => {
        if (ready) applyModeClass(mode);
    }, [mode, ready]);

    const setMode = useCallback((next: ThemeMode) => {
        setModeState(next);
        applyModeClass(next);
        try {
            localStorage.setItem(THEME_MODE_STORAGE_KEY, next);
        } catch {
            /* keep the mode for this session */
        }
    }, []);

    const toggleMode = useCallback(() => setMode(mode === 'dark' ? 'light' : 'dark'), [mode, setMode]);

    // Cross-tab sync, like the Saving Scheme app.
    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key === THEME_MODE_STORAGE_KEY && (e.newValue === 'dark' || e.newValue === 'light')) {
                setModeState(e.newValue);
            }
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    // Table classes use the theme tokens, so they follow the preset and mode.
    const getTableStyles = useCallback(
        () => ({
            headerBg: 'bg-primary',
            headerText: 'text-primary-foreground',
            bodyBg: 'bg-card',
            bodyText: 'text-foreground',
            border: 'border-border',
            stripedBg: 'bg-muted',
            hoverBg: 'hover:bg-accent-soft',
        }),
        []
    );

    const value = useMemo<ThemeContextType>(
        () => ({
            theme: { ...defaultTheme, spacing: responsive.spacing, fontSize: responsive.fontSize },
            mode,
            toggleMode,
            setMode,
            getTableStyles,
            responsive,
        }),
        [mode, toggleMode, setMode, getTableStyles, responsive]
    );

    return (
        <ThemeContext.Provider value={value}>
            <div
                data-theme={mode}
                data-screen-size={
                    responsive.isSmallMobile ? 'smallMobile' : responsive.isMobile ? 'mobile' : responsive.isTablet ? 'tablet' : 'desktop'
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

/** Inline script for <head>: applies the saved mode and preset colors
 *  before the first paint so there is no flash of the wrong theme. */
export function ThemeScript() {
    const script = `
    (function () {
      try {
        var root = document.documentElement;
        var mode = localStorage.getItem(${JSON.stringify(THEME_MODE_STORAGE_KEY)}) ||
          (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
        if (mode === "dark") root.classList.add("dark");
        root.dataset.theme = mode;
        root.style.colorScheme = mode;
        var p = JSON.parse(localStorage.getItem(${JSON.stringify(THEME_PRESET_STORAGE_KEY)}) || "null");
        if (p && p.primary) {
          root.style.setProperty("--primary", p.primary);
          root.style.setProperty("--secondary", p.secondary || ${JSON.stringify(DEFAULT_THEME_PRESET.secondary)});
          root.style.setProperty("--accent", p.accent || ${JSON.stringify(DEFAULT_THEME_PRESET.accent)});
          root.style.setProperty("--ring", p.primary + "80");
        }
      } catch (e) {}
    })();
  `;
    return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
