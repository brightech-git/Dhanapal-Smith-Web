"use client";

import { RotateCcw, Search } from "lucide-react";
import ComboBox from "@/src/components/ui/combo-box";
import DateInput from "@/src/components/ui/date-input";
import MultiComboBox from "@/src/components/ui/multi-combo-box";
import { WEIGHT_TRAN_TYPES } from "../../lib/weight-calc";
import { ledgerInput, todayLedgerFilter } from "./ledger-utils";
import type { SmithLedger } from "./use-smith-ledger";

/** Filters for the open smith's weight and cash rows: dates, item, type and search. */
export default function LedgerFilterBar({ ledger }: { ledger: SmithLedger }) {
    const { flags, ledgerDraft, setLedgerDraft, applyLedgerFilter, itemOptions, itemsQuery } = ledger;
    return (
                        <form className="flex flex-wrap items-end gap-2 rounded-2xl border border-border bg-card px-3 py-2 shadow-sm"
                            onSubmit={(event) => { event.preventDefault(); applyLedgerFilter(ledgerDraft); }}>
                            <label className="grid w-32 gap-1 text-[11px] font-medium">FROM DATE
                                <DateInput id="ledger-from" className={ledgerInput} value={ledgerDraft.fromDate} maxDate={new Date()}
                                    onChange={(fromDate) => setLedgerDraft((d) => ({ ...d, fromDate }))} />
                            </label>
                            <label className="grid w-32 gap-1 text-[11px] font-medium">TO DATE
                                <DateInput id="ledger-to" className={ledgerInput} value={ledgerDraft.toDate} maxDate={new Date()}
                                    onChange={(toDate) => setLedgerDraft((d) => ({ ...d, toDate }))} />
                            </label>
                            {flags.weightItems && (
                                <div className="grid w-40 gap-1 text-[11px] font-medium">
                                    <span id="ledger-item-label">ITEM</span>
                                    <ComboBox id="ledger-item" labelId="ledger-item-label" value={ledgerDraft.itemId}
                                        options={[{ value: "", label: "ALL ITEMS" }, ...itemOptions]}
                                        placeholder={itemsQuery.isPending ? "Loading items…" : "All items"}
                                        onChange={(itemId) => setLedgerDraft((d) => ({ ...d, itemId }))} />
                                </div>
                            )}
                            {flags.weightItems && (
                                <div className="grid w-44 gap-1 text-[11px] font-medium">
                                    <span id="ledger-type-label">TYPE</span>
                                    <MultiComboBox id="ledger-type" labelId="ledger-type-label" value={ledgerDraft.types}
                                        options={WEIGHT_TRAN_TYPES} placeholder="All types"
                                        onChange={(types) => setLedgerDraft((d) => ({ ...d, types }))} />
                                </div>
                            )}
                            <label className="grid min-w-36 flex-1 gap-1 text-[11px] font-medium">SEARCH
                                <input className={ledgerInput} value={ledgerDraft.search} placeholder="Item, weight or touch"
                                    onChange={(event) => setLedgerDraft((d) => ({ ...d, search: event.target.value }))} />
                            </label>
                            <div className="flex gap-1.5">
                                <button type="button" title="Clear filters" aria-label="Clear filters"
                                    className="inline-flex h-8 items-center rounded-lg border border-border px-2 hover:bg-muted"
                                    onClick={() => { const today = todayLedgerFilter(); setLedgerDraft(today); applyLedgerFilter(today); }}>
                                    <RotateCcw size={14} />
                                </button>
                                <button type="submit" data-enter-submit
                                    className="inline-flex h-8 items-center gap-1 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground hover:opacity-90">
                                    <Search size={14} /> Apply
                                </button>
                            </div>
                        </form>
    );
}
