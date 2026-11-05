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

// Inline placeholder media so the dummy rows show previews without a server.
const placeholderImage = (label: string, from: string, to: string) =>
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="560" viewBox="0 0 800 560">` +
            `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>` +
            `<rect width="800" height="560" fill="url(#g)"/>` +
            `<text x="400" y="290" font-family="sans-serif" font-size="44" fill="white" text-anchor="middle">${label}</text></svg>`
    );

const PLACEHOLDER_PDF =
    "data:application/pdf;base64," +
    "JVBERi0xLjQKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqCjIgMCBvYmo8PC9UeXBlL1BhZ2VzL0tpZHNbMyAwIFJdL0NvdW50IDE+PmVuZG9iagozIDAgb2JqPDwvVHlwZS9QYWdlL1BhcmVudCAyIDAgUi9NZWRpYUJveFswIDAgMzAwIDE0NF0vQ29udGVudHMgNCAwIFIvUmVzb3VyY2VzPDwvRm9udDw8L0YxIDUgMCBSPj4+Pj4+ZW5kb2JqCjQgMCBvYmo8PC9MZW5ndGggNTU+PnN0cmVhbQpCVCAvRjEgMjAgVGYgNDAgNzAgVGQgKFNhbXBsZSByZWNlaXB0IFBERikgVGogRVQKZW5kc3RyZWFtCmVuZG9iago1IDAgb2JqPDwvVHlwZS9Gb250L1N1YnR5cGUvVHlwZTEvQmFzZUZvbnQvSGVsdmV0aWNhPj5lbmRvYmoKdHJhaWxlcjw8L1Jvb3QgMSAwIFI+Pgo=";

const DUMMY_RECENT_CASH: RecentTransaction[] = [
    {
        id: 101, sno: 1, smithName: "Murugan", date: "2026-11-05", receipt: 25000, issue: 0, balance: 125000, remark: "Advance received",
        imageFile: placeholderImage("Cash receipt", "#0c376a", "#1d5fb0"),
        pdfFile: PLACEHOLDER_PDF,
    },
    {
        id: 102, sno: 2, smithName: "Selvam", date: "2026-11-05", receipt: 0, issue: 12000, balance: 48000, remark: "Making charge paid",
        cameraImage: placeholderImage("Camera photo", "#b45309", "#f59e0b"),
    },
    { id: 103, sno: 3, smithName: "Karthik", date: "2026-11-04", receipt: 8000, issue: 0, balance: 32500, remark: "Old balance" },
    { id: 104, sno: 4, smithName: "Raja", date: "2026-11-04", receipt: 0, issue: 5500, balance: 21000, remark: "Stone setting" },
    { id: 105, sno: 5, smithName: "Murugan", date: "2026-11-03", receipt: 15000, issue: 0, balance: 100000, remark: "" },
];

const DUMMY_RECENT_WEIGHT: RecentTransaction[] = [
    {
        id: 201, sno: 1, smithName: "Selvam", date: "2026-11-05", receipt: 52.35, issue: 0, balance: 210.4, remark: "22K chain return",
        imageFile: placeholderImage("Chain return", "#065f46", "#10b981"),
        cameraImage: placeholderImage("Weighing scale", "#334155", "#64748b"),
        pdfFile: PLACEHOLDER_PDF,
    },
    { id: 202, sno: 2, smithName: "Murugan", date: "2026-11-05", receipt: 0, issue: 80.0, balance: 158.05, remark: "Gold issued for bangles" },
    { id: 203, sno: 3, smithName: "Raja", date: "2026-11-04", receipt: 24.12, issue: 0, balance: 96.5, remark: "Ring return" },
    { id: 204, sno: 4, smithName: "Karthik", date: "2026-11-04", receipt: 0, issue: 40.25, balance: 72.38, remark: "" },
    { id: 205, sno: 5, smithName: "Selvam", date: "2026-11-03", receipt: 18.6, issue: 0, balance: 158.05, remark: "Earrings" },
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
