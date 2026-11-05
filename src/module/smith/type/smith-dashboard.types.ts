/** GET /transaction/dashboard, mapped for the KPI cards. */
export interface DashboardSummary {
    /** Total weight balance (receipt minus issue) across all smiths. */
    totalWeight: number;
    /** Total amount balance across all smiths. */
    totalAmount: number;
    smithCount: number;
    weightTransactions: number;
    amountTransactions: number;
    totalTransactions: number;
    updatedAt?: string;
}

export interface MediaFile {
    id: number;
    url: string;
}

/** One row in the "recent transactions" cards. */
export interface RecentTransaction {
    id?: number;
    sno: number;
    receipt: number;
    issue: number;
    /** That smith's running balance after this transaction. */
    balance: number;
    remark: string;
    smithId?: number;
    smithName?: string;
    date?: string;
    media?: MediaFile[];
}

export type FlowKind = "cash" | "weight";

/** Anything that carries attachments (ledger rows, recent rows). */
export interface FlowAttachments {
    media?: MediaFile[];
}
