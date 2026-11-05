export interface DashboardSummary {
    /** Current total weight balance across all smiths, in grams. */
    totalWeight: number;
    /** Current total cash balance across all smiths, in rupees. */
    totalAmount: number;
    /** Change since yesterday (optional; shown as a trend when present). */
    weightChange?: number;
    amountChange?: number;
    smithCount?: number;
    updatedAt?: string;
}

/** One row in the "recent transactions" cards. */
export interface RecentTransaction {
    /** Cash/weight row id; needed to add or replace attachments. */
    id?: number;
    sno: number;
    receipt: number;
    issue: number;
    balance: number;
    remark: string;
    smithName?: string;
    date?: string;
    /** Attachment URLs (same fields as the cash/weight rows). */
    imageFile?: string | null;
    pdfFile?: string | null;
    cameraImage?: string | null;
}

export type FlowKind = "cash" | "weight";

/** Attachment URLs stored on a cash or weight row. */
export interface FlowAttachments {
    imageFile?: string | null;
    pdfFile?: string | null;
    cameraImage?: string | null;
}

/** Files picked in the attachment dialog; any left out keep the current file. */
export interface FlowAttachmentUpload {
    imageFile?: File | null;
    pdfFile?: File | null;
    cameraImage?: File | null;
}
