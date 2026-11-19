"use client";

import { Inbox, Loader2 } from "lucide-react";
import ReportOutput from "./report-output";
import type { ResultSet } from "../api/report.api";

export type { ReportColumn } from "./report-output";

type ReportTableProps<T extends { resultSet: ResultSet }> = React.ComponentProps<typeof ReportOutput<T>>;

const alignClass = (align?: string) => (align === "right" ? "text-right tabular-nums" : align === "center" ? "text-center" : "text-left");

/** Row style by resultSet: records plain, subtotals bold, grand total highlighted. */
const rowClass = (resultSet: ResultSet) =>
    resultSet === 3
        ? "bg-primary/10 font-bold text-foreground"
        : resultSet === 2
            ? "bg-muted/60 font-semibold"
            : "hover:bg-muted/40";

export default function ReportTable<T extends { resultSet: ResultSet }>(props: ReportTableProps<T>) {
    const { columns, rows, loading, error } = props;
    const hasRecords = rows.some((row) => row.resultSet === 1);
    return (
        <div className="min-w-0">
            <ReportOutput {...props} />
            {loading ? (
                <p role="status" className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading report…
                </p>
            ) : error ? (
                <p role="alert" className="p-6 text-sm text-red-600">{error}</p>
            ) : !hasRecords ? (
                <p className="flex flex-col items-center gap-2 p-10 text-sm text-muted-foreground">
                    <Inbox className="h-6 w-6" /> No transactions match these filters.
                </p>
            ) : (
                <div className="max-h-[calc(100vh-16rem)] overflow-auto">
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 z-10 bg-muted text-xs uppercase tracking-wide text-muted-foreground">
                            <tr>
                                {columns.map((column) => (
                                    <th key={column.key} scope="col" className={`whitespace-nowrap px-3 py-2.5 font-medium ${alignClass(column.align)}`}>
                                        {column.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, index) => (
                                <tr key={index} data-set={row.resultSet} className={`border-t border-border ${rowClass(row.resultSet)}`}>
                                    {columns.map((column) => (
                                        <td key={column.key} className={`whitespace-nowrap px-3 py-2 ${alignClass(column.align)}`}>
                                            {column.render(row)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

/** dd-mm-yyyy from YYYY-MM-DD, "" when empty. */
export const formatReportDate = (value?: string | null) => {
    const m = (value ?? "").match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
};

/** Fixed decimals with Indian grouping; "" for null. */
export const formatReportNumber = (value: number | null | undefined, decimals: number) =>
    value == null ? "" : Number(value).toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

/** Filters in words for the subtitle / print header. */
export const describeFilters = (parts: [string, string | undefined | null][]) =>
    parts.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(" · ") || "All transactions";
