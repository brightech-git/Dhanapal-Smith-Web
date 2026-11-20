import type { ExportColumn, ExportRow } from "@/src/components/export/export-doc";
import { formatReportDate } from "@/src/module/report/lib/report-format";
import { formatFixed, weightTranTypeLabel } from "../../lib/weight-calc";
import { formatTransactionAmount } from "./ledger-utils";
import type { SmithLedger } from "./use-smith-ledger";

export type LedgerExportSetup = { key: string; title: string; filters?: string; columns: ExportColumn[]; rows: ExportRow[]; defaultColumns?: string[] };

/** What the Print / Export dialog gets for the smith list, weight rows or cash rows. */
export function ledgerExportSetup(ledger: SmithLedger): LedgerExportSetup | null {
    const {
        ledgerApplied, flags, metalId, itemOptions, exportTarget, smithSearch, summaryRows, transactionTotals,
        noItems, weightBalanceData, selectedSmithName, itemNameOf, weightTotals, cashBalanceData, cashTotals,
    } = ledger;
    const ledgerPeriod = ledgerApplied.fromDate && ledgerApplied.toDate
        ? ` From ${formatReportDate(ledgerApplied.fromDate)} To ${formatReportDate(ledgerApplied.toDate)}`
        : ledgerApplied.toDate ? ` As On ${formatReportDate(ledgerApplied.toDate)}`
            : ledgerApplied.fromDate ? ` From ${formatReportDate(ledgerApplied.fromDate)}` : "";
    const ledgerFiltersText = [
        flags.weightItems && metalId ? `Metal: ${metalId}` : "",
        ledgerApplied.itemId ? `Item: ${itemOptions.find((o: { value: string }) => o.value === ledgerApplied.itemId)?.label ?? ledgerApplied.itemId}` : "",
        ledgerApplied.types.length ? `Types: ${ledgerApplied.types.map((t) => weightTranTypeLabel(t) || t).join(", ")}` : "",
        ledgerApplied.search.trim() ? `Search: ${ledgerApplied.search.trim()}` : "",
    ].filter(Boolean).join(" · ");
    const wt3 = (v: unknown) => formatFixed(v ?? 0, 3);
    return ((): LedgerExportSetup | null => {
        if (exportTarget === "smiths") {
            return {
                key: "tx-smiths",
                title: "Smith Balances",
                filters: [flags.weightItems && metalId ? `Metal: ${metalId}` : "", smithSearch.trim() ? `Smith: ${smithSearch.trim()}` : ""].filter(Boolean).join(" · "),
                columns: [
                    { key: "sno", label: "S.NO" },
                    { key: "smith", label: "SMITH" },
                    { key: "weight", label: "WT BAL", align: "right", numeric: true },
                    { key: "cash", label: "CASH BAL", align: "right", numeric: true },
                ],
                rows: [
                    ...summaryRows.map((row, index): ExportRow => ({ kind: "data", cells: {
                        sno: String(index + 1), smith: row.name ?? "", weight: wt3(row.weightBalance), cash: formatTransactionAmount(row.cashBalance || 0),
                    } })),
                    { kind: "grand", cells: { smith: "TOTAL", weight: wt3(transactionTotals.weight), cash: formatTransactionAmount(transactionTotals.cash) } },
                ],
            };
        }
        if (exportTarget === "weight") {
            const columns: ExportColumn[] = [
                { key: "sno", label: "S.NO" },
                { key: "date", label: "DATE" },
                ...(noItems ? [] : [
                    { key: "type", label: "TYPE" },
                    { key: "item", label: "ITEM" },
                    { key: "grswt", label: "GRS WT", align: "right", numeric: true },
                    { key: "touch", label: "TOUCH", align: "right", numeric: true },
                ] as ExportColumn[]),
                { key: "receipts", label: "RECEIPT", align: "right", numeric: true, tone: "receipt" },
                { key: "payments", label: "ISSUE", align: "right", numeric: true, tone: "issue" },
                { key: "balance", label: "BALANCE", align: "right", numeric: true },
                { key: "age", label: "AGE", align: "right", numeric: true },
                { key: "remarks", label: "REMARKS" },
            ];
            const saved = weightBalanceData.filter((row) => !row.isNew);
            return {
                key: "tx-weight",
                title: `${selectedSmithName} Weight Ledger${ledgerPeriod}`,
                filters: ledgerFiltersText,
                columns,
                defaultColumns: columns.filter((c) => c.key !== "age").map((c) => c.key),
                rows: [
                    ...saved.map((row, index): ExportRow => ({ kind: "data", cells: {
                        sno: String(index + 1),
                        date: formatReportDate(row.date),
                        type: weightTranTypeLabel(row.tranType),
                        item: itemNameOf(row),
                        grswt: row.grswt != null ? formatFixed(row.grswt, 3) : "",
                        touch: row.touch != null ? formatFixed(row.touch, 2) : "",
                        receipts: wt3(row.receipts),
                        payments: wt3(row.payments),
                        balance: wt3(row.weightDifference ?? row.balance),
                        age: row.age != null ? String(row.age) : "",
                        remarks: row.cancelled ? `CANCELLED${row.remarks ? ` · ${row.remarks}` : ""}` : row.remarks ?? "",
                    } })),
                    { kind: "grand", cells: {
                        date: "TOTAL", grswt: wt3(weightTotals.grswt), receipts: wt3(weightTotals.receipts),
                        payments: wt3(weightTotals.payments), balance: wt3(weightTotals.balance),
                    } },
                ],
            };
        }
        if (exportTarget === "cash") {
            const saved = cashBalanceData.filter((row) => !row.isNew);
            return {
                key: "tx-cash",
                title: `${selectedSmithName} Cash Ledger${ledgerPeriod}`,
                columns: [
                    { key: "sno", label: "S.NO" },
                    { key: "date", label: "DATE" },
                    { key: "receipts", label: "RECEIPT", align: "right", numeric: true, tone: "receipt" },
                    { key: "payments", label: "ISSUE", align: "right", numeric: true, tone: "issue" },
                    { key: "balance", label: "BALANCE", align: "right", numeric: true },
                    { key: "remarks", label: "REMARKS" },
                ],
                rows: [
                    ...saved.map((row, index): ExportRow => ({ kind: "data", cells: {
                        sno: String(index + 1),
                        date: formatReportDate(row.date),
                        receipts: formatTransactionAmount(row.receipts || 0),
                        payments: formatTransactionAmount(row.payments || 0),
                        balance: formatTransactionAmount(row.balance || 0),
                        remarks: row.cancelled ? `CANCELLED${row.remarks ? ` · ${row.remarks}` : ""}` : row.remarks ?? "",
                    } })),
                    { kind: "grand", cells: {
                        date: "TOTAL", receipts: formatTransactionAmount(cashTotals.receipts),
                        payments: formatTransactionAmount(cashTotals.payments), balance: formatTransactionAmount(cashTotals.balance),
                    } },
                ],
            };
        }
        return null;
    })();
}
