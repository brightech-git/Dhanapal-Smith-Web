"use client";

import React from "react";

/** Shared look for the role screens (card, inputs, buttons, badges). */
export const card = "min-w-0 rounded-2xl border border-border bg-card shadow-sm";
export const inputClass =
    "h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/30 disabled:opacity-60";
export const primaryButton =
    "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";
export const ghostButton =
    "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-medium transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";
export const iconButton =
    "inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40";

export function CardHeader({
    icon: Icon,
    title,
    subtitle,
    actions,
}: {
    icon: React.ElementType;
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
}) {
    return (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-primary-text">
                    <Icon className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0">
                    <h2 className="text-sm font-semibold">{title}</h2>
                    {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
                </div>
            </div>
            {actions}
        </header>
    );
}

export function StatusBadge({ active }: { active: boolean }) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
                active ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-muted text-muted-foreground"
            }`}
        >
            <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-muted-foreground"}`} />
            {active ? "Active" : "Inactive"}
        </span>
    );
}

export function Field({ label, hint, children, htmlFor }: { label: string; hint?: string; children: React.ReactNode; htmlFor?: string }) {
    return (
        <div className="space-y-1.5">
            <label htmlFor={htmlFor} className="text-sm font-medium">
                {label}
            </label>
            {children}
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
    );
}

/** Checkbox styled as a switch; still an <input> so Enter navigation and Space work. */
export function Switch({
    id,
    checked,
    onChange,
    label,
    disabled,
}: {
    id?: string;
    checked: boolean;
    onChange: (v: boolean) => void;
    label: string;
    disabled?: boolean;
}) {
    return (
        <label htmlFor={id} className="inline-flex cursor-pointer select-none items-center gap-3">
            <span className="relative inline-flex">
                <input
                    id={id}
                    type="checkbox"
                    role="switch"
                    className="peer sr-only"
                    checked={checked}
                    disabled={disabled}
                    onChange={(e) => onChange(e.target.checked)}
                />
                <span className="h-6 w-11 rounded-full bg-muted ring-1 ring-border transition peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring" />
                <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
            </span>
            <span className="text-sm">{label}</span>
        </label>
    );
}

export function Checkbox({
    checked,
    indeterminate,
    onChange,
    label,
    disabled,
}: {
    checked: boolean;
    indeterminate?: boolean;
    onChange: (v: boolean) => void;
    label: string;
    disabled?: boolean;
}) {
    const ref = React.useRef<HTMLInputElement>(null);
    React.useEffect(() => {
        if (ref.current) ref.current.indeterminate = !!indeterminate && !checked;
    }, [indeterminate, checked]);
    return (
        <input
            ref={ref}
            type="checkbox"
            aria-label={label}
            title={label}
            checked={checked}
            disabled={disabled}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 cursor-pointer rounded border-border accent-[var(--primary)] disabled:cursor-not-allowed"
        />
    );
}
