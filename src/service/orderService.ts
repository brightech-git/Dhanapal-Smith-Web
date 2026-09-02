// src/service/orderService.ts
import { getAxiosInstance } from "@/api/axiosInstance";

export type Order = {
  id?: number;
  orderDate: string;
  orderItems: string;
  isNew?: boolean; // frontend-only
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export const OrderService = {
  getAllOrders: async (): Promise<Order[]> => {
    try {
      const axios = getAxiosInstance();
      const res = await axios.get<ApiResponse<Order[]>>("smith/orders");
      return res.data.data;
    } catch (error) {
      console.error("Error fetching orders:", error);
      throw error;
    }
  },

  createOrder: async (order: Order): Promise<Order> => {
    try {
      const axios = getAxiosInstance();
      const res = await axios.post<ApiResponse<Order>>("smith/orders", order);
      return res.data.data;
    } catch (error: any) {
      console.error("Error creating order:", error);
      // Check if response is HTML instead of JSON
      if (error.response && typeof error.response.data === 'string' && error.response.data.includes('<!DOCTYPE')) {
        throw new Error("Server returned HTML. Check if API endpoint is correct.");
      }
      throw error;
    }
  },

  updateOrder: async (id: number, order: Order): Promise<Order> => {
    try {
      const axios = getAxiosInstance();
      const res = await axios.put<ApiResponse<Order>>(`smith/orders/${id}`, order);
      return res.data.data;
    } catch (error) {
      console.error("Error updating order:", error);
      throw error;
    }
  },

  deleteOrder: async (id: number): Promise<void> => {
    try {
      const axios = getAxiosInstance();
      await axios.delete(`smith/orders/${id}`);
    } catch (error) {
      console.error("Error deleting order:", error);
      throw error;
    }
  },
};
// // Update your orderService.ts
// import { getAxiosInstance } from "@/api/axiosInstance";

// export type OrderPatchPayload = Record<string, any>;
// const SUB_URL = "/smith/ordermaster";
// //const SUB_URL = "/smith/ordermaster";
// export const OrderService = {

//     fetchOrdersBySmith: async (smithId: string) => {
//         const axios = getAxiosInstance();
//         const res = await axios.get(
//             `${SUB_URL}?smithId=${smithId}`
//         );
//         return res.data;
//     },

//     /**
//      * Add new order
//      */
//     addOrder: async (smithId: string, order: any) => {
//         const axios = getAxiosInstance();
//         const res = await axios.post(
//             `${SUB_URL}?smithId=${smithId}`,
//             order
//         );
//         return res.data;
//     },

//     /**
//      * Update order
//      */
//     updateOrder: async (
//         orderId: number,
//         updates: OrderPatchPayload
//     ) => {
//         const axios = getAxiosInstance();
//         const res = await axios.patch(
//             `${SUB_URL}/${orderId}`,
//             updates
//         );
//         return res.data;
//     },

//     /**
//      * Delete order
//      */
// deleteOrder: async (orderId: number) => {
//   const axios = getAxiosInstance();
//   const res = await axios.delete(`${SUB_URL}/${orderId}`);
//   return res.data;
// },
// };