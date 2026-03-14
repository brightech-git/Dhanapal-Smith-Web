"use client";

import React, { useEffect, useRef, useState } from "react";
import { OrderService, Order } from "@/service/orderService";
import { Pencil, Trash2, Plus, Save, X, Calendar } from "lucide-react";

/* -------------------- Date Utilities -------------------- */
const toBackendDate = (uiDate: string): string => {
  const [dd, mm, yyyy] = uiDate.split("/");
  return `${yyyy}-${mm}-${dd}`;
};

const toUIDate = (dbDate: string): string => {
  if (!dbDate) return "";
  const [yyyy, mm, dd] = dbDate.split("-");
  return `${dd}/${mm}/${yyyy}`;
};

const autoSlashDate = (value: string) => {
  const n = value.replace(/[^0-9]/g, "");
  if (n.length <= 2) return n;
  if (n.length <= 4) return `${n.slice(0, 2)}/${n.slice(2)}`;
  return `${n.slice(0, 2)}/${n.slice(2, 4)}/${n.slice(4, 8)}`;
};

const isValidDate = (dateStr: string): boolean => {
  const regex = /^\d{2}\/\d{2}\/\d{4}$/;
  if (!regex.test(dateStr)) return false;
  
  const [day, month, year] = dateStr.split('/').map(Number);
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

/* -------------------- Toast System -------------------- */
type ToastMessage = {
  id: number;
  text: string;
  type: 'success' | 'error';
};

const Toast = ({ toasts, removeToast }: { toasts: ToastMessage[], removeToast: (id: number) => void }) => (
  <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-md">
    {toasts.map(toast => (
      <div
        key={toast.id}
        className={`p-4 rounded-lg shadow-lg animate-slideIn flex items-center justify-between ${
          toast.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}
      >
        <span className="text-sm font-medium">{toast.text}</span>
        <button
          onClick={() => removeToast(toast.id)}
          className="ml-4 hover:opacity-80"
        >
          <X size={16} />
        </button>
      </div>
    ))}
  </div>
);

/* -------------------- Constants -------------------- */
const PAGE_SIZE = 10;

/* -------------------- Component -------------------- */
export default function OrderPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [editingId, setEditingId] = useState<number | "NEW" | null>(null);
  const [tempOrder, setTempOrder] = useState<Order>({
    orderDate: "",
    orderItems: "",
  } as Order);
  const [page, setPage] = useState(1);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [errors, setErrors] = useState<{date?: string; items?: string}>({});
  const [isSaving, setIsSaving] = useState(false);
  const tableEndRef = useRef<HTMLTableRowElement>(null);
  const dateInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);

  /* -------------------- Toast Functions -------------------- */
  const showToast = (text: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  /* -------------------- Load Orders -------------------- */
  const loadOrders = async () => {
    try {
      const data = await OrderService.getAllOrders();
      setOrders(data);
    } catch (error) {
      showToast("Failed to load orders", 'error');
      console.error(error);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  /* -------------------- Pagination -------------------- */
  const totalPages = Math.ceil(orders.length / PAGE_SIZE);
  const pagedOrders = orders.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  /* -------------------- Validation -------------------- */
  const validateOrder = (order: Order): boolean => {
    const newErrors: {date?: string; items?: string} = {};
    
    if (!order.orderDate.trim()) {
      newErrors.date = "Date is required";
    } else if (!isValidDate(order.orderDate)) {
      newErrors.date = "Invalid date format (DD/MM/YYYY)";
    }
    
    if (!order.orderItems.trim()) {
      newErrors.items = "Description is required";
    } else if (order.orderItems.length > 500) {
      newErrors.items = "Description too long (max 500 characters)";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* -------------------- Handlers -------------------- */
  const handleAddRow = () => {
    setIsAddingNew(true);
    setEditingId("NEW");
    setTempOrder({
      id: Date.now(),
      orderDate: "",
      orderItems: "",
    } as Order);
    setErrors({});
    
    // Go to last page if there are many pages
    if (totalPages > 1) {
      setPage(totalPages);
    }
    
    setTimeout(() => {
      tableEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSaveEdit = async () => {
    if (!validateOrder(tempOrder)) {
      showToast("Please fix validation errors", 'error');
      return;
    }

    setIsSaving(true);
    try {
      // For new order
      if (editingId === "NEW") {
        const orderToSave = {
          orderDate: toBackendDate(tempOrder.orderDate),
          orderItems: tempOrder.orderItems,
        };
        
        await OrderService.createOrder(orderToSave);
        showToast("Order created successfully", 'success');
        
        // Reset states and reload
        setEditingId(null);
        setIsAddingNew(false);
        await loadOrders();
      }
      // For editing existing order
      else if (typeof editingId === 'number') {
        await OrderService.updateOrder(editingId, {
          orderDate: toBackendDate(tempOrder.orderDate),
          orderItems: tempOrder.orderItems,
        });
        showToast("Order updated successfully", 'success');
        setEditingId(null);
        await loadOrders();
      }
    } catch (error: any) {
      console.error("Save error:", error);
      showToast(error.message || "Failed to save order", 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (order: Order) => {
    setEditingId(order.id || "NEW");
    setTempOrder({
      ...order,
      orderDate: order.orderDate && order.orderDate.includes('-') ? toUIDate(order.orderDate) : order.orderDate || "",
    });
    setErrors({});
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsAddingNew(false);
    setErrors({});
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;
    
    try {
      await OrderService.deleteOrder(id);
      showToast("Order deleted successfully", 'success');
      await loadOrders();
    } catch (error) {
      showToast("Failed to delete order", 'error');
      console.error(error);
    }
  };

  const openDatePicker = (index: number) => {
    const input = dateInputRefs.current[index];
    if (input) {
      input.showPicker();
    }
  };

  /* -------------------- UI -------------------- */
  return (
    <div className="min-h-screen bg-gray-50 p-3">
      <style jsx>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slideIn { animation: slideIn 0.3s ease-out; }
      `}</style>

      <Toast toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-gray-800">Order Management</h1>
            <p className="text-xs text-gray-600">
              {orders.length} orders • {isAddingNew ? "Adding new order" : "Ready to add"}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleAddRow}
              disabled={isSaving || isAddingNew}
              className={`flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium transition-colors ${
                isSaving || isAddingNew ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
              }`}
            >
              <Plus size={14} /> Add Row
            </button>
          </div>
        </div>
      </div>

      {/* TABLE CONTAINER */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden max-h-[calc(100vh-140px)]">
        <div className="overflow-auto h-full">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-800 text-white">
              <tr>
                <th className="p-2 text-left font-medium w-14">SNO</th>
                <th className="p-2 text-left font-medium w-36">Order Date</th>
                <th className="p-2 text-left font-medium">Order Description</th>
                <th className="p-2 text-center font-medium w-24">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {/* Existing orders */}
              {pagedOrders.map((order, i) => {
                const isEdit = editingId === order.id;
                const globalIndex = (page - 1) * PAGE_SIZE + i + 1;

                return (
                  <tr 
                    key={order.id} 
                    className="hover:bg-gray-50"
                  >
                    {/* Serial Number */}
                    <td className="p-2">
                      <div className="font-medium text-gray-700 pl-1">
                        {globalIndex}
                      </div>
                    </td>

                    {/* Date Cell */}
                    <td className="p-2">
                      {isEdit ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <input
                              ref={el => {
                                dateInputRefs.current[i] = el;
                              }}
                              type="date"
                              value={tempOrder.orderDate && tempOrder.orderDate.includes('/') ? '' : tempOrder.orderDate}
                              onChange={(e) => {
                                if (e.target.value) {
                                  setTempOrder(prev => ({
                                    ...prev,
                                    orderDate: toUIDate(e.target.value),
                                  }));
                                }
                              }}
                              className="hidden"
                            />
                            <input
                              type="text"
                              value={tempOrder.orderDate || ""}
                              maxLength={10}
                              placeholder="DD/MM/YYYY"
                              onChange={(e) =>
                                setTempOrder(prev => ({
                                  ...prev,
                                  orderDate: autoSlashDate(e.target.value),
                                }))
                              }
                              className={`w-full px-2 py-1 border rounded text-sm ${
                                errors.date ? 'border-red-300 bg-red-50' : 'border-gray-300'
                              }`}
                            />
                            <button
                              onClick={() => openDatePicker(i)}
                              className="p-1.5 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                              type="button"
                              title="Open date picker"
                            >
                              <Calendar size={14} />
                            </button>
                          </div>
                          {errors.date && (
                            <div className="text-xs text-red-600">{errors.date}</div>
                          )}
                        </div>
                      ) : (
                        <div className="text-gray-700 text-sm">
                          {order.orderDate && order.orderDate.includes('-') ? toUIDate(order.orderDate) : order.orderDate}
                        </div>
                      )}
                    </td>

                    {/* Description Cell */}
                    <td className="p-2">
                      {isEdit ? (
                        <div>
                          <textarea
                            rows={1}
                            value={tempOrder.orderItems || ""}
                            onChange={(e) =>
                              setTempOrder(prev => ({
                                ...prev,
                                orderItems: e.target.value,
                              }))
                            }
                            className={`w-full px-2 py-1 border rounded text-sm resize-none min-h-[38px] ${
                              errors.items ? 'border-red-300 bg-red-50' : 'border-gray-300'
                            }`}
                            onInput={(e) => {
                              const target = e.target as HTMLTextAreaElement;
                              target.style.height = 'auto';
                              target.style.height = Math.min(target.scrollHeight, 80) + 'px';
                            }}
                            placeholder="Enter order description..."
                          />
                          {errors.items && (
                            <div className="text-xs text-red-600 mt-1">{errors.items}</div>
                          )}
                        </div>
                      ) : (
                        <div 
                          className="text-gray-700 line-clamp-2 cursor-help text-sm"
                          title={order.orderItems}
                        >
                          {order.orderItems}
                        </div>
                      )}
                    </td>

                    {/* Actions Cell */}
                    <td className="p-2">
                      <div className="flex justify-center gap-1">
                        {isEdit ? (
                          <>
                            <button
                              onClick={handleSaveEdit}
                              disabled={isSaving}
                              className={`p-1.5 rounded transition-colors ${
                                isSaving
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                              }`}
                              title="Save"
                            >
                              <Save size={14} />
                            </button>
                            <button
                              onClick={handleCancel}
                              disabled={isSaving}
                              className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                              title="Cancel"
                            >
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEdit(order)}
                              disabled={isSaving || isAddingNew}
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                              title="Edit"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(order.id!)}
                              disabled={isSaving || isAddingNew}
                              className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* New Row (only when adding) */}
              {isAddingNew && (
                <tr 
                  ref={tableEndRef}
                  className="bg-green-50 hover:bg-green-100"
                >
                  <td className="p-2">
                    <div className="font-medium text-gray-700 pl-1">
                      {orders.length + 1}
                      <span className="ml-1 text-xs text-green-600">●</span>
                    </div>
                  </td>

                  <td className="p-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <input
                          ref={el => {
                            dateInputRefs.current[pagedOrders.length] = el;
                          }}
                          type="date"
                          value={tempOrder.orderDate && tempOrder.orderDate.includes('/') ? '' : tempOrder.orderDate}
                          onChange={(e) => {
                            if (e.target.value) {
                              setTempOrder(prev => ({
                                ...prev,
                                orderDate: toUIDate(e.target.value),
                              }));
                            }
                          }}
                          className="hidden"
                        />
                        <input
                          type="text"
                          value={tempOrder.orderDate || ""}
                          maxLength={10}
                          placeholder="DD/MM/YYYY"
                          onChange={(e) =>
                            setTempOrder(prev => ({
                              ...prev,
                              orderDate: autoSlashDate(e.target.value),
                            }))
                          }
                          className={`w-full px-2 py-1 border rounded text-sm ${
                            errors.date ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                        />
                        <button
                          onClick={() => openDatePicker(pagedOrders.length)}
                          className="p-1.5 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                          type="button"
                          title="Open date picker"
                        >
                          <Calendar size={14} />
                        </button>
                      </div>
                      {errors.date && (
                        <div className="text-xs text-red-600">{errors.date}</div>
                      )}
                    </div>
                  </td>

                  <td className="p-2">
                    <div>
                      <textarea
                        rows={1}
                        value={tempOrder.orderItems || ""}
                        onChange={(e) =>
                          setTempOrder(prev => ({
                            ...prev,
                            orderItems: e.target.value,
                          }))
                        }
                        className={`w-full px-2 py-1 border rounded text-sm resize-none min-h-[38px] ${
                          errors.items ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = 'auto';
                          target.style.height = Math.min(target.scrollHeight, 80) + 'px';
                        }}
                        placeholder="Enter order description..."
                      />
                      {errors.items && (
                        <div className="text-xs text-red-600 mt-1">{errors.items}</div>
                      )}
                    </div>
                  </td>

                  <td className="p-2">
                    <div className="flex justify-center gap-1">
                      <button
                        onClick={handleSaveEdit}
                        disabled={isSaving}
                        className={`p-1.5 rounded transition-colors ${
                          isSaving
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                        }`}
                        title="Save"
                      >
                        <Save size={14} />
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={isSaving}
                        className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                        title="Cancel"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {/* Empty State */}
              {orders.length === 0 && !isAddingNew && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-sm">No orders found</div>
                      <button
                        onClick={handleAddRow}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                      >
                        Add your first order
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGINATION */}
      {totalPages > 0 && (
        <div className="flex flex-wrap justify-center gap-1 mt-3">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-1.5 rounded disabled:opacity-30 hover:bg-gray-100 transition-colors"
            title="Previous"
          >
            ◀
          </button>
          
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (page <= 3) {
              pageNum = i + 1;
            } else if (page >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = page - 2 + i;
            }
            
            return (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`min-w-8 h-8 px-2 rounded text-sm transition-colors ${
                  page === pageNum
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
          
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-1.5 rounded disabled:opacity-30 hover:bg-gray-100 transition-colors"
            title="Next"
          >
            ▶
          </button>
        </div>
      )}
    </div>
  );
}