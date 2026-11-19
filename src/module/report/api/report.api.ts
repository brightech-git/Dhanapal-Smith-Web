import { api } from "@/lib/api/envelope";

// Smith reports (backend /api/v1/report/transaction/*). Every report is one flat
// array: resultSet 1 = record, 2 = subtotal / total, 3 = grand total (last row).

export type ResultSet = 1 | 2 | 3;

/** Weight report (mode W), grouped by date, item, type and metal. */
export type WeightReportRow = {
    resultSet: ResultSet;
    tranDate: string | null;
    itemId: number | null;
    itemName: string | null;
    tranType: string | null;
    tranTypeName: string | null;
    tranMode: "A" | "W";
    metalId: string | null;
    metalName: string | null;
    transactionCount: number;
    grswt: number | null;
    issue: number | null;
    receipt: number | null;
    balance: number | null;
    touch: number | null;
};

export type WeightReportFilter = {
    tranType?: string;
    fromDate?: string;
    toDate?: string;
    smithIds?: number[];
    itemId?: string;
    metalId?: string;
};

/** Amount report (mode A), per smith, or per smith per date (DATEWISE). */
export type AmountReportRow = {
    resultSet: ResultSet;
    smithId: number | null;
    smithName: string | null;
    tranDate: string | null;
    transactionCount: number;
    issue: number | null;
    receipt: number | null;
    balance: number | null;
};

export type AmountGroupBy = "SMITH" | "DATEWISE";
export type AmountReportFilter = { fromDate?: string; toDate?: string; groupBy?: AmountGroupBy };

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

/** Drops empty values so the backend sees only the filters that are set. */
const params = (values: Record<string, string | undefined>) =>
    Object.fromEntries(Object.entries(values).filter(([, v]) => v !== undefined && v !== ""));

export const fetchWeightReport = async (filter: WeightReportFilter = {}) =>
    (await api.get<WeightReportRow[]>("report/transaction/weight", params({
        tranType: filter.tranType,
        fromDate: filter.fromDate,
        toDate: filter.toDate,
        smithIds: filter.smithIds?.length ? filter.smithIds.join(",") : undefined,
        itemId: filter.itemId,
        metalId: filter.metalId,
    }))) ?? [];

export const fetchAmountReport = async (filter: AmountReportFilter = {}) =>
    (await api.get<AmountReportRow[]>("report/transaction/amount", params({
        fromDate: filter.fromDate,
        toDate: filter.toDate,
        groupBy: filter.groupBy,
    }))) ?? [];

export const fetchSmithReport = async (metalId?: string) =>
    (await api.get<SmithReportRow[]>("report/transaction/smith", params({ metalId }))) ?? [];

/** Weight report type filter (normalized by the backend). */
export const REPORT_TRAN_TYPES = [
    { value: "I", label: "ISSUE" },
    { value: "R", label: "RECEIPT" },
    //{ value: "P", label: "PURCHASE" },
    { value: "PR", label: "PURCHASE RETURN" },
    //{ value: "Other", label: "OTHER" },
];
