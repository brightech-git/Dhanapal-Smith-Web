// src/types/giftVoucher.ts

export interface Introducer {
    introducerId?: number; // Primary key
    introducerName: string;
    email?: string;
    mobile?: string;
    address?: string;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface VoucherPrefix {
    id: number;
    controlCode: string;
    prefix: string;
    lastNumber: number;
    batchNumber: number;
    isActive: boolean;
}

export interface GenerateVoucherRequest {
    introducerId: number;
    prefix: string;
    piece: number;
    amount: number;
}

export interface VoucherGeneration {
    id: number;
    batchNo: number;
    prefix: string;
    voucherNo: number;
    voucherCode: string;
    createdAt: string;
}

export interface ReturnVoucherRequest {
    batchNo: number;
    introducerId: number;
    prefix: string;
    voucherNos: number[];
}

export interface VoucherReportRequest {
    issRec?: "I" | "R" | "";
    introducerId?: number;
    batchNo?: number;
    voucherNo?: number;
    mobileNo?: string;
    fromDate?: string;
    toDate?: string;
}

export interface VoucherReportResponse {
    id: number;
    batchNo: number;
    introducerId: number;
    introducerName: string;
    mobileNo?: string;
    prefix: string;
    voucherNo: number;
    voucherCode: string;
    amount: number;
    piece: number;
    issRec: string;
    createdAt: string;
    issuePiece: number;
    returnPiece: number;
    balancePiece: number;
    issueAmount: number;
    returnAmount: number;
    balanceAmount: number;
}
