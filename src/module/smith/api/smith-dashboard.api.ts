// Dashboard totals and recent transactions from the backend.

import { api } from "@/lib/api/envelope";
import type { DashboardSummary, FlowKind, RecentTransaction } from "../type/smith-dashboard.types";
import { fetchSmithTransactions, fetchTransactions, tranTypeOf, type TransactionApi } from "./smith-transactions.api";

interface DashboardApi {
    totalWeightBalance: number;
    smithCount: number;
    totalAmount: number;
    totalWeightTransactions: number;
    totalAmountTransactions: number;
    totalTransactions: number;
}

const num = (v: unknown) => (typeof v === "number" ? v : parseFloat(String(v ?? 0)) || 0);

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
    const d = await api.get<DashboardApi>("transaction/dashboard");
    return {
        totalWeight: num(d.totalWeightBalance),
        totalAmount: num(d.totalAmount),
        smithCount: d.smithCount ?? 0,
        weightTransactions: d.totalWeightTransactions ?? 0,
        amountTransactions: d.totalAmountTransactions ?? 0,
        totalTransactions: d.totalTransactions ?? 0,
        updatedAt: new Date().toISOString(),
    };
}

/** Latest transactions of one type, newest first, with smith name and running balance. */
async function fetchRecent(kind: FlowKind, limit: number): Promise<RecentTransaction[]> {
    const [rows, smiths] = await Promise.all([fetchTransactions({ trantype: tranTypeOf(kind) }), fetchSmithTransactions()]);
    const names = new Map(smiths.map((s) => [s.id, s.name]));

    // Running balance per smith, oldest first.
    const balanceById = new Map<number, number>();
    const running = new Map<number, number>();
    [...rows]
        .sort((a, b) => (a.trandate === b.trandate ? a.id - b.id : a.trandate < b.trandate ? -1 : 1))
        .forEach((t) => {
            const next = (running.get(t.smithId) ?? 0) + num(t.receipt) - num(t.issue);
            running.set(t.smithId, next);
            balanceById.set(t.id, next);
        });

    const newest = [...rows].sort((a: TransactionApi, b: TransactionApi) =>
        a.trandate === b.trandate ? b.id - a.id : a.trandate < b.trandate ? 1 : -1
    );
    return newest.slice(0, limit).map((t, i) => ({
        id: t.id,
        sno: i + 1,
        smithId: t.smithId,
        smithName: names.get(t.smithId) ?? `Smith ${t.smithId}`,
        date: t.trandate,
        receipt: num(t.receipt),
        issue: num(t.issue),
        balance: balanceById.get(t.id) ?? 0,
        remark: t.remark ?? "",
        media: (t.media ?? []).map((m) => ({ id: m.id, url: m.url })),
    }));
}

export const fetchRecentCashTransactions = (limit = 5) => fetchRecent("cash", limit);
export const fetchRecentWeightTransactions = (limit = 5) => fetchRecent("weight", limit);
