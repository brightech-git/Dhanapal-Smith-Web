"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import { useTheme } from "@/context/theme/ThemeContext";
import Table from "@/component/ui/table/Table";
import { IndianRupee, Scale, Wallet } from "lucide-react";
import { formatCurrency, formatDate } from "@/utils/format";
import { useSmithTransactionsContext } from "@/context/smith/SmithTransactionsContext";
import SmithManager from "../smith/SmithManager";
import EditableCell from "@/component/ui/EditableCell";
import { useToast } from "@/context/smith/ToastContext";

export default function SmithsPage() {
    const { mode, theme, responsive } = useTheme();
    const { addToast } = useToast();

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

    const [weightBalanceData, setWeightBalanceData] = useState<any[]>([]);
    const [cashBalanceData, setCashBalanceData] = useState<any[]>([]);

    const [selectedSmithId, setSelectedSmithId] = useState<string>("");
    const [selectedSmithName, setSelectedSmithName] = useState<string>("");
    const [activeTable, setActiveTable] = useState<"weight" | "cash" | null>(null);

    const [newTransactionDate, setNewTransactionDate] = useState<string>(""); // yyyy-mm-dd

    const existingTransaction = transactions.find(
        (transaction: any) =>
            transaction.smithId === selectedSmithId
    );

    const cellRefs = useRef<(HTMLInputElement | null)[][]>([]);

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

    const handleAddWeightRow = () => {
        if (!selectedSmithId) {
            addToast({
                type: 'warning',
                title: 'Selection Required',
                message: 'Please select a Smith first.'
            });
            return;
        }
        setWeightBalanceData(prev => [
            ...prev,
            {
                id: null,
                smithId: selectedSmithId,
                date: new Date().toISOString().split('T')[0],
                receipts: 0,
                payments: 0,
                weightDifference: 0
            }
        ]);

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
        setCashBalanceData(prev => [
            ...prev,
            {
                id: null,
                smithId: selectedSmithId,
                date: new Date().toISOString().split('T')[0],
                receipts: 0,
                payments: 0,
                balance: 0
            }
        ]);

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
            title: 'Weight Table  and Cash Table Loaded',
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

    // ──────────── Save handlers ────────────
    const handleWeightSave = async (row: any, field: string, newValue: any) => {
        if (!selectedSmithId) return;

        try {
            if (row.id) {
                await updateWeight(row.id, { [field]: newValue });
                addToast({
                    type: 'success',
                    title: 'Weight Updated',
                    message: 'Weight data updated successfully'
                });
            } else {
                await addWeight(selectedSmithId, { ...row, [field]: newValue });
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
            if (row.id) {
                await updateCash(row.id, { [field]: newValue });
                addToast({
                    type: 'success',
                    title: 'Cash Updated',
                    message: 'Cash data updated successfully'
                });
            } else {
                await addCash(selectedSmithId, { ...row, [field]: newValue });
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
        if (!selectedSmithId || !selectedSmithName || !newTransactionDate) {
            addToast({
                type: 'warning',
                title: 'Missing Information',
                message: 'Please select a Smith and date.'
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

            await addTransaction({
                smithId: selectedSmithId,
                name: selectedSmithName,
                date: newTransactionDate,
                cashBalance: 0,
                weightBalance: 0,
            });

            addToast({
                type: 'success',
                title: 'Transaction Added',
                message: 'Transaction added successfully!'
            });

            setNewTransactionDate(""); // reset date picker
        } catch (err: any) {
            console.error(err);
            addToast({
                type: 'error',
                title: 'Failed to Add Transaction',
                message: err.message || "Unknown error occurred"
            });
        }
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

    // ──────────── Main Table Columns ────────────
    const mainTableColumns = useMemo(
        () => [
            {
                key: "sno",
                label: "S.No",
                align: "center" as const,
                width: "60px",
                render: (_v: any, _row: any, index: number) => <span className="font-semibold">{index + 1}</span>,
            },
            {
                key: "smithInfo",
                label: "Smith",
                align: "left" as const,
                width: "200px",
                render: (_v: any, row: any) => (
                    <div>
                        <span className="font-medium">{row.name}</span>
                        <span className="text-gray-500 dark:text-gray-300 text-sm"> ({row.smithId})</span>
                    </div>
                ),
            },
            {
                key: "date",
                label: "Date",
                align: "center" as const,
                width: "100px",
                render: (v: string) => (v ? formatDate(v) : "-"),
            },
            {
                key: "weightBalance",
                label: "Weight Balance",
                align: "right" as const,
                width: "100px",
                render: (v: number, row: any) => (
                    <span
                        onDoubleClick={() => handleWeightDoubleClick(row)}
                        className="cursor-pointer hover:underline hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                        {v?.toFixed(3)}g
                    </span>
                ),
            },
            {
                key: "cashBalance",
                label: "M.C Balance",
                align: "right" as const,
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


    // ──────────── Editable Weight Columns ────────────
    const weightBalanceColumns = useMemo(() => {
        const snoColumn = {
            key: "sno",
            label: "S.No",
            align: "center" as const,
            width: responsive.isMobile ? "40px" : "50px",
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
                align: field === "date" ? ("center" as const) : ("right" as const),
                width: responsive.isMobile ? "80px" : "90px",
                render: (value: any, row: any, rowIndex: number) => (
                    <EditableCell
                        value={value}
                        type={typeMap[field]}
                        onSave={(newVal) =>
                            handleWeightSave(row, field, typeMap[field] === "number" ? parseFloat(newVal) : newVal)
                        }
                        onTabNext={() => focusNextCell(rowIndex, colIndex, "weight")}
                        isMobile={responsive.isMobile}
                    />
                ),
            };
        });

        const balanceColumn = {
            key: "balance",
            label: "Balance",
            align: "right" as const,
            width: responsive.isMobile ? "80px" : "90px",
            render: (_v: any, row: any) => <span className="font-medium">{`${row.weightDifference?.toFixed(3)}g`}</span>,
        };

        return [snoColumn, ...dataColumns, balanceColumn];
    }, [selectedSmithId, responsive.isMobile]);

    // ──────────── Editable Cash Columns ────────────
    const cashBalanceColumns = useMemo(() => {
        const snoColumn = {
            key: "sno",
            label: "S.No",
            align: "center" as const,
            width: responsive.isMobile ? "40px" : "50px",
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
                align: field === "date" ? ("center" as const) : ("right" as const),
                width: responsive.isMobile ? "80px" : "100px",
                render: (value: any, row: any, rowIndex: number) => (
                    <EditableCell
                        value={value}
                        type={typeMap[field]}
                        onSave={(newVal) =>
                            handleCashSave(row, field, typeMap[field] === "number" ? parseFloat(newVal) : newVal)
                        }
                        onTabNext={() => focusNextCell(rowIndex, colIndex, "cash")}
                        isMobile={responsive.isMobile}
                    />
                ),
            };
        });

        const balanceColumn = {
            key: "balance",
            label: "Balance",
            align: "right" as const,
            width: responsive.isMobile ? "80px" : "100px",
            render: (v: number) => <span className="font-medium">{formatCurrency(v)}</span>,
        };

        return [snoColumn, ...dataColumns, balanceColumn];
    }, [selectedSmithId, responsive.isMobile]);

    // ──────────── Render ────────────
    return (
        <div style={{ background: styles.background.primary, color: styles.text.primary, minHeight: "100vh" }}>
            <main className="p-2 mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Smiths Table */}
                    <div>
                        <div className="p-3 border rounded-t" style={{ background: styles.background.card, borderColor: styles.border }}>
                            <h2 className="text-base font-semibold flex items-center justify-center space-x-2">
                                <Wallet size={18} className="text-blue-600 dark:text-blue-400" />
                                <span>Smith Transactions</span>
                            </h2>
                            {selectedSmithId && selectedSmithName && !existingTransaction && (
                                <div className="flex items-center gap-2 mt-3 p-2 bg-gray-100 dark:bg-gray-700 rounded">
                                    <span className="text-sm font-medium">Selected: {selectedSmithName}</span>
                                    <input
                                        type="date"
                                        value={newTransactionDate}
                                        onChange={(e) => setNewTransactionDate(e.target.value)}
                                        className="border px-2 py-1 rounded text-sm"
                                    />
                                    <button
                                        onClick={handleAddTransaction}
                                        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors text-sm"
                                    >
                                        Add Transaction
                                    </button>
                                </div>
                            )}
                        </div>
                        <Table
                            columns={mainTableColumns}
                            data={transactions || []}
                            striped
                            hoverable
                            compact="auto"
                            className="border border-t-0 rounded-t-none"
                            headerClassName="border-b bg-blue-600 text-white dark:bg-blue-800"
                            bodyClassName="border-0"
                            fixedHeight={responsive.isMobile ? "400px" : "500px"}
                            showRows={20}
                        />
                    </div>

                    {/* Weight + Cash Tables */}
                    <div>
                        {/* Weight Table */}
                        <div className="mb-4">
                            <div
                                className="flex justify-between items-center p-3 border rounded-t"
                                style={{ background: styles.background.card, borderColor: styles.border }}
                            >
                                <h2 className="text-base font-semibold flex items-center space-x-2">
                                    <Scale size={18} className="text-green-600 dark:text-green-400" />
                                    <span>Weight Balance</span>
                                    {selectedSmithId && activeTable === "weight" && (
                                        <span className="text-sm text-gray-600 dark:text-gray-300 ml-2">
                                            ({selectedSmithName})
                                        </span>
                                    )}
                                </h2>
                                {selectedSmithId && activeTable === "weight" && (
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
                                    {selectedSmithId && activeTable === "cash" && (
                                        <span className="text-sm text-gray-600 dark:text-gray-300 ml-2">
                                            ({selectedSmithName})
                                        </span>
                                    )}
                                </h2>
                                {selectedSmithId && activeTable === "cash" && (
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
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-4">
                    <SmithManager onSelectSmith={handleSmithSelect} />
                </div>
            </main>
        </div>
    );
}