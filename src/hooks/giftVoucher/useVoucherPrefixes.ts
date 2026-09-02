import { useQuery } from "@tanstack/react-query";
import { VoucherPrefixService } from "@/service/voucherService";

/**
 * Fetches active Gift Voucher prefixes (from GiftVoucherSoftControl)
 * for use in Prefix comboboxes on the Generate / Return screens.
 */
export const useVoucherPrefixes = () => {
    return useQuery({
        queryKey: ["voucherPrefixes", "active"],
        queryFn: VoucherPrefixService.getActive,
        staleTime: 1000 * 60 * 5,
        retry: 2,
    });
};

export const useVoucherById = (id: number , type:string) => {
    return useQuery({
        queryKey: ["voucherDetails", id],
        queryFn: () => VoucherPrefixService.getByVoucherNumber(id, type),
    });
};

