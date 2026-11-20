"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogTitle } from "@mui/material";
import { FileSpreadsheet, FileText, Loader2, Printer } from "lucide-react";
import { getApiErrorMessage } from "@/lib/api/envelope";
import { useAuth } from "@/src/features/auth/lib/auth-context";
import { useToast } from "@/src/providers/toast-provider";
import { ghostButton, inputClass, primaryButton } from "@/src/module/role/component/ui";
import {
    DEFAULT_EXPORT_OPTIONS, formatPrintedAt, printExport,
    type ExportColumn, type ExportDoc, type ExportOptions, type ExportRow, type ExportSummary,
} from "./export-doc";

// "Print / Export" dialog used by every report: asks for the title, the columns
// and what else goes on the page, then prints, or downloads PDF or Excel.
// Choices are remembered per report (storageKey) when "Remember" is ticked.

type Props = {
    open: boolean;
    onClose: () => void;
    /** Per-report key for the remembered choices, e.g. "daybook". */
    storageKey: string;
    defaultTitle: string;
    filters?: string;
    columns: ExportColumn[];
    /** Columns ticked the first time (all when omitted). */
    defaultColumns?: string[];
    rows: ExportRow[];
    summary?: ExportSummary;
    /** Whether "Totals summary" starts ticked (until the user's choice is remembered). Default true. */
    summaryDefault?: boolean;
};

type Saved = Partial<ExportOptions> & { columns?: string[] };

const load = (key: string): Saved => {
    try {
        const saved = JSON.parse(localStorage.getItem(`smith.export.${key}`) ?? "null");
        return saved && typeof saved === "object" ? saved : {};
    } catch {
        return {};
    }
};

/** Column heading with its group, e.g. "RECEIPT GROSS". */
const columnName = (col: ExportColumn) => (col.group ? `${col.group} ${col.label}` : col.label);

export default function ExportDialog({ open, onClose, storageKey, defaultTitle, filters, columns, defaultColumns, rows, summary, summaryDefault = true }: Props) {
    const { allDetails } = useAuth();
    const { addToast } = useToast();
    const [options, setOptions] = useState<ExportOptions>(DEFAULT_EXPORT_OPTIONS);
    const [chosen, setChosen] = useState<string[]>([]);
    const [title, setTitle] = useState(defaultTitle);
    const [remember, setRemember] = useState(true);
    const [busy, setBusy] = useState<"" | "pdf" | "excel">("");

    const allKeys = useMemo(() => columns.map((c) => c.key), [columns]);
    // Each time it opens: remembered choices and the title for the current filters.
    useEffect(() => {
        if (!open) return;
        const saved = load(storageKey);
        const { columns: savedColumns, ...savedOptions } = saved;
        setOptions({ ...DEFAULT_EXPORT_OPTIONS, showSummary: summaryDefault, ...savedOptions });
        const start = savedColumns?.filter((k) => allKeys.includes(k));
        setChosen(start?.length ? start : (defaultColumns ?? allKeys).filter((k) => allKeys.includes(k)));
        setTitle(defaultTitle);
    }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

    const set = <K extends keyof ExportOptions>(key: K, value: ExportOptions[K]) => setOptions((o) => ({ ...o, [key]: value }));
    const picked = columns.filter((c) => chosen.includes(c.key));
    const canExport = picked.length > 0 && rows.length > 0 && !busy;
    const userName = String(allDetails?.userName ?? allDetails?.username ?? "").toUpperCase();

    const run = async (kind: "print" | "pdf" | "excel") => {
        if (!canExport) return;
        if (remember) {
            try { localStorage.setItem(`smith.export.${storageKey}`, JSON.stringify({ ...options, columns: chosen })); } catch { /* storage blocked */ }
        }
        const doc: ExportDoc = {
            title, filters, rows, summary, userName,
            columns: picked,
            printedAt: formatPrintedAt(new Date()),
        };
        try {
            if (kind === "print") {
                printExport(doc, options);
                onClose();
                return;
            }
            setBusy(kind);
            if (kind === "pdf") await (await import("./export-pdf")).downloadExportPdf(doc, options);
            else await (await import("./export-excel")).downloadExportExcel(doc, options);
            onClose();
        } catch (failure) {
            addToast({ type: "error", title: "Export failed", message: getApiErrorMessage(failure) });
        } finally {
            setBusy("");
        }
    };

    const check = (label: string, key: keyof ExportOptions) => (
        <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" className="accent-[var(--primary)]" checked={options[key] as boolean}
                onChange={(event) => set(key, event.target.checked as never)} />
            {label}
        </label>
    );

    return (
        <Dialog open={open} onClose={onClose} aria-labelledby="export-dialog-title" fullWidth maxWidth="sm"
            slotProps={{ paper: { sx: { backgroundColor: "var(--card)", color: "var(--foreground)" } } }}>
            <DialogTitle id="export-dialog-title" sx={{ pb: 1 }}>Print / Export</DialogTitle>
            <div className="space-y-4 px-6 pb-6" data-enter-nav="off">
                <label className="grid gap-1.5 text-xs font-medium">
                    Title
                    <textarea rows={2} value={title} onChange={(event) => setTitle(event.target.value)}
                        className={`${inputClass} h-auto py-2`} />
                </label>

                <fieldset className="rounded-xl border border-border p-3">
                    <legend className="px-1 text-xs font-semibold">Columns</legend>
                    <label className="mb-2 flex items-center gap-2 text-xs font-semibold">
                        <input type="checkbox" className="accent-[var(--primary)]" checked={chosen.length === allKeys.length}
                            onChange={(event) => setChosen(event.target.checked ? allKeys : allKeys.slice(0, 1))} />
                        All columns
                    </label>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
                        {columns.map((col) => (
                            <label key={col.key} className="flex items-center gap-2 text-xs">
                                <input type="checkbox" className="accent-[var(--primary)]" checked={chosen.includes(col.key)}
                                    onChange={(event) => setChosen((list) => allKeys.filter((k) =>
                                        k === col.key ? event.target.checked : list.includes(k)))} />
                                {columnName(col)}
                            </label>
                        ))}
                    </div>
                </fieldset>

                <fieldset className="rounded-xl border border-border p-3">
                    <legend className="px-1 text-xs font-semibold">On the page</legend>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
                        {check("Filters under title", "showFilters")}
                        {summary && check("Totals summary", "showSummary")}
                        {check("Print date & time", "printDateTime")}
                        {check("Printed by (user)", "printUser")}
                        {check("Page numbers", "pageNumbers")}
                        {check("Colours", "colors")}
                        {check("Cell borders", "borders")}
                        {check("Bold headings", "boldHeadings")}
                        {check("Repeat header", "repeatHeader")}
                        {check("Landscape", "landscape")}
                    </div>
                    <label className="mt-3 flex items-center gap-2 text-xs">
                        Font size
                        <select value={options.fontSize} onChange={(event) => set("fontSize", event.target.value as ExportOptions["fontSize"])}
                            className="rounded-lg border border-border bg-background px-2 py-1 text-xs">
                            <option value="small">Small</option>
                            <option value="normal">Normal</option>
                            <option value="large">Large</option>
                        </select>
                    </label>
                </fieldset>

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <label className="flex items-center gap-2 text-xs">
                        <input type="checkbox" className="accent-[var(--primary)]" checked={remember}
                            onChange={(event) => setRemember(event.target.checked)} />
                        Remember these choices
                    </label>
                    <div className="flex flex-wrap gap-2">
                        <button type="button" className={ghostButton} onClick={onClose}>Cancel</button>
                        <button type="button" className={ghostButton} onClick={() => run("excel")} disabled={!canExport}>
                            {busy === "excel" ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />} Excel
                        </button>
                        <button type="button" className={ghostButton} onClick={() => run("pdf")} disabled={!canExport}>
                            {busy === "pdf" ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />} PDF
                        </button>
                        <button type="button" className={primaryButton} onClick={() => run("print")} disabled={!canExport}>
                            <Printer size={16} /> Print
                        </button>
                    </div>
                </div>
                {!picked.length && <p role="alert" className="text-xs text-red-600">Select at least one column.</p>}
            </div>
        </Dialog>
    );
}
