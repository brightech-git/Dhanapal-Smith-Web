// Theme presets, ported from the Saving Scheme frontend's theme studio.
// A preset only sets the brand colors; light/dark mode is separate
// (see theme-context.tsx). Applying a preset writes CSS variables on
// <html>, so Tailwind classes, the MUI theme and plain CSS all re-color.

export type ThemePreset = {
    id: string;
    name: string;
    description: string;
    /** Buttons, active nav items, links, focus rings, table headers. */
    primary: string;
    /** Paired with `primary` for gradients and highlights. */
    secondary: string;
    /** Badges and subtle highlight surfaces. */
    accent: string;
};

export const THEME_PRESETS: Record<string, ThemePreset> = {
    brightech: {
        id: "brightech",
        name: "Classic navy",
        description: "Deep navy with a warm gold accent.",
        primary: "#0c376a",
        secondary: "#d4a017",
        accent: "#eef4fb",
    },
    ocean: {
        id: "ocean",
        name: "Ocean command",
        description: "Deep blue controls with a fresh cyan glow.",
        primary: "#2f67ff",
        secondary: "#16c7d8",
        accent: "#eaf1ff",
    },
    ember: {
        id: "ember",
        name: "Ember rose",
        description: "Warm rose actions with soft coral tones.",
        primary: "#e5527a",
        secondary: "#fb923c",
        accent: "#fff1f2",
    },
    forest: {
        id: "forest",
        name: "Forest mint",
        description: "Grounded emerald highlights for calm workflows.",
        primary: "#16a34a",
        secondary: "#0f766e",
        accent: "#eefdf3",
    },
    violet: {
        id: "violet",
        name: "Violet studio",
        description: "Premium violet and indigo, a sharper workspace feel.",
        primary: "#7c3aed",
        secondary: "#2563eb",
        accent: "#f5f3ff",
    },
};

export const DEFAULT_THEME_PRESET = THEME_PRESETS.brightech;

/** Either one of THEME_PRESETS, or `{ ...preset, id: "custom" }` once a
 *  color has been hand-picked in the theme studio. */
export type ActiveThemePreset = ThemePreset;

export const THEME_PRESET_STORAGE_KEY = "theme-studio-preset";

const PRESET_VARS = ["--primary", "--secondary", "--accent", "--ring"] as const;

export function getInitialThemePreset(): ActiveThemePreset {
    try {
        const stored = window.localStorage.getItem(THEME_PRESET_STORAGE_KEY);
        if (!stored) return DEFAULT_THEME_PRESET;
        const parsed = JSON.parse(stored) as Partial<ActiveThemePreset>;
        const base = (parsed.id && THEME_PRESETS[parsed.id]) || DEFAULT_THEME_PRESET;
        return { ...base, ...parsed } as ActiveThemePreset;
    } catch {
        return DEFAULT_THEME_PRESET;
    }
}

export function persistThemePreset(preset: ActiveThemePreset) {
    try {
        window.localStorage.setItem(THEME_PRESET_STORAGE_KEY, JSON.stringify(preset));
    } catch {
        // Storage unavailable (private mode): the preset still applies for this session.
    }
}

export function applyThemePreset(preset: ActiveThemePreset) {
    if (typeof document === "undefined") return;
    const root = document.documentElement.style;
    root.setProperty("--primary", preset.primary);
    root.setProperty("--secondary", preset.secondary);
    root.setProperty("--accent", preset.accent);
    root.setProperty("--ring", `${preset.primary}80`);
}

/** Removes the inline overrides so the base tokens in globals.css apply. */
export function clearThemePresetOverrides() {
    if (typeof document === "undefined") return;
    const root = document.documentElement.style;
    PRESET_VARS.forEach((prop) => root.removeProperty(prop));
}
