"use client";

import * as React from "react";
import { createTheme, ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import { useTheme } from "./theme-context";
import {
    applyThemePreset,
    clearThemePresetOverrides,
    DEFAULT_THEME_PRESET,
    getInitialThemePreset,
    persistThemePreset,
    THEME_PRESET_STORAGE_KEY,
    THEME_PRESETS,
    type ActiveThemePreset,
} from "./presets";

interface ThemeStudioContextValue {
    preset: ActiveThemePreset;
    /** Switch to one of the named THEME_PRESETS. */
    setPreset: (preset: ActiveThemePreset) => void;
    /** Hand-pick one color on top of the active preset (marks it "custom"). */
    setPresetColor: (key: "primary" | "secondary" | "accent", value: string) => void;
    resetPreset: () => void;
}

const ThemeStudioContext = React.createContext<ThemeStudioContextValue | null>(null);

/**
 * Holds the active color preset (same model as the Saving Scheme theme
 * studio) and feeds it, with the light/dark mode, into MUI so MUI
 * buttons, inputs and pickers match the Tailwind side of the app.
 */
export function ThemeStudioProvider({ children }: { children: React.ReactNode }) {
    const { mode } = useTheme();
    // Default first so the static HTML and first client render match;
    // the saved preset (already painted by ThemeScript) is read on mount.
    const [preset, setPresetState] = React.useState<ActiveThemePreset>(DEFAULT_THEME_PRESET);

    React.useEffect(() => {
        const saved = getInitialThemePreset();
        setPresetState(saved);
        applyThemePreset(saved);
    }, []);

    const setPreset = React.useCallback((next: ActiveThemePreset) => {
        setPresetState(next);
        applyThemePreset(next);
        persistThemePreset(next);
    }, []);

    const setPresetColor = React.useCallback((key: "primary" | "secondary" | "accent", value: string) => {
        setPresetState((current) => {
            const next: ActiveThemePreset = {
                ...current,
                id: "custom",
                name: "Custom signature",
                description: "Your own hand-picked palette.",
                [key]: value,
            };
            applyThemePreset(next);
            persistThemePreset(next);
            return next;
        });
    }, []);

    const resetPreset = React.useCallback(() => {
        clearThemePresetOverrides();
        setPresetState(DEFAULT_THEME_PRESET);
        persistThemePreset(DEFAULT_THEME_PRESET);
    }, []);

    // Another tab changed the preset: follow it.
    React.useEffect(() => {
        const onStorage = (event: StorageEvent) => {
            if (event.key !== THEME_PRESET_STORAGE_KEY) return;
            const next = getInitialThemePreset();
            setPresetState(next);
            applyThemePreset(next);
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    const muiTheme = React.useMemo(
        () =>
            createTheme({
                palette: {
                    mode,
                    primary: { main: preset.primary },
                    secondary: { main: preset.secondary },
                    ...(mode === "dark"
                        ? { background: { default: "#0f141c", paper: "#161c26" } }
                        : { background: { default: "#f6f8fb", paper: "#ffffff" } }),
                },
                shape: { borderRadius: 10 },
                typography: { fontFamily: "inherit", button: { textTransform: "none", fontWeight: 600 } },
            }),
        [mode, preset.primary, preset.secondary]
    );

    const value = React.useMemo<ThemeStudioContextValue>(
        () => ({ preset, setPreset, setPresetColor, resetPreset }),
        [preset, setPreset, setPresetColor, resetPreset]
    );

    return (
        <ThemeStudioContext.Provider value={value}>
            <MuiThemeProvider theme={muiTheme}>{children}</MuiThemeProvider>
        </ThemeStudioContext.Provider>
    );
}

export function useThemeStudio(): ThemeStudioContextValue {
    const ctx = React.useContext(ThemeStudioContext);
    if (!ctx) throw new Error("useThemeStudio() must be used within a <ThemeStudioProvider>");
    return ctx;
}

export { THEME_PRESETS };
