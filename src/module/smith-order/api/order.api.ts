import { api, toApiDate } from "@/lib/api/envelope";

/** Order as the screen uses it. */
export type Order = {
  id?: number;
  orderDate: string; // YYYY-MM-DD from the API
  orderItems: string;
  isNew?: boolean; // frontend-only
};

/** Backend /orders record. */
type OrderApi = { id: number; date: string; remark: string | null };

const fromApi = (o: OrderApi): Order => ({ id: o.id, orderDate: o.date, orderItems: o.remark ?? "" });
// Only the editable fields: the server rejects unknown properties.
const toApi = (o: Order) => ({ date: toApiDate(o.orderDate), remark: o.orderItems?.trim() ? o.orderItems.trim() : null });

export const OrderService = {
  getAllOrders: async (): Promise<Order[]> => ((await api.get<OrderApi[]>("orders")) ?? []).map(fromApi),
  createOrder: async (order: Order): Promise<Order> => fromApi(await api.post<OrderApi>("orders", toApi(order))),
  updateOrder: async (id: number, order: Order): Promise<Order> => fromApi(await api.put<OrderApi>(`orders/${id}`, toApi(order))),
  deleteOrder: async (id: number): Promise<void> => api.delete(`orders/${id}`),
};
