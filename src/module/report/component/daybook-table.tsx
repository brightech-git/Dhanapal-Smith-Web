"use client";

import React from "react";
import type { DaybookFigures, DaybookLine } from "../lib/daybook-lines";
import { formatReportDate, formatReportNumber } from "../lib/report-format";

// The day book table on screen. Receipt columns are light green, issue columns
// light red. Print, PDF and Excel are built from the same lines (see daybookExport).

export type DaybookColumnKey =
    | "details" | "date"
    | "rGross" | "rTouch" | "rNet" | "rAmount"
    | "iGross" | "iTouch" | "iNet" | "iAmount"
    | "remark";

export type DaybookColumn = {
    key: DaybookColumnKey;
    label: string;
    /** Receipt or issue columns sit under a shared heading. */
    side?: "receipt" | "issue";
    numeric?: boolean;
};

export const DAYBOOK_COLUMNS: DaybookColumn[] = [
    { key: "details", label: "DETAILS" },
    { key: "date", label: "DATE" },
    { key: "rGross", label: "GROSS", side: "receipt", numeric: true },
    { key: "rTouch", label: "TOUCH", side: "receipt", numeric: true },
    { key: "rNet", label: "NET", side: "receipt", numeric: true },
    { key: "rAmount", label: "AMOUNT", side: "receipt", numeric: true },
    { key: "iGross", label: "GROSS", side: "issue", numeric: true },
    { key: "iTouch", label: "TOUCH", side: "issue", numeric: true },
    { key: "iNet", label: "NET", side: "issue", numeric: true },
    { key: "iAmount", label: "AMOUNT", side: "issue", numeric: true },
    // { key: "remark", label: "REMARK" },
];

export const SIDE_LABEL = { receipt: "RECEIPT", issue: "ISSUE" } as const;

/** Light green for receipt, light red for issue. */
export const SIDE_BG = {
    receipt: "bg-emerald-50 dark:bg-emerald-500/10",
    issue: "bg-red-50 dark:bg-red-500/10",
} as const;

const decimalsOf = (key: DaybookColumnKey) => (key.endsWith("Touch") || key.endsWith("Amount") ? 2 : 3);

/** A figure as text: weights 3 decimals, touch and amount 2. */
export const daybookFigure = (figures: DaybookFigures, key: DaybookColumnKey) =>
    formatReportNumber(figures[key as keyof DaybookFigures], decimalsOf(key));

export const daybookSmith = (line: Extract<DaybookLine, { kind: "entry" }>) =>
    [line.row.smithId, line.row.smithName].filter((v) => v != null && v !== "").join(" ") || "-";

export default function DaybookTable({ lines, columns }: { lines: DaybookLine[]; columns: DaybookColumn[] }) {
    const sideStart = (index: number) => !!columns[index].side && columns[index - 1]?.side !== columns[index].side;
    const tone = (column: DaybookColumn) => (column.side ? SIDE_BG[column.side] : "");

    const headerTop: React.ReactNode[] = [];
    const headerSub: React.ReactNode[] = [];
    columns.forEach((column, index) => {
        if (!column.side) {
            headerTop.push(
                <th key={column.key} scope="col" rowSpan={2} className="bg-muted px-3 py-2 text-left align-bottom font-semibold">
                    {column.label}
                </th>,
            );
            return;
        }
        const first = sideStart(index);
        if (first) {
            headerTop.push(
                <th key={column.side} scope="colgroup" colSpan={columns.filter((c) => c.side === column.side).length}
                    className={`border-l border-border px-3 py-1.5 text-center font-semibold ${column.side === "receipt"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300"
                        : "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300"}`}>
                    {SIDE_LABEL[column.side]}
                </th>,
            );
        }
        headerSub.push(
            <th key={column.key} scope="col"
                className={`px-3 py-1.5 text-right font-semibold ${tone(column)} ${first ? "border-l border-border" : ""}`}>
                {column.label}
            </th>,
        );
    });

    const td = (index: number, content: React.ReactNode, total = false) => {
        const column = columns[index];
        return (
            <td key={column.key}
                className={`whitespace-nowrap px-3 py-1.5 ${column.numeric ? "text-right tabular-nums" : ""} ${total ? "" : tone(column)} ${sideStart(index) ? "border-l border-border" : ""}`}>
                {content}
            </td>
        );
    };

    return (
        <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>{headerTop}</tr>
                <tr className="border-t border-border">{headerSub}</tr>
            </thead>
            <tbody>
                {lines.map((line, lineIndex) => {
                    if (line.kind === "type" || line.kind === "group") {
                        return (
                            <tr key={lineIndex} className="border-t border-border">
                                <td colSpan={columns.length}
                                    className={line.kind === "type"
                                        ? "px-3 pb-1 pt-3 text-sm font-bold text-emerald-700 dark:text-emerald-400"
                                        : "px-3 py-1 pl-7 text-xs font-semibold text-primary-text"}>
                                    {line.label}
                                </td>
                            </tr>
                        );
                    }
                    if (line.kind === "entry") {
                        return (
                            <tr key={lineIndex} className="border-t border-border hover:brightness-95">
                                {columns.map((column, index) => {
                                    if (column.key === "details") return td(index, <span className="pl-8">{daybookSmith(line)}</span>);
                                    if (column.key === "date") return td(index, formatReportDate(line.row.tranDate));
                                    if (column.key === "remark") return td(index, line.row.remark ?? "");
                                    return td(index, daybookFigure(line.figures, column.key));
                                })}
                            </tr>
                        );
                    }
                    const rowClass = line.kind === "groupTotal"
                        ? "border-t border-border bg-muted/40 font-semibold"
                        : line.kind === "typeTotal"
                            ? "border-t border-border bg-muted/80 font-bold"
                            : "border-t-2 border-border bg-primary/10 font-bold";
                    return (
                        <tr key={lineIndex} className={rowClass}>
                            {columns.map((column, index) => {
                                if (column.key === "details") return td(index, <span className={line.kind === "groupTotal" ? "pl-8" : ""}>{line.label}</span>, true);
                                if (!column.numeric || column.key.endsWith("Touch")) return td(index, "", true);
                                return td(index, daybookFigure(line.figures, column.key), true);
                            })}
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}
