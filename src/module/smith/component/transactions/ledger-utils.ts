// Shared bits of the smith transactions screen.

import { todayIso } from "@/src/module/report/lib/report-format";

export const formatTransactionAmount = (v: number) => v.toFixed(2);

/** Ledger filters for the open smith (GET transactions/smiths/{smithId}); type is applied on screen. */
export type LedgerFilter = { fromDate: string; toDate: string; itemId: string; types: string[]; search: string };
export const EMPTY_LEDGER_FILTER: LedgerFilter = { fromDate: "", toDate: "", itemId: "", types: [], search: "" };
/** Starting filter: today only (From and To both today). */
export const todayLedgerFilter = (): LedgerFilter => ({ ...EMPTY_LEDGER_FILTER, fromDate: todayIso(), toDate: todayIso() });

export const ledgerInput = "h-8 w-full rounded-lg border border-border bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring";
export const cardHeader = "flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3";
export const actionButton = "inline-flex items-center gap-1.5 rounded-lg px-1 py-1 text-[8px] font-semibold text-white shadow-sm transition hover:opacity-90";
/** Cancelled rows: red background, struck through (they are not counted). */
export const cancelledRowClass = (row: any) => (row?.cancelled ? "!bg-red-200 line-through decoration-red-700/60 dark:!bg-red-500/30" : "");
