import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../api/gift.api";
import type { GiftFilter, GiftIssueInput, GiftTranInput, IntroducerInput } from "../type/gift-voucher.types";

export const giftKeys = {
    all: ["gift"] as const,
    introducers: ["gift", "introducers"] as const,
    gifts: (f: GiftFilter) => ["gift", "transactions", f] as const,
    remaining: (f: Omit<GiftFilter, "type">) => ["gift", "remaining", f] as const,
};

export const useIntroducers = () => useQuery({ queryKey: giftKeys.introducers, queryFn: () => api.fetchIntroducers() });

export const useGifts = (filter: GiftFilter, enabled = true) =>
    useQuery({ queryKey: giftKeys.gifts(filter), queryFn: () => api.fetchGifts(filter), enabled });

export const useRemaining = (filter: Omit<GiftFilter, "type">, enabled = true) =>
    useQuery({ queryKey: giftKeys.remaining(filter), queryFn: () => api.fetchRemaining(filter), enabled });

/** Every gift change can move balances, so refresh all gift queries. */
const useInvalidate = () => {
    const qc = useQueryClient();
    return () => qc.invalidateQueries({ queryKey: giftKeys.all });
};

export function useSaveIntroducer() {
    const invalidate = useInvalidate();
    return useMutation({
        mutationFn: ({ id, input }: { id?: number; input: IntroducerInput }) =>
            id != null ? api.updateIntroducer(id, input) : api.createIntroducer(input),
        onSuccess: invalidate,
    });
}

export function useDeleteIntroducer() {
    const invalidate = useInvalidate();
    return useMutation({ mutationFn: (id: number) => api.deleteIntroducer(id), onSuccess: invalidate });
}

export function useIssueGifts() {
    const invalidate = useInvalidate();
    return useMutation({ mutationFn: (input: GiftIssueInput) => api.issueGifts(input), onSuccess: invalidate });
}

export function useUpdateGift() {
    const invalidate = useInvalidate();
    return useMutation({ mutationFn: ({ id, input }: { id: number; input: GiftTranInput }) => api.updateGift(id, input), onSuccess: invalidate });
}

export function useReceiveGifts() {
    const invalidate = useInvalidate();
    return useMutation({ mutationFn: (tagnos: string[]) => api.receiveGifts(tagnos), onSuccess: invalidate });
}

export function useDeleteGift() {
    const invalidate = useInvalidate();
    return useMutation({ mutationFn: (id: number) => api.deleteGift(id), onSuccess: invalidate });
}
