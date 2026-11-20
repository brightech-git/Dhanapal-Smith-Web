"use client";

import { useMemo } from "react";
import { Download, Plus, Scale } from "lucide-react";
import { Block, Delete } from "@mui/icons-material";
import Table from "@/src/components/ui/table";
import ComboBox from "@/src/components/ui/combo-box";
import EditableCell from "@/src/components/ui/editable-cell";
import { WEIGHT_TRAN_TYPES, formatFixed } from "../../lib/weight-calc";
import AttachButton from "./attach-button";
import { actionButton, cancelledRowClass, cardHeader } from "./ledger-utils";
import type { SmithLedger } from "./use-smith-ledger";

/** Weight rows of the open smith: editable grid, totals, add row, print / export. */
export default function WeightLedgerPanel({ ledger }: { ledger: SmithLedger }) {
    const {
        responsive, showTotal, showDelete, saveMode, savingRow, saveColumn, noItems, withoutItemColumns, itemNameOf,
        itemOptions, itemsQuery, canAddItem, setAddItemFor, setAttachTarget, editWeightEntry, onEdit, handleDeleteWeightRow,
        weightBalanceData, weightTotals, selectedSmithId, selectedSmithName, weightSectionRef, weightAddRef, handleLedgerEscape,
        hasNewWeightRow, handleAddWeightRow, setExportTarget,
    } = ledger;

    // Weight Table Columns
    const weightBalanceColumns = useMemo(() => [
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
                            className="text-red-500 hover:text-red-700 ml-1"
                            onClick={() => handleDeleteWeightRow(row)}
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
                <EditableCell value={value} type="date" onSave={(newVal) => onEdit("weight", row, "date", newVal)}  />
            ),
        },
        {
            key: "tranType",
            label: "TYPE",
            headalign: "center" as const,
            align: "center" as const,
            width: "90px",
            render: (value: any, row: any) => (
                <div className="min-w-[110px]" data-cell-nav>
                    <ComboBox id={`weight-type-${row.id ?? "new"}`} labelId="weight-type-header" value={value || ""}
                        options={WEIGHT_TRAN_TYPES} placeholder="Type" openOnFocus
                        onChange={(type) => editWeightEntry(row, "tranType", type)} />
                </div>
            ),
        },
        {
            key: "itemId",
            label: "ITEM",
            headalign: "left" as const,
            align: "left" as const,
            width: "150px",
            render: (value: any, row: any, index: number) => (
                <div className="min-w-[130px]" data-cell-nav>
                    <ComboBox id={`weight-item-${index}`} labelId="weight-item-header" value={value != null ? String(value) : ""}
                        options={itemOptions?.length  || value == null ? itemOptions : [{ value: String(value), label: itemNameOf(row) || `#${value}` }]}
                        placeholder={itemsQuery.isPending ? "Loading…" : "Select item"} openOnFocus
                        onChange={(itemId) => editWeightEntry(row, "itemId", Number(itemId))}
                        addNew={canAddItem} onAddNew={() => setAddItemFor(row)} />
                </div>
            ),
        },
        {
            key: "grswt",
            label: "GRS WT",
            headalign: "right" as const,
            align: "right" as const,
            width: "90px",
            render: (value: any, row: any) => (
                <EditableCell value={value} type="number" decimals={3} onSave={(newVal) => editWeightEntry(row, "grswt", newVal)} />
            ),
        },
        {
            key: "touch",
            label: "TOUCH",
            headalign: "right" as const,
            align: "right" as const,
            width: "80px",
            render: (value: any, row: any) => (
                <EditableCell value={value} type="number" decimals={2} onSave={(newVal) => editWeightEntry(row, "touch", newVal)} />
            ),
        },
        // {
        //     key: "purewt",
        //     label: "PURE WT",
        //     headalign: "right" as const,
        //     align: "right" as const,
        //     width: "90px",
        //     render: (value: any) => (
        //         <span className="font-medium tabular-nums" title="Grs Wt x Touch / 100">{value != null ? formatFixed(value, 3) : "-"}</span>
        //     ),
        // },
        {
            key: "receipts",
            label: "RECEIPT",
            headalign: "right" as const,
            align: "right" as const,
            width: "100px",
            render: (value: any, row: any, rowIndex: number) => (
                !noItems
                    ? <span className="tabular-nums" title="From Pure Wt">{formatFixed(value, 3)}</span>
                    : <EditableCell value={value} type="number" allowNegative onSave={(newVal) => onEdit("weight", row, "receipts", newVal)} />
            ),
        },
        {
            key: "payments",
            label: "ISSUE",
            headalign: "right" as const,
            align: "right" as const,
            width: "100px",
            render: (value: any, row: any, rowIndex: number) => (
                !noItems
                    ? <span className="tabular-nums" title="From Pure Wt">{formatFixed(value, 3)}</span>
                    : <EditableCell value={value} type="number" allowNegative onSave={(newVal) => onEdit("weight", row, "payments", newVal)} />
            ),
        },
        {
            key: "balance",
            label: "BALANCE",
            headalign: "right" as const,
            align: "right" as const,
            width: "70px",
            render: (_v: any, row: any) => <span className="font-medium">{row.weightDifference?.toFixed(3)}</span>,
        },
        {
            key: "remarks",
            label: "REMARKS",
            headalign: "center" as const,
            align: "left" as const,
            width: "110px",
            render: (value: any, row: any) => (
                <EditableCell value={value} type="text" onSave={(newVal) => onEdit("weight", row, "remarks", newVal)} />
            ),
        },
        {
            key:"age",
            label :"Age",
            headalign: "center" as const,
            align: "center" as const,
            width: "50px",
            render: (_v: any, row: any) => <span className="font-medium">{row.age}</span>,
        },
        {
            key: "files",
            label: "FILES",
            headalign: "center" as const,
            align: "center" as const,
            width: "50px",
            render: (_v: any, row: any) => <AttachButton row={row} onClick={() => setAttachTarget({ kind: "weight", row })} />,
        },
        ...(saveMode ? [saveColumn("weight")] : []),
    ].filter((column) => withoutItemColumns([column]).length > 0), [selectedSmithId, responsive.isMobile, showDelete, saveMode, savingRow, weightBalanceData, itemOptions, itemsQuery.isPending, canAddItem, noItems]);

    return (
                        <section ref={weightSectionRef} onKeyDown={handleLedgerEscape("weight")} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                            <div className={cardHeader}>
                                <h2 className="flex items-center gap-2 text-sm font-semibold">
                                    <Scale size={18} className="text-emerald-600 dark:text-emerald-400" />
                                    Weight Balance
                                    {selectedSmithId && (
                                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                            {selectedSmithName}
                                        </span>
                                    )}
                                </h2>
                                {selectedSmithId && (
                                    <div className="flex items-center gap-2">
                                        <button type="button" onClick={() => setExportTarget("weight")} data-shortcut="print"
                                            disabled={!weightBalanceData.some((row) => !row.isNew)}
                                            className="inline-flex h-7 items-center gap-1 rounded-lg border border-border px-2 text-xs font-medium hover:bg-muted disabled:opacity-50">
                                            <Download size={14} /> Print / Export
                                        </button>
                                        <button ref={weightAddRef} onClick={handleAddWeightRow} disabled={!!savingRow} data-shortcut="add"
                                            title={hasNewWeightRow ? "Go to the current weight row" : "Add a weight transaction"}
                                            className={`${actionButton} bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50`}>
                                            <Plus size={14} />
                                            Add new
                                        </button>
                                    </div>
                                )}
                            </div>
                            <Table
                                columns={weightBalanceColumns}
                                rowClassName={cancelledRowClass}
                                data={weightBalanceData}
                                striped
                                hoverable
                                compact="auto"
                                className="w-full rounded-none border-0 shadow-none"
                                fixedHeight={responsive.isMobile ? "250px" : "280px"}
                                showRows={5}
                                renderFooter={showTotal ? () => (
                                    <tfoot className="sticky bottom-0 bg-emerald-50 text-sm  font-semibold text-foreground dark:bg-emerald-500/10">
                                        <tr>
                                            <td colSpan={noItems ? 2 : 4} className="border-r border-border pr-4 text-right">Total</td>
                                            {!noItems && <>
                                                <td className="border-r border-border text-right px-2 py-1">{formatFixed(weightTotals.grswt, 3)}</td>
                                                <td className="border-r border-border px-2"></td>
                                            </>}
                                            {/* <td className="border-r border-border text-right px-2">{formatFixed(weightTotals.purewt, 3)}</td> */}
                                            <td className="border-r border-border text-right px-2">{weightTotals.receipts.toFixed(3)}</td>
                                            <td className="border-r border-border text-right px-2">{weightTotals.payments.toFixed(3)}</td>
                                            <td className="border-r border-border text-right px-2">{weightTotals.balance.toFixed(3)}</td>
                                            <td></td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                ) : undefined}
                            />
                        </section>
    );
}
