"use client";

import { formatReportNumber } from "../lib/report-format";

const wt = (v: number | null) => formatReportNumber(v ?? 0, 3);
const amt = (v: number | null) => formatReportNumber(v ?? 0, 2);

/** One summary card: receipt (green), issue (red) or balance. */
export default function TotalCard({ label, tone, gross, net, amount }: {
    label: string; tone: "receipt" | "issue" | "balance"; gross: number | null; net: number | null; amount: number | null;
}) {
    const colors = tone === "receipt"
        ? "border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10"
        : tone === "issue"
            ? "border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10"
            : "border-border bg-muted/50";
    const heading = tone === "receipt" ? "text-emerald-800 dark:text-emerald-300" : tone === "issue" ? "text-red-800 dark:text-red-300" : "text-foreground";
    return (
        <div className={`rounded-xl border px-3 py-2 ${colors}`}>
            <p className={`text-xs font-bold tracking-wide ${heading}`}>{label}</p>
            <dl className="mt-1 grid grid-cols-3 gap-2 text-xs">
                {[["GRS", wt(gross)], ["PUREWT", wt(net)], ["AMOUNT", amt(amount)]].map(([k, v]) => (
                    <div key={k} className="min-w-0">
                        <dt className="text-[10px] text-muted-foreground">{k}</dt>
                        <dd className="truncate text-sm font-semibold tabular-nums">{v}</dd>
                    </div>
                ))}
            </dl>
        </div>
    );
}
