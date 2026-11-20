import Decimal from "decimal.js";
import type { DaybookRow } from "../api/report.api";

// Turns the day book's flat rows into printable lines:
//   TYPE (e.g. Purchase)
//     ITEM (or metal / AMOUNT)
//       one line per transaction
//     Total (item)
//   Total (type)
// and a grand total when there is more than one type.

/** Receipt and issue figures. Touch is only set on transaction lines. */
export type DaybookFigures = {
    rGross: number | null; rTouch: number | null; rNet: number | null; rAmount: number | null;
    iGross: number | null; iTouch: number | null; iNet: number | null; iAmount: number | null;
};

export type DaybookLine =
    | { kind: "type"; label: string }
    | { kind: "group"; label: string }
    | { kind: "entry"; row: DaybookRow; figures: DaybookFigures }
    | { kind: "groupTotal" | "typeTotal" | "grandTotal"; label: string; figures: DaybookFigures };

const EMPTY: DaybookFigures = {
    rGross: null, rTouch: null, rNet: null, rAmount: null,
    iGross: null, iTouch: null, iNet: null, iAmount: null,
};

const nonZero = (value: number | null | undefined) => value != null && Number(value) !== 0;

/** Where a transaction's figures go: mode A is an amount, otherwise gross / touch / net weight. */
export const entryFigures = (row: DaybookRow): DaybookFigures => {
    const figures = { ...EMPTY };
    if (row.tranMode === "A") {
        if (nonZero(row.receipt)) figures.rAmount = Number(row.receipt);
        if (nonZero(row.issue)) figures.iAmount = Number(row.issue);
        return figures;
    }
    if (nonZero(row.receipt)) {
        figures.rGross = row.grswt;
        figures.rTouch = row.touch;
        figures.rNet = Number(row.receipt);
    }
    if (nonZero(row.issue)) {
        figures.iGross = row.grswt;
        figures.iTouch = row.touch;
        figures.iNet = Number(row.issue);
    }
    return figures;
};

const SUMMED = ["rGross", "rNet", "rAmount", "iGross", "iNet", "iAmount"] as const;

/** Exact (decimal) sums; a column nothing contributed to stays empty. */
const total = (list: DaybookFigures[]): DaybookFigures => {
    const out = { ...EMPTY };
    for (const key of SUMMED) {
        const values = list.map((f) => f[key]).filter((v): v is number => v != null);
        out[key] = values.length ? values.reduce((sum, v) => sum.plus(v), new Decimal(0)).toNumber() : null;
    }
    return out;
};

/** Heading for the group a transaction is listed under. */
const groupOf = (row: DaybookRow) => {
    if (row.itemName) return { key: `I${row.itemId ?? row.itemName}`, label: row.itemName };
    if (row.tranMode === "A") return { key: "A", label: "AMOUNT" };
    if (row.metalName || row.metalId) return { key: `M${row.metalId}`, label: row.metalName ?? row.metalId ?? "" };
    return { key: "W", label: "WEIGHT" };
};

/** Groups keep the order the backend sorted them in (type, item name, smith name). */
export function buildDaybookLines(rows: DaybookRow[]): DaybookLine[] {
    const types = new Map<string, Map<string, { label: string; rows: DaybookRow[] }>>();
    for (const row of rows) {
        const typeLabel = row.tranType || "Other";
        let groups = types.get(typeLabel);
        if (!groups) types.set(typeLabel, (groups = new Map()));
        const group = groupOf(row);
        const entry = groups.get(group.key) ?? { label: group.label, rows: [] };
        entry.rows.push(row);
        groups.set(group.key, entry);
    }

    const lines: DaybookLine[] = [];
    const typeTotals: DaybookFigures[] = [];
    for (const [typeLabel, groups] of types) {
        lines.push({ kind: "type", label: typeLabel.toUpperCase() });
        const groupTotals: DaybookFigures[] = [];
        for (const group of groups.values()) {
            lines.push({ kind: "group", label: group.label.toUpperCase() });
            const figures = group.rows.map(entryFigures);
            group.rows.forEach((row, index) => lines.push({ kind: "entry", row, figures: figures[index] }));
            const groupTotal = total(figures);
            groupTotals.push(groupTotal);
            lines.push({ kind: "groupTotal", label: "Total", figures: groupTotal });
        }
        const typeTotal = total(groupTotals);
        typeTotals.push(typeTotal);
        lines.push({ kind: "typeTotal", label: `${typeLabel.toUpperCase()} TOTAL`, figures: typeTotal });
    }
    if (typeTotals.length > 1) lines.push({ kind: "grandTotal", label: "GRAND TOTAL", figures: total(typeTotals) });
    return lines;
}

/** Totals of every transaction, for the summary above the table. */
export function daybookTotals(lines: DaybookLine[]) {
    const sum = total(lines.flatMap((line) => (line.kind === "entry" ? [line.figures] : [])));
    const diff = (a: number | null, b: number | null) =>
        a == null && b == null ? null : new Decimal(a ?? 0).minus(b ?? 0).toNumber();
    return {
        count: lines.filter((line) => line.kind === "entry").length,
        receipt: { gross: sum.rGross, net: sum.rNet, amount: sum.rAmount },
        issue: { gross: sum.iGross, net: sum.iNet, amount: sum.iAmount },
        balance: { gross: diff(sum.rGross, sum.iGross), net: diff(sum.rNet, sum.iNet), amount: diff(sum.rAmount, sum.iAmount) },
    };
}
