// Update your orderService.ts
import { getAxiosInstance } from "@/api/axiosInstance";

const SUB_URL = "smith/orders";

export type Order = {
  id?: number;
  // add your real fields here
  // smithId?: number;
  // description?: string;
  // qty?: number;
};

export const OrderService = {
  /**
   * Get all orders
   */
  getAllOrders: async (): Promise<Order[]> => {
    const axios = getAxiosInstance();
    const res = await axios.get(`smith/orders`);
    return res.data;
  },

  /**
   * Get order by ID
   */
  getOrderById: async (orderId: number): Promise<Order> => {
    const axios = getAxiosInstance();
    const res = await axios.get(`smith/orders/${orderId}`);
    return res.data;
  },

  /**
   * Create new order
   */
  createOrder: async (order: Order): Promise<Order> => {
    const axios = getAxiosInstance();
    const res = await axios.post(`smith/orders`, order);
    return res.data;
  },

  /**
   * Update order (FULL UPDATE – PUT)
   */
  updateOrder: async (
    orderId: number,
    order: Order
  ): Promise<Order> => {
    const axios = getAxiosInstance();
    const res = await axios.put(
      `smith/orders/${orderId}`,
      order
    );
    return res.data;
  },

  /**
   * Delete order
   */
  deleteOrder: async (orderId: number): Promise<void> => {
    const axios = getAxiosInstance();
    await axios.delete(`smith/orders/${orderId}`);
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