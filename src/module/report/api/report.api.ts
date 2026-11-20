import { api } from "@/lib/api/envelope";

// Smith reports (backend /api/v1/report/transaction/*).

/** resultSet on summary reports: 1 = record, 2 = subtotal / total, 3 = grand total (last row). */
export type ResultSet = 1 | 2 | 3;

/** Smith summary: weight per metal and the smith's amount balance. */
export type SmithReportRow = {
    resultSet: ResultSet;
    smithId: number | null;
    smithName: string | null;
    metalId: string | null;
    metalName: string | null;
    weight: number | null;
    amount: number | null;
};

/**
 * Day book (GET report/transaction/daybook): one row per non-cancelled transaction,
 * sorted by type, item and smith. No total rows; the screen adds them.
 * Mode W: issue / receipt are the net (pure) weight, with grswt and touch.
 * Mode A: issue / receipt are amounts; an entry with both comes back as two rows.
 */
export type DaybookRow = {
    id: number;
    tranDate: string;
    /** Display label: Issue, Receipt, Purchase, Purchase Return, Payment or a custom type. */
    tranType: string;
    tranMode: string;
    smithId: number | null;
    smithName: string | null;
    itemId: number | null;
    itemName: string | null;
    metalId: string | null;
    metalName: string | null;
    issue: number | null;
    receipt: number | null;
    grswt: number | null;
    touch: number | null;
    remark: string | null;
};

/** Leave fromDate empty for "As on toDate" (everything up to that date). */
export type DaybookFilter = {
    fromDate?: string;
    toDate?: string;
    smithIds?: string[];
    metalIds?: string[];
    itemIds?: string[];
    tranTypes?: string[];
};

/** Drops empty values so the backend sees only the filters that are set. */
const params = (values: Record<string, string | undefined>) =>
    Object.fromEntries(Object.entries(values).filter(([, v]) => v !== undefined && v !== ""));

const csv = (values?: string[]) => (values?.length ? values.join(",") : undefined);

export const fetchSmithReport = async (metalId?: string) =>
    (await api.get<SmithReportRow[]>("report/transaction/smith", params({ metalId }))) ?? [];

export const fetchDaybook = async (filter: DaybookFilter = {}) =>
    (await api.get<DaybookRow[]>("report/transaction/daybook", params({
        fromDate: filter.fromDate,
        toDate: filter.toDate,
        smithId: csv(filter.smithIds),
        metalId: csv(filter.metalIds),
        itemId: csv(filter.itemIds),
        tranType: csv(filter.tranTypes),
    }))) ?? [];

/** Day book type filter. The backend matches the exact display label (case-sensitive). */
export const DAYBOOK_TRAN_TYPES = [
    { value: "Receipt", label: "RECEIPT" },
    { value: "Issue", label: "ISSUE" },
    { value: "Purchase", label: "PURCHASE" },
    { value: "Purchase Return", label: "PURCHASE RETURN" },
];
