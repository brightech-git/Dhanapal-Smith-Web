// Smith balances and cash/weight ledger rows on top of the backend's single
// /transactions resource (trantype A = amount/cash, W = weight).
//
// The screens still work with "cash" and "weight" rows ({ date, receipts,
// payments, remarks, balance }); this file maps them to and from the API.

import { validateTransactionValues } from "../lib/transaction-validation";
import { api, toApiDate } from "@/lib/api/envelope";
import type { FlowKind } from "@/src/module/smith/type/smith-dashboard.types";

export type TranType = "A" | "W";
export const tranTypeOf = (kind: FlowKind): TranType => (kind === "cash" ? "A" : "W");

export interface MediaItem {
    id: number;
    tranid: number;
    url: string;
}

/** Backend TransactionResponse. */
export interface TransactionApi {
    id: number;
    smithId: number;
    trandate: string;
    remark: string | null;
    issue: number;
    receipt: number;
    trantype: TranType;
    media: MediaItem[];
}

/** One smith with current balances (GET /smiths/balance). */
export interface SmithTransaction {
    id: number;
    smithId: string;
    name: string;
    date: string;
    cashBalance: number;
    weightBalance: number;
}

export interface NewSmithTransaction {
    smithId: string | number;
    name: string;
    date: string;
    cashBalance: number;
    weightBalance: number;
}

/** A cash or weight ledger row as the screens use it. */
export interface SmithFlow {
    id: number;
    smithId: string;
    date: string; // YYYY-MM-DD
    receipts: number;
    payments: number;
    remarks: string;
    /** Running balance (receipts minus payments) up to and including this row. */
    balance: number;
    weightDifference: number;
    media: MediaItem[];
}
export type CashFlow = SmithFlow;
export type WeightFlow = SmithFlow;

export interface SmithTransactionDetail {
    id: number;
    cashBalance: number;
    weightBalance: number;
    transactions: TransactionApi[];
}

// Last known record per id: PUT replaces the whole record, so partial edits merge into this.
const cache = new Map<number, TransactionApi>();
const remember = (t: TransactionApi) => {
    cache.set(t.id, t);
    return t;
};

const num = (v: unknown) => {
    const n = typeof v === "number" ? v : parseFloat(String(v ?? 0));
    return isNaN(n) ? 0 : n;
};

/** Oldest first with a running balance, like a ledger. */
export const toFlows = (rows: TransactionApi[]): SmithFlow[] => {
    let running = 0;
    return [...rows]
        .sort((a, b) => (a.trandate === b.trandate ? a.id - b.id : a.trandate < b.trandate ? -1 : 1))
        .map((t) => {
            running += num(t.receipt) - num(t.issue);
            return {
                id: t.id,
                smithId: String(t.smithId),
                date: t.trandate,
                receipts: num(t.receipt),
                payments: num(t.issue),
                remarks: t.remark ?? "",
                balance: running,
                weightDifference: running,
                media: t.media ?? [],
            };
        });
};

// Exactly the fields TransactionRequest accepts (unknown properties are rejected).
const toRequest = (t: Omit<TransactionApi, "id" | "media">, mediaUrls?: string[] | null) => {
    validateTransactionValues(t.issue, t.receipt);
    return ({
    smithId: t.smithId,
    trandate: toApiDate(t.trandate),
    remark: t.remark && t.remark.trim() ? t.remark.trim() : null,
    issue: num(t.issue),
    receipt: num(t.receipt),
    trantype: t.trantype,
    ...(mediaUrls !== undefined ? { mediaUrls } : {}),
    });
};

/** Screen field names → API field names. */
const applyPatch = (t: TransactionApi, patch: Record<string, unknown>): TransactionApi => {
    const next = { ...t };
    if ("date" in patch) next.trandate = toApiDate(String(patch.date ?? ""));
    if ("receipts" in patch) next.receipt = Number(patch.receipts ?? 0);
    if ("payments" in patch) next.issue = Number(patch.payments ?? 0);
    if ("remarks" in patch) next.remark = (patch.remarks as string) ?? null;
    return next;
};

export const fetchTransaction = async (id: number) => remember(await api.get<TransactionApi>(`transactions/${id}`));

const current = async (id: number) => cache.get(id) ?? (await fetchTransaction(id));

export const fetchTransactions = async (params: { smithId?: number | string; trantype?: TranType } = {}) =>
    ((await api.get<TransactionApi[]>("transactions", params)) ?? []).map(remember);

export const fetchSmithTransactionsBySmith = async (smithId: number | string, trantype?: TranType) =>
    ((await api.get<TransactionApi[]>(`transactions/smiths/${smithId}`, trantype ? { trantype } : undefined)) ?? []).map(remember);

// ---- Balances
export const fetchSmithTransactions = async (): Promise<SmithTransaction[]> => {
    const rows = await api.get<{ smithId: number; smithName: string; weight: number; amount: number }[]>("smiths/balance");
    return (rows ?? []).map((r) => ({
        id: r.smithId,
        smithId: String(r.smithId),
        name: r.smithName,
        date: "",
        cashBalance: num(r.amount),
        weightBalance: num(r.weight),
    }));
};

/** Balances and every transaction of one smith (used before deleting the smith). */
export const fetchSmithTransactionDetail = async (smithId: number): Promise<SmithTransactionDetail> => {
    const transactions = await fetchSmithTransactionsBySmith(smithId);
    const sum = (type: TranType) =>
        transactions.filter((t) => t.trantype === type).reduce((s, t) => s + num(t.receipt) - num(t.issue), 0);
    return { id: smithId, cashBalance: sum("A"), weightBalance: sum("W"), transactions };
};

/** Smiths have no separate transaction header any more; kept so callers still work. */
export const addTransaction = async (_payload: NewSmithTransaction) => undefined;

export const deleteSmithTransaction = async (id: number) => {
    await api.delete(`transactions/${id}`);
    cache.delete(id);
};

// ---- Cash / weight rows
export const fetchFlows = async (smithId: string, kind: FlowKind) => toFlows(await fetchSmithTransactionsBySmith(smithId, tranTypeOf(kind)));
export const fetchCashFlows = (smithId: string) => fetchFlows(smithId, "cash");
export const fetchWeightFlows = (smithId: string) => fetchFlows(smithId, "weight");

export const addFlow = async (smithId: string, kind: FlowKind, data: Record<string, unknown>) => {
    const draft = applyPatch(
        { id: 0, smithId: Number(smithId), trandate: toApiDate(new Date()), remark: null, issue: 0, receipt: 0, trantype: tranTypeOf(kind), media: [] },
        data
    );
    return remember(await api.post<TransactionApi>("transactions", toRequest(draft)));
};
export const addCashFlow = (smithId: string, data: Record<string, unknown>) => addFlow(smithId, "cash", data);
export const addWeightFlow = (smithId: string, data: Record<string, unknown>) => addFlow(smithId, "weight", data);

/** Changes some fields of a row; the rest (and its attachments) are kept. */
export const patchFlow = async (id: number, patch: Record<string, unknown>) => {
    const next = applyPatch(await current(id), patch);
    return remember(await api.put<TransactionApi>(`transactions/${id}`, toRequest(next)));
};
export const patchCashFlow = patchFlow;
export const patchWeightFlow = patchFlow;

export const deleteCashFlow = deleteSmithTransaction;
export const deleteWeightFlow = deleteSmithTransaction;

/**
 * Adds files to a row and/or removes existing ones in one multipart PUT.
 * keepUrls: the existing media URLs to keep (undefined keeps them all).
 */
export const saveTransactionMedia = async (id: number, files: File[], keepUrls?: string[]) => {
    const t = await current(id);
    const form = new FormData();
    form.append(
        "transaction",
        new Blob([JSON.stringify(toRequest(t, keepUrls))], { type: "application/json" })
    );
    files.forEach((f) => form.append("files", f, f.name));
    return remember(await api.put<TransactionApi>(`transactions/${id}`, form));
};
