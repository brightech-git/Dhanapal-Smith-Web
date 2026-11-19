"use client";

import React, { useRef, useState } from "react";
import { Dialog, DialogTitle } from "@mui/material";
import { Download, FileSpreadsheet, FileText, Printer } from "lucide-react";
import { useToast } from "@/src/providers/toast-provider";
import { getApiErrorMessage } from "@/lib/api/envelope";
import { downloadReportExcel, downloadReportPdf, type ReportExportData } from "./report-export";
import { ghostButton } from "@/src/module/role/component/ui";
import { paginateAmountReport } from "./paginate-amount-report";
import type { ResultSet } from "../api/report.api";

export type ReportColumn<T> = {
    key: string;
    label: string;
    printLabel?: string;
    align?: "left" | "right" | "center";
    render: (row: T) => React.ReactNode;
};

type ReportOutputProps<T extends { resultSet: ResultSet }> = {
    title: string;
    /** Filters in words, printed under the title. */
    subtitle?: string;
    columns: ReportColumn<T>[];
    rows: T[];
    loading?: boolean;
    error?: string | null;
    defaultPrintColumns?: string[];
    allowColumnFlow?: boolean;
    defaultColumnsAcross?: 1 | 2;
};

const alignClass = (align?: string) => (align === "right" ? "text-right tabular-nums" : align === "center" ? "text-center" : "text-left");

/** Shared column selection, printing, PDF and Excel actions for API report rows. */
export default function ReportOutput<T extends { resultSet: ResultSet }>({
    title, subtitle, columns, rows, loading, error, defaultPrintColumns, allowColumnFlow = false, defaultColumnsAcross = 1,
}: ReportOutputProps<T>) {
    const { addToast } = useToast();
    const [exporting, setExporting] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);
    const [printOpen, setPrintOpen] = useState(false);
    const [chosenColumns, setChosenColumns] = useState<string[] | null>(null);
    const [chosenColumnsAcross, setColumnsAcross] = useState<1 | 2>(defaultColumnsAcross);
    const columnsAcross = allowColumnFlow ? chosenColumnsAcross : 1;
    const printKeys = chosenColumns ?? defaultPrintColumns ?? columns.map((column) => column.key);
    const printColumns = printKeys.flatMap((key) => columns.filter((column) => column.key === key));
    const hasRecords = rows.some((row) => row.resultSet === 1);

    const download = async (format: "pdf" | "excel") => {
        if (loading || error || exporting || !printColumns.length) return;
        setExporting(true);
        try {
            const table = printRef.current?.querySelector("table");
            if (!table) throw new Error("Report data is unavailable");
            const report: ReportExportData = {
                title,
                subtitle,
                columns: printColumns.map((column) => ({ label: column.printLabel ?? column.label, align: column.align })),
                rows: Array.from(table.tBodies[0]?.rows ?? []).map((row) => ({
                    resultSet: Number(row.dataset.set),
                    cells: Array.from(row.cells).map((cell) => cell.textContent ?? ""),
                })),
            };
            if (format === "pdf") await downloadReportPdf(report, columnsAcross);
            else await downloadReportExcel(report);
        } catch (failure) {
            addToast({ type: "error", title: "Export failed", message: getApiErrorMessage(failure) });
        } finally {
            setExporting(false);
        }
    };

    const print = () => {
        if (loading || error || !printColumns.length) return;
        const html = printRef.current?.innerHTML;
        const win = html ? window.open("", "_blank") : null;
        if (!win || !html) return;
        win.document.write(`<!doctype html><html><head><title>Report</title><style>
            @page { size: A4; margin: 10mm; }
            body { margin: 0; font-family: Arial, sans-serif; font-size: 11px; color: #000; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            h1 { font-size: 16px; margin: 0; } p { margin: 2px 0 8px; font-size: 11px; }
            .print-page { width: 190mm; height: 277mm; box-sizing: border-box; break-after: page; }
            .print-page:last-child { break-after: auto; }
            .print-columns { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1mm; align-items: start; }
            .print-columns table { table-layout: fixed; }
            .print-columns th, .print-columns td { overflow-wrap: anywhere; }
            thead { display: table-header-group; }
            tr { break-inside: avoid; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #777; padding: 4px 6px; }
            th { background: #ddd; }
            .text-right { text-align: right; } .text-center { text-align: center; }
            tr[data-set="2"] td { background: #eee; font-weight: bold; }
            tr[data-set="3"] td { background: #ddd; font-weight: bold; }
        </style></head><body></body></html>`);
        const heading = win.document.createElement("h1");
        heading.textContent = title;
        const header = win.document.createElement("header");
        header.appendChild(heading);
        if (subtitle) {
            const description = win.document.createElement("p");
            description.textContent = subtitle;
            header.appendChild(description);
        }
        const report = win.document.createElement("div");
        report.innerHTML = html;
        if (columnsAcross === 2) {
            const table = report.querySelector("table");
            if (!table) { win.close(); return; }
            paginateAmountReport(win.document, table, header);
        } else {
            win.document.body.append(header, report);
        }
        win.document.close();
        win.focus();
        win.print();
        win.close();
    };

    return (
        <div className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2.5">
                <p className="min-w-0 truncate text-xs text-muted-foreground">{subtitle}</p>
                <button type="button" data-shortcut="print" className={`${ghostButton} h-8 px-3`} onClick={() => setPrintOpen(true)} disabled={!hasRecords || loading || !!error}>
                    <Download className="h-4 w-4" /> Print / Export
                </button>
            </div>
            <Dialog open={printOpen} onClose={() => setPrintOpen(false)} aria-labelledby="report-print-title"
                fullWidth maxWidth="xs" slotProps={{ paper: { sx: { backgroundColor: "var(--card)", color: "var(--foreground)" } } }}>
                <DialogTitle id="report-print-title">Print / Export</DialogTitle>
                <div className="space-y-5 px-6 pb-6">
                    <fieldset className="space-y-2">
                        <legend className="mb-2 text-sm font-semibold">Columns to include</legend>
                        {columns.map((column) => (
                            <label key={column.key} className="flex items-center gap-2 text-xs">
                                <input type="checkbox" checked={printKeys.includes(column.key)}
                                    className="accent-[var(--primary)]"
                                    onChange={(event) => setChosenColumns(event.target.checked
                                        ? [...printKeys, column.key] : printKeys.filter((key) => key !== column.key))} />
                                {column.printLabel ?? column.label}
                            </label>
                        ))}
                    </fieldset>
                    {allowColumnFlow && <label className="grid gap-1 text-xs font-medium">
                        Report columns
                        <select value={columnsAcross} onChange={(event) => setColumnsAcross(Number(event.target.value) as 1 | 2)}
                            className="rounded-lg border border-border bg-background px-3 py-2">
                            <option value={1}>One</option>
                            <option value={2}>Two, fill left then right</option>
                        </select>
                    </label>}
                    <div className="overflow-x-auto rounded-lg border border-border p-2">
                        <p className="text-xs text-muted-foreground">
                            {Array.from({ length: columnsAcross }, () => printColumns.map((column) => column.printLabel ?? column.label).join(" · ")).join("  |  ") || "Select at least one column."}
                        </p>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                        <button type="button" className={ghostButton} onClick={() => download("pdf")}
                            disabled={!printColumns.length || !hasRecords || loading || !!error || exporting}>
                            <FileText size={16} /> PDF
                        </button>
                        <button type="button" className={ghostButton} onClick={() => download("excel")}
                            disabled={!printColumns.length || !hasRecords || loading || !!error || exporting}>
                            <FileSpreadsheet size={16} /> Excel
                        </button>
                        <button type="button" data-shortcut="print" className={ghostButton} onClick={print}
                            disabled={!printColumns.length || !hasRecords || loading || !!error}>
                            <Printer size={16} /> Print
                        </button>
                        <button type="button" className={ghostButton} onClick={() => setPrintOpen(false)}>Cancel</button>
                    </div>
                    {exporting && <p role="status" className="text-xs text-muted-foreground">Preparing download…</p>}
                </div>
            </Dialog>
            <div ref={printRef} hidden>
                <table>
                    <thead><tr>{printColumns.map((column) => (
                        <th key={column.key} className={alignClass(column.align)}>{column.printLabel ?? column.label}</th>
                    ))}</tr></thead>
                    <tbody>{rows.map((row, index) => (
                        <tr key={index} data-set={row.resultSet}>
                            {printColumns.map((column) => (
                                <td key={column.key} className={alignClass(column.align)}>{column.render(row)}</td>
                            ))}
                        </tr>
                    ))}</tbody>
                </table>
            </div>
        </div>
    );
}
