// Update your orderService.ts
import { getAxiosInstance } from "@/api/axiosInstance";

export type OrderPatchPayload = Record<string, any>;

export const OrderService = {
    /**
     * Fetch orders by smith
     */
    fetchOrdersBySmith: async (smithId: string) => {
        const axios = getAxiosInstance();
        const res = await axios.get(
            `/smith/ordermaster?smithId=${smithId}`
        );
        return res.data;
    },

    /**
     * Add new order
     */
    addOrder: async (smithId: string, order: any) => {
        const axios = getAxiosInstance();
        const res = await axios.post(
            `/smith/ordermaster?smithId=${smithId}`,
            order
        );
        return res.data;
    },

    /**
     * Update order
     */
    updateOrder: async (
        orderId: number,
        updates: OrderPatchPayload
    ) => {
        const axios = getAxiosInstance();
        const res = await axios.patch(
            `/smith/ordermaster/${orderId}`,
            updates
        );
        return res.data;
    },

    /**
     * Delete order
     */
deleteOrder: async (orderId: number) => {
  const axios = getAxiosInstance();
  const res = await axios.delete(`/smith/ordermaster/${orderId}`);
  return res.data;
},
};