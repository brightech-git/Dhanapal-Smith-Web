"use client";

import React, { useEffect, useState } from "react";
import { OrderService, Order } from "@/service/orderService";
import { Pencil, Trash2 } from "lucide-react";

// Utility: dd/MM/yyyy -> yyyy-MM-dd
const toBackendDate = (uiDate: string): string => {
  const [dd, mm, yyyy] = uiDate.split("/");
  return `${yyyy}-${mm}-${dd}`;
};

// Utility: yyyy-MM-dd -> dd/MM/yyyy
const toUIDate = (dbDate: string): string => {
  const [yyyy, mm, dd] = dbDate.split("-");
  return `${dd}/${mm}/${yyyy}`;
};

const autoSlashDate = (value: string) => {
  const numbersOnly = value.replace(/[^0-9]/g, "");
  
  if (numbersOnly.length <= 2) return numbersOnly;
  if (numbersOnly.length <= 4)
    return `${numbersOnly.slice(0, 2)}/${numbersOnly.slice(2)}`;
  return `${numbersOnly.slice(0, 2)}/${numbersOnly.slice(2, 4)}/${numbersOnly.slice(4, 8)}`;
};

export default function OrderPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderDate, setOrderDate] = useState("");
  const [orderText, setOrderText] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const loadOrders = async () => {
    const data = await OrderService.getAllOrders();
    setOrders(data);
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleSubmit = async () => {
    if (!orderDate || !orderText) return;

    const payload: Order = {
      orderDate: toBackendDate(orderDate),
      orderItems: orderText,
    } as any;

    if (editingId) {
      await OrderService.updateOrder(editingId, payload);
    } else {
      await OrderService.createOrder(payload);
    }

    setOrderDate("");
    setOrderText("");
    setEditingId(null);
    loadOrders();
  };

  const handleEdit = (o: any) => {
    setEditingId(o.id);
    setOrderDate(toUIDate(o.orderDate));
    setOrderText(o.orderItems);
  };

  const handleDelete = async (id: number) => {
    if(window.confirm("Are You Sure want to delete?")){
    await OrderService.deleteOrder(id);
    loadOrders();}
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Order Entry</h1>

      {/* FORM */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm">Order Date</label>
          <input
            type="text"
            placeholder="dd/mm/yyyy"
            maxLength={10}
            value={orderDate}
            onChange={(e) => setOrderDate(autoSlashDate(e.target.value))}
            className="w-full border rounded p-2"
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm">Order Description</label>
          <textarea
            rows={3}
            value={orderText}
            onChange={(e) => setOrderText(e.target.value)}
            placeholder="Enter order description (max 1000 characters)"
            maxLength={1000}
            className="w-full border rounded p-2 resize-y overflow-auto"
          />
        </div>
      </div>

      <button
        onClick={handleSubmit}
        className="px-4 py-2 bg-black text-white rounded"
      >
        {editingId ? "Update" : "Save"}
      </button>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="min-w-full border mt-6">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-3 py-2 text-left">S.No</th>
              <th className="border px-3 py-2 text-left">Order Date</th>
              <th className="border px-3 py-2 text-left">Order</th>
              <th className="border px-3 py-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o: any, index) => (
              <tr key={o.id} className="hover:bg-gray-50">
                <td className="border px-3 py-2">{index + 1}</td>
                <td className="border px-3 py-2">
                  {toUIDate(o.orderDate)}
                </td>
                <td className="border px-3 py-2 max-w-xl">
                  <div className="line-clamp-3" title={o.order}>
                    {o.orderItems}
                  </div>
                </td>
                <td className="border px-3 py-2 text-center">
                  <div className="flex justify-center gap-3">
                    <button onClick={() => handleEdit(o)}>
                      <Pencil size={18} />
                    </button>
                    <button onClick={() => handleDelete(o.id)}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
