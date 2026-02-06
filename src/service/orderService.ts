// src/service/orderService.ts
import { getAxiosInstance } from "@/api/axiosInstance";

export const OrderService = {

    fetchOrdersBySmith: async (smithId: string) => {
        const axios = getAxiosInstance();
        const res = await axios.get(`/smith/ordermaster?smithId=${smithId}`);
        return res.data;
    },

    addOrder: async (smithId: string, order: any) => {
        const axios = getAxiosInstance();
        const res = await axios.post(
            `/smith/ordermaster?smithId=${smithId}`,
            order
        );
        return res.data;
    }
};

    // updateOrder: async (order: any) => {
    //     const axiosInstance = getAxiosInstance();
    //     const response = await axiosInstance.put('/smith/ordermaster', order);
    //     return response.data;
    // },

    // deleteOrder: async (orderId: number) => {
    //     const axiosInstance = getAxiosInstance();
    //     const response = await axiosInstance.delete(`/smith/ordermaster/${orderId}`);
    //     return response.data;
    // },
