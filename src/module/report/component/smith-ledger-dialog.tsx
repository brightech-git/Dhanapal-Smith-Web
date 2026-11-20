"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import Decimal from "decimal.js";
import { Download, Inbox, Loader2, RotateCcw, Search, X } from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api/envelope";
import ComboBox from "@/src/components/ui/combo-box";
import DateInput from "@/src/components/ui/date-input";
import MultiComboBox from "@/src/components/ui/multi-combo-box";
import ExportDialog from "@/src/components/export/export-dialog";
import type { ExportColumn, ExportRow, ExportSummary } from "@/src/components/export/export-doc";
import { fetchItems, itemQueryKey } from "@/src/module/item/item-form";
import { metalQueryKey, type Metal } from "@/src/module/metal/metal-form";
import { ghostButton, iconButton, inputClass, primaryButton } from "@/src/module/role/component/ui";
import { fetchSmithLedger, type TransactionApi, type TranType } from "@/src/module/smith/api/smith-transactions.api";
import type { DaybookRow } from "../api/report.api";
import { entryFigures, type DaybookFigures } from "../lib/daybook-lines";
import { formatReportDate, formatReportNumber, todayIso } from "../lib/report-format";
import TotalCard from "./total-card";
import { FilterField } from "./report-filters";

// One smith's transactions (GET transactions/smiths/{smithId}), opened by
// double-clicking a smith. Today by default; mode, metal, item, type and a
// search narrow it further. Receipt columns are green, issue columns red.

type Filters = { fromDate: string; toDate: string; mode: "" | TranType; metalId: string; itemId: string; types: string[]; search: string };
const initial = (): Filters => ({ fromDate: todayIso(), toDate: todayIso(), mode: "", metalId: "", itemId: "", types: [], search: "" });

const MODE_OPTIONS = [
    { value: "", label: "WEIGHT & AMOUNT" },
    { value: "W", label: "WEIGHT" },
    { value: "A", label: "AMOUNT" },
];
const TYPE_OPTIONS = [
    { value: "RECEIPT", label: "RECEIPT" },
    { value: "ISSUE", label: "ISSUE" },
    { value: "PURCHASE", label: "PURCHASE" },
    { value: "PURCHASE RETURN", label: "PURCHASE RETURN" },
];
const TYPE_CODES: Record<string, string> = { R: "RECEIPT", I: "ISSUE", P: "PURCHASE", PR: "PURCHASE RETURN" };

/** Type in words: the weight entry type, or receipt / issue from the amounts. */
const typeOf = (t: TransactionApi) => {
    const code = (t.tranType ?? "").trim();
    if (t.tranMode !== "A" && TYPE_CODES[code]) return TYPE_CODES[code];
    return Number(t.receipt ?? 0) !== 0 ? "RECEIPT" : "ISSUE";
};

/** Figures in the day book's receipt / issue columns. */
const figuresOf = (t: TransactionApi) => entryFigures({
    tranMode: t.tranMode ?? "W", receipt: t.receipt, issue: t.issue, grswt: t.grswt ?? null, touch: t.touch ?? null,
} as DaybookRow);

const SIDES = [
    { side: "receipt", group: "RECEIPT", keys: ["rGross", "rTouch", "rNet", "rAmount"] },
    { side: "issue", group: "ISSUE", keys: ["iGross", "iTouch", "iNet", "iAmount"] },
] as const;
const SUB_LABEL: Record<string, string> = { Gross: "GRS", Touch: "TOUCH", Net: "NET", Amount: "AMOUNT" };
const decimals = (key: string) => (key.endsWith("Touch") || key.endsWith("Amount") ? 2 : 3);
const fig = (f: DaybookFigures, key: string) => formatReportNumber(f[key as keyof DaybookFigures], decimals(key));

const COLUMNS: ExportColumn[] = [
    { key: "date", label: "DATE" },
    { key: "type", label: "TYPE" },
    { key: "item", label: "ITEM" },
    ...SIDES.flatMap(({ side, group, keys }) => keys.map((key) => ({
        key, label: SUB_LABEL[key.slice(1)], group, tone: side, align: "right" as const, numeric: true,
    }))),
    { key: "remark", label: "REMARK" },
];
const SIDE_BG = { receipt: "bg-emerald-50 dark:bg-emerald-500/10", issue: "bg-red-50 dark:bg-red-500/10" } as const;

type Props = { smith: { id: number; name: string } | null; onClose: () => void };

export default function SmithLedgerDialog({ smith, onClose }: Props) {
    const [draft, setDraft] = useState<Filters>(initial);
    const [applied, setApplied] = useState<Filters>(initial);
    const [error, setError] = useState("");
    const [exportOpen, setExportOpen] = useState(false);
    const set = <K extends keyof Filters>(key: K) => (value: Filters[K]) => setDraft((d) => ({ ...d, [key]: value }));

    // A new smith starts again from today.
    useEffect(() => {
        if (!smith) return;
        setDraft(initial());
        setApplied(initial());
        setError("");
    }, [smith?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    const metals = useQuery({ queryKey: metalQueryKey, queryFn: () => api.get<Metal[]>("metal"), enabled: !!smith });
    const metalOptions = [{ value: "", label: "ALL METALS" }, ...(metals.data ?? []).map((m) => ({ value: m.metalId, label: `${m.metalId} · ${m.metalName}` }))];
    const items = useQuery({ queryKey: [...itemQueryKey, { active: "Y" }], queryFn: () => fetchItems({ active: "Y" }), enabled: !!smith });
    const itemOptions = [{ value: "", label: "ALL ITEMS" }, ...(items.data?.items ?? [])
        .filter((i) => !draft.metalId || i.metalId === draft.metalId)
        .map((i) => ({ value: String(i.itemId), label: i.itemName }))];

    const apply = () => {
        if (draft.fromDate && draft.toDate && draft.fromDate > draft.toDate) {
            setError("From date must be on or before the to date.");
            return;
        }
        setError("");
        setApplied(draft);
    };

    const query = useQuery({
        queryKey: ["report", "smith-ledger", smith?.id, applied.fromDate, applied.toDate, applied.mode, applied.metalId, applied.itemId, applied.search],
        enabled: !!smith,
        queryFn: () => fetchSmithLedger(smith!.id, {
            tranMode: applied.mode || undefined,
            metalId: applied.metalId || undefined,
            itemId: applied.itemId || undefined,
            fromDate: applied.fromDate || undefined,
            toDate: applied.toDate || undefined,
            search: applied.search,
        }),
    });

    // Oldest first, like a ledger; the type filter is applied here.
    const rows = useMemo(() => [...(query.data ?? [])]
        .filter((t) => !applied.types.length || applied.types.includes(typeOf(t)))
        .sort((a, b) => (a.tranDate === b.tranDate ? a.id - b.id : a.tranDate < b.tranDate ? -1 : 1))
        .map((t) => ({ t, figures: figuresOf(t) })), [query.data, applied.types]);

    // Totals leave out cancelled entries.
    const totals = useMemo(() => {
        const keys = ["rGross", "rNet", "rAmount", "iGross", "iNet", "iAmount"] as const;
        const live = rows.filter((r) => !r.t.cancel);
        const sum = Object.fromEntries(keys.map((key) => [key,
            live.reduce((s, r) => s.plus(r.figures[key] ?? 0), new Decimal(0)).toNumber()])) as Record<typeof keys[number], number>;
        return {
            count: live.length,
            sum,
            receipt: { gross: sum.rGross, net: sum.rNet, amount: sum.rAmount },
            issue: { gross: sum.iGross, net: sum.iNet, amount: sum.iAmount },
            balance: {
                gross: new Decimal(sum.rGross).minus(sum.iGross).toNumber(),
                net: new Decimal(sum.rNet).minus(sum.iNet).toNumber(),
                amount: new Decimal(sum.rAmount).minus(sum.iAmount).toNumber(),
            },
        };
    }, [rows]);

    const period = applied.fromDate && applied.toDate
        ? (applied.fromDate === applied.toDate ? `On ${formatReportDate(applied.toDate)}` : `From ${formatReportDate(applied.fromDate)} To ${formatReportDate(applied.toDate)}`)
        : applied.toDate ? `As On ${formatReportDate(applied.toDate)}` : applied.fromDate ? `From ${formatReportDate(applied.fromDate)}` : "All dates";
    const title = smith ? `${smith.name} Transactions ${period}` : "";
    const filtersText = [
        applied.mode ? `Mode: ${MODE_OPTIONS.find((o) => o.value === applied.mode)?.label}` : "",
        applied.metalId ? `Metal: ${applied.metalId}` : "",
        applied.itemId ? `Item: ${itemOptions.find((o) => o.value === applied.itemId)?.label ?? applied.itemId}` : "",
        applied.types.length ? `Types: ${applied.types.join(", ")}` : "",
        applied.search.trim() ? `Search: ${applied.search.trim()}` : "",
    ].filter(Boolean).join(" · ");

    const exportRows: ExportRow[] = [
        ...rows.map(({ t, figures }): ExportRow => ({
            kind: "data",
            cells: {
                date: formatReportDate(t.tranDate),
                type: typeOf(t) + (t.cancel ? " (CANCELLED)" : ""),
                item: t.itemName ?? "",
                ...Object.fromEntries(SIDES.flatMap(({ keys }) => keys.map((key) => [key, fig(figures, key)]))),
                remark: t.remark ?? "",
            },
        })),
        {
            kind: "grand",
            cells: {
                date: "TOTAL",
                ...Object.fromEntries(SIDES.flatMap(({ keys }) => keys.filter((k) => !k.endsWith("Touch"))
                    .map((key) => [key, fig(totals.sum as unknown as DaybookFigures, key)]))),
            },
        },
    ];
    const wt = (v: number) => formatReportNumber(v, 3);
    const amt = (v: number) => formatReportNumber(v, 2);
    const summary: ExportSummary = {
        columns: ["GRS", "NET", "AMOUNT"],
        rows: [
            { label: "RECEIPT", tone: "receipt", cells: [wt(totals.receipt.gross), wt(totals.receipt.net), amt(totals.receipt.amount)] },
            { label: "ISSUE", tone: "issue", cells: [wt(totals.issue.gross), wt(totals.issue.net), amt(totals.issue.amount)] },
            { label: "BALANCE", cells: [wt(totals.balance.gross), wt(totals.balance.net), amt(totals.balance.amount)] },
        ],
    };

    if(!smith)
        return null;

    return (
        <Dialog open={!!smith} onClose={onClose} fullWidth maxWidth="xl" aria-labelledby="smith-ledger-title"
            slotProps={{ paper: { sx: { backgroundColor: "var(--card)", color: "var(--foreground)", height: "92vh" } } }}>
       
            <div className="flex h-full min-h-0 flex-col">
                <header className="flex items-center bg-accent-soft justify-between gap-3 border-b border-border px-4 py-3">
                    <div className="min-w-0">
                        <h2 id="smith-ledger-title" className="truncate text-sm font-semibold">{smith?.name}</h2>
                        <p className="truncate text-xs text-muted-foreground">{period}{filtersText ? ` · ${filtersText}` : ""}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button type="button" className={`${ghostButton} h-8 px-3`} onClick={() => setExportOpen(true)}
                            disabled={!rows.length || query.isFetching}>
                            <Download className="h-4 w-4" /> Print / Export
                        </button>
                        <button type="button" className={iconButton} onClick={onClose} aria-label="Close"><X className="h-4 w-4" /></button>
                    </div>
                </header>

                <form className="grid grid-cols-2 items-end gap-2 border-b border-border p-3 sm:grid-cols-4 lg:grid-cols-8"
                    onSubmit={(event) => { event.preventDefault(); apply(); }}>
                    <FilterField label="FROM DATE" id="sl-from">
                        <DateInput id="sl-from" className={inputClass} value={draft.fromDate} onChange={set("fromDate")} maxDate={new Date()} />
                    </FilterField>
                    <FilterField label="TO DATE" id="sl-to">
                        <DateInput id="sl-to" className={inputClass} value={draft.toDate} onChange={set("toDate")} maxDate={new Date()} />
                    </FilterField>
                    <FilterField label="MODE" id="sl-mode">
                        <ComboBox id="sl-mode" labelId="sl-mode-label" value={draft.mode} options={MODE_OPTIONS}
                            placeholder="Weight & amount" onChange={(v) => set("mode")(v as Filters["mode"])} />
                    </FilterField>
                    <FilterField label="METAL" id="sl-metal">
                        <ComboBox id="sl-metal" labelId="sl-metal-label" value={draft.metalId} options={metalOptions}
                            placeholder={metals.isPending ? "Loading…" : "All metals"}
                            onChange={(metalId) => setDraft((d) => ({ ...d, metalId, itemId: "" }))} />
                    </FilterField>
                    <FilterField label="ITEM" id="sl-item">
                        <ComboBox id="sl-item" labelId="sl-item-label" value={draft.itemId} options={itemOptions}
                            placeholder={items.isPending ? "Loading…" : "All items"} onChange={set("itemId")} />
                    </FilterField>
                    <FilterField label="TYPE" id="sl-type">
                        <MultiComboBox id="sl-type" labelId="sl-type-label" value={draft.types} options={TYPE_OPTIONS}
                            placeholder="All types" onChange={set("types")} />
                    </FilterField>
                    <FilterField label="SEARCH" id="sl-search">
                        <input id="sl-search" className={inputClass} value={draft.search} placeholder="Item, weight, touch"
                            onChange={(event) => set("search")(event.target.value)} />
                    </FilterField>
                    <div className="flex gap-2">
                        <button type="button" className={`${ghostButton} px-3`} title="Reset to today"
                            onClick={() => { setDraft(initial()); setApplied(initial()); setError(""); }}>
                            <RotateCcw className="h-4 w-4" />
                        </button>
                        <button type="submit" data-enter-submit className={`${primaryButton} flex-1`} disabled={query.isFetching}>
                            <Search className="h-4 w-4" /> Show
                        </button>
                    </div>
                </form>
                {error && <p role="alert" className="border-b border-border px-4 py-2 text-xs text-red-600">{error}</p>}

                {rows.length > 0 && (
                    <div className="grid gap-2 border-b border-border p-3 sm:grid-cols-3">
                        <TotalCard label="RECEIPT" tone="receipt" {...totals.receipt} />
                        <TotalCard label="ISSUE" tone="issue" {...totals.issue} />
                        <TotalCard label={`BALANCE · ${totals.count} ENTRIES`} tone="balance" {...totals.balance} />
                    </div>
                )}

                <div className="min-h-0 flex-1 overflow-auto">
                    {query.isPending ? (
                        <p role="status" className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" /> Loading transactions…
                        </p>
                    ) : query.isError ? (
                        <p role="alert" className="p-6 text-sm text-red-600">{getApiErrorMessage(query.error)}</p>
                    ) : !rows.length ? (
                        <p className="flex flex-col items-center gap-2 p-10 text-sm text-muted-foreground">
                            <Inbox className="h-6 w-6" /> No transactions for these filters. Try a wider date range.
                        </p>
                    ) : (
                        <table className="w-full border-collapse text-sm">
                            <thead className="sticky top-0 z-10 text-xs uppercase tracking-wide text-muted-foreground">
                                <tr>
                                    {["DATE", "TYPE", "ITEM"].map((h) => <th key={h} rowSpan={2} className="bg-muted px-3 py-2 text-left align-bottom font-semibold">{h}</th>)}
                                    <th colSpan={4} className="border-l border-border bg-emerald-100 px-3 py-1.5 text-center font-semibold text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">RECEIPT</th>
                                    <th colSpan={4} className="border-l border-border bg-red-100 px-3 py-1.5 text-center font-semibold text-red-800 dark:bg-red-500/20 dark:text-red-300">ISSUE</th>
                                    <th rowSpan={2} className="bg-muted px-3 py-2 text-left align-bottom font-semibold">REMARK</th>
                                </tr>
                                <tr className="border-t border-border">
                                    {SIDES.flatMap(({ side, keys }) => keys.map((key, i) => (
                                        <th key={key} className={`px-3 py-1.5 text-right font-semibold ${SIDE_BG[side]} ${i === 0 ? "border-l border-border" : ""}`}>
                                            {SUB_LABEL[key.slice(1)]}
                                        </th>
                                    )))}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map(({ t, figures }) => (
                                    <tr key={`${t.id}-${t.tranMode}`} className={`border-t border-border ${t.cancel ? "line-through decoration-red-700/60 [&>td]:!bg-red-200 dark:[&>td]:!bg-red-500/30" : ""}`}
                                        title={t.cancel ? "Cancelled (not in totals)" : undefined}>
                                        <td className="whitespace-nowrap px-3 py-1.5">{formatReportDate(t.tranDate)}</td>
                                        <td className="whitespace-nowrap px-3 py-1.5">{typeOf(t)}{t.tranMode === "A" ? " (AMT)" : ""}</td>
                                        <td className="whitespace-nowrap px-3 py-1.5">{t.itemName ?? ""}</td>
                                        {SIDES.flatMap(({ side, keys }) => keys.map((key, i) => (
                                            <td key={key} className={`whitespace-nowrap px-3 py-1.5 text-right tabular-nums ${SIDE_BG[side]} ${i === 0 ? "border-l border-border" : ""}`}>
                                                {fig(figures, key)}
                                            </td>
                                        )))}
                                        <td className="px-3 py-1.5">{t.remark ?? ""}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="sticky bottom-0 bg-muted font-bold">
                                <tr className="border-t-2 border-border">
                                    <td colSpan={3} className="px-3 py-2">TOTAL</td>
                                    {SIDES.flatMap(({ keys }) => keys.map((key, i) => (
                                        <td key={key} className={`whitespace-nowrap px-3 py-2 text-right tabular-nums ${i === 0 ? "border-l border-border" : ""}`}>
                                            {key.endsWith("Touch") ? "" : fig(totals.sum as unknown as DaybookFigures, key)}
                                        </td>
                                    )))}
                                    <td />
                                </tr>
                            </tfoot>
                        </table>
                    )}
                </div>
            </div>
            <ExportDialog open={exportOpen} onClose={() => setExportOpen(false)} storageKey="smith-ledger"
                defaultTitle={title} filters={filtersText} columns={COLUMNS}
                defaultColumns={COLUMNS.filter((c) => c.key !== "remark").map((c) => c.key)}
                rows={exportRows} summary={summary} />
        {/* </div> */}
        </Dialog>
    );
}
