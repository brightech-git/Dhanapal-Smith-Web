// Dashboard summary and recent transactions.
//
// The backend has no endpoints for these yet, so the functions return
// dummy data in the final response shape. When the endpoints exist, set
// USE_DUMMY_DASHBOARD to false and fill in the paths marked TODO; the
// hooks and screens will not need to change.

import { getAxiosInstance } from "@/lib/api/client";
import type { DashboardSummary, RecentTransaction } from "../type/smith-dashboard.types";

export const USE_DUMMY_DASHBOARD = true;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const DUMMY_SUMMARY: DashboardSummary = {
    totalWeight: 1284.562,
    totalAmount: 845320.5,
    weightChange: 12.45,
    amountChange: -15200,
    smithCount: 18,
    updatedAt: new Date().toISOString(),
};

const DUMMY_RECENT_CASH: RecentTransaction[] = [
    { sno: 1, smithName: "Murugan", date: "2026-11-05", receipt: 25000, issue: 0, balance: 125000, remark: "Advance received" },
    { sno: 2, smithName: "Selvam", date: "2026-11-05", receipt: 0, issue: 12000, balance: 48000, remark: "Making charge paid" },
    { sno: 3, smithName: "Karthik", date: "2026-11-04", receipt: 8000, issue: 0, balance: 32500, remark: "Old balance" },
    { sno: 4, smithName: "Raja", date: "2026-11-04", receipt: 0, issue: 5500, balance: 21000, remark: "Stone setting" },
    { sno: 5, smithName: "Murugan", date: "2026-11-03", receipt: 15000, issue: 0, balance: 100000, remark: "" },
];

const DUMMY_RECENT_WEIGHT: RecentTransaction[] = [
    { sno: 1, smithName: "Selvam", date: "2026-11-05", receipt: 52.35, issue: 0, balance: 210.4, remark: "22K chain return" },
    { sno: 2, smithName: "Murugan", date: "2026-11-05", receipt: 0, issue: 80.0, balance: 158.05, remark: "Gold issued for bangles" },
    { sno: 3, smithName: "Raja", date: "2026-11-04", receipt: 24.12, issue: 0, balance: 96.5, remark: "Ring return" },
    { sno: 4, smithName: "Karthik", date: "2026-11-04", receipt: 0, issue: 40.25, balance: 72.38, remark: "" },
    { sno: 5, smithName: "Selvam", date: "2026-11-03", receipt: 18.6, issue: 0, balance: 158.05, remark: "Earrings" },
];

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
    if (USE_DUMMY_DASHBOARD) {
        await delay(400);
        return { ...DUMMY_SUMMARY, updatedAt: new Date().toISOString() };
    }
    // TODO: replace with the real endpoint when the backend adds it.
    const { data } = await getAxiosInstance().get<DashboardSummary>("smith/dashboard/summary");
    return data;
}

export async function fetchRecentCashTransactions(limit = 5): Promise<RecentTransaction[]> {
    if (USE_DUMMY_DASHBOARD) {
        await delay(500);
        return DUMMY_RECENT_CASH.slice(0, limit);
    }
    // TODO: replace with the real endpoint when the backend adds it.
    const { data } = await getAxiosInstance().get<RecentTransaction[]>("smith/dashboard/recent-cash", { params: { limit } });
    return data;
}

export async function fetchRecentWeightTransactions(limit = 5): Promise<RecentTransaction[]> {
    if (USE_DUMMY_DASHBOARD) {
        await delay(500);
        return DUMMY_RECENT_WEIGHT.slice(0, limit);
    }
    // TODO: replace with the real endpoint when the backend adds it.
    const { data } = await getAxiosInstance().get<RecentTransaction[]>("smith/dashboard/recent-weight", { params: { limit } });
    return data;
}
