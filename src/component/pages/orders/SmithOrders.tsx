'use client';

import React, { useEffect, useState, useRef } from 'react';
import Table from '@/component/ui/table/Table';
import { OrderService } from '@/service/orderService';
import { SmithDetailsService } from '@/service/smithDetailsService';
import { Search, X, ChevronDown, User } from 'lucide-react';
import { EditIcon } from "@chakra-ui/icons";
import { IconButton, Tooltip } from "@chakra-ui/react";
type Smith = {
  smithId: number;
  pname: string;
};

type OrderRow = {
  orderDate: string;
  orderItems: string;
  weight: string;
  oldWeight: string;
  oldValue: string;
  cashReceived: string;
};

const emptyRow: OrderRow = {
  orderDate: '',
  orderItems: '',
  weight: '',
  oldWeight: '',
  oldValue: '',
  cashReceived: '',
};

const SmithOrders: React.FC = () => {
  const [smiths, setSmiths] = useState<Smith[]>([]);
  const [smithQuery, setSmithQuery] = useState('');
  const [selectedSmith, setSelectedSmith] = useState<Smith | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<OrderRow[]>([{ ...emptyRow }]);
  const [isSaving, setIsSaving] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Calculate totals for GET table
  const getTotals = orders.reduce(
    (acc, order) => ({
      weight: acc.weight + (Number(order.weight) || 0),
      oldWeight: acc.oldWeight + (Number(order.oldWeight) || 0),
      oldValue: acc.oldValue + (Number(order.oldValue) || 0),
      cashReceived: acc.cashReceived + (Number(order.cashReceived) || 0),
      balance: acc.balance + ((Number(order.oldValue) || 0) - (Number(order.cashReceived) || 0)),
    }),
    { weight: 0, oldWeight: 0, oldValue: 0, cashReceived: 0, balance: 0 }
  );

  // Load smiths
  useEffect(() => {
    SmithDetailsService.getAll().then((data) => {
      const normalized: Smith[] = data
        .filter(s => s.smithId !== undefined)
        .map(s => ({
          smithId: s.smithId!,
          pname: s.pname ?? '',
        }));
      setSmiths(normalized);
    });
  }, []);

  // Load orders
  const loadOrders = async (smithId: number) => {
    setLoading(true);
    const data = await OrderService.fetchOrdersBySmith(smithId.toString());
    setOrders(data || []);
    setLoading(false);
  };

  // Add row
  const addRow = () => {
    setRows([...rows, { ...emptyRow }]);
  };

  // Remove row
  const removeRow = (index: number) => {
    if (rows.length === 1) {
      setRows([{ ...emptyRow }]);
      return;
    }
    const updated = rows.filter((_, i) => i !== index);
    setRows(updated);
  };

  // Update row
  const updateRow = (index: number, key: keyof OrderRow, value: string) => {
    const updated = [...rows];
    updated[index][key] = value;
    setRows(updated);
  };

  // Save all
  const saveAll = async () => {
    if (!selectedSmith) {
      alert('Select Smith');
      return;
    }

    setIsSaving(true);
    try {
      for (const r of rows) {
        if (!r.orderItems.trim()) continue;

        await OrderService.addOrder(
          selectedSmith.smithId.toString(),
          {
            orderDate: r.orderDate || new Date().toISOString().split('T')[0],
            orderItems: r.orderItems,
            weight: Number(r.weight) || 0,
            oldWeight: Number(r.oldWeight) || 0,
            oldValue: Number(r.oldValue) || 0,
            cashReceived: Number(r.cashReceived) || 0,
          }
        );
      }

      setRows([{ ...emptyRow }]);
      loadOrders(selectedSmith.smithId);
      
    } catch (error) {
      console.error('Error saving orders:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Filter smiths
  const filteredSmiths = smiths.filter(s =>
    s.pname.toLowerCase().includes(smithQuery.toLowerCase())
  );

  // Table columns for GET table
  const getColumns = [
    { 
      key: 'sno', 
      label: 'S.No',
      width: '60px',
      render: (row: any, index: number) => (
        <div className="text-center text-xs">{index + 1}</div>
      )
    },
    { 
      key: 'orderDate', 
      label: 'Date',
      width: '90px',
      render: (row: any) => (
        <div className="text-xs">
          {row.orderDate ? new Date(row.orderDate).toLocaleDateString() : '-'}
        </div>
      )
    },
    {
      key: 'orderItems',
      label: 'Order Items',
      width: '250px',
      render: (row: any) => (
        <div 
          className="text-xs max-h-10 overflow-y-auto cursor-help" 
          title={row.orderItems}
        >
          {row.orderItems}
        </div>
      ),
    },
    { 
      key: 'weight', 
      label: 'Weight (g)',
      width: '80px',
      render: (row: any) => (
        <div className="text-xs text-right">{row.weight || '0'}</div>
      )
    },
    { 
      key: 'oldWeight', 
      label: 'Old Wt (g)',
      width: '80px',
      render: (row: any) => (
        <div className="text-xs text-right">{row.oldWeight || '0'}</div>
      )
    },
    { 
      key: 'oldValue', 
      label: 'Old Value',
      width: '90px',
      render: (row: any) => (
        <div className="text-xs text-right">₹{row.oldValue || '0'}</div>
      )
    },
    { 
      key: 'cashReceived', 
      label: 'Cash',
      width: '90px',
      render: (row: any) => (
        <div className="text-xs text-right">₹{row.cashReceived || '0'}</div>
      )
    },
    {
      key: 'balance',
      label: 'Balance',
      width: '90px',
      render: (row: any) => {
        const balance = (Number(row.oldValue) || 0) - (Number(row.cashReceived) || 0);
        return (
          <div className={`text-xs text-right font-medium ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
            ₹{balance}
          </div>
        );
      }
    },
        { 
      key: '', 
      label: 'Edit',
      width: '40px',
      render: (row: any) => (
        <div className="text-xs text-right"><i><EditIcon boxSize={4} /></i>
</div>
      )
    }
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when dropdown opens
  useEffect(() => {
    if (showDropdown && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showDropdown]);

  const handleSmithSelect = (smith: Smith) => {
    setSelectedSmith(smith);
    setSmithQuery(smith.pname);
    setShowDropdown(false);
    loadOrders(smith.smithId);
  };

  const handleClearSmith = () => {
    setSelectedSmith(null);
    setSmithQuery('');
    setOrders([]);
    setShowDropdown(true);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="p-3 min-h-screen bg-white dark:bg-gray-900">
      <div className="space-y-4">
        {/* Smith Selection - Compact Header */}
        <div className="flex items-center justify-between">
          <div className="relative w-72" ref={dropdownRef}>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <Search className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </div>
              
              <input
                ref={inputRef}
                type="text"
                value={smithQuery}
                onChange={(e) => {
                  setSmithQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Search smith..."
                className={`w-full pl-10 pr-10 py-2 text-sm rounded-lg border transition-colors
                  ${selectedSmith 
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200' 
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100'
                  }
                  focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600`}
              />
              
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                {selectedSmith && (
                  <button
                    onClick={handleClearSmith}
                    className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                  >
                    <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </button>
                )}
                <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''} text-gray-500 dark:text-gray-400`} />
              </div>
            </div>
            
            {showDropdown && !selectedSmith && (
              <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredSmiths.length > 0 ? (
                  filteredSmiths.map(smith => (
                    <div
                      key={smith.smithId}
                      onClick={() => handleSmithSelect(smith)}
                      className="px-4 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer border-b dark:border-gray-700 last:border-b-0 flex items-center gap-2"
                    >
                      <User className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span>{smith.pname}</span>
                      <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                        ID: {smith.smithId}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                    No smiths found
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={addRow}
              className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              + Add Row
            </button>
            <button
              onClick={saveAll}
              disabled={!selectedSmith || isSaving}
              className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                !selectedSmith || isSaving
                  ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white'
              }`}
            >
              {isSaving ? 'Saving...' : 'Save All'}
            </button>
          </div>
        </div>

        {/* INPUT TABLE */}
        <div className="border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-800 to-blue-900 dark:from-blue-900 dark:to-blue-950 px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <h2 className="text-sm font-semibold text-white">New Orders</h2>
              </div>
              <span className="text-xs text-blue-200 bg-white/10 px-2 py-0.5 rounded">
                {rows.length} row(s)
              </span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-blue-50 dark:bg-gray-800">
                  <th className="p-2 text-left font-medium text-gray-700 dark:text-gray-300 border-b border-r border-gray-300 dark:border-gray-700">Date</th>
                  <th className="p-2 text-left font-medium text-gray-700 dark:text-gray-300 border-b border-r border-gray-300 dark:border-gray-700 w-[220px]">Order Items</th>
                  <th className="p-2 text-left font-medium text-gray-700 dark:text-gray-300 border-b border-r border-gray-300 dark:border-gray-700">Weight (g)</th>
                  <th className="p-2 text-left font-medium text-gray-700 dark:text-gray-300 border-b border-r border-gray-300 dark:border-gray-700">Old Wt (g)</th>
                  <th className="p-2 text-left font-medium text-gray-700 dark:text-gray-300 border-b border-r border-gray-300 dark:border-gray-700">Old Value</th>
                  <th className="p-2 text-left font-medium text-gray-700 dark:text-gray-300 border-b border-gray-300 dark:border-gray-700">Cash</th>
                  <th className="p-2 text-left font-medium text-gray-700 dark:text-gray-300 border-b border-gray-300 dark:border-gray-700 w-[40px]"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr 
                    key={index} 
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="p-1 border-r border-gray-200 dark:border-gray-700">
                      <input
                        type="date"
                        value={row.orderDate}
                        onChange={e => updateRow(index, 'orderDate', e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-600"
                      />
                    </td>
                    <td className="p-1 border-r border-gray-200 dark:border-gray-700">
                      <textarea
                        value={row.orderItems}
                        onChange={e => updateRow(index, 'orderItems', e.target.value)}
                        placeholder="Enter order description..."
                        rows={1}
                        className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 resize-none overflow-y-auto max-h-16 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-600"
                      />
                    </td>
                    <td className="p-1 border-r border-gray-200 dark:border-gray-700">
                      <input
                        type="number"
                        value={row.weight}
                        onChange={e => updateRow(index, 'weight', e.target.value)}
                        placeholder="0"
                        className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-right focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-600"
                      />
                    </td>
                    <td className="p-1 border-r border-gray-200 dark:border-gray-700">
                      <input
                        type="number"
                        value={row.oldWeight}
                        onChange={e => updateRow(index, 'oldWeight', e.target.value)}
                        placeholder="0"
                        className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-right focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-600"
                      />
                    </td>
                    <td className="p-1 border-r border-gray-200 dark:border-gray-700">
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400">₹</span>
                        <input
                          type="number"
                          value={row.oldValue}
                          onChange={e => updateRow(index, 'oldValue', e.target.value)}
                          placeholder="0"
                          className="w-full pl-6 pr-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-right focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-600"
                        />
                      </div>
                    </td>
                    <td className="p-1 border-r border-gray-200 dark:border-gray-700">
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400">₹</span>
                        <input
                          type="number"
                          value={row.cashReceived}
                          onChange={e => updateRow(index, 'cashReceived', e.target.value)}
                          placeholder="0"
                          className="w-full pl-6 pr-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-right focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-600"
                        />
                      </div>
                    </td>
                    <td className="p-1">
                      <button
                        onClick={() => removeRow(index)}
                        disabled={rows.length === 1}
                        className="w-6 h-6 flex items-center justify-center text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded disabled:text-gray-400 dark:disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* GET TABLE */}
        <div className="border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-800 to-blue-900 dark:from-blue-900 dark:to-blue-950 px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <h2 className="text-sm font-semibold text-white">Order History</h2>
                {selectedSmith && (
                  <span className="text-xs text-blue-200 ml-2">
                    {selectedSmith.pname}
                  </span>
                )}
              </div>
              {selectedSmith && orders.length > 0 && (
                <span className="text-xs text-blue-200 bg-white/10 px-2 py-0.5 rounded">
                  {orders.length} orders
                </span>
              )}
            </div>
          </div>
          
          <div className="overflow-x-auto max-h-80">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 dark:border-blue-500"></div>
              </div>
            ) : !selectedSmith ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-600">
                  <User className="w-full h-full opacity-50" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Select a smith to view order history
                </p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-600">
                  <div className="w-full h-full flex items-center justify-center border-2 border-dashed rounded-full">
                    <span className="text-2xl">0</span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No orders found for this smith
                </p>
              </div>
            ) : (
              <>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-blue-50 dark:bg-gray-800">
                      {getColumns.map(col => (
                        <th 
                          key={col.key} 
                          className="p-2 text-left font-medium text-gray-700 dark:text-gray-300 border-b border-r border-gray-300 dark:border-gray-700"
                          style={{ width: col.width }}
                        >
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order, index) => (
                      <tr 
                        key={order.id || index} 
                        className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        {getColumns.map(col => (
                          <td 
                            key={col.key} 
                            className="p-2 border-r border-gray-200 dark:border-gray-700 last:border-r-0"
                          >
                            {col.render ? col.render(order, index) : order[col.key]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* GET TOTALS ROW */}
                <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-300 dark:border-gray-700 backdrop-blur-sm">
                  <table className="w-full text-xs">
                    <tbody>
                      <tr className="font-semibold">
                        <td className="p-2 text-center border-r border-gray-300 dark:border-gray-700" style={{ width: '60px' }}>
                          Total
                        </td>
                        <td className="p-2 border-r border-gray-300 dark:border-gray-700" style={{ width: '90px' }}></td>
                        <td className="p-2 border-r border-gray-300 dark:border-gray-700" style={{ width: '250px' }}></td>
                        <td className="p-2 text-right border-r border-gray-300 dark:border-gray-700" style={{ width: '80px' }}>
                          {getTotals.weight.toFixed(2)}
                        </td>
                        <td className="p-2 text-right border-r border-gray-300 dark:border-gray-700" style={{ width: '80px' }}>
                          {getTotals.oldWeight.toFixed(2)}
                        </td>
                        <td className="p-2 text-right border-r border-gray-300 dark:border-gray-700" style={{ width: '90px' }}>
                          ₹{getTotals.oldValue.toFixed(2)}
                        </td>
                        <td className="p-2 text-right border-r border-gray-300 dark:border-gray-700" style={{ width: '90px' }}>
                          ₹{getTotals.cashReceived.toFixed(2)}
                        </td>
                        <td className="p-2 text-right" style={{ width: '90px' }}>
                          <span className={`font-medium ${getTotals.balance > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                            ₹{getTotals.balance.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmithOrders;