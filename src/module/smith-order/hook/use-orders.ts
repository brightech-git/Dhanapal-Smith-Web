import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { OrderService, type Order } from "../api/order.api";

const key = ["orders"] as const;

export const useOrders = () => useQuery({ queryKey: key, queryFn: OrderService.getAllOrders });

export function useSaveOrder() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, order }: { id?: number; order: Order }) => (id != null ? OrderService.updateOrder(id, order) : OrderService.createOrder(order)),
        onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    });
}

export function useDeleteOrder() {
    const qc = useQueryClient();
    return useMutation({ mutationFn: (id: number) => OrderService.deleteOrder(id), onSuccess: () => qc.invalidateQueries({ queryKey: key }) });
}
