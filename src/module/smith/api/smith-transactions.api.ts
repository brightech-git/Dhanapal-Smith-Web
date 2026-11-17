// Smith balances and cash/weight ledger rows on top of the backend's single
// /transactions resource (trantype A = amount/cash, W = weight).
//
// The screens still work with "cash" and "weight" rows ({ date, receipts,
// payments, remarks, balance }); this file maps them to and from the API.
//
// Backend fields: tranMode is A (amount) or W (weight); tranType is the
// weight entry type, R (Receipt) or P (Purchase). Weight rows also carry
// itemId, grswt (gross weight), touch and purewt (grswt x touch / 100).

import { validateTransactionValues } from "../lib/transaction-validation";
import { api, toApiDate } from "@/lib/api/envelope";
import Decimal from "decimal.js";
import { isWeightTranType, pureWeight, type WeightTranType } from "../lib/weight-calc";
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
    tranDate: string;
    remark: string | null;
    issue: number;
    receipt: number;
    /** A or W. Older backends sent this in tranType instead. */
    tranMode?: TranType | null;
    /** R (Receipt) or P (Purchase) for weight rows. */
    tranType?: string | null;
    media: MediaItem[];
    itemId?: number | null;
    grswt?: number | null;
    purewt?: number | null;
    touch?: number | null;
    itemName?: string | null;
}

/** A or W, from tranMode (or tranType on older backends). */
const typeText = (t: Pick<TransactionApi, "tranType">) => t.tranType ?? null;

export const modeOf = (t: Pick<TransactionApi, "tranMode" | "tranType">): TranType | undefined => {
    const text = typeText(t);
    return t.tranMode ?? (text === "A" || text === "W" ? text : undefined);
};

/** R or P, or "" when the row has no weight entry type. */
const entryTypeOf = (t: Pick<TransactionApi, "tranType">) => {
    const text = typeText(t);
    return isWeightTranType(text) ? text : "";
};

/** One smith with current balances (from GET /transactions/summary). */
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
    /** Weight rows: R (Receipt) or P (Purchase), "" for older rows. */
    tranType: WeightTranType | "";
    itemId: number | null;
    itemName: string;
    grswt: number | null;
    touch: number | null;
    purewt: number | null;
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

const optionalNum = (v: unknown) => (v === null || v === undefined || v === "" ? null : num(v));

/** Oldest first with a running balance, like a ledger. Sums use decimal.js so weights stay exact. */
export const toFlows = (rows: TransactionApi[]): SmithFlow[] => {
    let total = new Decimal(0);
    return [...rows]
        .sort((a, b) => (a.tranDate === b.tranDate ? a.id - b.id : a.tranDate < b.tranDate ? -1 : 1))
        .map((t) => {
            total = total.plus(String(num(t.receipt))).minus(String(num(t.issue)));
            const running = total.toNumber();
            return {
                id: t.id,
                smithId: String(t.smithId),
                date: t.tranDate,
                receipts: num(t.receipt),
                payments: num(t.issue),
                remarks: t.remark ?? "",
                balance: running,
                weightDifference: running,
                media: t.media ?? [],
                tranType: entryTypeOf(t),
                itemId: t.itemId ?? null,
                itemName: t.itemName ?? "",
                grswt: optionalNum(t.grswt),
                touch: optionalNum(t.touch),
                // Older rows may come back without purewt: work it out from grswt and touch.
                purewt: optionalNum(t.purewt) ?? (t.grswt != null && t.touch != null ? pureWeight(t.grswt, t.touch) : null),
            };
        });
};

// Exactly the fields TransactionRequest accepts (unknown properties are rejected):
// smithId, tranDate, remark, issue, receipt, tranMode, tranType, mediaUrls, itemId, grswt, touch, cancel.
// purewt is not sent; the screen shows grswt x touch / 100 and puts it in receipt or issue.
const toRequest = (t: Omit<TransactionApi, "id" | "media">, mediaUrls?: string[] | null) => {
    const entryType = entryTypeOf(t);
    validateTransactionValues(t.issue, t.receipt);
    return ({
    smithId: t.smithId,
    tranDate: toApiDate(t.tranDate),
    remark: t.remark && t.remark.trim() ? t.remark.trim() : null,
    issue: num(t.issue),
    receipt: num(t.receipt),
    tranMode: modeOf(t),
    tranType: entryType || null,
    itemId: t.itemId ?? null,
    grswt: t.grswt ?? null,
    touch: t.touch ?? null,
    ...(mediaUrls !== undefined ? { mediaUrls } : {}),
    });
};

/** Screen field names → API field names. */
const applyPatch = (t: TransactionApi, patch: Record<string, unknown>): TransactionApi => {
    const next = { ...t };
    if ("date" in patch) next.tranDate = toApiDate(String(patch.date ?? ""));
    if ("receipts" in patch) next.receipt = Number(patch.receipts ?? 0);
    if ("payments" in patch) next.issue = Number(patch.payments ?? 0);
    if ("remarks" in patch) next.remark = (patch.remarks as string) ?? null;
    if ("tranType" in patch) next.tranType = (patch.tranType as string) || null;
    if ("itemId" in patch) next.itemId = patch.itemId == null || patch.itemId === "" ? null : Number(patch.itemId);
    if ("grswt" in patch) next.grswt = optionalNum(patch.grswt);
    if ("touch" in patch) next.touch = optionalNum(patch.touch);
    if ("purewt" in patch) next.purewt = optionalNum(patch.purewt);
    return next;
};

export const fetchTransaction = async (id: number) => remember(await api.get<TransactionApi>(`transactions/${id}`));

const current = async (id: number) => cache.get(id) ?? (await fetchTransaction(id));

// The mode filter is sent as tranMode (A or W),
// and applied again here so either backend gives the same rows.
const byMode = (mode?: TranType) => (t: TransactionApi) => !mode || !modeOf(t) || modeOf(t) === mode;

export const fetchTransactions = async ({ trantype, ...params }: { smithId?: number | string; trantype?: TranType } = {}) =>
    ((await api.get<TransactionApi[]>("transactions", trantype ? { ...params, tranMode: trantype } : params)) ?? [])
        .filter(byMode(trantype)).map(remember);

export const fetchSmithTransactionsBySmith = async (smithId: number | string, trantype?: TranType, metalId?: string) =>
    ((await api.get<TransactionApi[]>(`transactions/smiths/${smithId}`, {
        ...(trantype ? { tranMode: trantype } : {}),
        // metalId filters weight rows by their item's metal.
        ...(metalId && trantype === "W" ? { metalId } : {}),
    })) ?? [])
        .filter(byMode(trantype)).map(remember);

// ---- Balances
/** GET /transactions/summary row: one per smith and metal (issue minus receipt). */
export interface TransactionSummaryRow {
    smithId: number;
    smithName: string;
    metalId: string | null;
    metalName: string | null;
    weight: number;
    amount: number;
}

/** Summary rows; with a metalId the backend returns that metal only. */
export const fetchTransactionSummary = async ({ metalId }: { metalId?: string } = {}) =>
    (await api.get<TransactionSummaryRow[]>("transactions/summary", metalId ? { metalId } : undefined)) ?? [];

/**
 * One row per smith. Weight counts only the chosen metal (all metals when
 * metalId is empty); amount is cash, so it always counts every row.
 */
export const summarizeSmiths = (rows: TransactionSummaryRow[], metalId = ""): SmithTransaction[] => {
    const bySmith = new Map<number, { name: string; weight: Decimal; amount: Decimal }>();
    for (const r of rows) {
        const entry = bySmith.get(r.smithId) ?? { name: r.smithName, weight: new Decimal(0), amount: new Decimal(0) };
        entry.amount = entry.amount.plus(String(num(r.amount)));
        if (!metalId || r.metalId === metalId) entry.weight = entry.weight.plus(String(num(r.weight)));
        bySmith.set(r.smithId, entry);
    }
    return Array.from(bySmith, ([smithId, e]) => ({
        id: smithId,
        smithId: String(smithId),
        name: e.name,
        date: "",
        cashBalance: e.amount.toNumber(),
        weightBalance: e.weight.toNumber(),
    }));
};


/** One row per smith with balances (weight for the chosen metal only). */
export const fetchSmithTransactions = async (metalId = ""): Promise<SmithTransaction[]> =>
    summarizeSmiths(await fetchTransactionSummary({ metalId }), metalId);

/** Balances and every transaction of one smith (used before deleting the smith). */
export const fetchSmithTransactionDetail = async (smithId: number): Promise<SmithTransactionDetail> => {
    const transactions = await fetchSmithTransactionsBySmith(smithId);
    const sum = (type: TranType) =>
        transactions.filter((t) => modeOf(t) === type)
            .reduce((s, t) => s.plus(String(num(t.receipt))).minus(String(num(t.issue))), new Decimal(0)).toNumber();
    return { id: smithId, cashBalance: sum("A"), weightBalance: sum("W"), transactions };
};

/** Smiths have no separate transaction header any more; kept so callers still work. */
export const addTransaction = async (_payload: NewSmithTransaction) => undefined;

export const deleteSmithTransaction = async (id: number) => {
    await api.delete(`transactions/${id}`);
    cache.delete(id);
};

// ---- Cash / weight rows
export const fetchFlows = async (smithId: string, kind: FlowKind, metalId?: string) =>
    toFlows(await fetchSmithTransactionsBySmith(smithId, tranTypeOf(kind), metalId));
export const fetchCashFlows = (smithId: string) => fetchFlows(smithId, "cash");
export const fetchWeightFlows = (smithId: string, metalId?: string) => fetchFlows(smithId, "weight", metalId);

export const addFlow = async (smithId: string, kind: FlowKind, data: Record<string, unknown>) => {
    const draft = applyPatch(
        { id: 0, smithId: Number(smithId), tranDate: toApiDate(new Date()), remark: null, issue: 0, receipt: 0, tranMode: tranTypeOf(kind), tranType: null, media: [] },
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
