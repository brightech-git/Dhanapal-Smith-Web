"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import { useTheme } from "@/context/theme/ThemeContext";
import Table from "@/component/ui/table/Table";
import { IndianRupee, Scale, Wallet, Plus } from "lucide-react";
import { formatCurrency, formatDate } from "@/utils/format";
import { useSmithTransactionsContext } from "@/context/smith/SmithTransactionsContext";
import { useSmithDetails } from '@/context/smith/useSmithDetails'
import SmithManager from "../smith/SmithManager";
import EditableCell from "@/component/ui/EditableCell";
import { useToast } from "@/context/smith/ToastContext";

export default function SmithsPage() {
    const { mode, theme, responsive } = useTheme();
    const { addToast } = useToast();
    const { createSmith, smiths: allSmiths } = useSmithDetails(); // Get createSmith function and all smiths

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
        addWeight,
        updateWeight,
        addTransaction
    } = useSmithTransactionsContext();


    console.log(transactions , 'data')
    const [weightBalanceData, setWeightBalanceData] = useState<any[]>([]);
    const [cashBalanceData, setCashBalanceData] = useState<any[]>([]);

    const [selectedSmithId, setSelectedSmithId] = useState<string>("");
    const [selectedSmithName, setSelectedSmithName] = useState<string>("");
    const [activeTable, setActiveTable] = useState<"weight" | "cash" | null>(null);
    const [isCreatingSmith, setIsCreatingSmith] = useState(false);
    const [newSmithName, setNewSmithName] = useState("");


    const existingTransaction = transactions.find(
        (transaction: any) =>
            transaction.smithId === selectedSmithId
    );

    const cellRefs = useRef<(HTMLInputElement | null)[][]>([]);

    // Calculate totals
    const totals = useMemo(() => {
        const weightTotal = transactions.reduce((sum, transaction) => sum + (transaction.weightBalance || 0), 0);
        const cashTotal = transactions.reduce((sum, transaction) => sum + (transaction.cashBalance || 0), 0);

        return {
            weight: weightTotal,
            cash: cashTotal
        };
    }, [transactions]);

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

    const convertDateToAPIFormat = (dateString: string) => {
        if (!dateString) return '';

        if (dateString.includes('-') && dateString.split('-')[0]?.length === 2) {
            // dd-mm-yyyy → yyyy-mm-dd
            const [day, month, year] = dateString.split('-');
            return `${year}-${month}-${day}`;
        }

        // If already in yyyy-mm-dd format or other format, return as-is
        return dateString;
    };

    // Create new Smith and auto-create transaction
    const handleCreateSmith = async () => {
        if (!newSmithName.trim()) {
            addToast({
                type: 'warning',
                title: 'Name Required',
                message: 'Please enter a Smith name.'
            });
            return;
        }

        try {
            setIsCreatingSmith(true);

            // Create Smith with only name
            const newSmith = await createSmith({
                pname: newSmithName.trim(),
                active: "Y"
            });

            // Auto-create transaction for the new Smith
            const today = new Date().toISOString().split('T')[0]; // yyyy-mm-dd

            if (!newSmith.smithId) {
                throw new Error('Smith ID not returned from creation');
            }

            await addTransaction({

                smithId: newSmith.smithId.toString(),
                name: newSmith.pname || newSmithName.trim(),
                date: today, // Use today's date in yyyy-mm-dd format
                cashBalance: 0,
                weightBalance: 0,
            });

            // Set as selected Smith
            setSelectedSmithId(newSmith.smithId.toString());
            setSelectedSmithName(newSmith.pname || newSmithName.trim());

            // Reset form
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
        // Use ISO format for the date input (yyyy-mm-dd)
        const isoDate = today.toISOString().split('T')[0];
        // But keep display format as dd-mm-yyyy
        const displayDate = today.toLocaleDateString('en-GB').replace(/\//g, '-');

        const newRow = {
            id: null,
            smithId: selectedSmithId,
            date: displayDate, // This is what gets displayed
            receipts: 0,
            payments: 0,
            weightDifference: 0,
            isNew: true,
        };

        console.log(newRow, 'new row added');

        setWeightBalanceData(prev => {
            const newData = [...prev, newRow];
            const lastIndex = newData.length - 1;

            setTimeout(() => {
                const receiptsInput = document.querySelector(`#row-weight-${lastIndex} input[type="number"]`);
                if (receiptsInput) {
                    receiptsInput.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                    (receiptsInput as HTMLInputElement).focus();
                    (receiptsInput as HTMLInputElement).select();
                } else {
                    const newRowElement = document.querySelector(`#row-weight-${lastIndex}`);
                    if (newRowElement) {
                        newRowElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center'
                        });
                    }
                }
            }, 150);

            return newData;
        });

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

        setCashBalanceData(prev => {
            const newData = [...prev, newRow];
            const lastIndex = newData.length - 1;

            setTimeout(() => {
                const newRowElement = document.querySelector(`#row-cash-${lastIndex}`);
                if (newRowElement) {
                    newRowElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });

                    // Focus on the receipts input (second input in the row)
                    const inputs = newRowElement.querySelectorAll('input');
                    if (inputs.length >= 2) {
                        const receiptsInput = inputs[1];
                        receiptsInput.focus();
                        receiptsInput.select();
                    } else if (inputs.length === 1) {
                        inputs[0].focus();
                        inputs[0].select();
                    }
                }
            }, 150);

            return newData;
        });

        addToast({
            type: 'info',
            title: 'New Row Added',
            message: 'New cash row added. Fill in the details and save.'
        });
    };

    // ──────────── Double-click handlers ────────────
    const handleWeightDoubleClick = async (row: any) => {
        if (!row?.smithId) return;
        setSelectedSmithId(row.smithId);
        setSelectedSmithName(row.name || "");
        setActiveTable("weight");

        await refetchWeightFlows(row.smithId);
        await refetchCashFlows(row.smithId);

        addToast({
            type: 'info',
            title: 'Weight Table and Cash Table Loaded',
            message: `Weight data and Cash data loaded for ${row.name || 'selected Smith'}`
        });
    };

    const handleCashDoubleClick = async (row: any) => {
        if (!row?.smithId) return;

        setSelectedSmithId(row.smithId);
        setSelectedSmithName(row.name || "");
        setActiveTable("cash");
        await refetchCashFlows(row.smithId);
        await refetchWeightFlows(row.smithId);

        addToast({
            type: 'info',
            title: 'Cash Table and Weight Table Loaded',
            message: `Cash data and Weight data loaded for ${row.name || 'selected Smith'}`
        });
    };

    // ──────────── Save handlers (dynamic approach) ────────────
    const handleWeightSave = async (row: any, field: string, newValue: any) => {
        if (!selectedSmithId) return;

        try {
            // Convert date to API format if it's a date field
            const apiValue = field === 'date' ? convertDateToAPIFormat(newValue) : newValue;

            if (row.id) {
                await updateWeight(row.id, { [field]: apiValue });
                addToast({
                    type: 'success',
                    title: 'Weight Updated',
                    message: 'Weight data updated successfully'
                });
            } else {
                // Create the data object dynamically based on which field is being updated
                const dataToSend: any = {
                    smithId: selectedSmithId,
                };

                // Set all fields, using newValue for the updated field and row value for others
                // Convert dates to API format before sending
                dataToSend.date = field === 'date'
                    ? convertDateToAPIFormat(newValue)
                    : convertDateToAPIFormat(row.date || '');

                dataToSend.receipts = field === 'receipts' ? parseFloat(newValue) : parseFloat(row.receipts) || 0;
                dataToSend.payments = field === 'payments' ? parseFloat(newValue) : parseFloat(row.payments) || 0;

                console.log('Adding weight:', {
                    dataToSend,
                    field,
                    newValue,
                    apiValue: field === 'date' ? apiValue : newValue,
                    originalRow: row
                });

                await addWeight(selectedSmithId, dataToSend);
                addToast({
                    type: 'success',
                    title: 'Weight Added',
                    message: 'New weight entry added successfully'
                });
            }
            await refetchWeightFlows(selectedSmithId);
        } catch (error) {
            console.error("Error saving weight data:", error);
            addToast({
                type: 'error',
                title: 'Save Failed',
                message: 'Failed to save weight data'
            });
        }
    };

    const handleCashSave = async (row: any, field: string, newValue: any) => {
        if (!selectedSmithId) return;

        try {
            // Convert date to API format if it's a date field
            const apiValue = field === 'date' ? convertDateToAPIFormat(newValue) : newValue;

            if (row.id) {
                await updateCash(row.id, { [field]: apiValue });
                addToast({
                    type: 'success',
                    title: 'Cash Updated',
                    message: 'Cash data updated successfully'
                });
            } else {
                // Create the data object dynamically based on which field is being updated
                const dataToSend: any = {
                    smithId: selectedSmithId,
                };

                // Set all fields, using newValue for the updated field and row value for others
                // Convert dates to API format before sending
                dataToSend.date = field === 'date'
                    ? convertDateToAPIFormat(newValue)
                    : convertDateToAPIFormat(row.date || '');

                dataToSend.receipts = field === 'receipts' ? parseFloat(newValue) : parseFloat(row.receipts) || 0;
                dataToSend.payments = field === 'payments' ? parseFloat(newValue) : parseFloat(row.payments) || 0;

                console.log('Adding cash:', {
                    dataToSend,
                    field,
                    newValue,
                    apiValue: field === 'date' ? apiValue : newValue,
                    originalRow: row
                });

                await addCash(selectedSmithId, dataToSend);
                addToast({
                    type: 'success',
                    title: 'Cash Added',
                    message: 'New cash entry added successfully'
                });
            }
            await refetchCashFlows(selectedSmithId);
        } catch (error) {
            console.error("Error saving cash data:", error);
            addToast({
                type: 'error',
                title: 'Save Failed',
                message: 'Failed to save cash data'
            });
        }
    };

    const handleSmithSelect = (
        smithId: string | number,
        smithName: string = "",
        showWeight = false,
        showCash = false
    ) => {
        const smithIdStr = String(smithId);
        setSelectedSmithId(smithIdStr);
        setSelectedSmithName(smithName);

        addToast({
            type: 'info',
            title: 'Smith Selected',
            message: `${smithName} selected`
        });
    };

    const handleAddTransaction = async () => {
        if (!selectedSmithId || !selectedSmithName) {
            addToast({
                type: 'warning',
                title: 'Missing Information',
                message: 'Please select a Smith first.'
            });
            return;
        }

        try {
            // Check if smithId already exists in transactions
            const existingTransaction = transactions.find(
                (transaction: any) =>
                    transaction.smithId === selectedSmithId
            );

            if (existingTransaction) {
                addToast({
                    type: 'warning',
                    title: 'Transaction Exists',
                    message: 'A transaction for this Smith already exists!'
                });
                return;
            }

            // Use today's date in yyyy-mm-dd format
            const today = new Date().toISOString().split('T')[0];

            await addTransaction({
                smithId: selectedSmithId,
                name: selectedSmithName,
                date: today, // Auto-use today's date
                cashBalance: 0,
                weightBalance: 0,
            });

            addToast({
                type: 'success',
                title: 'Transaction Added',
                message: 'Transaction added successfully!'
            });

        } catch (err: any) {
            console.error(err);
            addToast({
                type: 'error',
                title: 'Failed to Add Transaction',
                message: err.message || "Unknown error occurred"
            });
        }
    };

    const formatDateForDisplay = (dateString: string) => {
        if (!dateString) return "";

        // If already in dd-mm-yyyy format
        if (dateString.includes('-') && dateString.split('-')[0]?.length === 2) {
            return dateString;
        }

        const parts = dateString.split('-').map((p) => p.trim());

        // yyyy-mm-dd → dd-mm-yyyy
        if (parts.length === 3 && parts[0].length === 4) {
            const [year, month, day] = parts;
            return `${day}-${month}-${year}`;
        }

        // mm-dd-yyyy → dd-mm-yyyy
        if (parts.length === 3 && parts[2].length === 4) {
            const [month, day, year] = parts;
            return `${day}-${month}-${year}`;
        }

        // If unknown or already formatted, return as-is
        return dateString;
    };

    // ──────────── Focus next cell ────────────
    const focusNextCell = (rowIndex: number, colIndex: number, table: "weight" | "cash") => {
        const currentRefs = cellRefs.current;
        const tableRefs = table === "weight" ? currentRefs : currentRefs;
        if (!tableRefs[rowIndex]) return;

        const nextColIndex = colIndex + 1;
        if (tableRefs[rowIndex][nextColIndex]) {
            tableRefs[rowIndex][nextColIndex]?.focus();
        } else if (tableRefs[rowIndex + 1]?.[0]) {
            tableRefs[rowIndex + 1][0]?.focus();
        }
    };

    // ──────────── Main Table Columns with Create Smith Row ────────────
    // const mainTableColumns = useMemo(
    //     () => [
    //         {
    //             key: "sno",
    //             label: "S.No",
    //             headalign: "center" as const,
    //             align: "center" as const,
    //             width: "60px",
    //             render: (_v: any, _row: any, index: number) => <span className="font-semibold">{index + 1}</span>,
    //         },
    //         {
    //             key: "smithInfo",
    //             label: "Smith",
    //             headalign: "left" as const,
    //             align: "left" as const,
    //             width: "200px",
    //             render: (_v: any, row: any, index: number) => {
    //                 // Last row is the create smith row
    //                 if (index === transactions.length) {
    //                     return (
    //                         <div className="flex items-center space-x-2">
    //                             <input
    //                                 type="text"
    //                                 value={newSmithName}
    //                                 onChange={(e) => setNewSmithName(e.target.value)}
    //                                 placeholder="Enter Smith name"
    //                                 className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
    //                                 onKeyDown={(e) => {
    //                                     if (e.key === 'Enter') {
    //                                         handleCreateSmith();
    //                                     }
    //                                 }}
    //                             />
    //                             <button
    //                                 onClick={handleCreateSmith}
    //                                 disabled={isCreatingSmith}
    //                                 className="bg-green-600 text-white p-1 rounded hover:bg-green-700 transition-colors disabled:opacity-50"
    //                                 title="Create Smith"
    //                             >
    //                                 <Plus size={16} />
    //                             </button>
    //                         </div>
    //                     );
    //                 }

    //                 return (
    //                     <div>
    //                         <span className="font-medium">{row.name}</span>
    //                         <span className="text-gray-500 dark:text-gray-300 text-sm"> ({row.smithId})</span>
    //                     </div>
    //                 );
    //             },
    //         },
    //         {
    //             key: "date",
    //             label: "Date",
    //             headalign: "center" as const,
    //             align: "center" as const,
    //             width: "100px",
    //             render: (v: string, _row: any, index: number) => {
    //                 if (index === transactions.length) return "-";
    //                 return v ? formatDateForDisplay(v) : "-";
    //             },
    //         },
    //         {
    //             key: "weightBalance",
    //             label: "Weight Balance",
    //             headalign: "center" as const,
    //             align: "right" as const,
    //             width: "100px",
    //             render: (v: number, row: any,) => {

    //                 return (
    //                     <span
    //                         onDoubleClick={() => handleWeightDoubleClick(row)}
    //                         className="cursor-pointer hover:underline hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
    //                     >
    //                         {v?.toFixed(3)}
    //                     </span>
    //                 );
    //             },
    //         },
    //         {
    //             key: "cashBalance",
    //             label: "M.C Balance",
    //             align: "right" as const,
    //             headalign: "center" as const,
    //             width: "110px",
    //             render: (v: number, row: any ) => {

    //                 return (
    //                     <span
    //                         onDoubleClick={() => handleCashDoubleClick(row)}
    //                         className="cursor-pointer hover:underline hover:text-green-600 dark:hover:text-green-400 transition-colors"
    //                     >
    //                         {formatCurrency(v)}
    //                     </span>
    //                 );
    //             },
    //         },
    //     ],
    //     [responsive.isMobile, transactions.length, newSmithName, isCreatingSmith, totals]
    // );

    // ──────────── Main Table Columns (without totals and create row) ────────────
    const mainTableColumns = useMemo(
        () => [
            {
                key: "sno",
                label: "S.No",
                headalign: "center" as const,
                align: "center" as const,
                width: "60px",
                render: (_v: any, _row: any, index: number) => <span className="font-semibold">{index + 1}</span>,
            },
            {
                key: "smithInfo",
                label: "Smith",
                headalign: "left" as const,
                align: "left" as const,
                width: "200px",
                render: (_v: any, row: any) => (
                    <div>
                        <span className="font">{row.name}</span>
                       
                    </div>
                ),
            },
            // {
            //     key: "date",
            //     label: "Date",
            //     headalign: "center" as const,
            //     align: "center" as const,
            //     width: "100px",
            //     render: (v: string) => (v ? formatDateForDisplay(v) : "-"),
            // },
            {
                key: "weightBalance",
                label: "Weight Balance",
                headalign: "center" as const,
                align: "right" as const,
                width: "100px",
                render: (v: number, row: any) => (
                    <span
                        onDoubleClick={() => handleWeightDoubleClick(row)}
                        className="cursor-pointer hover:underline hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                        {v?.toFixed(3)}
                    </span>
                ),
            },
            {
                key: "cashBalance",
                label: "M.C Balance",
                align: "right" as const,
                headalign: "center" as const,
                width: "110px",
                render: (v: number, row: any) => (
                    <span
                        onDoubleClick={() => handleCashDoubleClick(row)}
                        className="cursor-pointer hover:underline hover:text-green-600 dark:hover:text-green-400 transition-colors"
                    >
                        {formatCurrency(v)}
                    </span>
                ),
            },
        ],
        [responsive.isMobile]
    );

    // // Add create smith row to data
    // const tableDataWithCreateRow = useMemo(() => {
    //     return [...transactions, { isCreateRow: true }];
    // }, [transactions]);

    // ──────────── Editable Weight Columns ────────────
    const weightBalanceColumns = useMemo(() => {
        const snoColumn = {
            key: "sno",
            label: "S.No",
            align: "center" as const,
            headalign: "center" as const,
            width: responsive.isMobile ? "40px" : "10px",
            render: (_v: any, _row: any, rowIndex: number) => <span className="font-semibold">{rowIndex + 1}</span>,
        };

        const dataColumns = ["date", "receipts", "payments"].map((field, colIndex) => {
            const labelMap: Record<string, string> = {
                date: "Date",
                receipts: "Receipts",
                payments: "Payments",
            };
            const typeMap: Record<string, "number" | "date"> = {
                date: "date",
                receipts: "number",
                payments: "number",
            };

            return {
                key: field,
                label: labelMap[field],
                headalign: field === "date" ? ("center" as const) : ("right" as const),
                align: field === "date" ? ("center" as const) : ("right" as const),
                width: responsive.isMobile ? "80px" : "50px",
                render: (value: any, row: any, rowIndex: number) => {
                    return (
                        <EditableCell
                            value={value}
                            type={typeMap[field]}
                            onSave={(newVal) => {
                                const finalValue = typeMap[field] === "number" ? parseFloat(newVal) : newVal;
                                handleWeightSave(row, field, finalValue);
                            }}
                            onTabNext={() => focusNextCell(rowIndex, colIndex, "weight")}
                            isMobile={responsive.isMobile}
                        />
                    );
                },
            };
        });

        const balanceColumn = {
            key: "balance",
            label: "Balance",
            headalign: "right" as const,
            align: "right" as const,
            width: responsive.isMobile ? "80px" : "90px",
            render: (_v: any, row: any) => <span className="font-medium">{`${row.weightDifference?.toFixed(3)}`}</span>,
        };
        const remarksColumn = {
            key: "remarks",
            label: "Remarks",
            headalign: "center",
            align: "left",
            width: responsive.isMobile ? "80px" : "90px",
            render: (value: any, row: any, rowIndex: number) => {
                return (
                    <EditableCell
                        value={value}
                        type="text"
                        onSave={(newVal) => {
                            const finalValue = typeMap[field] === "number" ? parseFloat(newVal) : newVal;
                            handleWeightSave(row, field, finalValue);
                        }}

                        isMobile={responsive.isMobile}
                    />
                );
            },
        };

        return [snoColumn, ...dataColumns, balanceColumn , remarksColumn];
    }, [selectedSmithId, responsive.isMobile]);

    // ──────────── Editable Cash Columns ────────────
    const cashBalanceColumns = useMemo(() => {
        const snoColumn = {
            key: "sno",
            label: "S.No",
            headalign: "center" as const,
            align: "center" as const,
            width: responsive.isMobile ? "40px" : "50px",
            render: (_v: any, _row: any, rowIndex: number) => (
                <span className="font-semibold">{rowIndex + 1}</span>
            ),
        };

        const dataColumns = ["date", "receipts", "payments" ].map((field, colIndex) => {
            const labelMap: Record<string, string> = {
                date: "Date",
                receipts: "Receipts",
                payments: "Payments",
            };

            const typeMap: Record<string,"number"| "numbers" | "date"> = {
                date: "date",
                receipts: "numbers",
                payments: "numbers",
            };

            return {
                key: field,
                label: labelMap[field],
                headalign: field === "date" ? ("center" as const) : ("right" as const),
                align: field === "date" ? ("center" as const) : ("right" as const),
                width: responsive.isMobile ? "80px" : "100px",
                render: (value: any, row: any, rowIndex: number) => {
                   

                    return (
                        <EditableCell
                            value={
                                value
                            }
                            type={typeMap[field]}
                            onSave={(newVal) => {
                                const finalValue = newVal;
                                handleCashSave(row, field, finalValue);
                            }}
                            onTabNext={() => focusNextCell(rowIndex, colIndex, "cash")}
                            isMobile={responsive.isMobile}
                        />
                    );
                },
            };

        });

        const balanceColumn = {
            key: "balance",
            label: "Balance",
            headalign: "right" as const,
            align: "right" as const,
            width: responsive.isMobile ? "80px" : "100px",
            render: (v: number) => (
                <span className="font-medium">{formatCurrency(v || 0)}</span>
            ),
        };
        const remarksColumn = {
            key: "remarks",
            label: "Remarks",
            headalign: "center",
            align: "left",
            width: responsive.isMobile ? "80px" : "90px",
            render: (value: any, row: any, rowIndex: number) => {
                return (
                    <EditableCell
                        value={value}
                        type="text"
                        onSave={(newVal) => {
                            const finalValue = typeMap[field] === "number" ? parseFloat(newVal) : newVal;
                            handleWeightSave(row, field, finalValue);
                        }}
                    
                        isMobile={responsive.isMobile}
                    />
                );
            },
        };



        return [snoColumn, ...dataColumns, balanceColumn ,remarksColumn];
    }, [selectedSmithId, responsive.isMobile]);


    // ──────────── Render ────────────
    return (
        <div style={{ background: styles.background.primary, color: styles.text.primary, minHeight: "100vh" }}>
            <main className="p-2 mx-auto">
               
                <div className="grid grid-cols-1 lg:grid-cols-5  gap-2">
                    {/* Smiths Table */}
                    <div className=" lg:col-span-2   flex flex-col gap-1">
                        <div className="flex justify-between p-3 border rounded-t" style={{ background: styles.background.card, borderColor: styles.border }}>
                            <h2 className="text-base font-semibold flex items-center justify-center space-x-2">
                                <Wallet size={18} className="text-blue-600 dark:text-blue-400" />
                                <span>Smith Transactions</span>
                            </h2>
                            <div className="flex items-center space-x-2">
                                {/* Create Smith Input */}
                                <input
                                    type="text"
                                    value={newSmithName}
                                    onChange={(e) => setNewSmithName(e.target.value)}
                                    placeholder="Enter Smith name"
                                    className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleCreateSmith();
                                        }
                                    }}
                                />
                                <button
                                    onClick={handleCreateSmith}
                                    disabled={isCreatingSmith || !newSmithName.trim()}
                                    className="bg-green-600 text-white p-1.5 rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                                    title="Create New Smith"
                                >
                                    <Plus size={12} />
                                    <span className="text-xs">Create Smith</span>
                                </button>
                            </div>
                            {selectedSmithId && selectedSmithName && !existingTransaction && (
                                <div className="flex items-center gap-2 mt-3 p-2 bg-gray-100 dark:bg-gray-700 rounded">
                                    <span className="text-sm font-medium">Selected: {selectedSmithName}</span>
                                    <button
                                        onClick={handleAddTransaction}
                                        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors text-sm"
                                    >
                                        Add Transaction
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Main Table */}
                        <Table
                            columns={mainTableColumns}
                            data={transactions || []}
                            striped
                            hoverable
                            compact="auto"
                            className="border border-t-0"
                            headerClassName="border-b bg-blue-600 text-white dark:bg-blue-800"
                            bodyClassName="border-0"
                            fixedHeight={responsive.isMobile ? "400px" : "500px"}
                            showRows={20}
                        />

                        {/* Totals Footer */}
                        <div className="border border-t-0 rounded-b" style={{ borderColor: styles.border }}>
                            <div className="flex justify-end items-center p-3">
                               

                                {/* Totals Display */}
                                <div className="flex items-center space-x-15 sm:space-x-18 md:space-x-18 lg:space-x-22">
                                    <div className="text-xs sm:text-sm md:text-md   text-600 dark:text-400">Total </div>
                                    <div className="text-right">
                                        
                                        <div className="text-xs sm:text-sm md:text-md   font-bold text-red-600 dark:text-blue-400">
                                            {totals.weight.toFixed(3)}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs sm:text-sm md:text-md   font-bold text-red-600 dark:text-green-400">
                                            {formatCurrency(totals.cash)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Weight + Cash Tables */}
                    <div className="lg:col-span-3  ">
                        {/* Weight Table */}
                        <div className="mb-4">
                            <div
                                className="flex justify-between items-center p-3 border rounded-t"
                                style={{ background: styles.background.card, borderColor: styles.border }}
                            >
                                <h2 className="text-base font-semibold flex items-center space-x-2">
                                    <Scale size={18} className="text-green-600 dark:text-green-400" />
                                    <span>Weight Balance</span>
                                    {selectedSmithId && (
                                        <span className="text-sm text-gray-600 dark:text-gray-300 ml-2">
                                            ({selectedSmithName})
                                        </span>
                                    )}
                                </h2>
                                {selectedSmithId && (
                                    <button
                                        onClick={handleAddWeightRow}
                                        className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 transition-colors text-sm"
                                    >
                                        Add New
                                    </button>
                                )}
                            </div>
                            <Table
                                columns={weightBalanceColumns}
                                data={weightBalanceData}
                                striped
                                hoverable
                                compact="auto"
                                className="border border-t-0 rounded-t-none"
                                headerClassName="border-b bg-green-600 text-white dark:bg-green-800"
                                fixedHeight={responsive.isMobile ? "250px" : "280px"}
                                showRows={5}
                                rowIdPrefix="row-weight"
                            />
                        </div>

                        {/* Cash Table */}
                        <div>
                            <div
                                className="flex justify-between items-center p-3 border rounded-t"
                                style={{ background: styles.background.card, borderColor: styles.border }}
                            >
                                <h2 className="text-base font-semibold flex items-center space-x-2">
                                    <IndianRupee size={18} className="text-blue-600 dark:text-blue-400" />
                                    <span>Cash Balance</span>
                                    {selectedSmithId && (
                                        <span className="text-sm text-gray-600 dark:text-gray-300 ml-2">
                                            ({selectedSmithName})
                                        </span>
                                    )}
                                </h2>
                                {selectedSmithId && (
                                    <button
                                        onClick={handleAddCashRow}
                                        className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors text-sm"
                                    >
                                        Add New
                                    </button>
                                )}
                            </div>
                            <Table
                                columns={cashBalanceColumns}
                                data={cashBalanceData}
                                striped
                                hoverable
                                compact="auto"
                                className="border border-t-0 rounded-t-none"
                                headerClassName="border-b bg-blue-600 text-white dark:bg-blue-800"
                                fixedHeight={responsive.isMobile ? "250px" : "280px"}
                                showRows={5}
                                rowIdPrefix="row-cash"
                            />
                        </div>
                    </div>
                    
                </div>
<div className="mt-2 ">
                        <SmithManager onSelectSmith={handleSmithSelect} />
                    </div>

            </main>
        </div>
    );
}