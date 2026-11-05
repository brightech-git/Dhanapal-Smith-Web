"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/src/theme/theme-context";
import Table from "@/src/components/ui/table";
import { IndianRupee, Scale, Wallet, Plus, Paperclip, Save, Check, Loader2, Users as UsersIcon, ClipboardList, CalendarDays, History } from "lucide-react";
import { formatCurrency, } from "@/src/utils/format/format";
import { useSmithTransactionsContext } from "@/src/module/smith/context/smith-transactions-context";
import { useSmithDetails } from '@/src/module/smith/context/smith-details-context'
import SmithManager from "@/src/module/smith/component/smith-manager";
import EditableCell from "@/src/components/ui/editable-cell";
import { useToast } from "@/src/providers/toast-provider";
import PrintTable from "@/src/components/print/print-table";
import { validateTransactionValues } from "../lib/transaction-validation";
import { toApiDate } from "@/lib/api/envelope";
import { useSoftControlFlags } from "@/src/module/smith/context/soft-control-context";
import { Delete } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import Register from "@/src/module/user/component/register-form";
import FlowAttachmentsDialog from "@/src/module/smith/component/flow-attachments-dialog";
import TransactionDetailView from "@/src/module/smith/component/transaction-detail-view";
import { KpiCard, RecentTransactionsCard, formatAmount, formatWeight } from "@/src/module/smith/component/dashboard-widgets";
import { attachmentCount } from "@/src/module/smith/api/smith-attachments.api";
import {
    useDashboardSummary,
    useRecentCashTransactions,
    useRecentWeightTransactions,
} from "@/src/module/smith/hook/use-smith-dashboard";
import type { FlowKind } from "@/src/module/smith/type/smith-dashboard.types";

/** Paperclip button for a cash/weight row; disabled until the row is saved. */
function AttachButton({ row, onClick }: { row: any; onClick: () => void }) {
    const count = attachmentCount(row);
    const saved = !!row?.id;
    if (!saved && !row?.isNew) return <span className="opacity-0">-</span>;
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={!saved}
            title={saved ? "Attachments" : "Save the row first"}
            className="relative inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-accent-soft hover:text-primary-text disabled:opacity-40"
        >
            <Paperclip className="h-4 w-4" />
            {count > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                    {count}
                </span>
            )}
        </button>
    );
}

import { useAuth } from "@/src/features/auth/lib/auth-context";
import { canMenuAction, canViewMenu } from "@/src/features/auth/lib/access";

export default function SmithsPage() {
    const { allDetails } = useAuth();
    const { responsive } = useTheme();
    const { addToast } = useToast();
    const { createSmith, smiths: allSmiths } = useSmithDetails();
    const flags = useSoftControlFlags();
    const showTotal = flags.grandTotal;
    const showDelete = canViewMenu(allDetails, "transactions") && canMenuAction(allDetails, "transactions", "del");
    const saveMode = flags.saveButton;
    const showDashboard = flags.showDashboard && canViewMenu(allDetails, "dashboard");

    const [attachTarget, setAttachTarget] = useState<{ kind: FlowKind; row: any } | null>(null);
    const [detail, setDetail] = useState<{ kind: FlowKind; index: number } | null>(null);
    const summaryQuery = useDashboardSummary(showDashboard);
    const recentCashQuery = useRecentCashTransactions(5, showDashboard && canViewMenu(allDetails, "transactions"));
    const recentWeightQuery = useRecentWeightTransactions(5, showDashboard && canViewMenu(allDetails, "transactions"));

    const weightPrintRef = useRef<HTMLDivElement>(null);
    const cashPrintRef = useRef<HTMLDivElement>(null);



    const {
        transactions,
        loading: transactionsLoading,
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

    const convertDateToAPIFormat = (dateString: string) => {
        if (!dateString) return '';
        if (dateString.includes('-') && dateString.split('-')[0]?.length === 2) {
            const [day, month, year] = dateString.split('-');
            return `${year}-${month}-${day}`;
        }
        return dateString;
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
                message: `Smith "${newSmith.pname}" created`
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
        const displayDate = toApiDate(today);

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
        const formattedDate = toApiDate(today);

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
                    remarks: field === 'remarks' ? newValue : row.remarks ?? '',
                };
                await addWeight(selectedSmithId, dataToSend);
            }
            await refetchWeightFlows(selectedSmithId);
        } catch (error) {
            console.error("Error saving weight data:", error);
            addToast({ type: 'error', title: 'Save failed', message: (error as any)?.message || 'Could not save the weight row.' });
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
                    remarks: field === 'remarks' ? newValue : row.remarks ?? '',
                };
                await addCash(selectedSmithId, dataToSend);
            }
            await refetchCashFlows(selectedSmithId);
        } catch (error) {
            console.error("Error saving cash data:", error);
            addToast({ type: 'error', title: 'Save failed', message: (error as any)?.message || 'Could not save the cash row.' });
        }
    };

    // SaveButton soft control: keep edits on the row until its Save button is pressed.
    const [savingRow, setSavingRow] = useState<any>(null);

    const isDirty = (row: any) => !!row?.isNew || (!!row?.__changes && Object.keys(row.__changes).length > 0);

    const stageEdit = (kind: FlowKind, row: any, field: string, value: any) => {
        const setter = kind === "weight" ? setWeightBalanceData : setCashBalanceData;
        setter((prev) =>
            prev.map((r) => (r === row ? { ...r, [field]: value, __changes: { ...(r.__changes || {}), [field]: value } } : r))
        );
    };

    const onEdit = async (kind: FlowKind, row: any, field: string, value: any) => {
        if (saveMode) {
            stageEdit(kind, row, field, value);
            return;
        }
        return kind === "weight" ? handleWeightSave(row, field, value) : handleCashSave(row, field, value);
    };

    const commitRow = async (kind: FlowKind, row: any, quiet = false) => {
        if (!selectedSmithId || !isDirty(row)) return true;
        setSavingRow(row);
        try {
            if (row.id) {
                const payload = Object.fromEntries(
                    Object.entries(row.__changes || {}).map(([k, v]) => [k, k === "date" ? convertDateToAPIFormat(String(v)) : v])
                );
                if (kind === "weight") await updateWeight(row.id, payload);
                else await updateCash(row.id, payload);
            } else {
                const payload: any = {
                    smithId: selectedSmithId,
                    date: convertDateToAPIFormat(row.date || ""),
                    receipts: parseFloat(row.receipts) || 0,
                    payments: parseFloat(row.payments) || 0,
                    remarks: row.remarks ?? "",
                };
                if (kind === "weight") await addWeight(selectedSmithId, payload);
                else await addCash(selectedSmithId, payload);
            }
            if (!quiet) {
                addToast({ type: "success", title: "Saved", message: `${kind === "weight" ? "Weight" : "Cash"} row saved.` });
                if (kind === "weight") await refetchWeightFlows(selectedSmithId);
                else await refetchCashFlows(selectedSmithId);
            }
            return true;
        } catch (error: any) {
            console.error(`Error saving ${kind} row:`, error);
            addToast({ type: "error", title: "Save failed", message: error?.message || "Could not save the row." });
            return false;
        } finally {
            setSavingRow(null);
        }
    };

    const commitAll = async (kind: FlowKind) => {
        if (!selectedSmithId) return;
        const rows = (kind === "weight" ? weightBalanceData : cashBalanceData).filter(isDirty);
        try {
            for (const row of rows) validateTransactionValues(row.payments, row.receipts);
        } catch (error) {
            addToast({ type: "error", title: "Save failed", message: (error as Error).message });
            return;
        }
        let saved = 0;
        for (const row of rows) if (await commitRow(kind, row, true)) saved++;
        if (kind === "weight") await refetchWeightFlows(selectedSmithId);
        else await refetchCashFlows(selectedSmithId);
        if (saved) addToast({ type: "success", title: "Saved", message: `${saved} ${kind} row${saved > 1 ? "s" : ""} saved.` });
    };

    const saveColumn = (kind: FlowKind) => ({
        key: "save",
        label: "Save",
        headalign: "center" as const,
        align: "center" as const,
        width: "60px",
        render: (_v: any, row: any) => {
            const dirty = isDirty(row);
            const busy = savingRow === row;
            return (
                <button
                    type="button"
                    onClick={() => commitRow(kind, row)}
                    disabled={!dirty || busy}
                    title={dirty ? "Save this row" : "Saved"}
                    className={`inline-flex h-7 items-center justify-center gap-1 rounded-lg px-2 text-xs font-semibold transition ${
                        dirty
                            ? "bg-primary text-primary-foreground shadow-sm hover:opacity-90"
                            : "text-emerald-600 dark:text-emerald-400"
                    } disabled:cursor-default`}
                >
                    {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : dirty ? <Save className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                    {dirty && !busy && <span className="hidden sm:inline">Save</span>}
                </button>
            );
        },
    });

    const weightDirtyCount = weightBalanceData.filter(isDirty).length;
    const cashDirtyCount = cashBalanceData.filter(isDirty).length;

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
        if (!showDelete || !selectedSmithId) return;

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
        if (!showDelete || !selectedSmithId) return;

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
                <EditableCell value={value} type="date" onSave={(newVal) => onEdit("weight", row, "date", newVal)} />
            ),
        },
        {
            key: "receipts",
            label: "Receipts",
            headalign: "right" as const,
            align: "right" as const,
            width: "100px",
            render: (value: any, row: any, rowIndex: number) => (
                <EditableCell value={value} type="number" allowNegative onSave={(newVal) => onEdit("weight", row, "receipts", newVal)} />
            ),
        },
        {
            key: "payments",
            label: "Payments",
            headalign: "right" as const,
            align: "right" as const,
            width: "100px",
            render: (value: any, row: any, rowIndex: number) => (
                <EditableCell value={value} type="number" allowNegative onSave={(newVal) => onEdit("weight", row, "payments", newVal)} />
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
                <EditableCell value={value} type="text" onSave={(newVal) => onEdit("weight", row, "remarks", newVal)} />
            ),
        },
        {
            key: "files",
            label: "Files",
            headalign: "center" as const,
            align: "center" as const,
            width: "50px",
            render: (_v: any, row: any) => <AttachButton row={row} onClick={() => setAttachTarget({ kind: "weight", row })} />,
        },
        ...(saveMode ? [saveColumn("weight")] : []),
    ], [selectedSmithId, responsive.isMobile, showDelete, saveMode, savingRow, weightBalanceData]);
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
                <EditableCell value={value} type="date" onSave={(newVal) => onEdit("weight", row, "date", newVal)} />
            ),
        },
        {
            key: "receipts",
            label: "Receipts",
            headalign: "right" as const,
            align: "right" as const,
            width: "100px",
            render: (value: any, row: any, rowIndex: number) => (
                <EditableCell value={value} type="number" allowNegative onSave={(newVal) => onEdit("weight", row, "receipts", newVal)} />
            ),
        },
        {
            key: "payments",
            label: "Payments",
            headalign: "right" as const,
            align: "right" as const,
            width: "100px",
            render: (value: any, row: any, rowIndex: number) => (
                <EditableCell value={value} type="number" allowNegative onSave={(newVal) => onEdit("weight", row, "payments", newVal)} />
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
                <EditableCell value={value} type="text" onSave={(newVal) => onEdit("weight", row, "remarks", newVal)} />
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
                <EditableCell value={value} type="date" onSave={(newVal) => onEdit("cash", row, "date", newVal)} />
            ),
        },
        {
            key: "receipts",
            label: "Receipts",
            headalign: "right" as const,
            align: "right" as const,
            width: "100px",
            render: (value: any, row: any, rowIndex: number) => (
                <EditableCell value={value} type="numbers" allowNegative onSave={(newVal) => onEdit("cash", row, "receipts", newVal)} />
            ),
        },
        {
            key: "payments",
            label: "Payments",
            headalign: "right" as const,
            align: "right" as const,
            width: "100px",
            render: (value: any, row: any, rowIndex: number) => (
                <EditableCell value={value} type="numbers" allowNegative onSave={(newVal) => onEdit("cash", row, "payments", newVal)} />
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
                <EditableCell value={value} type="text" onSave={(newVal) => onEdit("cash", row, "remarks", newVal)} />
            ),
        },
        {
            key: "files",
            label: "Files",
            headalign: "center" as const,
            align: "center" as const,
            width: "50px",
            render: (_v: any, row: any) => <AttachButton row={row} onClick={() => setAttachTarget({ kind: "cash", row })} />,
        },
        ...(saveMode ? [saveColumn("cash")] : []),
    ], [selectedSmithId, responsive.isMobile, showDelete, saveMode, savingRow, cashBalanceData]);
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
                <EditableCell value={value} type="date" onSave={(newVal) => onEdit("cash", row, "date", newVal)} />
            ),
        },
        {
            key: "receipts",
            label: "Receipts",
            headalign: "right" as const,
            align: "right" as const,
            width: "100px",
            render: (value: any, row: any, rowIndex: number) => (
                <EditableCell value={value} type="numbers" allowNegative onSave={(newVal) => onEdit("cash", row, "receipts", newVal)} />
            ),
        },
        {
            key: "payments",
            label: "Payments",
            headalign: "right" as const,
            align: "right" as const,
            width: "100px",
            render: (value: any, row: any, rowIndex: number) => (
                <EditableCell value={value} type="numbers" allowNegative onSave={(newVal) => onEdit("cash", row, "payments", newVal)} />
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
                <EditableCell value={value} type="text" onSave={(newVal) => onEdit("cash", row, "remarks", newVal)} />
            ),
        },
    ], [selectedSmithId, responsive.isMobile, showDelete]);




    const summary = summaryQuery.data;
    // Totals and recent transactions; shown only when the Dashboard soft control is Y,
    // above or below the ledger according to DashboardPosition.
    const dashboardSection = (
        <div className="space-y-5">
                {summaryQuery.isError && <p role="alert" className="text-sm text-red-600">Unable to load dashboard totals. Please try again.</p>}
                {/* Totals */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <KpiCard
                        index={0}
                        label="Total weight balance"
                        value={summary?.totalWeight ?? 0}
                        format={formatWeight}
                        footnote={summary ? `${summary.weightTransactions} weight entries` : undefined}
                        icon={Scale}
                        tone="primary"
                        loading={flags.showLoading && summaryQuery.isLoading}
                    />
                    <KpiCard
                        index={1}
                        label="Total amount"
                        value={summary?.totalAmount ?? 0}
                        format={formatAmount}
                        footnote={summary ? `${summary.amountTransactions} cash entries` : undefined}
                        icon={IndianRupee}
                        tone="secondary"
                        loading={flags.showLoading && summaryQuery.isLoading}
                    />
                    <KpiCard
                        index={2}
                        label="Smiths"
                        value={summary?.smithCount ?? 0}
                        format={(v) => Math.round(v).toString()}
                        footnote="Registered smiths"
                        icon={UsersIcon}
                        tone="emerald"
                        loading={flags.showLoading && summaryQuery.isLoading}
                    />
                    <KpiCard
                        index={3}
                        label="Weight transactions"
                        value={summary?.weightTransactions ?? 0}
                        format={(v) => Math.round(v).toLocaleString("en-IN")}
                        icon={Scale}
                        tone="primary"
                        loading={flags.showLoading && summaryQuery.isLoading}
                    />
                    <KpiCard
                        index={4}
                        label="Amount transactions"
                        value={summary?.amountTransactions ?? 0}
                        format={(v) => Math.round(v).toLocaleString("en-IN")}
                        icon={IndianRupee}
                        tone="secondary"
                        loading={flags.showLoading && summaryQuery.isLoading}
                    />
                    <KpiCard
                        index={5}
                        label="Total transactions"
                        value={summary?.totalTransactions ?? 0}
                        format={(v) => Math.round(v).toLocaleString("en-IN")}
                        icon={ClipboardList}
                        tone="slate"
                        loading={flags.showLoading && summaryQuery.isLoading}
                    />
                </div>

                {/* Recent transactions */}
                {canViewMenu(allDetails, "transactions") && <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    <RecentTransactionsCard
                        index={0}
                        title="Recent cash transactions"
                        subtitle="Latest receipts and issues by amount"
                        icon={Wallet}
                        rows={recentCashQuery.data}
                        loading={flags.showLoading && recentCashQuery.isLoading}
                        format={formatAmount}
                        onSelect={(i) => setDetail({ kind: "cash", index: i })}
                    />
                    <RecentTransactionsCard
                        index={1}
                        title="Recent weight transactions"
                        subtitle="Latest receipts and issues by weight"
                        icon={History}
                        rows={recentWeightQuery.data}
                        loading={flags.showLoading && recentWeightQuery.isLoading}
                        format={formatWeight}
                        onSelect={(i) => setDetail({ kind: "weight", index: i })}
                    />
                </div>}
        </div>
    );
    const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

    const cardHeader = "flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3";
    const actionButton = "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:opacity-90";

    return (
        <div className="min-h-screen w-full bg-background text-foreground">
            <main className="w-full space-y-5 px-3 py-4 sm:px-5 lg:px-6">
                {/* Page heading */}
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Smith Dashboard</h1>
                        <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                            <CalendarDays className="h-4 w-4" />
                            {today}
                        </p>
                    </div>
                    {showDashboard && summary?.updatedAt && (
                        <p className="text-xs text-muted-foreground">
                            Updated {new Date(summary.updatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                    )}
                </div>

                {showDashboard && flags.dashboardPosition === "above" && dashboardSection}

                {/* Ledger workspace */}
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                    <section className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm xl:col-span-4">
                        <div className={cardHeader}>
                            <h2 className="flex items-center gap-2 text-sm font-semibold">
                                <Wallet size={18} className="text-primary-text" />
                                Smith Transactions
                                <PrintTable
                                    title="Smith Transactions"
                                    columns={mainTableColumns}
                                    data={transactions || []}
                                    main={true}
                                    showTotal={showTotal}
                                />
                            </h2>
                            <div className="flex items-center gap-1.5">
                                <input
                                    type="text"
                                    value={newSmithName}
                                    onChange={(e) => setNewSmithName(e.target.value)}
                                    placeholder="New smith name"
                                    className="w-36 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring sm:w-44"
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateSmith()}
                                />
                                <button
                                    onClick={handleCreateSmith}
                                    disabled={isCreatingSmith || !newSmithName.trim()}
                                    className={`${actionButton} bg-primary disabled:opacity-50`}
                                >
                                    <Plus size={14} />
                                    Create
                                </button>
                            </div>
                        </div>
                        <Table
                            columns={mainTableColumns}
                            loading={flags.showLoading && transactionsLoading}
                            data={transactions || []}
                            striped
                            hoverable
                            compact="auto"
                            className="w-full rounded-none border-0 shadow-none"
                            bodyClassName="border-0"
                            fixedHeight={responsive.isMobile ? "400px" : "640px"}
                            showRows={20}
                            renderFooter={() => (
                                <tfoot className="sticky bottom-0 z-10 bg-muted font-semibold">
                                    <tr>
                                        <td colSpan={2} className="border-r border-border pr-2 text-right">Total</td>
                                        <td className="border-r border-border pr-1 text-right text-primary-text">
                                            {transactionTotals.weight.toFixed(3)}
                                        </td>
                                        <td className="pr-1 text-right text-primary-text">{formatCurrency(transactionTotals.cash)}</td>
                                    </tr>
                                </tfoot>
                            )}
                        />
                    </section>

                    <div className="flex min-w-0 flex-col gap-4 xl:col-span-8">
                        {/* Weight */}
                        <section className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                            <div className={cardHeader}>
                                <h2 className="flex items-center gap-2 text-sm font-semibold">
                                    <Scale size={18} className="text-emerald-600 dark:text-emerald-400" />
                                    Weight Balance
                                    {selectedSmithId && (
                                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                            {selectedSmithName}
                                        </span>
                                    )}
                                </h2>
                                {selectedSmithId && (
                                    <div className="flex items-center gap-2">
                                        <div ref={weightPrintRef}>
                                            <PrintTable title="Weight Balance Summary" columns={weightBalancePrintColumns} data={weightBalanceData} showTotal={showTotal} smithName={selectedSmithName} />
                                        </div>
                                        {saveMode && weightDirtyCount > 0 && (
                                            <button onClick={() => commitAll("weight")} disabled={!!savingRow} className={`${actionButton} bg-amber-500 disabled:opacity-60`}>
                                                <Save size={14} />
                                                Save all ({weightDirtyCount})
                                            </button>
                                        )}
                                        <button onClick={handleAddWeightRow} className={`${actionButton} bg-emerald-600`}>
                                            <Plus size={14} />
                                            Add new
                                        </button>
                                    </div>
                                )}
                            </div>
                            <Table
                                columns={weightBalanceColumns}
                                data={weightBalanceData}
                                striped
                                hoverable
                                compact="auto"
                                className="w-full rounded-none border-0 shadow-none"
                                fixedHeight={responsive.isMobile ? "250px" : "280px"}
                                showRows={5}
                                renderFooter={showTotal ? () => (
                                    <tfoot className="sticky bottom-0 bg-emerald-50 font-semibold text-foreground dark:bg-emerald-500/10">
                                        <tr>
                                            <td colSpan={2} className="border-r border-border pr-4 text-right">Total</td>
                                            <td className="border-r border-border text-right">{weightTotals.receipts.toFixed(3)}</td>
                                            <td className="border-r border-border text-right">{weightTotals.payments.toFixed(3)}</td>
                                            <td className="border-r border-border text-right">{weightTotals.balance.toFixed(3)}</td>
                                            <td></td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                ) : undefined}
                            />
                        </section>

                        {/* Cash */}
                        <section className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                            <div className={cardHeader}>
                                <h2 className="flex items-center gap-2 text-sm font-semibold">
                                    <IndianRupee size={18} className="text-primary-text" />
                                    Cash Balance
                                    {selectedSmithId && (
                                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                            {selectedSmithName}
                                        </span>
                                    )}
                                </h2>
                                {selectedSmithId && (
                                    <div className="flex items-center gap-2">
                                        <div ref={cashPrintRef}>
                                            <PrintTable title="Cash Balance Summary" columns={cashBalancePrintColumns} data={cashBalanceData} showTotal={showTotal} smithName={selectedSmithName} />
                                        </div>
                                        {saveMode && cashDirtyCount > 0 && (
                                            <button onClick={() => commitAll("cash")} disabled={!!savingRow} className={`${actionButton} bg-amber-500 disabled:opacity-60`}>
                                                <Save size={14} />
                                                Save all ({cashDirtyCount})
                                            </button>
                                        )}
                                        <button onClick={handleAddCashRow} className={`${actionButton} bg-primary`}>
                                            <Plus size={14} />
                                            Add new
                                        </button>
                                    </div>
                                )}
                            </div>
                            <Table
                                columns={cashBalanceColumns}
                                data={cashBalanceData}
                                striped
                                hoverable
                                compact="auto"
                                className="w-full rounded-none border-0 shadow-none"
                                fixedHeight={responsive.isMobile ? "250px" : "280px"}
                                showRows={5}
                                renderFooter={showTotal ? () => (
                                    <tfoot className="sticky bottom-0 bg-accent-soft font-semibold text-foreground">
                                        <tr>
                                            <td colSpan={2} className="border-r border-border pr-4 text-right">Total</td>
                                            <td className="border-r border-border text-right">{formatCurrency(cashTotals.receipts)}</td>
                                            <td className="border-r border-border text-right">{formatCurrency(cashTotals.payments)}</td>
                                            <td className="border-r border-border text-right">{formatCurrency(cashTotals.balance)}</td>
                                            <td></td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                ) : undefined}
                            />
                        </section>
                    </div>
                </div>

                {/* Management */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <section className="min-w-0 rounded-2xl border border-border bg-card p-4 shadow-sm">
                        <SmithManager onSelectSmith={handleSmithSelect} />
                    </section>
                    <section className="min-w-0 rounded-2xl border border-border bg-card p-4 shadow-sm">
                        <Register />
                    </section>
                </div>

                {showDashboard && flags.dashboardPosition === "below" && dashboardSection}
            </main>

            <TransactionDetailView
                open={!!detail}
                kind={detail?.kind ?? "cash"}
                rows={(detail?.kind === "weight" ? recentWeightQuery.data : recentCashQuery.data) ?? []}
                index={detail?.index ?? 0}
                format={detail?.kind === "weight" ? formatWeight : formatAmount}
                onIndexChange={(index) => setDetail((d) => (d ? { ...d, index } : d))}
                onClose={() => setDetail(null)}
                onAttach={(r) =>
                    detail &&
                    setAttachTarget({
                        kind: detail.kind,
                        row: { id: r.id, date: r.date, remarks: r.remark, media: r.media ?? [] },
                    })
                }
            />

            <FlowAttachmentsDialog
                open={!!attachTarget}
                kind={attachTarget?.kind ?? "cash"}
                row={attachTarget?.row ?? null}
                onClose={() => setAttachTarget(null)}
                onUploaded={() => {
                    if (!selectedSmithId || !attachTarget) return;
                    if (attachTarget.kind === "cash") refetchCashFlows(selectedSmithId);
                    else refetchWeightFlows(selectedSmithId);
                }}
            />
        </div>
    );
}
