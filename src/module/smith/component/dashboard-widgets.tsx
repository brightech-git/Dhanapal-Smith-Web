"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { ArrowDownLeft, ArrowDownRight, ArrowRight, ArrowUpRight, ChevronRight, Inbox, Paperclip } from "lucide-react";
import { attachmentCount } from "../api/smith-attachments.api";
import type { RecentTransaction } from "../type/smith-dashboard.types";

export const formatWeight = (v: number | undefined | null) =>
    `${(v ?? 0).toFixed(3)}`;

export const formatAmount = (v: number | undefined | null) =>
    `${(v ?? 0).toFixed(2)}`;

/** Whole number, plain format (no digit grouping). */
export const formatCount = (v: number | undefined | null) => `${Math.round(v ?? 0)}`;

const EASE = [0.22, 1, 0.36, 1] as const;

/** Number that counts up to its value. */
function CountUp({ value, format }: { value: number; format: (v: number) => string }) {
    const reduce = useReducedMotion();
    const mv = useMotionValue(reduce ? value : 0);
    const text = useTransform(mv, (v) => format(v));
    useEffect(() => {
        if (reduce) {
            mv.set(value);
            return;
        }
        const controls = animate(mv, value, { duration: 1.1, ease: EASE });
        return () => controls.stop();
    }, [value, reduce, mv]);
    return <motion.span>{text}</motion.span>;
}

type Tone = "primary" | "secondary" | "emerald" | "slate";

/** Filled icon tile (hero cards) and soft icon tile (compact cards) per tone. */
const TONES: Record<Tone, { solid: string; soft: string; bar: string; glow: string }> = {
    primary: {
        solid: "from-primary-700 to-primary-500 text-primary-foreground",
        soft: "bg-primary/10 text-primary-text dark:bg-primary/25",
        bar: "from-primary via-primary-400 to-secondary",
        glow: "bg-primary/15",
    },
    secondary: {
        solid: "from-amber-600 to-secondary text-white",
        soft: "bg-secondary/15 text-amber-700 dark:text-amber-300",
        bar: "from-secondary via-amber-300 to-primary",
        glow: "bg-secondary/20",
    },
    emerald: {
        solid: "from-emerald-700 to-teal-500 text-white",
        soft: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        bar: "from-emerald-600 to-teal-400",
        glow: "bg-emerald-500/15",
    },
    slate: {
        solid: "from-slate-800 to-slate-500 text-white",
        soft: "bg-slate-500/10 text-slate-700 dark:text-slate-300",
        bar: "from-slate-600 to-slate-400",
        glow: "bg-slate-500/15",
    },
};

/** Small uppercase heading with a gold accent and a fading rule. */
export function SectionHeading({ title, aside }: { title: string; aside?: React.ReactNode }) {
    return (
        <div className="flex items-center gap-3 pt-2">
            <span aria-hidden className="h-4 w-1 rounded-full bg-gradient-to-b from-secondary to-primary" />
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{title}</h2>
            <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
            {aside}
        </div>
    );
}

export interface KpiSplitPart {
    label: string;
    value: number;
    /** Tailwind background class for the bar segment and legend dot. */
    color: string;
}

export function KpiCard({
    label,
    value,
    format,
    icon: Icon,
    change,
    changeFormat,
    tone = "primary",
    loading,
    index = 0,
    footnote,
    variant = "compact",
    split,
    className = "",
}: {
    label: string;
    value: number | null;
    format: (v: number) => string;
    icon: React.ElementType;
    change?: number;
    changeFormat?: (v: number) => string;
    tone?: Tone;
    loading?: boolean;
    index?: number;
    footnote?: string;
    /** "hero" is the large headline card; "compact" is the small stat card. */
    variant?: "hero" | "compact";
    /** Optional proportion bar under the value (for example weight vs cash entries). */
    split?: KpiSplitPart[];
    className?: string;
}) {
    const t = TONES[tone];
    const hero = variant === "hero";
    const up = (change ?? 0) >= 0;
    const splitTotal = split?.reduce((s, p) => s + p.value, 0) ?? 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06, duration: 0.45, ease: EASE }}
            whileHover={{ y: -3 }}
            className={`group relative isolate overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgb(15_23_42/0.04),0_10px_30px_-18px_rgb(15_23_42/0.25)] transition-shadow hover:shadow-[0_1px_2px_rgb(15_23_42/0.06),0_18px_40px_-18px_rgb(15_23_42/0.35)] dark:shadow-none ${hero ? "p-5 sm:p-6" : "p-4"} ${className}`}
        >
            {/* top accent line */}
            <span aria-hidden className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${t.bar} ${hero ? "opacity-100" : "opacity-60 transition-opacity group-hover:opacity-100"}`} />
            {/* soft glow + watermark icon */}
            <span aria-hidden className={`pointer-events-none absolute -right-14 -top-14 -z-10 rounded-full blur-2xl transition-transform duration-500 group-hover:scale-125 ${t.glow} ${hero ? "size-48" : "size-28"}`} />
            {hero && (
                <Icon aria-hidden className="pointer-events-none absolute -bottom-6 -right-4 -z-10 size-32 text-foreground opacity-[0.035] transition-transform duration-700 group-hover:-rotate-6" />
            )}

            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className={`font-semibold uppercase text-muted-foreground ${hero ? "text-xs tracking-[0.14em]" : "text-[11px] tracking-[0.12em]"}`}>{label}</p>
                    <p className={`truncate font-bold tracking-tight tabular-nums ${hero ? "mt-3 text-3xl sm:text-4xl" : "mt-2 text-2xl"}`}>
                        {loading ? (
                            <span className={`inline-block animate-pulse rounded-lg bg-muted ${hero ? "h-9 w-44" : "h-7 w-20"}`} />
                        ) : value === null ? (
                            "—"
                        ) : (
                            <CountUp value={value} format={format} />
                        )}
                    </p>
                </div>
                {hero ? (
                    <span className={`flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br shadow-md ring-1 ring-white/20 ${t.solid}`}>
                        <Icon className="size-[22px]" />
                    </span>
                ) : (
                    <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${t.soft}`}>
                        <Icon className="size-[18px]" />
                    </span>
                )}
            </div>

            {split && splitTotal > 0 && !loading && (
                <div className="mt-3 space-y-1.5">
                    <div className="flex h-1.5 overflow-hidden rounded-full bg-muted">
                        {split.map((p, i) => (
                            <motion.span
                                key={p.label}
                                className={`h-full ${p.color}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${(p.value / splitTotal) * 100}%` }}
                                transition={{ delay: 0.3 + i * 0.1, duration: 0.8, ease: EASE }}
                            />
                        ))}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                        {split.map((p) => (
                            <span key={p.label} className="inline-flex items-center gap-1.5">
                                <span className={`size-2 rounded-full ${p.color}`} />
                                {p.label} <span className="font-semibold tabular-nums text-foreground">{formatCount(p.value)}</span>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {(footnote || (change !== undefined && !loading)) && (
                <div className={`flex items-center gap-2 text-xs ${hero ? "mt-4 border-t border-border pt-3" : "mt-2"}`}>
                    {change !== undefined && !loading && (
                        <span
                            className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-semibold ${
                                up ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 text-red-600 dark:text-red-400"
                            }`}
                        >
                            {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                            {(changeFormat ?? format)(Math.abs(change))}
                        </span>
                    )}
                    {footnote && <span className="text-muted-foreground">{footnote}</span>}
                </div>
            )}
        </motion.div>
    );
}

const initials = (name?: string) =>
    (name ?? "")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0] ?? "")
        .join("")
        .toUpperCase() || "—";

export function RecentTransactionsCard({
    title,
    subtitle,
    icon: Icon,
    rows,
    loading,
    format,
    index = 0,
    onSelect,
    viewAllHref,
}: {
    title: string;
    subtitle: string;
    icon: React.ElementType;
    rows: RecentTransaction[] | undefined;
    loading?: boolean;
    format: (v: number) => string;
    index?: number;
    /** Called with the row index when a row is clicked; opens the single view. */
    onSelect?: (index: number) => void;
    /** Optional link to the full transactions screen. */
    viewAllHref?: string;
}) {
    return (
        <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + index * 0.06, duration: 0.45, ease: EASE }}
            className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgb(15_23_42/0.04),0_10px_30px_-18px_rgb(15_23_42/0.25)] dark:shadow-none"
        >
            <header className="relative flex items-center justify-between gap-3 px-5 py-4">
                <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-700 to-primary-500 text-primary-foreground shadow-sm ring-1 ring-white/20">
                        <Icon className="size-[18px]" />
                    </span>
                    <div>
                        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
                        <p className="text-xs text-muted-foreground">{subtitle}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {onSelect && !!rows?.length && <span className="hidden text-xs text-muted-foreground md:inline">Click a row to view</span>}
                    {viewAllHref && (
                        <Link
                            href={viewAllHref}
                            className="group/link inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-primary-text transition-colors hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            VIEW ALL
                            <ArrowRight className="size-3.5 motion-safe:transition-transform group-hover/link:translate-x-0.5" />
                        </Link>
                    )}
                </div>
            </header>

            <div className="relative overflow-x-auto border-t border-border">
                <table className="w-full min-w-[620px] text-sm">
                    <thead>
                        <tr className="bg-muted/60 text-left text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                            <th className="px-5 py-2.5 font-semibold">S.NO</th>
                            <th className="px-3 py-2.5 font-semibold">SMITH</th>
                            <th className="px-3 py-2.5 text-right font-semibold">RECEIPT</th>
                            <th className="px-3 py-2.5 text-right font-semibold">ISSUE</th>
                            <th className="px-3 py-2.5 text-right font-semibold">BALANCE</th>
                            <th className="px-3 py-2.5 font-semibold">REMARK</th>
                            <th className="w-16 px-5 py-2.5 text-right font-semibold" aria-label="Files" title="Files">
                                <Paperclip className="ml-auto h-3.5 w-3.5" aria-hidden />
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {loading &&
                            Array.from({ length: 4 }).map((_, i) => (
                                <tr key={i}>
                                    <td colSpan={7} className="px-5 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 animate-pulse rounded-full bg-muted" />
                                            <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        {!loading &&
                            rows?.map((r, i) => (
                                <motion.tr
                                    key={`${r.sno}-${i}`}
                                    initial={{ opacity: 0, x: -6 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.25 + i * 0.04 }}
                                    className={`group transition-colors hover:bg-accent-soft/60 ${onSelect ? "cursor-pointer focus:bg-accent-soft/60 focus:outline-none" : ""}`}
                                    {...(onSelect && {
                                        role: "button",
                                        tabIndex: 0,
                                        "aria-label": `View transaction ${r.sno}${r.smithName ? ` of ${r.smithName}` : ""}`,
                                        onClick: () => onSelect(i),
                                        onKeyDown: (e: React.KeyboardEvent) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                onSelect(i);
                                            }
                                        },
                                    })}
                                >
                                    <td className="relative px-5 py-3 font-medium tabular-nums text-muted-foreground">
                                        <span aria-hidden className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-primary opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100" />
                                        {r.sno}
                                    </td>
                                    <td className="px-3 py-3">
                                        <div className="flex items-center gap-3">
                                            <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-accent-soft text-[11px] font-bold text-primary-text ring-1 ring-border">
                                                {initials(r.smithName)}
                                            </span>
                                            <div className="min-w-0">
                                                <p className="truncate font-medium">{r.smithName || "—"}</p>
                                                {r.date && <p className="text-xs tabular-nums text-muted-foreground">{r.date.split("-").reverse().join("-")}</p>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-3 py-3 text-right">
                                        {r.receipt ? (
                                            <span className="inline-flex items-center gap-1 font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                                                <ArrowDownLeft className="size-3.5" aria-hidden />
                                                {format(r.receipt)}
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground">—</span>
                                        )}
                                    </td>
                                    <td className="px-3 py-3 text-right">
                                        {r.issue ? (
                                            <span className="inline-flex items-center gap-1 font-semibold tabular-nums text-red-600 dark:text-red-400">
                                                <ArrowUpRight className="size-3.5" aria-hidden />
                                                {format(r.issue)}
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground">—</span>
                                        )}
                                    </td>
                                    <td className="px-3 py-3 text-right font-bold tabular-nums">{format(r.balance)}</td>
                                    <td className="max-w-[180px] truncate px-3 py-3 text-muted-foreground" title={r.remark}>
                                        {r.remark || "—"}
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <span className="inline-flex items-center justify-end gap-1 text-xs text-muted-foreground">
                                            {attachmentCount(r) > 0 && (
                                                <span className="inline-flex items-center gap-0.5 rounded-full bg-accent-soft px-1.5 py-0.5 font-semibold text-primary-text">
                                                    <Paperclip className="h-3 w-3" />
                                                    {attachmentCount(r)}
                                                </span>
                                            )}
                                            {onSelect && (
                                                <ChevronRight className="h-4 w-4 opacity-40 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                                            )}
                                        </span>
                                    </td>
                                </motion.tr>
                            ))}
                        {!loading && !rows?.length && (
                            <tr>
                                <td colSpan={7} className="px-5 py-12 text-center text-sm text-muted-foreground">
                                    <span className="mx-auto mb-2 grid size-11 place-items-center rounded-full bg-muted">
                                        <Inbox className="size-5" />
                                    </span>
                                    No recent transactions
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </motion.section>
    );
}
