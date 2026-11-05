"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    fetchDashboardSummary,
    fetchRecentCashTransactions,
    fetchRecentWeightTransactions,
} from "../api/smith-dashboard.api";
import { uploadFlowAttachments } from "../api/smith-attachments.api";
import type { FlowAttachmentUpload, FlowKind } from "../type/smith-dashboard.types";

export const smithDashboardKeys = {
    all: ["smith-dashboard"] as const,
    summary: () => [...smithDashboardKeys.all, "summary"] as const,
    recentCash: (limit: number) => [...smithDashboardKeys.all, "recent-cash", limit] as const,
    recentWeight: (limit: number) => [...smithDashboardKeys.all, "recent-weight", limit] as const,
};

/** Current total weight and total amount across all smiths. */
export function useDashboardSummary() {
    return useQuery({
        queryKey: smithDashboardKeys.summary(),
        queryFn: fetchDashboardSummary,
        staleTime: 30_000,
        refetchOnWindowFocus: false,
    });
}

export function useRecentCashTransactions(limit = 5) {
    return useQuery({
        queryKey: smithDashboardKeys.recentCash(limit),
        queryFn: () => fetchRecentCashTransactions(limit),
        staleTime: 30_000,
        refetchOnWindowFocus: false,
    });
}

export function useRecentWeightTransactions(limit = 5) {
    return useQuery({
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
        mutationFn: ({ kind, id, files }: { kind: FlowKind; id: number; files: FlowAttachmentUpload }) =>
            uploadFlowAttachments(kind, id, files),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: smithDashboardKeys.all }),
    });
}
