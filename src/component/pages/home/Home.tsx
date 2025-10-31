"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import { useTheme } from "@/context/theme/ThemeContext";
import Table from "@/component/ui/table/Table";
import { IndianRupee, Scale, Wallet, Plus } from "lucide-react";
import { formatCurrency, } from "@/utils/format";
import { useSmithTransactionsContext } from "@/context/smith/SmithTransactionsContext";
import { useSmithDetails } from '@/context/smith/useSmithDetails'
import SmithManager from "../smith/SmithManager";
import EditableCell from "@/component/ui/EditableCell";
import { useToast } from "@/context/smith/ToastContext";
import PrintTable from "@/component/printingOptions/PrintTable";
import { useSoftControls } from "@/context/smith/SoftControlContext";
import { Delete } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { formatDateForInput, parseDateFromInput } from "@/utils/dateHelpers";

export default function SmithsPage() {
    const { mode, theme, responsive } = useTheme();
    const { addToast } = useToast();
    const { createSmith, smiths: allSmiths } = useSmithDetails();
    const { softControls } = useSoftControls();
    const [showTotal, setShowTotal] = useState(false);
    const [showDelete, setShowDelete] = useState(false);

    const weightPrintRef = useRef<HTMLDivElement>(null);
    const cashPrintRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (Array.isArray(softControls)) {
            const grandTotalCtl = softControls.find(sc => sc.description === "GrandTotal");
            const showRowDelete = softControls.find(sc => sc.description === "Delete");

            setShowTotal(grandTotalCtl?.ctlid === "Y");
            setShowDelete(showRowDelete?.ctlid === "Y");
        } else {
            setShowTotal(false);
            setShowDelete(false);
        }
    }, [softControls]);


    const styles = useMemo(() => {
        const isDark = mode === "dark";
        return {
            background: {
                primary: isDark
                    ? theme.colors?.dark?.background?.primary || "#1f2937"
                    : theme.colors?.light?.background?.primary || "#ffffff",
                card: isDark
                    ? theme.colors?.dark?.background?.tertiary || "#4b5563"
                    : theme.colors?.light?.background?.tertiary || "#f3f4f6",
            },
            text: {
                primary: isDark
                    ? theme.colors?.dark?.text?.primary || "#f9fafb"
                    : theme.colors?.light?.text?.primary || "#111827",
            },
            border: isDark ? "#4b5563" : "#e5e7eb",
        };
    }, [mode, theme]);

    const {
        transactions,
        getWeightFlows,
        getCashFlows,
        addCash,
        updateCash,
        deleteCash,
        addWeight,
        updateWeight,
        deleteWeight,
        addTransaction
    } = useSmithTransactionsContext();

    const [weightBalanceData, setWeightBalanceData] = useState<any[]>([]);
    const [cashBalanceData, setCashBalanceData] = useState<any[]>([]);
  
    const [selectedSmithId, setSelectedSmithId] = useState<string>("");
    const [selectedSmithName, setSelectedSmithName] = useState<string>("");
    const [activeTable, setActiveTable] = useState<"weight" | "cash" | null>(null);
    const [isCreatingSmith, setIsCreatingSmith] = useState(false);
    const [newSmithName, setNewSmithName] = useState("");

    

    // Calculate totals for main table
    const transactionTotals = useMemo(() => {
        const weight = transactions?.reduce((sum, txn) => sum + (txn.weightBalance || 0), 0) || 0;
        const cash = transactions?.reduce((sum, txn) => sum + (txn.cashBalance || 0), 0) || 0;
        return { weight, cash };
    }, [transactions]);

    // Totals for weight table
    const weightTotals = useMemo(() => {
        const receipts = weightBalanceData.reduce((sum, row) => sum + (row.receipts || 0), 0);
        const payments = weightBalanceData.reduce((sum, row) => sum + (row.payments || 0), 0);
        const balance = receipts - payments;
        return { receipts, payments, balance };
    }, [weightBalanceData]);

    // Totals for cash table
    const cashTotals = useMemo(() => {
        const receipts = cashBalanceData.reduce((sum, row) => sum + (row.receipts || 0), 0);
        const payments = cashBalanceData.reduce((sum, row) => sum + (row.payments || 0), 0);
        const balance = receipts - payments;
        return { receipts, payments, balance };
    }, [cashBalanceData]);

    // Rest of your functions remain the same...
    const refetchWeightFlows = async (smithId: string) => {
        try {
            const data = await getWeightFlows(smithId);
            setWeightBalanceData(data || []);
        } catch (error) {
            addToast({
                type: 'error',
                title: 'Error',
                message: 'Failed to fetch weight data'
            });
        }
    };

    const refetchCashFlows = async (smithId: string) => {
        try {
            const data = await getCashFlows(smithId);
            setCashBalanceData(data || []);
        } catch (error) {
            addToast({
                type: 'error',
                title: 'Error',
                message: 'Failed to fetch cash data'
            });
        }
    };

     const convertDateToAPIFormat = (dateStr: string): string => {
        return parseDateFromInput(dateStr) || dateStr;
    };

    const handleCreateSmith = async () => {
        const trimmedName = newSmithName.trim();

        if (!trimmedName) {
            addToast({
                type: 'warning',
                title: 'Name Required',
                message: 'Please enter a Smith name.'
            });
            return;
        }

        // 🔍 Check if name already exists (case-insensitive)
        const nameExists = allSmiths.some(
            (smith) => smith.pname?.toLowerCase() === trimmedName.toLowerCase()
        );

        if (nameExists) {
            addToast({
                type: 'warning',
                title: 'Duplicate Name',
                message: `The name "${trimmedName}" already exists. Please use another name.`
            });
            return;
        }

        try {
            setIsCreatingSmith(true);

            // 🆕 Create Smith
            const newSmith = await createSmith({
                pname: trimmedName,
                active: "Y"
            });

            if (!newSmith.smithId) {
                throw new Error('Smith ID not returned from creation');
            }

            // 🧾 Create initial empty transaction
            const today = new Date().toISOString().split('T')[0];

            await addTransaction({
                smithId: newSmith.smithId.toString(),
                name: newSmith.pname || trimmedName,
                date: today,
                cashBalance: 0,
                weightBalance: 0,
            });

            // ✅ Update UI
            setSelectedSmithId(newSmith.smithId.toString());
            setSelectedSmithName(newSmith.pname || trimmedName);
            setNewSmithName("");
            setIsCreatingSmith(false);

            addToast({
                type: 'success',
                title: 'Smith Created',
                message: `Smith "${newSmith.pname}" created successfully with empty transaction!`
            });

        } catch (error: any) {
            console.error("Error creating Smith:", error);
            addToast({
                type: 'error',
                title: 'Creation Failed',
                message: error.message || 'Failed to create Smith'
            });
            setIsCreatingSmith(false);
        }
    };


    const handleAddWeightRow = () => {
        if (!selectedSmithId) {
            addToast({
                type: 'warning',
                title: 'Selection Required',
                message: 'Please select a Smith first.'
            });
            return;
        }

        const today = new Date();
        const displayDate = today.toLocaleDateString('en-GB').replace(/\//g, '-');

        const newRow = {
            id: null,
            smithId: selectedSmithId,
            date: displayDate,
            receipts: 0,
            payments: 0,
            weightDifference: 0,
            isNew: true,
        };

        setWeightBalanceData(prev => [...prev, newRow]);
        addToast({
            type: 'info',
            title: 'New Row Added',
            message: 'New weight row added. Fill in the details and save.'
        });
    };

    const handleAddCashRow = () => {
        if (!selectedSmithId) {
            addToast({
                type: 'warning',
                title: 'Selection Required',
                message: 'Please select a Smith first.'
            });
            return;
        }

        const today = new Date();
        const formattedDate = today.toLocaleDateString('en-GB').replace(/\//g, '-');

        const newRow = {
            id: null,
            smithId: selectedSmithId,
            date: formattedDate,
            receipts: 0,
            payments: 0,
            balance: 0,
            isNew: true,
        };

        setCashBalanceData(prev => [...prev, newRow]);
        addToast({
            type: 'info',
            title: 'New Row Added',
            message: 'New cash row added. Fill in the details and save.'
        });
    };

    const handleWeightDoubleClick = async (row: any) => {
        if (!row?.smithId) return;
        setSelectedSmithId(row.smithId);
        setSelectedSmithName(row.name || "");
        setActiveTable("weight");
        await refetchWeightFlows(row.smithId);
        await refetchCashFlows(row.smithId);
    };

    const handleCashDoubleClick = async (row: any) => {
        if (!row?.smithId) return;
        setSelectedSmithId(row.smithId);
        setSelectedSmithName(row.name || "");
        setActiveTable("cash");
        await refetchCashFlows(row.smithId);
        await refetchWeightFlows(row.smithId);
    };

    const handleWeightSave = async (row: any, field: string, newValue: any) => {
        if (!selectedSmithId) return;
        try {
            const apiValue = field === 'date' ? convertDateToAPIFormat(newValue) : newValue;
            if (row.id) {
                await updateWeight(row.id, { [field]: apiValue });
            } else {
                const dataToSend: any = {
                    smithId: selectedSmithId,
                    date: field === 'date' ? convertDateToAPIFormat(newValue) : convertDateToAPIFormat(row.date || ''),
                    receipts: field === 'receipts' ? parseFloat(newValue) : parseFloat(row.receipts) || 0,
                    payments: field === 'payments' ? parseFloat(newValue) : parseFloat(row.payments) || 0,
                };
                await addWeight(selectedSmithId, dataToSend);
            }
            await refetchWeightFlows(selectedSmithId);
        } catch (error) {
            console.error("Error saving weight data:", error);
        }
    };

    const handleCashSave = async (row: any, field: string, newValue: any) => {
        if (!selectedSmithId) return;
        try {
            const apiValue = field === 'date' ? convertDateToAPIFormat(newValue) : newValue;
            if (row.id) {
                await updateCash(row.id, { [field]: apiValue });
            } else {
                const dataToSend: any = {
                    smithId: selectedSmithId,
                    date: field === 'date' ? convertDateToAPIFormat(newValue) : convertDateToAPIFormat(row.date || ''),
                    receipts: field === 'receipts' ? parseFloat(newValue) : parseFloat(row.receipts) || 0,
                    payments: field === 'payments' ? parseFloat(newValue) : parseFloat(row.payments) || 0,
                };
                await addCash(selectedSmithId, dataToSend);
            }
            await refetchCashFlows(selectedSmithId);
        } catch (error) {
            console.error("Error saving cash data:", error);
        }
    };

    const handleSmithSelect = (smithId: string | number, smithName: string = "") => {
        const smithIdStr = String(smithId);
        setSelectedSmithId(smithIdStr);
        setSelectedSmithName(smithName);
    };

    // const handleAddTransaction = async () => {
    //     if (!selectedSmithId || !selectedSmithName) return;
    //     try {
    //         const existing = transactions.find((t: any) => t.smithId === selectedSmithId);
    //         if (existing) {
    //             addToast({ type: 'warning', title: 'Transaction Exists', message: 'Transaction already exists!' });
    //             return;
    //         }
    //         await addTransaction({
    //             smithId: selectedSmithId,
    //             name: selectedSmithName,
    //             date: new Date().toISOString().split('T')[0],
    //             cashBalance: 0,
    //             weightBalance: 0,
    //         });
    //         addToast({ type: 'success', title: 'Transaction Added', message: 'Transaction added successfully!' });
    //     } catch (err: any) {
    //         addToast({ type: 'error', title: 'Failed to Add Transaction', message: err.message || "Unknown error" });
    //     }
    // };

    // Prepare weight balance rows
    // const displayWeightData = showDelete
    //     ? weightBalanceData.slice(-2)  // last 2 entries
    //     : weightBalanceData;

    // Prepare cash balance rows
    // const displayCashData = showDelete
    //     ? cashBalanceData.slice(-2)  // last 2 entries
    //     : cashBalanceData;

    const handleDeleteCashRow = async (rowId: number) => {
        if (!selectedSmithId) return;

        // Ask for user confirmation
        const confirmed = window.confirm("Are you sure you want to delete this row?");
        if (!confirmed) return;

        try {
            // Call your delete API
            await deleteCash(rowId);

            // Remove row locally (optional if using React Query / state)
            setCashBalanceData(prev => prev.filter(row => row.id !== rowId));

            // Show toast after successful delete
            addToast({
                type: 'success',
                title: 'Deleted',
                message: `Cash row with ID ${rowId} deleted successfully.`
            });
        } catch (error) {
            // Show error toast if delete fails
            addToast({
                type: 'error',
                title: 'Delete Failed',
                message: 'Failed to delete the row. Please try again.'
            });
            console.error(error);
        }
    };


    const handleDeleteWeightRow = async (rowId: number) => {
        if (!selectedSmithId) return;

        // Ask for user confirmation
        const confirmed = window.confirm("Are you sure you want to delete this weight row?");
        if (!confirmed) return;

        try {
            // Call your delete API
            await deleteWeight(rowId);

            // Remove row locally if using state
            setWeightBalanceData(prev => prev.filter(row => row.id !== rowId));

            // Show success toast
            addToast({
                type: 'success',
                title: 'Deleted',
                message: `Weight row with ID ${rowId} deleted successfully.`,
            });
        } catch (error) {
            // Show error toast
            addToast({
                type: 'error',
                title: 'Delete Failed',
                message: 'Failed to delete the weight row. Please try again.',
            });
            console.error(error);
        }
    };


    // Main Table Columns
    const mainTableColumns = useMemo(() => [
        {
            key: "sno",
            label: "S.No",
            headalign: "left" as const,
            align: "left" as const,
            width: "30px",
            render: (_v: any, _row: any, index: number) => <span className="font-semibold">{index + 1}</span>,
        },
        {
            key: "smithInfo",
            label: "Smith",
            headalign: "left" as const,
            align: "left" as const,
            width: "100px",
            render: (_v: any, row: any) => <span>{row.name}</span>,
        },
        {
            key: "weightBalance",
            label: "Weight Balance",
            headalign: "right" as const,
            align: "right" as const,
            width: "100px",
            render: (v: number, row: any) => (
                <span onDoubleClick={() => handleWeightDoubleClick(row)} className="cursor-pointer hover:underline">
                    {v?.toFixed(3)}
                </span>
            ),
        },
        {
            key: "cashBalance",
            label: "M.C Balance",
            headalign: "right" as const,
            align: "right" as const,
            width: "110px",
            render: (v: number, row: any) => (
                <span onDoubleClick={() => handleCashDoubleClick(row)} className="cursor-pointer hover:underline">
                    {formatCurrency(v)}
                </span>
            ),
        },
    ], [responsive.isMobile]);

    // Weight Table Columns
    const weightBalanceColumns = useMemo(() => [
        {
            key: "sno",
            label: "S.No",
            headalign: "left" as const,
            align: "left" as const,
            width: "50px",
            render: (_v: any, row: any, index: number) => (
                <div className="flex items-center justify-between">
                    <span>{index + 1}</span>
                    {showDelete  && <button
                        className="text-red-500 hover:text-red-700 ml-1"
                        onClick={() => handleDeleteWeightRow(row.id)}
                        title="Delete row"
                    >
                        <Delete fontSize="small" />
                    </button>} 
                   
                </div>
            ),
        },
        {
            key: "date",
            label: "Date",
            headalign: "center" as const,
            align: "center" as const,
            width: "100px",
            render: (value: any, row: any, rowIndex: number) => (
                <EditableCell value={value} type="date" onSave={(newVal) => handleWeightSave(row, "date", newVal)} />
            ),
        },
        {
            key: "receipts",
            label: "Receipts",
            headalign: "right" as const,
            align: "right" as const,
            width: "100px",
            render: (value: any, row: any, rowIndex: number) => (
                <EditableCell value={value} type="number" onSave={(newVal) => handleWeightSave(row, "receipts", newVal)} />
            ),
        },
        {
            key: "payments",
            label: "Payments",
            headalign: "right" as const,
            align: "right" as const,
            width: "100px",
            render: (value: any, row: any, rowIndex: number) => (
                <EditableCell value={value} type="number" onSave={(newVal) => handleWeightSave(row, "payments", newVal)} />
            ),
        },
        {
            key: "balance",
            label: "Balance",
            headalign: "right" as const,
            align: "right" as const,
            width: "70px",
            render: (_v: any, row: any) => <span className="font-medium">{row.weightDifference?.toFixed(3)}</span>,
        },
        {
            key: "remarks",
            label: "Remarks",
            headalign: "center" as const,
            align: "left" as const,
            width: "110px",
            render: (value: any, row: any) => (
                <EditableCell value={value} type="text" onSave={(newVal) => handleWeightSave(row, "remarks", newVal)} />
            ),
        },
    ], [selectedSmithId, responsive.isMobile, showDelete]);
    const weightBalancePrintColumns = useMemo(() => [
        {
            key: "sno",
            label: "S.No",
            headalign: "left" as const,
            align: "left" as const,
            width: "50px",
            render: (_v: any, row: any, index: number) => (
                <div className="flex items-center justify-between">
                    <span>{index + 1}</span>
                    

                </div>
            ),
        },
        {
            key: "date",
            label: "Date",
            headalign: "center" as const,
            align: "center" as const,
            width: "100px",
            render: (value: any, row: any, rowIndex: number) => (
                <EditableCell value={value} type="date" onSave={(newVal) => handleWeightSave(row, "date", newVal)} />
            ),
        },
        {
            key: "receipts",
            label: "Receipts",
            headalign: "right" as const,
            align: "right" as const,
            width: "100px",
            render: (value: any, row: any, rowIndex: number) => (
                <EditableCell value={value} type="number" onSave={(newVal) => handleWeightSave(row, "receipts", newVal)} />
            ),
        },
        {
            key: "payments",
            label: "Payments",
            headalign: "right" as const,
            align: "right" as const,
            width: "100px",
            render: (value: any, row: any, rowIndex: number) => (
                <EditableCell value={value} type="number" onSave={(newVal) => handleWeightSave(row, "payments", newVal)} />
            ),
        },
        {
            key: "balance",
            label: "Balance",
            headalign: "right" as const,
            align: "right" as const,
            width: "70px",
            render: (_v: any, row: any) => <span className="font-medium">{row.weightDifference?.toFixed(3)}</span>,
        },
        {
            key: "remarks",
            label: "Remarks",
            headalign: "center" as const,
            align: "left" as const,
            width: "110px",
            render: (value: any, row: any) => (
                <EditableCell value={value} type="text" onSave={(newVal) => handleWeightSave(row, "remarks", newVal)} />
            ),
        },
    ], [selectedSmithId, responsive.isMobile, showDelete]);

    // Cash Table Columns
    const cashBalanceColumns = useMemo(() => [
        {
            key: "sno",
            label: "S.No",
            headalign: "left" as const,
            align: "left" as const,
            width: "50px",
            render: (_v: any, row: any, index: number) => (
                <div className="flex items-center justify-between">
                    <span>{index + 1}</span>
                    {showDelete   && <button
                        className="text-red-500 hover:text-red-700 ml-2"
                        onClick={() => handleDeleteCashRow(row.id)}
                        title="Delete row"
                    >
                        <Delete fontSize="small" />
                    </button>}
                   
                </div>
            ),
        },

        {
            key: "date",
            label: "Date",
            headalign: "center" as const,
            align: "center" as const,
            width: "100px",
            render: (value: any, row: any, rowIndex: number) => (
                <EditableCell value={value} type="date" onSave={(newVal) => handleCashSave(row, "date", newVal)} />
            ),
        },
        {
            key: "receipts",
            label: "Receipts",
            headalign: "right" as const,
            align: "right" as const,
            width: "100px",
            render: (value: any, row: any, rowIndex: number) => (
                <EditableCell value={value} type="numbers" onSave={(newVal) => handleCashSave(row, "receipts", newVal)} />
            ),
        },
        {
            key: "payments",
            label: "Payments",
            headalign: "right" as const,
            align: "right" as const,
            width: "100px",
            render: (value: any, row: any, rowIndex: number) => (
                <EditableCell value={value} type="numbers" onSave={(newVal) => handleCashSave(row, "payments", newVal)} />
            ),
        },
        {
            key: "balance",
            label: "Balance",
            headalign: "right" as const,
            align: "right" as const,
            width: "70px",
            render: (v: number) => <span className="font-medium">{formatCurrency(v || 0)}</span>,
        },
        {
            key: "remarks",
            label: "Remarks",
            headalign: "center" as const,
            align: "left" as const,
            width: "110px",
            render: (value: any, row: any) => (
                <EditableCell value={value} type="text" onSave={(newVal) => handleCashSave(row, "remarks", newVal)} />
            ),
        },
    ], [selectedSmithId, responsive.isMobile, showDelete]);
    const cashBalancePrintColumns = useMemo(() => [
        {
            key: "sno",
            label: "S.No",
            headalign: "left" as const,
            align: "left" as const,
            width: "50px",
            render: (_v: any, row: any, index: number) => (
                <div className="flex items-center justify-between">
                    <span>{index + 1}</span>
                

                </div>
            ),
        },

        {
            key: "date",
            label: "Date",
            headalign: "center" as const,
            align: "center" as const,
            width: "100px",
            render: (value: any, row: any, rowIndex: number) => (
                <EditableCell value={value} type="date" onSave={(newVal) => handleCashSave(row, "date", newVal)} />
            ),
        },
        {
            key: "receipts",
            label: "Receipts",
            headalign: "right" as const,
            align: "right" as const,
            width: "100px",
            render: (value: any, row: any, rowIndex: number) => (
                <EditableCell value={value} type="numbers" onSave={(newVal) => handleCashSave(row, "receipts", newVal)} />
            ),
        },
        {
            key: "payments",
            label: "Payments",
            headalign: "right" as const,
            align: "right" as const,
            width: "100px",
            render: (value: any, row: any, rowIndex: number) => (
                <EditableCell value={value} type="numbers" onSave={(newVal) => handleCashSave(row, "payments", newVal)} />
            ),
        },
        {
            key: "balance",
            label: "Balance",
            headalign: "right" as const,
            align: "right" as const,
            width: "70px",
            render: (v: number) => <span className="font-medium">{formatCurrency(v || 0)}</span>,
        },
        {
            key: "remarks",
            label: "Remarks",
            headalign: "center" as const,
            align: "left" as const,
            width: "110px",
            render: (value: any, row: any) => (
                <EditableCell value={value} type="text" onSave={(newVal) => handleCashSave(row, "remarks", newVal)} />
            ),
        },
    ], [selectedSmithId, responsive.isMobile, showDelete]);




    return (
        <div style={{ background: styles.background.primary, color: styles.text.primary, minHeight: "100vh" }}>
            <main className="p-2 mx-auto">
                {/* Fixed Flexbox Layout */}
                <div className="flex flex-col lg:flex-row gap-4 w-full">
                    {/* Left Side - Main Table (30% width) */}
                    <div className="flex-1 lg:flex-[0_0_30%] max-w-full lg:max-w-[50%] flex flex-col gap-1">
                        <div className="flex justify-between items-center p-3 border rounded-t" style={{ background: styles.background.card, borderColor: styles.border }}>
                            <h2 className="text-base font-semibold flex items-center space-x-2">
                                <Wallet size={18} className="text-blue-600 dark:text-blue-400" />
                                <span>Smith Transactions</span>
                                <PrintTable
                                    title="Details"
                                    // subtitle="Summary of balances"
                                    columns={mainTableColumns}
                                    data={transactions || []}
                                />
                            </h2>
                            <div className="flex  items-center space-x-1">
                                <input
                                    type="text"
                                    value={newSmithName}
                                    onChange={(e) => setNewSmithName(e.target.value)}
                                    placeholder="Enter Smith name"
                                    className="border border-gray-300 rounded px-2 py-1.5 text-xs w-32 sm:w-40 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateSmith()}
                                />
                                <button
                                    onClick={handleCreateSmith}
                                    disabled={isCreatingSmith || !newSmithName.trim()}
                                    className="bg-green-600 text-white px-2 py-1.5 rounded hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center text-xs"
                                >
                                    <Plus size={12} className="mr-1" />
                                    Create
                                </button>
                            </div>
                        </div>

                        {/* Main Table with Correct Footer */}
                        <div className="flex">
                            <Table
                                columns={mainTableColumns}
                                data={transactions || []}
                                striped
                                hoverable
                                compact="auto"
                                className="border border-t-0 w-full"
                                headerClassName="border-b bg-blue-600 text-white dark:bg-blue-800"
                                bodyClassName="border-0"
                                fixedHeight={responsive.isMobile ? "400px" : "500px"}
                                showRows={20}
                                renderFooter={() => (
                                    <tfoot className="sticky bottom-0 z-10 bg-gray-100 dark:bg-gray-800 font-semibold">
                                        <tr>
                                            <td colSpan={2} className="text-right text-red-600  pr-2 border-r border-gray-300 dark:border-gray-600">
                                                Total
                                            </td>
                                            <td className="text-right text-red-600 pr-1 dark:text-blue-400 border-r border-gray-300 dark:border-gray-600">
                                                {transactionTotals.weight.toFixed(3)}
                                            </td>
                                            <td className="text-right text-red-600 pr-1  dark:text-green-400">
                                                {formatCurrency(transactionTotals.cash)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                )}
                            />
                        </div>

                        {/* {selectedSmithId && selectedSmithName && !existingTransaction && (
                            <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-700 rounded border" style={{ borderColor: styles.border }}>
                                <span className="text-sm font-medium">Selected: {selectedSmithName}</span>
                                <button
                                    onClick={handleAddTransaction}
                                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors text-sm"
                                >
                                    Add Transaction
                                </button>
                            </div>
                        )} */}
                    </div>

                    {/* Right Side - Weight + Cash Tables (70% width) */}
                    <div className="flex-1 lg:flex-[0_0_70%] max-w-full lg:max-w-[52%] flex flex-col gap-1">
                        {/* Weight Table */}
                        <div className="flex-1 flex flex-col ">
                            <div className="flex justify-between items-center px-3 py-4 border rounded-t" style={{ background: styles.background.card, borderColor: styles.border }}>
                                <h2 className="text-base font-semibold flex items-center space-x-2">
                                    <Scale size={18} className="text-green-600 dark:text-green-400" />
                                    <span>Weight Balance</span>
                                    {selectedSmithId && <span className="text-sm text-gray-600 dark:text-gray-300">({selectedSmithName})</span>}
                                </h2>
                                {selectedSmithId && (
                                    <div className="flex items-center space-x-2">
                                       <div ref={weightPrintRef}> <PrintTable title="Weight Balance Summary" columns={weightBalancePrintColumns} data={weightBalanceData} />
                                        </div>
                                        <button onClick={handleAddWeightRow} className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 transition-colors text-sm">
                                            Add New
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <Table
                                    columns={weightBalanceColumns}
                                    data={weightBalanceData}
                                    striped
                                    hoverable
                                    compact="auto"
                                    className="border border-t-0 rounded-t-none w-full"
                                    headerClassName="border-b bg-green-600 text-white dark:bg-green-800"
                                    fixedHeight={responsive.isMobile ? "250px" : "280px"}
                                    showRows={5}
                                    renderFooter={showTotal ? () => (
                                        <tfoot className=" sticky bottom-0 bg-green-100 dark:bg-green-800/30 text-black font-semibold">
                                            <tr>
                                                <td colSpan={2} className="text-right pr-4 border-r border-gray-300 dark:border-gray-600">Total</td>
                                                <td className="text-right border-r border-gray-300 dark:border-gray-600">{weightTotals.receipts.toFixed(3)}</td>
                                                <td className="text-right border-r border-gray-300 dark:border-gray-600">{weightTotals.payments.toFixed(3)}</td>
                                                <td className="text-right border-r border-gray-300 dark:border-gray-600">{weightTotals.balance.toFixed(3)}</td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    ) : undefined}
                                />
                            </div>
                        </div>

                        {/* Cash Table */}
                        <div className="flex-1 flex flex-col">
                            <div className="flex justify-between items-center px-3 py-3 border rounded-t" style={{ background: styles.background.card, borderColor: styles.border }}>
                                <h2 className="text-base font-semibold flex items-center space-x-2">
                                    <IndianRupee size={18} className="text-blue-600 dark:text-blue-400" />
                                    <span>Cash Balance</span>
                                    {selectedSmithId && <span className="text-sm text-gray-600 dark:text-gray-300">({selectedSmithName})</span>}
                                </h2>
                                {selectedSmithId && (
                                    <div className="flex items-center space-x-2">
                                        <div ref={cashPrintRef}> <PrintTable title="Cash Balance Summary" columns={cashBalancePrintColumns} data={cashBalanceData} /></div>
                                       
                                        <button onClick={handleAddCashRow} className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors text-sm">
                                            Add New
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <Table
                                    columns={cashBalanceColumns}
                                    data={cashBalanceData}
                                    striped
                                    hoverable
                                    compact="auto"
                                    className="border border-t-0 rounded-t-none w-full"
                                    headerClassName="border-b bg-blue-600 text-white dark:bg-blue-800"
                                    fixedHeight={responsive.isMobile ? "250px" : "280px"}
                                    showRows={5}
                                    renderFooter={showTotal ? () => (
                                        <tfoot className=" sticky bottom-0 bg-blue-100 dark:bg-blue-800/30 text-black font-semibold">
                                            <tr>
                                                <td colSpan={2} className="text-right pr-4 border-r border-gray-300 dark:border-gray-600">Total</td>
                                                <td className="text-right border-r border-gray-300 dark:border-gray-600">{formatCurrency(cashTotals.receipts)}</td>
                                                <td className="text-right border-r border-gray-300 dark:border-gray-600">{formatCurrency(cashTotals.payments)}</td>
                                                <td className="text-right border-r border-gray-300 dark:border-gray-600">{formatCurrency(cashTotals.balance)}</td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    ) : undefined}
                                />
                            </div>
                        </div>
                    </div>
                    
                </div>
                <div className="flex flex-col lg:flex-row gap-2 w-full">
                    <SmithManager onSelectSmith={handleSmithSelect} />
                </div>
                {/* Smith Manager */}
                
            </main>
        </div>
    );
}