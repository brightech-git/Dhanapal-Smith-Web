// 'use client';

// import React, { useEffect, useState, useRef } from 'react';
// import { OrderService } from '@/service/orderService';
// import { SmithDetailsService } from '@/service/smithDetailsService';
// import { Search, X, User, Check, Pencil, Trash2, Menu, Sun, Moon, ChevronDown, ChevronUp } from 'lucide-react';
// import { useAuth } from "@/context/auth/AuthContext";
// import { useTheme } from "@/context/theme/ThemeContext";

// type Smith = {
//   smithId: number;
//   pname: string;
// };

// type OrderRow = {
//   orderDate: string;
//   orderItems: string;
//   weight: string;
//   oldWeight: string;
//   oldValue: string;
//   cashReceived: string;
//   balance: string;
// };

// type Order = {
//   id: number;
//   orderDate: string;
//   orderItems: string;
//   weight: number;
//   oldWeight: number;
//   oldValue: number;
//   cashReceived: number;
//   balance: number;
//   smithId: string;
//   sno?: number;
//   name?: string;
//   [key: string]: any;
// };

// const emptyRow: OrderRow = {
//   orderDate: '',
//   orderItems: '',
//   weight: '',
//   oldWeight: '',
//   oldValue: '',
//   cashReceived: '',
//   balance: '',
// };

// const SmithOrders: React.FC = () => {
//   const { allDetails } = useAuth();
//   const { mode, theme, toggleMode } = useTheme();
//   const isAdmin = allDetails?.admin || false;
  
//   const [smiths, setSmiths] = useState<Smith[]>([]);
//   const [selectedSmith, setSelectedSmith] = useState<Smith | null>(null);
//   const [orders, setOrders] = useState<Order[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [rows, setRows] = useState<OrderRow[]>([{ ...emptyRow }]);
//   const [isSaving, setIsSaving] = useState(false);
//   const [editingId, setEditingId] = useState<number | null>(null);
//   const [editingRow, setEditingRow] = useState<Partial<OrderRow>>({});
//   const [searchQuery, setSearchQuery] = useState('');
//   const [showSmithList, setShowSmithList] = useState(false);
//   const [isDeleting, setIsDeleting] = useState<number | null>(null);
  
//   // Theme colors function from header
//   const getThemeColors = () => {
//     if (mode === "dark") {
//       return {
//         background: {
//           primary: theme.colors?.dark?.background?.primary || "#1a1a1a",
//           sidebar: theme.colors?.dark?.background?.primary || "#1a1a1a",
//           card: "#1a1a1a",
//           hover: "#2a4365",
//           active: "#2c5282",
//           header: "#1a1a1a",
//           tableHeader: "#2a4365",
//           input: "#2d3748",
//           tableRowHover: "rgba(42, 67, 101, 0.3)",
//           totals: "rgba(42, 67, 101, 0.8)",
//           mobileCard: "#2d3748"
//         },
//         border: {
//           primary: "#374151",
//           secondary: "#4a5568",
//           light: "#2d3748"
//         },
//         text: {
//           primary: theme.colors?.dark?.text?.primary || "#ffffff",
//           secondary: theme.colors?.dark?.text?.secondary || "#a0a0a0",
//           muted: "#718096"
//         },
//         button: {
//           primary: "#2a4365",
//           hover: "#2c5282",
//           active: "#3182ce",
//           save: "#2c5282",
//           cancel: "#4a5568",
//           delete: "#9d174d"
//         },
//         gradient: {
//           header: "linear-gradient(to right, #1a365d, #2a4365)"
//         }
//       };
//     }

//     // Light theme with blue theme
//     return {
//       background: {
//         primary: "#ffffff",
//         sidebar: "#ffffff",
//         card: "#f8fafc",
//         hover: "#2563eb",
//         active: "#3b82f6",
//         header: "#1e3a8a",
//         tableHeader: "#1e3a8a",
//         input: "#ffffff",
//         tableRowHover: "#f1f5f9",
//         totals: "rgba(248, 250, 252, 0.8)",
//         mobileCard: "#f1f5f9"
//       },
//       border: {
//         primary: "#1d4ed8",
//         secondary: "#3b82f6",
//         light: "#e2e8f0"
//       },
//       text: {
//         primary: "#1e293b",
//         secondary: "#64748b",
//         muted: "#94a3b8"
//       },
//       button: {
//         primary: "#1e40af",
//         hover: "#2563eb",
//         active: "#3b82f6",
//         save: "#16a34a",
//         cancel: "#dc2626",
//         delete: "#be123c"
//       },
//       gradient: {
//         header: "linear-gradient(to right, #1e3a8a, #1d4ed8)"
//       }
//     };
//   };

//   const themeColors = getThemeColors();

//   // Reverse orders array to show recent transactions first
//   const reversedOrders = [...orders].reverse();

//   // Filter smiths based on search
//   const filteredSmiths = smiths.filter(smith =>
//     smith.pname.toLowerCase().includes(searchQuery.toLowerCase()) ||
//     smith.smithId.toString().includes(searchQuery)
//   );

//   // Calculate totals
//   const getTotals = reversedOrders.reduce(
//     (acc, order) => ({
//       weight: acc.weight + (Number(order.weight) || 0),
//       oldWeight: acc.oldWeight + (Number(order.oldWeight) || 0),
//       oldValue: acc.oldValue + (Number(order.oldValue) || 0),
//       cashReceived: acc.cashReceived + (Number(order.cashReceived) || 0),
//       balance: acc.balance + (Number(order.balance) || 0),
//     }),
//     { weight: 0, oldWeight: 0, oldValue: 0, cashReceived: 0, balance: 0 }
//   );

//   // Load smiths
//   useEffect(() => {
//     SmithDetailsService.getAll().then((data) => {
//       const normalized: Smith[] = data
//         .filter(s => s.smithId !== undefined)
//         .map(s => ({
//           smithId: s.smithId!,
//           pname: s.pname ?? '',
//         }));
//       setSmiths(normalized);
//     });
//   }, []);

//   // Load orders
//   const loadOrders = async (smithId: number) => {
//     setLoading(true);
//     const data = await OrderService.fetchOrdersBySmith(smithId.toString());
//     setOrders(data || []);
//     setLoading(false);
//   };

//   // Handle smith selection
//   const handleSmithSelect = (smith: Smith) => {
//     setSelectedSmith(smith);
//     loadOrders(smith.smithId);
//     setEditingId(null);
//     setEditingRow({});
//     setIsDeleting(null);
//     setShowSmithList(false); // Close sidebar on mobile after selection
//   };

//   // Add row
//   const addRow = () => {
//     setRows([...rows, { ...emptyRow }]);
//   };

//   // Remove row from input table
//   const removeRow = (index: number) => {
//     if (rows.length === 1) {
//       setRows([{ ...emptyRow }]);
//       return;
//     }
//     const updated = rows.filter((_, i) => i !== index);
//     setRows(updated);
//   };

//   // Update row in input table
//   const updateRow = (index: number, key: keyof OrderRow, value: string) => {
//     const updated = [...rows];
//     updated[index][key] = value;
//     setRows(updated);
//   };

//   // Save all new orders
//   const saveAll = async () => {
//     if (!selectedSmith) {
//       alert('Select Smith');
//       return;
//     }

//     setIsSaving(true);
//     try {
//       for (const r of rows) {
//         if (!r.orderItems.trim()) continue;

//         await OrderService.addOrder(
//           selectedSmith.smithId.toString(),
//           {
//             orderDate: r.orderDate || new Date().toISOString().split('T')[0],
//             orderItems: r.orderItems,
//             weight: Number(r.weight) || 0,
//             oldWeight: Number(r.oldWeight) || 0,
//             oldValue: Number(r.oldValue) || 0,
//             cashReceived: Number(r.cashReceived) || 0,
//             balance: Number(r.balance) || 0,
//           }
//         );
//       }

//       setRows([{ ...emptyRow }]);
//       loadOrders(selectedSmith.smithId);
      
//     } catch (error) {
//       console.error('Error saving orders:', error);
//       alert('Error saving orders');
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   // Handle edit click
//   const handleEditClick = (order: Order) => {
//     setEditingId(order.id);
//     setEditingRow({
//       orderDate: order.orderDate.split('T')[0],
//       orderItems: order.orderItems,
//       weight: order.weight.toString(),
//       oldWeight: order.oldWeight.toString(),
//       oldValue: order.oldValue.toString(),
//       cashReceived: order.cashReceived.toString(),
//       balance: order.balance.toString(),
//     });
//   };

//   // Handle update
//   const handleUpdate = async (orderId: number) => {
//     if (!selectedSmith || !editingRow.orderItems?.trim()) {
//       alert('Order items cannot be empty');
//       return;
//     }

//     try {
//       const updates: Record<string, any> = {};
      
//       if (editingRow.orderDate) updates.orderDate = editingRow.orderDate;
//       if (editingRow.orderItems) updates.orderItems = editingRow.orderItems;
//       if (editingRow.weight !== undefined) updates.weight = Number(editingRow.weight) || 0;
//       if (editingRow.oldWeight !== undefined) updates.oldWeight = Number(editingRow.oldWeight) || 0;
//       if (editingRow.oldValue !== undefined) updates.oldValue = Number(editingRow.oldValue) || 0;
//       if (editingRow.cashReceived !== undefined) updates.cashReceived = Number(editingRow.cashReceived) || 0;
//       if (editingRow.balance !== undefined) updates.balance = Number(editingRow.balance) || 0;

//       await OrderService.updateOrder(orderId, updates);
      
//       await loadOrders(selectedSmith.smithId);
      
//       setEditingId(null);
//       setEditingRow({});
      
//       alert('Order updated successfully!');
      
//     } catch (error) {
//       console.error('Error updating order:', error);
//       alert('Failed to update order');
//     }
//   };

//   // Handle delete order
//   const handleDeleteOrder = async (orderId: number) => {
//     if (!selectedSmith || !window.confirm('Are you sure you want to delete this order?')) {
//       return;
//     }

//     setIsDeleting(orderId);
//     try {
//       await OrderService.deleteOrder(orderId);
      
//       await loadOrders(selectedSmith.smithId);
      
//       alert('Order deleted successfully!');
      
//     } catch (error) {
//       console.error('Error deleting order:', error);
//       alert('Failed to delete order');
//     } finally {
//       setIsDeleting(null);
//     }
//   };

//   // Cancel edit
//   const cancelEdit = () => {
//     setEditingId(null);
//     setEditingRow({});
//   };

//   // Handle editing row change
//   const handleEditingRowChange = (key: keyof OrderRow, value: string) => {
//     setEditingRow(prev => ({
//       ...prev,
//       [key]: value
//     }));
//   };

//   return (
//     <div 
//       className="flex min-h-screen transition-colors duration-200"
//       style={{ 
//         backgroundColor: themeColors.background.primary,
//         color: themeColors.text.primary
//       }}
//     >
//       {/* Mobile Smith List Overlay */}
//       {showSmithList && (
//         <div 
//           className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
//           onClick={() => setShowSmithList(false)}
//         ></div>
//       )}

//       {/* Left Sidebar - Smith List */}
//       <div 
//         className={`
//           fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out
//           ${showSmithList ? 'translate-x-0' : '-translate-x-full'}
//           md:relative md:translate-x-0 md:w-72
//           border-r flex flex-col
//         `}
//         style={{ 
//           backgroundColor: themeColors.background.sidebar,
//           borderColor: themeColors.border.primary
//         }}
//       >
//         {/* Sidebar Header */}
//         <div 
//           className="p-4 border-b"
//           style={{ borderColor: themeColors.border.primary }}
//         >
//           <div className="flex items-center justify-between">
//             <h2 
//               className="text-sm font-semibold"
//               style={{ color: themeColors.text.primary }}
//             >
//               Smiths
//             </h2>
//             <button
//               onClick={() => setShowSmithList(false)}
//               className="md:hidden p-1 transition-colors"
//               style={{ color: themeColors.text.secondary }}
//             >
//               <X size={18} />
//             </button>
//           </div>
//           <div className="relative mt-2">
//             <Search 
//               className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4"
//               style={{ color: themeColors.text.secondary }}
//             />
//             <input
//               type="text"
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               placeholder="Search smiths..."
//               className="w-full pl-8 pr-3 py-1.5 text-xs border rounded transition-colors"
//               style={{
//                 backgroundColor: themeColors.background.input,
//                 borderColor: themeColors.border.primary,
//                 color: themeColors.text.primary
//               }}
//             />
//           </div>
//         </div>

//         {/* Smith List - 90% height with scroll (DESKTOP ONLY) */}
//         <div className="flex-1 overflow-y-auto" style={{ maxHeight: '90vh' }}>
//           {filteredSmiths.length > 0 ? (
//             filteredSmiths.map(smith => (
//               <div
//                 key={smith.smithId}
//                 onClick={() => handleSmithSelect(smith)}
//                 className={`px-4 py-3 border-b cursor-pointer transition-colors ${
//                   selectedSmith?.smithId === smith.smithId
//                     ? 'border-l-4'
//                     : ''
//                 }`}
//                 style={{
//                   borderBottomColor: themeColors.border.light,
//                   borderLeftColor: selectedSmith?.smithId === smith.smithId 
//                     ? themeColors.button.primary 
//                     : 'transparent',
//                   backgroundColor: selectedSmith?.smithId === smith.smithId 
//                     ? themeColors.background.hover + '20'
//                     : 'transparent',
//                 }}
//                 onMouseEnter={(e) => {
//                   e.currentTarget.style.backgroundColor = 
//                     selectedSmith?.smithId === smith.smithId 
//                       ? themeColors.background.hover + '20'
//                       : themeColors.background.hover + '10';
//                 }}
//                 onMouseLeave={(e) => {
//                   e.currentTarget.style.backgroundColor = 
//                     selectedSmith?.smithId === smith.smithId 
//                       ? themeColors.background.hover + '20'
//                       : 'transparent';
//                 }}
//               >
//                 <div className="flex items-center">
//                   <User 
//                     className="w-4 h-4 mr-2"
//                     style={{ color: themeColors.text.secondary }}
//                   />
//                   <div className="flex-1 min-w-0">
//                     <p 
//                       className="text-sm font-medium truncate"
//                       style={{ color: themeColors.text.primary }}
//                     >
//                       {smith.pname}
//                     </p>
//                     <p 
//                       className="text-xs"
//                       style={{ color: themeColors.text.secondary }}
//                     >
//                       ID: {smith.smithId}
//                     </p>
//                   </div>
//                   {selectedSmith?.smithId === smith.smithId && (
//                     <div 
//                       className="w-2 h-2 rounded-full"
//                       style={{ backgroundColor: themeColors.button.primary }}
//                     ></div>
//                   )}
//                 </div>
//               </div>
//             ))
//           ) : (
//             <div className="px-4 py-8 text-center">
//               <p style={{ color: themeColors.text.secondary }}>No smiths found</p>
//             </div>
//           )}
//         </div>

//         {/* Selected Smith Info */}
//         {selectedSmith && (
//           <div 
//             className="p-4 border-t"
//             style={{ 
//               backgroundColor: themeColors.background.hover + '10',
//               borderColor: themeColors.border.primary
//             }}
//           >
//             <p 
//               className="text-xs font-medium"
//               style={{ color: themeColors.text.secondary }}
//             >
//               Selected:
//             </p>
//             <p 
//               className="text-sm font-semibold mt-1"
//               style={{ color: themeColors.text.primary }}
//             >
//               {selectedSmith.pname}
//             </p>
//             <p 
//               className="text-xs"
//               style={{ color: themeColors.text.secondary }}
//             >
//               ID: {selectedSmith.smithId}
//             </p>
//           </div>
//         )}
//       </div>

//       {/* Main Content */}
//       <div className="flex-1 p-4 md:p-6">
//         {/* Mobile Header */}
//         <div className="md:hidden mb-4">
//           <div className="flex items-center justify-between mb-4">
//             <button
//               onClick={() => setShowSmithList(true)}
//               className="px-3 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-2"
//               style={{ backgroundColor: themeColors.button.primary }}
//             >
//               <Menu size={16} />
//               {selectedSmith ? selectedSmith.pname : 'Select Smith'}
//             </button>
//             {selectedSmith && (
//               <button
//                 onClick={addRow}
//                 className="px-3 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-2"
//                 style={{ backgroundColor: themeColors.button.save }}
//               >
//                 <span>+</span>
//                 Add Row
//               </button>
//             )}
//           </div>
          
//           {selectedSmith && (
//             <div className="mb-4">
//               <button
//                 onClick={saveAll}
//                 disabled={isSaving}
//                 className="w-full px-4 py-3 text-sm font-medium text-white rounded-lg transition-colors"
//                 style={{
//                   backgroundColor: isSaving 
//                     ? themeColors.text.muted 
//                     : themeColors.button.save,
//                   cursor: isSaving ? 'not-allowed' : 'pointer'
//                 }}
//               >
//                 {isSaving ? 'Saving All Orders...' : 'Save All Orders'}
//               </button>
//             </div>
//           )}
//         </div>

//         {/* Desktop Header */}


//         <div className="space-y-6">
//           {/* Action Buttons - Desktop */}
//           <div className="hidden md:flex items-center justify-end gap-2">
//             <button
//               onClick={addRow}
//               className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-2"
//               style={{ backgroundColor: themeColors.button.primary }}
//               onMouseEnter={(e) => e.currentTarget.style.backgroundColor = themeColors.button.hover}
//               onMouseLeave={(e) => e.currentTarget.style.backgroundColor = themeColors.button.primary}
//             >
//               <span>+</span>
//               Add Row
//             </button>
//             <button
//               onClick={saveAll}
//               disabled={!selectedSmith || isSaving}
//               className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
//               style={{
//                 backgroundColor: !selectedSmith || isSaving 
//                   ? themeColors.text.muted 
//                   : mode === "dark" 
//                     ? themeColors.button.save 
//                     : themeColors.button.save,
//                 cursor: !selectedSmith || isSaving ? 'not-allowed' : 'pointer'
//               }}
//             >
//               {isSaving ? 'Saving...' : 'Save All Orders'}
//             </button>
//           </div>

//           {/* INPUT TABLE - Desktop */}
//           <div className="hidden md:block border rounded-lg overflow-hidden shadow-sm"
//             style={{ borderColor: themeColors.border.primary }}>
//             <div className="px-6 py-3"
//               style={{ background: themeColors.gradient.header }}>
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center gap-3">
//                   <div className="w-2 h-2 bg-white rounded-full"></div>
//                   <h2 className="text-base font-semibold text-white">New Orders Input</h2>
//                 </div>
//                 <span className="text-xs px-3 py-1 rounded-full"
//                   style={{ 
//                     color: mode === "dark" ? "#bfdbfe" : "#eff6ff",
//                     backgroundColor: "rgba(255, 255, 255, 0.15)"
//                   }}>
//                   {rows.length} row(s)
//                 </span>
//               </div>
//             </div>
            
//             <div className="overflow-x-auto">
//               <table className="w-full text-sm">
//                 <thead>
//                   <tr style={{ backgroundColor: themeColors.background.tableHeader + '20' }}>
//                     {['Date', 'Order Items', 'Weight (g)', 'Old Wt (g)', 'Old Value', 'Cash', 'Balance', ''].map((header, index) => (
//                       <th key={header}
//                         className={`p-3 text-left font-medium border-b ${index < 7 ? 'border-r' : ''}`}
//                         style={{ 
//                           color: themeColors.text.primary,
//                           borderColor: themeColors.border.light,
//                           width: index === 1 ? '220px' : index === 7 ? '40px' : 'auto'
//                         }}>
//                         {header}
//                       </th>
//                     ))}
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {rows.map((row, index) => (
//                     <tr key={index} className="border-b transition-colors"
//                       style={{ borderColor: themeColors.border.light }}
//                       onMouseEnter={(e) => {
//                         e.currentTarget.style.backgroundColor = themeColors.background.tableRowHover;
//                       }}
//                       onMouseLeave={(e) => {
//                         e.currentTarget.style.backgroundColor = 'transparent';
//                       }}>
//                       <td className="p-2 border-r" style={{ borderColor: themeColors.border.light }}>
//                         <input
//                           type="date"
//                           value={row.orderDate}
//                           onChange={e => updateRow(index, 'orderDate', e.target.value)}
//                           className="w-full px-3 py-2 text-sm border rounded transition-colors focus:outline-none focus:ring-2"
//                           style={{
//                             backgroundColor: themeColors.background.input,
//                             borderColor: themeColors.border.primary,
//                             color: themeColors.text.primary,
//                             boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
//                           }}
//                         />
//                       </td>
//                       <td className="p-2 border-r" style={{ borderColor: themeColors.border.light }}>
//                         <textarea
//                           value={row.orderItems}
//                           onChange={e => updateRow(index, 'orderItems', e.target.value)}
//                           placeholder="Enter order description..."
//                           rows={2}
//                           className="w-full px-3 py-2 text-sm border rounded resize-none transition-colors focus:outline-none focus:ring-2"
//                           style={{
//                             backgroundColor: themeColors.background.input,
//                             borderColor: themeColors.border.primary,
//                             color: themeColors.text.primary,
//                             boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
//                           }}
//                         />
//                       </td>
//                       <td className="p-2 border-r" style={{ borderColor: themeColors.border.light }}>
//                         <input
//                           type="number"
//                           value={row.weight}
//                           onChange={e => updateRow(index, 'weight', e.target.value)}
//                           placeholder="0"
//                           className="w-full px-3 py-2 text-sm border rounded text-right transition-colors focus:outline-none focus:ring-2"
//                           style={{
//                             backgroundColor: themeColors.background.input,
//                             borderColor: themeColors.border.primary,
//                             color: themeColors.text.primary,
//                             boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
//                           }}
//                         />
//                       </td>
//                       <td className="p-2 border-r" style={{ borderColor: themeColors.border.light }}>
//                         <input
//                           type="number"
//                           value={row.oldWeight}
//                           onChange={e => updateRow(index, 'oldWeight', e.target.value)}
//                           placeholder="0"
//                           className="w-full px-3 py-2 text-sm border rounded text-right transition-colors focus:outline-none focus:ring-2"
//                           style={{
//                             backgroundColor: themeColors.background.input,
//                             borderColor: themeColors.border.primary,
//                             color: themeColors.text.primary,
//                             boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
//                           }}
//                         />
//                       </td>
//                       <td className="p-2 border-r" style={{ borderColor: themeColors.border.light }}>
//                         <div className="relative">
//                           <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm"
//                             style={{ color: themeColors.text.secondary }}>
//                             ₹
//                           </span>
//                           <input
//                             type="number"
//                             value={row.oldValue}
//                             onChange={e => updateRow(index, 'oldValue', e.target.value)}
//                             placeholder="0"
//                             className="w-full pl-8 pr-3 py-2 text-sm border rounded text-right transition-colors focus:outline-none focus:ring-2"
//                             style={{
//                               backgroundColor: themeColors.background.input,
//                               borderColor: themeColors.border.primary,
//                               color: themeColors.text.primary,
//                               boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
//                             }}
//                           />
//                         </div>
//                       </td>
//                       <td className="p-2 border-r" style={{ borderColor: themeColors.border.light }}>
//                         <div className="relative">
//                           <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm"
//                             style={{ color: themeColors.text.secondary }}>
//                             ₹
//                           </span>
//                           <input
//                             type="number"
//                             value={row.cashReceived}
//                             onChange={e => updateRow(index, 'cashReceived', e.target.value)}
//                             placeholder="0"
//                             className="w-full pl-8 pr-3 py-2 text-sm border rounded text-right transition-colors focus:outline-none focus:ring-2"
//                             style={{
//                               backgroundColor: themeColors.background.input,
//                               borderColor: themeColors.border.primary,
//                               color: themeColors.text.primary,
//                               boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
//                             }}
//                           />
//                         </div>
//                       </td>
//                       <td className="p-2 border-r" style={{ borderColor: themeColors.border.light }}>
//                         <div className="relative">
//                           <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm"
//                             style={{ color: themeColors.text.secondary }}>
//                             ₹
//                           </span>
//                           <input
//                             type="number"
//                             value={row.balance}
//                             onChange={e => updateRow(index, 'balance', e.target.value)}
//                             placeholder="0"
//                             className="w-full pl-8 pr-3 py-2 text-sm border rounded text-right transition-colors focus:outline-none focus:ring-2"
//                             style={{
//                               backgroundColor: themeColors.background.input,
//                               borderColor: themeColors.border.primary,
//                               color: themeColors.text.primary,
//                               boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
//                             }}
//                           />
//                         </div>
//                       </td>
//                       <td className="p-2">
//                         <button
//                           onClick={() => removeRow(index)}
//                           disabled={rows.length === 1}
//                           className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
//                           style={{
//                             color: rows.length === 1 ? themeColors.text.muted : themeColors.button.cancel,
//                           }}
//                           onMouseEnter={(e) => {
//                             if (rows.length > 1) {
//                               e.currentTarget.style.backgroundColor = mode === "dark" 
//                                 ? themeColors.button.cancel + '20' 
//                                 : '#fef2f2';
//                             }
//                           }}
//                           onMouseLeave={(e) => {
//                             e.currentTarget.style.backgroundColor = 'transparent';
//                           }}>
//                           <X className="w-4 h-4" />
//                         </button>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </div>

//           {/* INPUT TABLE - Mobile */}
//           <div className="md:hidden">
//             <div className="mb-6">
//               <h3 className="text-lg font-semibold mb-3">New Orders</h3>
//               {rows.map((row, index) => (
//                 <div key={index} className="mb-4 p-4 rounded-lg border"
//                   style={{
//                     backgroundColor: themeColors.background.mobileCard,
//                     borderColor: themeColors.border.light
//                   }}>
//                   <div className="flex justify-between items-center mb-3">
//                     <h4 className="font-medium">Row {index + 1}</h4>
//                     <button
//                       onClick={() => removeRow(index)}
//                       disabled={rows.length === 1}
//                       className="p-1.5 rounded-full transition-colors"
//                       style={{
//                         color: rows.length === 1 ? themeColors.text.muted : themeColors.button.cancel,
//                       }}>
//                       <X size={18} />
//                     </button>
//                   </div>
                  
//                   {/* Two-line layout for mobile */}
//                   <div className="space-y-4">
//                     {/* First Line */}
//                     <div className="grid grid-cols-2 gap-3">
//                       <div className="space-y-1">
//                         <label className="text-xs font-medium block" style={{ color: themeColors.text.secondary }}>
//                           Date
//                         </label>
//                         <input
//                           type="date"
//                           value={row.orderDate}
//                           onChange={e => updateRow(index, 'orderDate', e.target.value)}
//                           className="w-full px-3 py-2 text-sm border rounded transition-colors"
//                           style={{
//                             backgroundColor: themeColors.background.input,
//                             borderColor: themeColors.border.primary,
//                             color: themeColors.text.primary
//                           }}
//                         />
//                       </div>
//                       <div className="space-y-1">
//                         <label className="text-xs font-medium block" style={{ color: themeColors.text.secondary }}>
//                           Weight (g)
//                         </label>
//                         <input
//                           type="number"
//                           value={row.weight}
//                           onChange={e => updateRow(index, 'weight', e.target.value)}
//                           placeholder="0"
//                           className="w-full px-3 py-2 text-sm border rounded text-right transition-colors"
//                           style={{
//                             backgroundColor: themeColors.background.input,
//                             borderColor: themeColors.border.primary,
//                             color: themeColors.text.primary
//                           }}
//                         />
//                       </div>
//                     </div>
                    
//                     {/* Second Line */}
//                     <div className="grid grid-cols-2 gap-3">
//                       <div className="space-y-1">
//                         <label className="text-xs font-medium block" style={{ color: themeColors.text.secondary }}>
//                           Old Wt (g)
//                         </label>
//                         <input
//                           type="number"
//                           value={row.oldWeight}
//                           onChange={e => updateRow(index, 'oldWeight', e.target.value)}
//                           placeholder="0"
//                           className="w-full px-3 py-2 text-sm border rounded text-right transition-colors"
//                           style={{
//                             backgroundColor: themeColors.background.input,
//                             borderColor: themeColors.border.primary,
//                             color: themeColors.text.primary
//                           }}
//                         />
//                       </div>
//                       <div className="space-y-1">
//                         <label className="text-xs font-medium block" style={{ color: themeColors.text.secondary }}>
//                           Old Value
//                         </label>
//                         <div className="relative">
//                           <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm"
//                             style={{ color: themeColors.text.secondary }}>
//                             ₹
//                           </span>
//                           <input
//                             type="number"
//                             value={row.oldValue}
//                             onChange={e => updateRow(index, 'oldValue', e.target.value)}
//                             placeholder="0"
//                             className="w-full pl-8 pr-3 py-2 text-sm border rounded text-right transition-colors"
//                             style={{
//                               backgroundColor: themeColors.background.input,
//                               borderColor: themeColors.border.primary,
//                               color: themeColors.text.primary
//                             }}
//                           />
//                         </div>
//                       </div>
//                     </div>
                    
//                     {/* Third Line */}
//                     <div className="grid grid-cols-2 gap-3">
//                       <div className="space-y-1">
//                         <label className="text-xs font-medium block" style={{ color: themeColors.text.secondary }}>
//                           Cash
//                         </label>
//                         <div className="relative">
//                           <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm"
//                             style={{ color: themeColors.text.secondary }}>
//                             ₹
//                           </span>
//                           <input
//                             type="number"
//                             value={row.cashReceived}
//                             onChange={e => updateRow(index, 'cashReceived', e.target.value)}
//                             placeholder="0"
//                             className="w-full pl-8 pr-3 py-2 text-sm border rounded text-right transition-colors"
//                             style={{
//                               backgroundColor: themeColors.background.input,
//                               borderColor: themeColors.border.primary,
//                               color: themeColors.text.primary
//                             }}
//                           />
//                         </div>
//                       </div>
//                       <div className="space-y-1">
//                         <label className="text-xs font-medium block" style={{ color: themeColors.text.secondary }}>
//                           Balance
//                         </label>
//                         <div className="relative">
//                           <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm"
//                             style={{ color: themeColors.text.secondary }}>
//                             ₹
//                           </span>
//                           <input
//                             type="number"
//                             value={row.balance}
//                             onChange={e => updateRow(index, 'balance', e.target.value)}
//                             placeholder="0"
//                             className="w-full pl-8 pr-3 py-2 text-sm border rounded text-right transition-colors"
//                             style={{
//                               backgroundColor: themeColors.background.input,
//                               borderColor: themeColors.border.primary,
//                               color: themeColors.text.primary
//                             }}
//                           />
//                         </div>
//                       </div>
//                     </div>
                    
//                     {/* Order Items - Full width */}
//                     <div className="space-y-1">
//                       <label className="text-xs font-medium block" style={{ color: themeColors.text.secondary }}>
//                         Order Items
//                       </label>
//                       <textarea
//                         value={row.orderItems}
//                         onChange={e => updateRow(index, 'orderItems', e.target.value)}
//                         placeholder="Enter order description..."
//                         rows={2}
//                         className="w-full px-3 py-2 text-sm border rounded resize-none transition-colors"
//                         style={{
//                           backgroundColor: themeColors.background.input,
//                           borderColor: themeColors.border.primary,
//                           color: themeColors.text.primary
//                         }}
//                       />
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>

//           {/* GET TABLE - Order History */}
//           <div className="border rounded-lg overflow-hidden shadow-sm"
//             style={{ borderColor: themeColors.border.primary }}>
//             <div className="px-6 py-3"
//               style={{ background: themeColors.gradient.header }}>
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center gap-3">
//                   <div className="w-2 h-2 bg-white rounded-full"></div>
//                   <h2 className="text-base font-semibold text-white">Order History</h2>
//                   {selectedSmith && (
//                     <span className="text-sm ml-2"
//                       style={{ color: mode === "dark" ? "#bfdbfe" : "#eff6ff" }}>
//                       {selectedSmith.pname}
//                     </span>
//                   )}
//                 </div>
//                 {selectedSmith && orders.length > 0 && (
//                   <span className="text-xs px-3 py-1 rounded-full"
//                     style={{ 
//                       color: mode === "dark" ? "#bfdbfe" : "#eff6ff",
//                       backgroundColor: "rgba(255, 255, 255, 0.15)"
//                     }}>
//                     {orders.length} orders
//                   </span>
//                 )}
//               </div>
//             </div>
            
//             <div className="overflow-x-auto max-h-[400px]">
//               {loading ? (
//                 <div className="flex justify-center items-center py-12">
//                   <div className="animate-spin rounded-full h-8 w-8 border-b-2"
//                     style={{ borderColor: themeColors.button.primary }}></div>
//                 </div>
//               ) : !selectedSmith ? (
//                 <div className="text-center py-12">
//                   <div className="w-16 h-16 mx-auto mb-4">
//                     <User className="w-full h-full opacity-50"
//                       style={{ color: themeColors.text.secondary }} />
//                   </div>
//                   <p className="text-sm" style={{ color: themeColors.text.secondary }}>
//                     Select a smith to view order history
//                   </p>
//                 </div>
//               ) : orders.length === 0 ? (
//                 <div className="text-center py-12">
//                   <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center border-2 border-dashed rounded-full"
//                     style={{ 
//                       borderColor: themeColors.text.secondary,
//                       color: themeColors.text.secondary
//                     }}>
//                     <span className="text-3xl">0</span>
//                   </div>
//                   <p className="text-sm" style={{ color: themeColors.text.secondary }}>
//                     No orders found for this smith
//                   </p>
//                 </div>
//               ) : (
//                 <>
//                   {/* Desktop Table */}
//                   <table className="hidden md:table w-full text-sm">
//                     <thead>
//                       <tr style={{ backgroundColor: themeColors.background.tableHeader + '20' }}>
//                         <th className="p-3 text-left font-medium border-b border-r"
//                           style={{ 
//                             width: '60px',
//                             color: themeColors.text.primary,
//                             borderColor: themeColors.border.light
//                           }}>
//                           S.No
//                         </th>
//                         <th className="p-3 text-left font-medium border-b border-r"
//                           style={{ 
//                             width: '90px',
//                             color: themeColors.text.primary,
//                             borderColor: themeColors.border.light
//                           }}>
//                           Date
//                         </th>
//                         <th className="p-3 text-left font-medium border-b border-r"
//                           style={{ 
//                             width: '250px',
//                             color: themeColors.text.primary,
//                             borderColor: themeColors.border.light
//                           }}>
//                           Order Items
//                         </th>
//                         <th className="p-3 text-left font-medium border-b border-r"
//                           style={{ 
//                             width: '80px',
//                             color: themeColors.text.primary,
//                             borderColor: themeColors.border.light
//                           }}>
//                           Weight (g)
//                         </th>
//                         <th className="p-3 text-left font-medium border-b border-r"
//                           style={{ 
//                             width: '80px',
//                             color: themeColors.text.primary,
//                             borderColor: themeColors.border.light
//                           }}>
//                           Old Wt (g)
//                         </th>
//                         <th className="p-3 text-left font-medium border-b border-r"
//                           style={{ 
//                             width: '90px',
//                             color: themeColors.text.primary,
//                             borderColor: themeColors.border.light
//                           }}>
//                           Old Value
//                         </th>
//                         <th className="p-3 text-left font-medium border-b border-r"
//                           style={{ 
//                             width: '90px',
//                             color: themeColors.text.primary,
//                             borderColor: themeColors.border.light
//                           }}>
//                           Cash
//                         </th>
//                         <th className="p-3 text-left font-medium border-b border-r"
//                           style={{ 
//                             width: '90px',
//                             color: themeColors.text.primary,
//                             borderColor: themeColors.border.light
//                           }}>
//                           Balance
//                         </th>
//                         <th className="p-3 text-left font-medium border-b"
//                           style={{ 
//                             width: isAdmin ? '120px' : '80px',
//                             color: themeColors.text.primary,
//                             borderColor: themeColors.border.light
//                           }}>
//                           Actions
//                         </th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {reversedOrders.map((order, index) => (
//                         <tr key={order.id || index} className="border-b transition-colors"
//                           style={{ 
//                             borderColor: themeColors.border.light,
//                             backgroundColor: editingId === order.id 
//                               ? (mode === "dark" ? 'rgba(251, 191, 36, 0.1)' : '#fefce8')
//                               : 'transparent'
//                           }}
//                           onMouseEnter={(e) => {
//                             if (editingId !== order.id) {
//                               e.currentTarget.style.backgroundColor = themeColors.background.tableRowHover;
//                             }
//                           }}
//                           onMouseLeave={(e) => {
//                             if (editingId !== order.id) {
//                               e.currentTarget.style.backgroundColor = 'transparent';
//                             }
//                           }}>
//                           <td className="p-2 border-r" style={{ borderColor: themeColors.border.light }}>
//                             <div className="text-center text-sm"
//                               style={{ color: themeColors.text.primary }}>
//                               {reversedOrders.length - index}
//                             </div>
//                           </td>
                          
//                           <td className="p-2 border-r" style={{ borderColor: themeColors.border.light }}>
//                             <div className="text-sm">
//                               {editingId === order.id ? (
//                                 <input
//                                   type="date"
//                                   value={editingRow.orderDate || ''}
//                                   onChange={(e) => handleEditingRowChange('orderDate', e.target.value)}
//                                   className="w-full px-2 py-1 text-sm border rounded"
//                                   style={{
//                                     backgroundColor: themeColors.background.input,
//                                     borderColor: themeColors.border.primary,
//                                     color: themeColors.text.primary
//                                   }}
//                                 />
//                               ) : (
//                                 <div style={{ color: themeColors.text.primary }}>
//                                   {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : '-'}
//                                 </div>
//                               )}
//                             </div>
//                           </td>
                          
//                           <td className="p-2 border-r" style={{ borderColor: themeColors.border.light }}>
//                             <div>
//                               {editingId === order.id ? (
//                                 <textarea
//                                   value={editingRow.orderItems || ''}
//                                   onChange={(e) => handleEditingRowChange('orderItems', e.target.value)}
//                                   rows={2}
//                                   className="w-full px-2 py-1 text-sm border rounded resize-none"
//                                   style={{
//                                     backgroundColor: themeColors.background.input,
//                                     borderColor: themeColors.border.primary,
//                                     color: themeColors.text.primary
//                                   }}
//                                 />
//                               ) : (
//                                 <div className="text-sm max-h-16 overflow-y-auto cursor-help" 
//                                   title={order.orderItems}
//                                   style={{ color: themeColors.text.primary }}>
//                                   {order.orderItems}
//                                 </div>
//                               )}
//                             </div>
//                           </td>
                          
//                           <td className="p-2 border-r" style={{ borderColor: themeColors.border.light }}>
//                             <div className="text-sm">
//                               {editingId === order.id ? (
//                                 <input
//                                   type="number"
//                                   value={editingRow.weight || ''}
//                                   onChange={(e) => handleEditingRowChange('weight', e.target.value)}
//                                   className="w-full px-2 py-1 text-sm border rounded text-right"
//                                   style={{
//                                     backgroundColor: themeColors.background.input,
//                                     borderColor: themeColors.border.primary,
//                                     color: themeColors.text.primary
//                                   }}
//                                 />
//                               ) : (
//                                 <div className="text-right"
//                                   style={{ color: themeColors.text.primary }}>
//                                   {order.weight || '0'}
//                                 </div>
//                               )}
//                             </div>
//                           </td>
                          
//                           <td className="p-2 border-r" style={{ borderColor: themeColors.border.light }}>
//                             <div className="text-sm">
//                               {editingId === order.id ? (
//                                 <input
//                                   type="number"
//                                   value={editingRow.oldWeight || ''}
//                                   onChange={(e) => handleEditingRowChange('oldWeight', e.target.value)}
//                                   className="w-full px-2 py-1 text-sm border rounded text-right"
//                                   style={{
//                                     backgroundColor: themeColors.background.input,
//                                     borderColor: themeColors.border.primary,
//                                     color: themeColors.text.primary
//                                   }}
//                                 />
//                               ) : (
//                                 <div className="text-right"
//                                   style={{ color: themeColors.text.primary }}>
//                                   {order.oldWeight || '0'}
//                                 </div>
//                               )}
//                             </div>
//                           </td>
                          
//                           <td className="p-2 border-r" style={{ borderColor: themeColors.border.light }}>
//                             <div className="text-sm">
//                               {editingId === order.id ? (
//                                 <div className="relative">
//                                   <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-sm"
//                                     style={{ color: themeColors.text.secondary }}>
//                                     ₹
//                                   </span>
//                                   <input
//                                     type="number"
//                                     value={editingRow.oldValue || ''}
//                                     onChange={(e) => handleEditingRowChange('oldValue', e.target.value)}
//                                     className="w-full pl-6 pr-2 py-1 text-sm border rounded text-right"
//                                     style={{
//                                       backgroundColor: themeColors.background.input,
//                                       borderColor: themeColors.border.primary,
//                                       color: themeColors.text.primary
//                                     }}
//                                   />
//                                 </div>
//                               ) : (
//                                 <div className="text-right"
//                                   style={{ color: themeColors.text.primary }}>
//                                   ₹{order.oldValue || '0'}
//                                 </div>
//                               )}
//                             </div>
//                           </td>
                          
//                           <td className="p-2 border-r" style={{ borderColor: themeColors.border.light }}>
//                             <div className="text-sm">
//                               {editingId === order.id ? (
//                                 <div className="relative">
//                                   <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-sm"
//                                     style={{ color: themeColors.text.secondary }}>
//                                     ₹
//                                   </span>
//                                   <input
//                                     type="number"
//                                     value={editingRow.cashReceived || ''}
//                                     onChange={(e) => handleEditingRowChange('cashReceived', e.target.value)}
//                                     className="w-full pl-6 pr-2 py-1 text-sm border rounded text-right"
//                                     style={{
//                                       backgroundColor: themeColors.background.input,
//                                       borderColor: themeColors.border.primary,
//                                       color: themeColors.text.primary
//                                     }}
//                                   />
//                                 </div>
//                               ) : (
//                                 <div className="text-right"
//                                   style={{ color: themeColors.text.primary }}>
//                                   ₹{order.cashReceived || '0'}
//                                 </div>
//                               )}
//                             </div>
//                           </td>
                          
//                           <td className="p-2 border-r" style={{ borderColor: themeColors.border.light }}>
//                             <div className="text-sm">
//                               {editingId === order.id ? (
//                                 <div className="relative">
//                                   <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-sm"
//                                     style={{ color: themeColors.text.secondary }}>
//                                     ₹
//                                   </span>
//                                   <input
//                                     type="number"
//                                     value={editingRow.balance || ''}
//                                     onChange={(e) => handleEditingRowChange('balance', e.target.value)}
//                                     className="w-full pl-6 pr-2 py-1 text-sm border rounded text-right"
//                                     style={{
//                                       backgroundColor: themeColors.background.input,
//                                       borderColor: themeColors.border.primary,
//                                       color: themeColors.text.primary
//                                     }}
//                                   />
//                                 </div>
//                               ) : (
//                                 <div className="text-right"
//                                   style={{ color: themeColors.text.primary }}>
//                                   ₹{order.balance || '0'}
//                                 </div>
//                               )}
//                             </div>
//                           </td>
                          
//                           <td className="p-2">
//                             <div className="text-right">
//                               {editingId === order.id ? (
//                                 <div className="flex items-center justify-end gap-2">
//                                   <button
//                                     onClick={() => handleUpdate(order.id)}
//                                     className="p-2 rounded-full transition-colors"
//                                     style={{
//                                       color: themeColors.button.save,
//                                       backgroundColor: themeColors.button.save + '20'
//                                     }}
//                                     onMouseEnter={(e) => {
//                                       e.currentTarget.style.backgroundColor = themeColors.button.save + '40';
//                                     }}
//                                     onMouseLeave={(e) => {
//                                       e.currentTarget.style.backgroundColor = themeColors.button.save + '20';
//                                     }}
//                                     title="Update">
//                                     <Check size={18} />
//                                   </button>
//                                   <button
//                                     onClick={cancelEdit}
//                                     className="p-2 rounded-full transition-colors"
//                                     style={{
//                                       color: themeColors.button.cancel,
//                                       backgroundColor: themeColors.button.cancel + '20'
//                                     }}
//                                     onMouseEnter={(e) => {
//                                       e.currentTarget.style.backgroundColor = themeColors.button.cancel + '40';
//                                     }}
//                                     onMouseLeave={(e) => {
//                                       e.currentTarget.style.backgroundColor = themeColors.button.cancel + '20';
//                                     }}
//                                     title="Cancel">
//                                     <X size={18} />
//                                   </button>
//                                 </div>
//                               ) : (
//                                 <div className="flex items-center justify-end gap-2">
//                                   <button
//                                     onClick={() => handleEditClick(order)}
//                                     className="p-2 rounded-full transition-colors"
//                                     style={{
//                                       color: themeColors.button.primary,
//                                       backgroundColor: themeColors.button.primary + '20'
//                                     }}
//                                     onMouseEnter={(e) => {
//                                       e.currentTarget.style.backgroundColor = themeColors.button.primary + '40';
//                                     }}
//                                     onMouseLeave={(e) => {
//                                       e.currentTarget.style.backgroundColor = themeColors.button.primary + '20';
//                                     }}
//                                     title="Edit">
//                                     <Pencil size={18} />
//                                   </button>
//                                   {isAdmin && (
//                                     <button
//                                       onClick={() => handleDeleteOrder(order.id)}
//                                       disabled={isDeleting === order.id}
//                                       className="p-2 rounded-full transition-colors"
//                                       style={{
//                                         color: themeColors.button.delete,
//                                         backgroundColor: themeColors.button.delete + '20',
//                                         opacity: isDeleting === order.id ? 0.5 : 1
//                                       }}
//                                       onMouseEnter={(e) => {
//                                         if (isDeleting !== order.id) {
//                                           e.currentTarget.style.backgroundColor = themeColors.button.delete + '40';
//                                         }
//                                       }}
//                                       onMouseLeave={(e) => {
//                                         e.currentTarget.style.backgroundColor = themeColors.button.delete + '20';
//                                       }}
//                                       title="Delete">
//                                       {isDeleting === order.id ? (
//                                         <div className="w-4 h-4 border-2 rounded-full animate-spin"
//                                           style={{ 
//                                             borderColor: themeColors.button.delete,
//                                             borderTopColor: 'transparent'
//                                           }}></div>
//                                       ) : (
//                                         <Trash2 size={18} />
//                                       )}
//                                     </button>
//                                   )}
//                                 </div>
//                               )}
//                             </div>
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
                  
//                   {/* Mobile Cards */}
//                   <div className="md:hidden p-4">
//                     {reversedOrders.map((order, index) => (
//                       <div key={order.id || index} className="mb-4 p-4 rounded-lg border"
//                         style={{
//                           backgroundColor: themeColors.background.mobileCard,
//                           borderColor: themeColors.border.light
//                         }}>
//                         <div className="flex justify-between items-start mb-3">
//                           <div>
//                             <span className="text-xs font-semibold px-2 py-1 rounded"
//                               style={{ 
//                                 backgroundColor: themeColors.button.primary + '20',
//                                 color: themeColors.text.primary
//                               }}>
//                               #{reversedOrders.length - index}
//                             </span>
//                             <span className="text-xs ml-2"
//                               style={{ color: themeColors.text.secondary }}>
//                               {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : '-'}
//                             </span>
//                           </div>
//                           <div className="flex gap-1">
//                             <button
//                               onClick={() => handleEditClick(order)}
//                               className="p-1.5 rounded-full transition-colors"
//                               style={{
//                                 color: themeColors.button.primary,
//                                 backgroundColor: themeColors.button.primary + '20'
//                               }}
//                               title="Edit">
//                               <Pencil size={16} />
//                             </button>
//                             {isAdmin && (
//                               <button
//                                 onClick={() => handleDeleteOrder(order.id)}
//                                 disabled={isDeleting === order.id}
//                                 className="p-1.5 rounded-full transition-colors"
//                                 style={{
//                                   color: themeColors.button.delete,
//                                   backgroundColor: themeColors.button.delete + '20',
//                                   opacity: isDeleting === order.id ? 0.5 : 1
//                                 }}
//                                 title="Delete">
//                                 {isDeleting === order.id ? (
//                                   <div className="w-4 h-4 border-2 rounded-full animate-spin"
//                                     style={{ 
//                                       borderColor: themeColors.button.delete,
//                                       borderTopColor: 'transparent'
//                                     }}></div>
//                                 ) : (
//                                   <Trash2 size={16} />
//                                 )}
//                               </button>
//                             )}
//                           </div>
//                         </div>
                        
//                         <div className="mb-3 p-2 rounded border text-sm"
//                           style={{ 
//                             backgroundColor: themeColors.background.input,
//                             borderColor: themeColors.border.light,
//                             color: themeColors.text.primary
//                           }}>
//                           {order.orderItems}
//                         </div>
                        
//                         {/* Two-line layout for mobile */}
//                         <div className="space-y-4">
//                           {/* First Line */}
//                           <div className="grid grid-cols-2 gap-3">
//                             <div className="space-y-1">
//                               <div className="text-xs" style={{ color: themeColors.text.secondary }}>Weight:</div>
//                               <div style={{ color: themeColors.text.primary }}>{order.weight || '0'} g</div>
//                             </div>
//                             <div className="space-y-1">
//                               <div className="text-xs" style={{ color: themeColors.text.secondary }}>Old Weight:</div>
//                               <div style={{ color: themeColors.text.primary }}>{order.oldWeight || '0'} g</div>
//                             </div>
//                           </div>
                          
//                           {/* Second Line */}
//                           <div className="grid grid-cols-2 gap-3">
//                             <div className="space-y-1">
//                               <div className="text-xs" style={{ color: themeColors.text.secondary }}>Old Value:</div>
//                               <div style={{ color: themeColors.text.primary }}>₹{order.oldValue || '0'}</div>
//                             </div>
//                             <div className="space-y-1">
//                               <div className="text-xs" style={{ color: themeColors.text.secondary }}>Cash:</div>
//                               <div style={{ color: themeColors.text.primary }}>₹{order.cashReceived || '0'}</div>
//                             </div>
//                           </div>
                          
//                           {/* Third Line */}
//                           <div className="space-y-1">
//                             <div className="text-xs" style={{ color: themeColors.text.secondary }}>Balance:</div>
//                             <div className="font-semibold" style={{ color: themeColors.text.primary }}>
//                               ₹{order.balance || '0'}
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     ))}
                    
//                     {/* Mobile Totals */}
//                     <div className="mt-4 p-4 rounded-lg border"
//                       style={{
//                         backgroundColor: themeColors.background.totals,
//                         borderColor: themeColors.border.primary
//                       }}>
//                       <h3 className="font-semibold mb-3 text-center">Totals</h3>
//                       <div className="space-y-4">
//                         {/* First Line */}
//                         <div className="grid grid-cols-2 gap-3">
//                           <div className="space-y-1">
//                             <div className="text-xs" style={{ color: themeColors.text.secondary }}>Total Weight:</div>
//                             <div style={{ color: themeColors.text.primary }}>{getTotals.weight.toFixed(2)} g</div>
//                           </div>
//                           <div className="space-y-1">
//                             <div className="text-xs" style={{ color: themeColors.text.secondary }}>Total Old Weight:</div>
//                             <div style={{ color: themeColors.text.primary }}>{getTotals.oldWeight.toFixed(2)} g</div>
//                           </div>
//                         </div>
                        
//                         {/* Second Line */}
//                         <div className="grid grid-cols-2 gap-3">
//                           <div className="space-y-1">
//                             <div className="text-xs" style={{ color: themeColors.text.secondary }}>Total Old Value:</div>
//                             <div style={{ color: themeColors.text.primary }}>₹{getTotals.oldValue.toFixed(2)}</div>
//                           </div>
//                           <div className="space-y-1">
//                             <div className="text-xs" style={{ color: themeColors.text.secondary }}>Total Cash:</div>
//                             <div style={{ color: themeColors.text.primary }}>₹{getTotals.cashReceived.toFixed(2)}</div>
//                           </div>
//                         </div>
                        
//                         {/* Third Line */}
//                         <div className="space-y-1">
//                           <div className="text-xs" style={{ color: themeColors.text.secondary }}>Total Balance:</div>
//                           <div className="font-semibold" style={{ color: themeColors.text.primary }}>
//                             ₹{getTotals.balance.toFixed(2)}
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   </div>

//                   {/* GET TOTALS ROW - Desktop */}
//                   <div className="hidden md:block sticky bottom-0 border-t backdrop-blur-sm"
//                     style={{ 
//                       backgroundColor: themeColors.background.totals,
//                       borderColor: themeColors.border.primary
//                     }}>
//                     <table className="w-full text-sm">
//                       <tbody>
//                         <tr className="font-semibold">
//                           <td className="p-3 text-center border-r"
//                             style={{ 
//                               width: '60px',
//                               color: themeColors.text.primary,
//                               borderColor: themeColors.border.light
//                             }}>
//                             Total
//                           </td>
//                           <td className="p-3 border-r" style={{ width: '90px', borderColor: themeColors.border.light }}></td>
//                           <td className="p-3 border-r" style={{ width: '250px', borderColor: themeColors.border.light }}></td>
//                           <td className="p-3 text-right border-r"
//                             style={{ 
//                               width: '80px',
//                               color: themeColors.text.primary,
//                               borderColor: themeColors.border.light
//                             }}>
//                             {getTotals.weight.toFixed(2)}
//                           </td>
//                           <td className="p-3 text-right border-r"
//                             style={{ 
//                               width: '80px',
//                               color: themeColors.text.primary,
//                               borderColor: themeColors.border.light
//                             }}>
//                             {getTotals.oldWeight.toFixed(2)}
//                           </td>
//                           <td className="p-3 text-right border-r"
//                             style={{ 
//                               width: '90px',
//                               color: themeColors.text.primary,
//                               borderColor: themeColors.border.light
//                             }}>
//                             ₹{getTotals.oldValue.toFixed(2)}
//                           </td>
//                           <td className="p-3 text-right border-r"
//                             style={{ 
//                               width: '90px',
//                               color: themeColors.text.primary,
//                               borderColor: themeColors.border.light
//                             }}>
//                             ₹{getTotals.cashReceived.toFixed(2)}
//                           </td>
//                           <td className="p-3 text-right border-r"
//                             style={{ 
//                               width: '90px',
//                               color: themeColors.text.primary,
//                               borderColor: themeColors.border.light
//                             }}>
//                             ₹{getTotals.balance.toFixed(2)}
//                           </td>
//                           <td style={{ width: isAdmin ? '120px' : '80px' }}></td>
//                         </tr>
//                       </tbody>
//                     </table>
//                   </div>
//                 </>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SmithOrders;