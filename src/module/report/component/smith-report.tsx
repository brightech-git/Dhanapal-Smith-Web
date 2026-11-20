"use client";

import { useMemo, useState } from "react";
import Decimal from "decimal.js";
import { useQuery } from "@tanstack/react-query";
import { Download, Inbox, Loader2, MousePointerClick, Users } from "lucide-react";
import { getApiErrorMessage } from "@/lib/api/envelope";
import ExportDialog from "@/src/components/export/export-dialog";
import type { ExportColumn, ExportRow, ExportSummary } from "@/src/components/export/export-doc";
import { CardHeader, card, ghostButton } from "@/src/module/role/component/ui";
import { useSoftControlFlags } from "@/src/module/smith/context/soft-control-context";
import { fetchSmithReport, type SmithReportRow } from "../api/report.api";
import { formatReportNumber } from "../lib/report-format";
import { MetalFilter, ReportFilterForm, SmithFilter } from "./report-filters";
import SmithLedgerDialog from "./smith-ledger-dialog";

/**
 * Smith summary report: weight balance per metal and amount balance per smith,
 * with smith subtotals and a grand total. Double-click a smith to see their
 * transactions (today by default, with more filters there).
 */
export default function SmithReport() {

    const { weightItems } = useSoftControlFlags();
    const [draft, setDraft] = useState("");
    const [applied, setApplied] = useState("");
    const [smithIds, setSmithIds] = useState<string[]>([]);
    const [exportOpen, setExportOpen] = useState(false);
    const [openSmith, setOpenSmith] = useState<{ id: number; name: string } | null>(null);
    // Metal only applies when weight rows carry items (WEIGHTITEM = Y).
    const metalId = weightItems ? applied : "";

    const query = useQuery({
        queryKey: ["report", "smith", metalId],
        queryFn: () => fetchSmithReport(metalId || undefined),
    });

    // A smith with a single row gets no subtotal: it would only repeat that row.
    // Picked smiths hide the others (and their subtotals); the grand total row is rebuilt below.
    const rows = useMemo(() => {
        const picked = new Set(smithIds);
        const shown = (list: SmithReportRow[]) => !picked.size || list.some((r) => picked.has(String(r.smithId)));
        const out: SmithReportRow[] = [];
        let records: SmithReportRow[] = [];
        for (const row of query.data ?? []) {
            if (row.resultSet === 1) {
                records.push(row);
                continue;
            }
            if (shown(records)) {
                out.push(...records);
                if (row.resultSet === 2 && records.length > 1) out.push(row);
            }
            if (row.resultSet === 3 && !picked.size) out.push(row);
            records = [];
        }
        if (records.length && shown(records)) out.push(...records);
        return out;
    }, [query.data, smithIds]);

    // Totals of the smiths shown. Amount repeats on each metal row of a smith, so it counts once per smith.
    const totals = useMemo(() => {
        const records = rows.filter((r) => r.resultSet === 1);
        const amounts = new Map<number | null, number>();
        records.forEach((r) => amounts.set(r.smithId, Number(r.amount ?? 0)));
        return {
            smiths: amounts.size,
            weight: records.reduce((sum, r) => sum.plus(r.weight ?? 0), new Decimal(0)).toNumber(),
            amount: Array.from(amounts.values()).reduce((sum, v) => sum.plus(v), new Decimal(0)).toNumber(),
        };
    }, [rows]);
    // With smiths picked, the backend's grand total no longer matches, so add our own.
    const displayRows: SmithReportRow[] = smithIds.length && rows.length
        ? [...rows, { resultSet: 3, smithId: null, smithName: "TOTAL", metalId: null, metalName: null, weight: totals.weight, amount: totals.amount }]
        : rows;
    const hasRecords = displayRows.some((r) => r.resultSet === 1);

    const columns: ExportColumn[] = [
        { key: "smith", label: "SMITH" },
        ...(weightItems ? [{ key: "metal", label: "METAL" }] : []),
        { key: "weight", label: "WEIGHT BALANCE", align: "right", numeric: true },
        { key: "amount", label: "AMOUNT BALANCE", align: "right", numeric: true },
    ];
    const cellsOf = (r: SmithReportRow): Record<string, string> => ({
        smith: r.smithName ?? "",
        metal: r.resultSet === 1 ? r.metalName ?? r.metalId ?? "" : "",
        weight: formatReportNumber(r.weight, 3),
        amount: formatReportNumber(r.amount, 2),
    });
    const exportRows: ExportRow[] = displayRows.map((r) => ({
        kind: r.resultSet === 1 ? "data" : r.resultSet === 2 ? "subtotal" : "grand",
        cells: cellsOf(r),
    }));
    const filtersText = [metalId ? `Metal: ${metalId}` : "", smithIds.length ? `Smiths: ${smithIds.length} selected` : ""].filter(Boolean).join(" · ");
    const summary: ExportSummary = {
        columns: ["SMITHS", "WEIGHT BALANCE", "AMOUNT BALANCE"],
        rows: [{ label: "TOTAL", cells: [String(totals.smiths), formatReportNumber(totals.weight, 3), formatReportNumber(totals.amount, 2)] }],
    };

    return (
        <section className={card}>
            <CardHeader icon={Users} title="SMITH SUMMARY REPORT" subtitle="Weight and amount balance of every smith (receipt minus issue)" />
            <ReportFilterForm onSubmit={() => setApplied(draft)} onReset={() => { setDraft(""); setApplied(""); setSmithIds([]); }} busy={query.isFetching}>
                {weightItems && <MetalFilter id="sr-metal" value={draft} onChange={setDraft} />}
                <SmithFilter id="sr-smith" value={smithIds} onChange={setSmithIds} />
            </ReportFilterForm>

            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2.5">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MousePointerClick className="h-3.5 w-3.5" /> Double-click a smith to see their transactions.
                </p>
                <button type="button" data-shortcut="print" className={`${ghostButton} h-8 px-3`} onClick={() => setExportOpen(true)}
                    disabled={!hasRecords || query.isFetching || query.isError}>
                    <Download className="h-4 w-4" /> Print / Export
                </button>
            </div>

            {hasRecords && !query.isError && (
                <div className="grid grid-cols-1 gap-2 border-b border-border p-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-border bg-muted/50 px-3 py-2">
                        <p className="text-xs font-bold tracking-wide">SMITHS</p>
                        <p className="mt-1 text-lg font-semibold tabular-nums">{totals.smiths}</p>
                    </div>
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                        <p className="text-xs font-bold tracking-wide text-emerald-800 dark:text-emerald-300">TOTAL WEIGHT BALANCE</p>
                        <p className="mt-1 text-lg font-semibold tabular-nums">{formatReportNumber(totals.weight, 3)}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-accent-soft px-3 py-2">
                        <p className="text-xs font-bold tracking-wide text-primary-text">TOTAL AMOUNT BALANCE</p>
                        <p className="mt-1 text-lg font-semibold tabular-nums">{formatReportNumber(totals.amount, 2)}</p>
                    </div>
                </div>
            )}

            {query.isPending ? (
                <p role="status" className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading report…
                </p>
            ) : query.isError ? (
                <p role="alert" className="p-6 text-sm text-red-600">{getApiErrorMessage(query.error)}</p>
            ) : !hasRecords ? (
                <p className="flex flex-col items-center gap-2 p-10 text-sm text-muted-foreground">
                    <Inbox className="h-6 w-6" /> No smiths match these filters.
                </p>
            ) : (
                <div className="max-h-[calc(100vh-16rem)] overflow-auto">
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 z-10 bg-muted text-xs uppercase tracking-wide text-muted-foreground">
                            <tr>
                                {columns.map((c) => (
                                    <th key={c.key} scope="col" className={`whitespace-nowrap px-3 py-2.5 font-medium ${c.align === "right" ? "text-right" : "text-left"}`}>{c.label}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {displayRows.map((r, index) => {
                                const record = r.resultSet === 1 && r.smithId != null;
                                const cells = cellsOf(r);
                                return (
                                    <tr key={index}
                                        className={`border-t border-border ${r.resultSet === 3 ? "bg-primary/10 font-bold" : r.resultSet === 2 ? "bg-muted/60 font-semibold" : "cursor-pointer hover:bg-accent-soft"}`}
                                        title={record ? "Double-click to see transactions" : undefined}
                                        onDoubleClick={record ? () => setOpenSmith({ id: r.smithId!, name: r.smithName ?? `#${r.smithId}` }) : undefined}>
                                        {columns.map((c) => (
                                            <td key={c.key} className={`whitespace-nowrap px-3 py-2 ${c.align === "right" ? "text-right tabular-nums" : ""}`}>{cells[c.key]}</td>
                                        ))}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <ExportDialog open={exportOpen} onClose={() => setExportOpen(false)} storageKey="smith-summary"
                defaultTitle="Smith Summary Report" filters={filtersText} columns={columns} rows={exportRows}
                summary={summary} summaryDefault={false} />
            <SmithLedgerDialog smith={openSmith} onClose={() => setOpenSmith(null)} />
        </section>
    );
}
