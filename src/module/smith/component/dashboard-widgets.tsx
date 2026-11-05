"use client";

import React, { useEffect } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, ChevronRight, Inbox, Paperclip } from "lucide-react";
import { attachmentCount } from "../api/smith-attachments.api";
import type { RecentTransaction } from "../type/smith-dashboard.types";

export const formatWeight = (v: number | undefined | null) =>
    `${(v ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} g`;

export const formatAmount = (v: number | undefined | null) =>
    `₹${(v ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
        const controls = animate(mv, value, { duration: 1.1, ease: [0.22, 1, 0.36, 1] });
        return () => controls.stop();
    }, [value, reduce, mv]);
    return <motion.span>{text}</motion.span>;
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
}: {
    label: string;
    value: number;
    format: (v: number) => string;
    icon: React.ElementType;
    change?: number;
    changeFormat?: (v: number) => string;
    tone?: "primary" | "secondary" | "emerald" | "slate";
    loading?: boolean;
    index?: number;
    footnote?: string;
}) {
    const toneClass = {
        primary: "from-primary to-primary-500 text-primary-foreground",
        secondary: "from-secondary to-amber-500 text-white",
        emerald: "from-emerald-600 to-teal-500 text-white",
        slate: "from-slate-700 to-slate-500 text-white",
    }[tone];
    const up = (change ?? 0) >= 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -3 }}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
        >
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary opacity-[0.06] transition-transform duration-500 group-hover:scale-125" />
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-sm font-medium text-muted-foreground">{label}</p>
                    <p className="mt-2 truncate text-2xl font-bold tracking-tight sm:text-[26px]">
                        {loading ? <span className="inline-block h-7 w-32 animate-pulse rounded-lg bg-muted" /> : <CountUp value={value} format={format} />}
                    </p>
                </div>
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm ${toneClass}`}>
                    <Icon className="h-5 w-5" />
                </span>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs">
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
        </motion.div>
    );
}

export function RecentTransactionsCard({
    title,
    subtitle,
    icon: Icon,
    rows,
    loading,
    format,
    index = 0,
    onSelect,
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
}) {
    return (
        <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + index * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
        >
            <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
                <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-primary-text">
                        <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <div>
                        <h3 className="text-sm font-semibold">{title}</h3>
                        <p className="text-xs text-muted-foreground">{subtitle}</p>
                    </div>
                </div>
                {onSelect && !!rows?.length && <span className="hidden text-xs text-muted-foreground sm:inline">Click a row to view</span>}
            </header>

            <div className="relative overflow-x-auto">
                <table className="w-full min-w-[620px] text-sm">
                    <thead>
                        <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                            <th className="px-5 py-2.5 font-medium">S.No</th>
                            <th className="px-3 py-2.5 font-medium">Smith</th>
                            <th className="px-3 py-2.5 text-right font-medium">Receipt</th>
                            <th className="px-3 py-2.5 text-right font-medium">Issue</th>
                            <th className="px-3 py-2.5 text-right font-medium">Balance</th>
                            <th className="px-3 py-2.5 font-medium">Remark</th>
                            <th className="w-16 px-5 py-2.5 text-right font-medium" aria-label="Files" title="Files">
                                <Paperclip className="ml-auto h-3.5 w-3.5" aria-hidden />
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {loading &&
                            Array.from({ length: 4 }).map((_, i) => (
                                <tr key={i}>
                                    <td colSpan={7} className="px-5 py-3">
                                        <div className="h-4 w-full animate-pulse rounded bg-muted" />
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
                                    className={`group transition-colors hover:bg-muted/60 ${onSelect ? "cursor-pointer focus:bg-muted/60 focus:outline-none" : ""}`}
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
                                    <td className="px-5 py-3 font-medium text-muted-foreground">{r.sno}</td>
                                    <td className="px-3 py-3">
                                        <p className="font-medium">{r.smithName || "—"}</p>
                                        {r.date && <p className="text-xs text-muted-foreground">{r.date.split("-").reverse().join("-")}</p>}
                                    </td>
                                    <td className="px-3 py-3 text-right font-medium text-emerald-600 dark:text-emerald-400">
                                        {r.receipt ? format(r.receipt) : "—"}
                                    </td>
                                    <td className="px-3 py-3 text-right font-medium text-red-600 dark:text-red-400">
                                        {r.issue ? format(r.issue) : "—"}
                                    </td>
                                    <td className="px-3 py-3 text-right font-semibold">{format(r.balance)}</td>
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
                                <td colSpan={7} className="px-5 py-10 text-center text-sm text-muted-foreground">
                                    <Inbox className="mx-auto mb-2 h-6 w-6" />
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
