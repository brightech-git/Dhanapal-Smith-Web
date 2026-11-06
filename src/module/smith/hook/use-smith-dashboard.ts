"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    fetchDashboardSummary,
    fetchRecentCashTransactions,
    fetchRecentWeightTransactions,
} from "../api/smith-dashboard.api";
import { uploadFlowAttachments } from "../api/smith-attachments.api";


export const smithDashboardKeys = {
    all: ["smith-dashboard"] as const,
    summary: () => [...smithDashboardKeys.all, "summary"] as const,
    recentCash: (limit: number) => [...smithDashboardKeys.all, "recent-cash", limit] as const,
    recentWeight: (limit: number) => [...smithDashboardKeys.all, "recent-weight", limit] as const,
};

/** Current total weight and total amount across all smiths. */
export function useDashboardSummary(enabled = true) {
    return useQuery({
        enabled,
        queryKey: smithDashboardKeys.summary(),
        queryFn: fetchDashboardSummary,
        staleTime: 30_000,
        refetchOnWindowFocus: false,
    });
}

export function useRecentCashTransactions(limit = 5, enabled = true) {
    return useQuery({
        enabled,
        queryKey: smithDashboardKeys.recentCash(limit),
        queryFn: () => fetchRecentCashTransactions(limit),
        staleTime: 30_000,
        refetchOnWindowFocus: false,
    });
}

export function useRecentWeightTransactions(limit = 5, enabled = true) {
    return useQuery({
        enabled,
        queryKey: smithDashboardKeys.recentWeight(limit),
        queryFn: () => fetchRecentWeightTransactions(limit),
        staleTime: 30_000,
        refetchOnWindowFocus: false,
    });
}

/** Upload image / PDF / camera photo for one cash or weight row. */
export function useUploadFlowAttachments() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, files, keepUrls }: { id: number; files: File[]; keepUrls?: string[] }) =>
            uploadFlowAttachments(id, files, keepUrls),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: smithDashboardKeys.all }),
    });
}
