"use client";

import { useMemo } from "react";
import { Download, IndianRupee, Plus } from "lucide-react";
import { Block, Delete } from "@mui/icons-material";
import Table from "@/src/components/ui/table";
import EditableCell from "@/src/components/ui/editable-cell";
import AttachButton from "./attach-button";
import { actionButton, cancelledRowClass, cardHeader, formatTransactionAmount } from "./ledger-utils";
import type { SmithLedger } from "./use-smith-ledger";

/** Cash (amount) rows of the open smith: editable grid, totals, add row, print / export. */
export default function CashLedgerPanel({ ledger }: { ledger: SmithLedger }) {
    const {
        responsive, showTotal, showDelete, saveMode, savingRow, saveColumn, setAttachTarget, onEdit, handleDeleteCashRow,
        cashBalanceData, cashTotals, selectedSmithId, selectedSmithName, cashSectionRef, cashAddRef, handleLedgerEscape,
        hasNewCashRow, handleAddCashRow, setExportTarget,
    } = ledger;

    // Cash Table Columns
    const cashBalanceColumns = useMemo(() => [
        {
            key: "sno",
            label: "S.NO",
            headalign: "left" as const,
            align: "left" as const,
            width: "50px",
            render: (_v: any, row: any, index: number) => (
                <div className="flex items-center justify-between">
                    <span>{row?.isNew ? "" : index + 1}</span>
                    {row?.cancelled
                        ? <span className="ml-1 rounded bg-red-600 px-1 text-[9px] font-bold text-white" title="Cancelled: not counted">CXL</span>
                        : (showDelete || row?.isNew) && <button
                            className="text-red-500 hover:text-red-700 ml-2"
                            onClick={() => handleDeleteCashRow(row)}
                            title={row?.isNew ? "Remove unsaved row" : "Cancel transaction"}
                        >
                            {row?.isNew ? <Delete fontSize="small" /> : <Block fontSize="small" />}
                        </button>}

                </div>
            ),
        },

        {
            key: "date",
            label: "DATE",
            headalign: "center" as const,
            align: "center" as const,
            width: "100px",
            render: (value: any, row: any, rowIndex: number) => (
                <EditableCell value={value} type="date" onSave={(newVal) => onEdit("cash", row, "date", newVal)} />
            ),
        },
        {
            key: "receipts",
            label: "RECEIPT",
            headalign: "right" as const,
            align: "right" as const,
            width: "100px",
            render: (value: any, row: any, rowIndex: number) => (
                <EditableCell value={value} type="numbers" allowNegative onSave={(newVal) => onEdit("cash", row, "receipts", newVal)} />
            ),
        },
        {
            key: "payments",
            label: "ISSUE",
            headalign: "right" as const,
            align: "right" as const,
            width: "100px",
            render: (value: any, row: any, rowIndex: number) => (
                <EditableCell value={value} type="numbers" allowNegative onSave={(newVal) => onEdit("cash", row, "payments", newVal)} />
            ),
        },
        {
            key: "balance",
            label: "BALANCE",
            headalign: "right" as const,
            align: "right" as const,
            width: "70px",
            render: (v: number) => <span className="font-medium">{formatTransactionAmount(v || 0)}</span>,
        },
        {
            key: "remarks",
            label: "REMARKS",
            headalign: "center" as const,
            align: "left" as const,
            width: "110px",
            render: (value: any, row: any) => (
                <EditableCell value={value} type="text" onSave={(newVal) => onEdit("cash", row, "remarks", newVal)} />
            ),
        },
        {
            key: "files",
            label: "FILES",
            headalign: "center" as const,
            align: "center" as const,
            width: "50px",
            render: (_v: any, row: any) => <AttachButton row={row} onClick={() => setAttachTarget({ kind: "cash", row })} />,
        },
        ...(saveMode ? [saveColumn("cash")] : []),
    ], [selectedSmithId, responsive.isMobile, showDelete, saveMode, savingRow, cashBalanceData]);

    return (
                        <section ref={cashSectionRef} onKeyDown={handleLedgerEscape("cash")} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                            <div className={cardHeader}>
                                <h2 className="flex items-center gap-2 text-sm font-semibold">
                                    <IndianRupee size={18} className="text-primary-text" />
                                    Cash Balance
                                    {selectedSmithId && (
                                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                            {selectedSmithName}
                                        </span>
                                    )}
                                </h2>
                                {selectedSmithId && (
                                    <div className="flex items-center gap-2">
                                        <button type="button" onClick={() => setExportTarget("cash")}
                                            disabled={!cashBalanceData.some((row) => !row.isNew)}
                                            className="inline-flex h-7 items-center gap-1 rounded-lg border border-border px-2 text-xs font-medium hover:bg-muted disabled:opacity-50">
                                            <Download size={14} /> Print / Export
                                        </button>
                                        <button ref={cashAddRef} onClick={handleAddCashRow} disabled={!!savingRow} data-shortcut="add-cash"
                                            title={hasNewCashRow ? "Go to the current cash row" : "Add a cash transaction"}
                                            className={`${actionButton} bg-primary disabled:cursor-not-allowed disabled:opacity-50`}>
                                            <Plus size={14} />
                                            Add new
                                        </button>
                                    </div>
                                )}
                            </div>
                            <Table
                                columns={cashBalanceColumns}
                                rowClassName={cancelledRowClass}
                                data={cashBalanceData}
                                striped
                                hoverable
                                compact="auto"
                                className="w-full rounded-none border-0 shadow-none"
                                fixedHeight={responsive.isMobile ? "250px" : "280px"}
                                showRows={5}
                                renderFooter={showTotal ? () => (
                                    <tfoot className="sticky bottom-0 bg-accent-soft text-xs font-semibold text-foreground">
                                        <tr>
                                            <td colSpan={2} className="border-r border-border pr-4 text-right">Total</td>
                                            <td className="border-r border-border text-right px-2 py-1">{formatTransactionAmount(cashTotals.receipts)}</td>
                                            <td className="border-r border-border text-right px-2">{formatTransactionAmount(cashTotals.payments)}</td>
                                            <td className="border-r border-border text-right px-2">{formatTransactionAmount(cashTotals.balance)}</td>
                                            <td></td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                ) : undefined}
                            />
                        </section>
    );
}
