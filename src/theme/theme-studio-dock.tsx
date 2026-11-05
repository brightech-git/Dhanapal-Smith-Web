"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Moon, Palette, RotateCcw, Sun, X } from "lucide-react";
import { useTheme } from "./theme-context";
import { THEME_PRESETS, useThemeStudio } from "./theme-studio-context";

const CUSTOM_COLOR_FIELDS = [
    { key: "primary", label: "Primary action", hint: "Buttons, active menu, table headers" },
    { key: "secondary", label: "Secondary glow", hint: "Gradients and highlights" },
    { key: "accent", label: "Accent surface", hint: "Badges and soft highlight panels" },
] as const;

/**
 * Theme studio, modelled on the Saving Scheme app: a trigger button plus
 * a slide-out panel to switch light/dark, pick a preset, or hand-pick
 * colors. Changes apply instantly and are remembered on this device.
 */
export function ThemeStudioDock({ triggerClassName = "" }: { triggerClassName?: string }) {
    const [open, setOpen] = React.useState(false);
    const [mounted, setMounted] = React.useState(false);
    const { mode, setMode } = useTheme();
    const { preset, setPreset, setPresetColor, resetPreset } = useThemeStudio();

    React.useEffect(() => setMounted(true), []);
    React.useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open]);

    const presets = Object.values(THEME_PRESETS);

    const panel = (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        key="overlay"
                        className="fixed inset-0 z-[1300] bg-slate-900/30 backdrop-blur-[2px]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setOpen(false)}
                    />
                    <motion.aside
                        key="panel"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Theme studio"
                        className="fixed inset-y-0 right-0 z-[1301] flex w-full max-w-md flex-col border-l border-border bg-card text-foreground shadow-2xl"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 380, damping: 38 }}
                    >
                        <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
                            <div>
                                <h2 className="text-lg font-semibold">Theme studio</h2>
                                <p className="mt-0.5 text-sm text-muted-foreground">
                                    Pick a ready palette, tune individual colors, or switch between light and dark.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                aria-label="Close theme studio"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </header>

                        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
                            <section className="space-y-2.5">
                                <h3 className="text-sm font-medium">Display mode</h3>
                                <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
                                    {(["light", "dark"] as const).map((m) => (
                                        <button
                                            key={m}
                                            type="button"
                                            onClick={() => setMode(m)}
                                            className={`relative flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors ${
                                                mode === m ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                                            }`}
                                        >
                                            {mode === m && (
                                                <motion.span
                                                    layoutId="mode-pill"
                                                    className="absolute inset-0 rounded-lg bg-card shadow-sm"
                                                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                                                />
                                            )}
                                            <span className="relative flex items-center gap-2">
                                                {m === "light" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                                                {m === "light" ? "Light" : "Dark"}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </section>

                            <section className="space-y-2.5">
                                <h3 className="text-sm font-medium">Theme presets</h3>
                                <div className="grid grid-cols-2 gap-2.5">
                                    {presets.map((item) => {
                                        const isActive =
                                            preset.id === item.id ||
                                            (preset.id === "custom" &&
                                                preset.primary === item.primary &&
                                                preset.secondary === item.secondary);
                                        return (
                                            <motion.button
                                                key={item.id}
                                                type="button"
                                                whileHover={{ y: -2 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setPreset(item)}
                                                className={`relative flex flex-col gap-2 overflow-hidden rounded-xl border p-3 text-left transition-colors ${
                                                    isActive ? "border-primary bg-accent-soft" : "border-border hover:bg-muted"
                                                }`}
                                            >
                                                <span
                                                    className="h-10 w-full rounded-lg"
                                                    style={{ background: `linear-gradient(120deg, ${item.primary}, ${item.secondary})` }}
                                                />
                                                <span className="text-sm font-medium">{item.name}</span>
                                                <span className="text-xs leading-snug text-muted-foreground">{item.description}</span>
                                                {isActive && (
                                                    <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-card/90 px-1.5 py-0.5 text-[10px] font-semibold text-primary shadow-sm">
                                                        <Check className="h-3 w-3" />
                                                        Active
                                                    </span>
                                                )}
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </section>

                            <section className="space-y-2.5">
                                <h3 className="text-sm font-medium">Custom colors</h3>
                                <div className="space-y-2">
                                    {CUSTOM_COLOR_FIELDS.map((field) => (
                                        <label
                                            key={field.key}
                                            className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-muted"
                                        >
                                            <span>
                                                <span className="block text-sm font-medium">{field.label}</span>
                                                <span className="block text-xs text-muted-foreground">{field.hint}</span>
                                            </span>
                                            <input
                                                type="color"
                                                value={preset[field.key]}
                                                onChange={(e) => setPresetColor(field.key, e.target.value)}
                                                className="h-9 w-9 shrink-0 cursor-pointer rounded-lg border border-border bg-transparent p-0.5"
                                            />
                                        </label>
                                    ))}
                                </div>
                            </section>
                        </div>

                        <footer className="border-t border-border px-5 py-4">
                            <button
                                type="button"
                                onClick={resetPreset}
                                className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-medium transition hover:bg-muted"
                            >
                                <RotateCcw className="h-4 w-4" />
                                Reset theme colors
                            </button>
                        </footer>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label="Open theme settings"
                title="Theme settings"
                className={triggerClassName}
            >
                <Palette className="h-[18px] w-[18px]" />
            </button>
            {mounted && createPortal(panel, document.body)}
        </>
    );
}
