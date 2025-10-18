// src/api/types.ts
export interface SmithTransaction {
    smithId?: number;        // optional for creation
    grwt: number;
    lesswt: number;
    netwt: number;
    touch: number;
    purity: number;
    pcs: number;
    cash: number;
    upi: number;
    card: number;
    rtgs: number;
    cheque: number;
    updated?: string;        // ISO date string
    uptime?: string;         // ISO datetime string
    cancel?: string;
}
