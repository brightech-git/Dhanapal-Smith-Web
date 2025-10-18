import { useQuery } from "@tanstack/react-query";
import { getSmithFullDetails } from "@/service/smithFullDetailService";

/**
 * Custom React Query hook to fetch smith full details
 */
export const useSmithFullDetails = () => {
    return useQuery({
        queryKey: ["smithFullDetails"], // unique key for caching
        queryFn: getSmithFullDetails,
        staleTime: 1000 * 60 * 5, // cache for 5 minutes
        retry: 2, // retry twice if request fails
    });
};
