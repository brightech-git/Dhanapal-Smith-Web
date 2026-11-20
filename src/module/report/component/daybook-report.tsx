"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Download, Inbox, Loader2 } from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api/envelope";
import ComboBox from "@/src/components/ui/combo-box";
import DateInput from "@/src/components/ui/date-input";
import MultiComboBox from "@/src/components/ui/multi-combo-box";
import ExportDialog from "@/src/components/export/export-dialog";
import type { ExportColumn, ExportRow, ExportSummary } from "@/src/components/export/export-doc";
import { fetchItems, itemQueryKey } from "@/src/module/item/item-form";
import { metalQueryKey, type Metal } from "@/src/module/metal/metal-form";
import { CardHeader, card, ghostButton, inputClass } from "@/src/module/role/component/ui";
import { DAYBOOK_TRAN_TYPES, fetchDaybook } from "../api/report.api";
import { buildDaybookLines, daybookTotals, type DaybookLine } from "../lib/daybook-lines";
import { formatReportDate, formatReportNumber } from "../lib/report-format";
import TotalCard from "./total-card";
import DaybookTable, { DAYBOOK_COLUMNS, SIDE_LABEL, daybookFigure, daybookSmith } from "./daybook-table";
import { FilterField, ReportFilterForm, SmithFilter, monthToDate } from "./report-filters";

type Period = "range" | "asOn";
type Filters = {
    period: Period;
    fromDate: string;
    toDate: string;
    smithIds: string[];
    metalIds: string[];
    itemIds: string[];
    tranTypes: string[];
};

const initial = (): Filters => ({ period: "range", ...monthToDate(), smithIds: [], metalIds: [], itemIds: [], tranTypes: [] });
const PERIOD_OPTIONS = [
    { value: "range", label: "FROM - TO DATE" },
    { value: "asOn", label: "AS ON DATE" },
];

/** "Day Book From dd-mm-yyyy To dd-mm-yyyy", or "Day Book As On dd-mm-yyyy". */
const titleFor = (f: Filters) =>
    f.period === "asOn"
        ? `Day Book As On ${formatReportDate(f.toDate)}`
        : `Day Book From ${formatReportDate(f.fromDate)} To ${formatReportDate(f.toDate)}`;

const names = (values: string[], options: { value: string; label: string }[]) =>
    values.map((v) => options.find((o) => o.value === v)?.label ?? v).join(", ");

/** Columns for print / PDF / Excel: receipt and issue under their own heading and colour. */
const EXPORT_COLUMNS: ExportColumn[] = DAYBOOK_COLUMNS.map((c) => ({
    key: c.key,
    label: c.label,
    align: c.numeric ? "right" : "left",
    numeric: c.numeric,
    group: c.side ? SIDE_LABEL[c.side] : undefined,
    tone: c.side,
}));
const EXPORT_DEFAULT_COLUMNS = DAYBOOK_COLUMNS.filter((c) => c.key !== "date" && c.key !== "remark").map((c) => c.key);

const toExportRows = (lines: DaybookLine[]): ExportRow[] => lines.map((line) => {
    if (line.kind === "type") return { kind: "section", label: line.label };
    if (line.kind === "group") return { kind: "subsection", label: line.label };
    const cells: Record<string, string> = {};
    for (const column of DAYBOOK_COLUMNS) {
        if (column.key === "details") cells.details = line.kind === "entry" ? daybookSmith(line) : line.label;
        else if (column.key === "date") cells.date = line.kind === "entry" ? formatReportDate(line.row.tranDate) : "";
        else if (column.key === "remark") cells.remark = line.kind === "entry" ? line.row.remark ?? "" : "";
        else cells[column.key] = line.kind !== "entry" && column.key.endsWith("Touch") ? "" : daybookFigure(line.figures, column.key);
    }
    const kind = line.kind === "entry" ? "data" : line.kind === "groupTotal" ? "subtotal" : line.kind === "typeTotal" ? "total" : "grand";
    return { kind, cells };
});

const wt = (v: number | null) => formatReportNumber(v ?? 0, 3);
const amt = (v: number | null) => formatReportNumber(v ?? 0, 2);

/**
 * Day book: every transaction for a period (or up to a date), grouped by type,
 * then item, then smith, with Receipt and Issue columns (gross, touch, net, amount),
 * totals per item and per type, and overall totals above the table.
 */
export default function DaybookReport() {
    const [draft, setDraft] = useState<Filters>(initial);
    const [applied, setApplied] = useState<Filters>(initial);
    const [error, setError] = useState("");
    const [exportOpen, setExportOpen] = useState(false);

    const metals = useQuery({ queryKey: metalQueryKey, queryFn: () => api.get<Metal[]>("metal") });
    const metalOptions = (metals.data ?? []).map((m) => ({ value: m.metalId, label: `${m.metalId} · ${m.metalName}` }));
    const items = useQuery({ queryKey: [...itemQueryKey, { active: "Y" }], queryFn: () => fetchItems({ active: "Y" }) });
    const allItems = items.data?.items ?? [];
    // Items of the chosen metals (all items when no metal is picked).
    const itemOptions = allItems
        .filter((i) => !draft.metalIds.length || draft.metalIds.includes(i.metalId))
        .map((i) => ({ value: String(i.itemId), label: i.itemName }));

    const apply = () => {
        if (!draft.toDate || (draft.period === "range" && !draft.fromDate)) {
            setError(draft.period === "asOn" ? "Enter the as on date." : "Enter the from and to dates.");
            return;
        }
        if (draft.period === "range" && draft.fromDate > draft.toDate) {
            setError("From date must be on or before the to date.");
            return;
        }
        setError("");
        setApplied(draft);
    };

    const query = useQuery({
        queryKey: ["report", "daybook", applied],
        queryFn: () => fetchDaybook({
            fromDate: applied.period === "range" ? applied.fromDate : undefined,
            toDate: applied.toDate,
            smithIds: applied.smithIds,
            metalIds: applied.metalIds,
            itemIds: applied.itemIds,
            tranTypes: applied.tranTypes,
        }),
    });
    const lines = useMemo(() => buildDaybookLines(query.data ?? []), [query.data]);
    const totals = useMemo(() => daybookTotals(lines), [lines]);
    const exportRows = useMemo(() => toExportRows(lines), [lines]);
    const hasRows = (query.data?.length ?? 0) > 0;

    const summary: ExportSummary = {
        columns: ["GROSS", "PUREWT", "AMOUNT"],
        rows: [
            { label: "RECEIPT", tone: "receipt", cells: [wt(totals.receipt.gross), wt(totals.receipt.net), amt(totals.receipt.amount)] },
            { label: "ISSUE", tone: "issue", cells: [wt(totals.issue.gross), wt(totals.issue.net), amt(totals.issue.amount)] },
            { label: "BALANCE", cells: [wt(totals.balance.gross), wt(totals.balance.net), amt(totals.balance.amount)] },
        ],
    };

    const filtersText = [
        applied.smithIds.length ? `Smiths: ${applied.smithIds.length} selected` : "",
        applied.metalIds.length ? `Metal: ${applied.metalIds.join(", ")}` : "",
        applied.itemIds.length ? `Items: ${applied.itemIds.length > 3 ? `${applied.itemIds.length} selected`
            : names(applied.itemIds, allItems.map((i) => ({ value: String(i.itemId), label: i.itemName })))}` : "",
        applied.tranTypes.length ? `Types: ${names(applied.tranTypes, DAYBOOK_TRAN_TYPES)}` : "",
    ].filter(Boolean).join(" · ");
    const title = titleFor(applied);

    return (
        <section className={card}>
            <CardHeader icon={BookOpen} title="DAY BOOK" subtitle="Receipts and issues by type, item and smith" />
            <ReportFilterForm onSubmit={apply} onReset={() => { setDraft(initial()); setApplied(initial()); setError(""); }} busy={query.isFetching}>
                <FilterField label="PERIOD" id="db-period">
                    <ComboBox id="db-period" labelId="db-period-label" value={draft.period} options={PERIOD_OPTIONS}
                        placeholder="Period" onChange={(value) => setDraft((d) => ({ ...d, period: (value || "range") as Period }))} />
                </FilterField>
                {draft.period === "range" && (
                    <FilterField label="FROM DATE" id="db-from">
                        <DateInput id="db-from" className={inputClass} value={draft.fromDate} maxDate={new Date()}
                            onChange={(fromDate) => setDraft((d) => ({ ...d, fromDate }))} />
                    </FilterField>
                )}
                <FilterField label={draft.period === "asOn" ? "AS ON DATE" : "TO DATE"} id="db-to">
                    <DateInput id="db-to" className={inputClass} value={draft.toDate} maxDate={new Date()}
                        onChange={(toDate) => setDraft((d) => ({ ...d, toDate }))} />
                </FilterField>
                <SmithFilter id="db-smith" value={draft.smithIds} onChange={(smithIds) => setDraft((d) => ({ ...d, smithIds }))} />
                <FilterField label="METAL" id="db-metal">
                    <MultiComboBox id="db-metal" labelId="db-metal-label" value={draft.metalIds} options={metalOptions}
                        placeholder={metals.isPending ? "Loading metals…" : "All metals"}
                        onChange={(metalIds) => setDraft((d) => {
                            // Keep only items that belong to the chosen metals.
                            const keep = new Set(allItems.filter((i) => !metalIds.length || metalIds.includes(i.metalId)).map((i) => String(i.itemId)));
                            return { ...d, metalIds, itemIds: d.itemIds.filter((id) => keep.has(id)) };
                        })}
                        className="text-xs" />
                </FilterField>
                <FilterField label="ITEM" id="db-item">
                    <MultiComboBox id="db-item" labelId="db-item-label" value={draft.itemIds} options={itemOptions}
                        placeholder={items.isPending ? "Loading items…" : "All items"}
                        onChange={(itemIds) => setDraft((d) => ({ ...d, itemIds }))} />
                </FilterField>
                <FilterField label="TRAN TYPE" id="db-type">
                    <MultiComboBox id="db-type" labelId="db-type-label" value={draft.tranTypes} options={DAYBOOK_TRAN_TYPES}
                        placeholder="All types" onChange={(tranTypes) => setDraft((d) => ({ ...d, tranTypes }))} />
                </FilterField>
            </ReportFilterForm>
            {error && <p role="alert" className="border-b border-border px-4 py-2 text-xs text-red-600">{error}</p>}

            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2.5">
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{title}</p>
                    {filtersText && <p className="truncate text-xs text-muted-foreground">{filtersText}</p>}
                </div>
                <button type="button" data-shortcut="print" className={`${ghostButton} h-8 px-3`}
                    onClick={() => setExportOpen(true)} disabled={!hasRows || query.isFetching || query.isError}>
                    <Download className="h-4 w-4" /> Print / Export
                </button>
            </div>

            {hasRows && !query.isError && (
                <div className="grid gap-2 border-b border-border p-3 sm:grid-cols-3">
                    <TotalCard label="RECEIPT" tone="receipt" {...totals.receipt} />
                    <TotalCard label="ISSUE" tone="issue" {...totals.issue} />
                    <TotalCard label={`BALANCE · ${totals.count} ENTRIES`} tone="balance" {...totals.balance} />
                </div>
            )}

            {query.isPending ? (
                <p role="status" className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading day book…
                </p>
            ) : query.isError ? (
                <p role="alert" className="p-6 text-sm text-red-600">{getApiErrorMessage(query.error)}</p>
            ) : !hasRows ? (
                <p className="flex flex-col items-center gap-2 p-10 text-sm text-muted-foreground">
                    <Inbox className="h-6 w-6" /> No transactions match these filters.
                </p>
            ) : (
                <div className="max-h-[calc(100vh-20rem)] overflow-auto">
                    <DaybookTable lines={lines} columns={DAYBOOK_COLUMNS} />
                </div>
            )}

            <ExportDialog open={exportOpen} onClose={() => setExportOpen(false)} storageKey="daybook"
                defaultTitle={title} filters={filtersText} columns={EXPORT_COLUMNS} defaultColumns={EXPORT_DEFAULT_COLUMNS}
                rows={exportRows} summary={summary} />
        </section>
    );
}
