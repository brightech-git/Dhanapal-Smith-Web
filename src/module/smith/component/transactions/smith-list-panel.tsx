"use client";

import { useMemo } from "react";
import { Download, Plus, Wallet } from "lucide-react";
import Table from "@/src/components/ui/table";
import ComboBox from "@/src/components/ui/combo-box";
import TextInput from "@/src/components/ui/text-input";
import { actionButton, cardHeader, formatTransactionAmount } from "./ledger-utils";
import type { SmithLedger } from "./use-smith-ledger";

/** Left panel: every smith with weight and cash balance. Double-click a balance to open that smith. */
export default function SmithListPanel({ ledger }: { ledger: SmithLedger }) {
    const {
        responsive, flags, metalId, setMetalId, metalOptions, metalsQuery, smithSearch, setSmithSearch, summaryRows,
        transactionsLoading, transactionTotals, newSmithName, setNewSmithName, handleCreateSmith, isCreatingSmith,
        setExportTarget, handleWeightDoubleClick, handleCashDoubleClick,
    } = ledger;

    // Main Table Columns
    const mainTableColumns = useMemo(() => [
        {
            key: "sno",
            label: "S.NO",
            headalign: "left" as const,
            align: "left" as const,
            width: "10px",
            render: (_v: any, _row: any, index: number) => <span className="font-semibold">{index + 1}</span>,
        },
        {
            key: "smithInfo",
            label: "SMITH",
            headalign: "left" as const,
            align: "left" as const,
            width: "90px",
            render: (_v: any, row: any) => <span>{row.name}</span>,
        },
        {
            key: "weightBalance",
            label: "WT BAL",
            headalign: "right" as const,
            align: "right" as const,
            width: "80px",
            render: (v: number, row: any) => (
                <span onDoubleClick={() => handleWeightDoubleClick(row)} className="cursor-pointer hover:underline">
                    {v?.toFixed(3)}
                </span>
            ),
        },
        {
            key: "cashBalance",
            label: "M.C BAL",
            headalign: "right" as const,
            align: "right" as const,
            width: "80px",
            render: (v: number, row: any) => (
                <span onDoubleClick={() => handleCashDoubleClick(row)} className="cursor-pointer hover:underline">
                    {formatTransactionAmount(v)}
                </span>
            ),
        },
    ], [responsive.isMobile]);

    return (
                    <section className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm xl:col-span-3">
                        <div className={cardHeader}>
                            <h2 className="flex items-center gap-2 text-sm font-semibold">
                                <Wallet size={18} className="text-primary-text" />
                                Smith
                                <button type="button" onClick={() => setExportTarget("smiths")} disabled={!summaryRows.length}
                                    title="Print / Export the smith list" aria-label="Print or export the smith list"
                                    className="inline-flex h-7 items-center gap-1 rounded-lg border border-border px-2 text-xs font-medium hover:bg-muted disabled:opacity-50">
                                    <Download size={14} />
                                </button>
                            </h2>
                            <div className="flex items-center gap-1.5">
                                <TextInput
                                    value={newSmithName}
                                    onChange={setNewSmithName}
                                    placeholder="New smith name"
                                    unstyled
                                    inputClassName="w-36 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring sm:w-44"
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateSmith()}
                                />
                                <button
                                    onClick={handleCreateSmith}
                                    disabled={isCreatingSmith || !newSmithName.trim()}
                                    className={`${actionButton} -ml-16 bg-primary disabled:opacity-50`}
                                >
                                    <Plus size={14} />
                                    Create
                                </button>
                                {/* <button
                                    type="button"
                                    onClick={() => setSmithModalOpen(true)}
                                    title="Create a smith with full details"
                                    aria-label="Create a smith with full details"
                                    className={`${actionButton} text-sm border border-border bg-card !text-foreground hover:bg-muted`}
                                >
                                    <UserPlus size={14} />
                                    <span className="hidden sm:inline">Full details</span>
                                </button> */}
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2" data-enter-nav>
                            {/* Metal filter only when weight rows carry items (soft control WEIGHTITEM = Y). */}
                            {flags.weightItems && <>
                                <span id="summary-metal-label" className="sr-only">METAL</span>
                                <div className="w-40">
                                    <ComboBox id="summary-metal" labelId="summary-metal-label" value={metalId}
                                        options={metalOptions}
                                        placeholder={metalsQuery.isPending ? "Loading metals…" : "All metals"}
                                        onChange={setMetalId} />
                                </div>
                            </>}
                            <TextInput type="search" uppercase={false} value={smithSearch} onChange={setSmithSearch}
                                placeholder="Search smith" aria-label="Search smith" className="min-w-0 flex-1" unstyled
                                inputClassName="w-full rounded-lg border border-border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                        </div>
                        <Table
                            columns={mainTableColumns}
                            loading={flags.showLoading && transactionsLoading}
                            data={summaryRows}
                            striped
                            hoverable
                            compact="auto"
                            className="w-full rounded-none border-0 shadow-none"
                            bodyClassName="border-0"
                            fixedHeight={responsive.isMobile ? "400px" : "640px"}
                            showRows={15}
                            renderFooter={() => (
                                <tfoot className="sticky bottom-0 z-10 bg-muted text-sm font-semibold">
                                    <tr>
                                        <td colSpan={2} className="border-r border-border pr-2 text-right">Total</td>
                                        <td className="border-r border-border pr-1 text-right  text-primary-text">
                                            {transactionTotals.weight.toFixed(3)}
                                        </td>
                                        <td className="pr-1 text-right text-primary-text">{formatTransactionAmount(transactionTotals.cash)}</td>
                                    </tr>
                                </tfoot>
                            )}
                        />
                    </section>
    );
}
