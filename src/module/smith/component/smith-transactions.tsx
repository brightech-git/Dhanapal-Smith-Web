"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import { useTheme } from "@/src/theme/theme-context";
import Table from "@/src/components/ui/table";
import { IndianRupee, Scale, Wallet, Plus, Paperclip, Save, Check, Loader2, UserPlus } from "lucide-react";
import { formatCurrency, } from "@/src/utils/format/format";
import { useSmithTransactionsContext } from "@/src/module/smith/context/smith-transactions-context";
import { useSmithDetails } from '@/src/module/smith/context/smith-details-context'
import SmithManager from "@/src/module/smith/component/smith-manager";
import EditableCell from "@/src/components/ui/editable-cell";
import SmithFormModal from "./smith-form-modal";
import { useToast } from "@/src/providers/toast-provider";
import PrintTable from "@/src/components/print/print-table";
import { validateTransactionValues } from "../lib/transaction-validation";
import { toApiDate } from "@/lib/api/envelope";
import { useSoftControlFlags } from "@/src/module/smith/context/soft-control-context";
import { Delete } from "@mui/icons-material";
import { Dialog, DialogTitle, IconButton } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import ComboBox from "@/src/components/ui/combo-box";
import { moveToNextCell } from "@/src/components/ui/cell-navigation";
import { metalQueryKey, type Metal } from "@/src/module/metal/metal-form";
import { api } from "@/lib/api/envelope";
import ItemForm, { activeItems, fetchItems, itemQueryKey } from "@/src/module/item/item-form";
import { WEIGHT_TRAN_TYPES, formatFixed, ledgerFromPureWeight, pureWeight, sumWeights, weightTranTypeLabel } from "../lib/weight-calc";
import Register from "@/src/module/user/component/register-form";
import FlowAttachmentsDialog from "@/src/module/smith/component/flow-attachments-dialog";
import { attachmentCount } from "@/src/module/smith/api/smith-attachments.api";
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

export default function SmithTransactionsPage() {
    const { allDetails } = useAuth();
    const { responsive } = useTheme();
    const { addToast } = useToast();
    const { createSmith, smiths: allSmiths } = useSmithDetails();
    const flags = useSoftControlFlags();
    const showTotal = flags.grandTotal;
    const showDelete = canViewMenu(allDetails, "transactions") && canMenuAction(allDetails, "transactions", "del");
    const saveMode = flags.saveButton;
    const [attachTarget, setAttachTarget] = useState<{ kind: FlowKind; row: any } | null>(null);
    const weightPrintRef = useRef<HTMLDivElement>(null);
    const canAddItem = canMenuAction(allDetails, "items", "add");
    const itemsQuery = useQuery({ queryKey: itemQueryKey, queryFn: fetchItems });
    const itemOptions = useMemo(
        () => activeItems(itemsQuery.data).map((item) => ({ value: String(item.itemId), label: item.itemName })),
        [itemsQuery.data]
    );
    const itemNameOf = (row: any) =>
        row?.itemName || itemOptions.find((option) => option.value === String(row?.itemId ?? ""))?.label || "";
    // The weight row waiting for an item from the "Add new" item dialog.
    const [addItemFor, setAddItemFor] = useState<any>(null);
    const cashPrintRef = useRef<HTMLDivElement>(null);
    const weightSectionRef = useRef<HTMLElement>(null);
    const cashSectionRef = useRef<HTMLElement>(null);


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
        addTransaction,
        metalId,
        setMetalId,
    } = useSmithTransactionsContext();

    // Summary header: metal for the weight balance, and a smith name search.
    const metalsQuery = useQuery({ queryKey: metalQueryKey, queryFn: () => api.get<Metal[]>("metal") });
    const metalOptions = useMemo(
      //  () => [{ value: "", label: "All metals" }, ...(metalsQuery.data ?? []).map((m) => ({ value: m.metalId, label: `${m.metalId} · ${m.metalName}` }))],
      () => [...(metalsQuery.data ?? []).map((m) => ({ value: m.metalId, label: `${m.metalId} · ${m.metalName}` }))],
        [metalsQuery.data]
    );
    const [smithSearch, setSmithSearch] = useState("");
    const summaryRows = useMemo(() => {
        const q = smithSearch.trim().toLowerCase();
        return (transactions ?? []).filter((t) => !q || (t.name ?? "").toLowerCase().includes(q));
    }, [transactions, smithSearch]);

    const [weightBalanceData, setWeightBalanceData] = useState<any[]>([]);
    const [cashBalanceData, setCashBalanceData] = useState<any[]>([]);
  
    const [selectedSmithId, setSelectedSmithId] = useState<string>("");
    const [selectedSmithName, setSelectedSmithName] = useState<string>("");
    // const [activeTable, setActiveTable] = useState<"weight" | "cash" | null>(null);
    const [isCreatingSmith, setIsCreatingSmith] = useState(false);
    const [smithModalOpen, setSmithModalOpen] = useState(false);
    const [newSmithName, setNewSmithName] = useState("");

    

    // Calculate totals for main table
    const transactionTotals = useMemo(() => {
        const weight = sumWeights(summaryRows.map((txn) => txn.weightBalance || 0));
        const cash = summaryRows.reduce((sum, txn) => sum + (txn.cashBalance || 0), 0);
        return { weight, cash };
    }, [summaryRows]);

    // Totals for weight table
    const weightTotals = useMemo(() => {
        const receipts = sumWeights(weightBalanceData.map((row) => row.receipts || 0));
        const payments = sumWeights(weightBalanceData.map((row) => row.payments || 0));
        const balance = sumWeights([receipts, -payments]);
        const grswt = sumWeights(weightBalanceData.map((row) => row.grswt || 0));
        const purewt = sumWeights(weightBalanceData.map((row) => row.purewt || 0));
        return { receipts, payments, balance, grswt, purewt };
    }, [weightBalanceData]);

    // Totals for cash table
    const cashTotals = useMemo(() => {
        const receipts = cashBalanceData.reduce((sum, row) => sum + (row.receipts || 0), 0);
        const payments = cashBalanceData.reduce((sum, row) => sum + (row.payments || 0), 0);
        const balance = receipts - payments;
        return { receipts, payments, balance };
    }, [cashBalanceData]);

    // Rest of your functions remain the same...
    // The smith whose rows are on screen; answers for an earlier smith are dropped.
    const shownSmith = useRef("");

    // A different metal: reload the open smith's weight rows for it.
    useEffect(() => {
        if (selectedSmithId) refetchWeightFlows(selectedSmithId);
    }, [metalId]); // eslint-disable-line react-hooks/exhaustive-deps

    /** Shows one smith: clears the previous smith's rows, then loads this one's. */
    const openSmith = async (smithId: string | number, smithName = "") => {
        const id = String(smithId);
        shownSmith.current = id;
        setSelectedSmithId(id);
        setSelectedSmithName(smithName);
        setWeightBalanceData([]);
        setCashBalanceData([]);
        setAttachTarget(null);
        await Promise.all([refetchWeightFlows(id), refetchCashFlows(id)]);
    };

    const refetchWeightFlows = async (smithId: string) => {
        try {
            const data = await getWeightFlows(smithId);
            if (shownSmith.current && shownSmith.current !== smithId) return;
            // Keep calculated running balances intact; reverse only the display order.
            setWeightBalanceData([...(data || [])].reverse());
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
            if (shownSmith.current && shownSmith.current !== smithId) return;
            setCashBalanceData([...(data || [])].reverse());
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

            // ✅ Close the smith that was open and open the new one, ready for entries
            await openSmith(newSmith.smithId.toString(), newSmith.pname || trimmedName);
            setSmithSearch("");
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


    const hasNewWeightRow = weightBalanceData.some((row) => row.isNew);
    const hasNewCashRow = cashBalanceData.some((row) => row.isNew);

    const handleAddWeightRow = () => {
        if (hasNewWeightRow) return;
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
            tranType: "R",
            itemId: null,
            grswt: null,
            touch: null,
            purewt: null,
            isNew: true,
        };

        setWeightBalanceData(prev => prev.some((row) => row.isNew) ? prev : [newRow, ...prev]);
        requestAnimationFrame(() => weightSectionRef.current?.querySelector(".overflow-auto")?.scrollTo({ top: 0 }));
        addToast({
            type: 'info',
            title: 'New Row Added',
            message: 'New weight row added. Fill in the details and save.'
        });
    };

    const handleAddCashRow = () => {
        if (hasNewCashRow) return;
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

        setCashBalanceData(prev => prev.some((row) => row.isNew) ? prev : [newRow, ...prev]);
        requestAnimationFrame(() => cashSectionRef.current?.querySelector(".overflow-auto")?.scrollTo({ top: 0 }));
        addToast({
            type: 'info',
            title: 'New Row Added',
            message: 'New cash row added. Fill in the details and save.'
        });
    };

    const handleWeightDoubleClick = async (row: any) => {
        if (!row?.smithId) return;
        await openSmith(row.smithId, row.name || "");
    };

    const handleCashDoubleClick = handleWeightDoubleClick;

    const handleWeightSave = (row: any, field: string, newValue: any) =>
        handleWeightPatch(row, { [field]: field === 'date' ? convertDateToAPIFormat(newValue) : newValue });

    /** Saves several fields of a weight row at once (e.g. gross wt with its pure wt and receipt). */
    const handleWeightPatch = async (row: any, patch: Record<string, any>) => {
        if (!selectedSmithId) return;
        try {
            if (row.id) {
                await updateWeight(row.id, patch);
            } else {
                const next = { ...row, ...patch };
                const dataToSend: any = {
                    smithId: selectedSmithId,
                    date: convertDateToAPIFormat(next.date || ''),
                    receipts: parseFloat(next.receipts) || 0,
                    payments: parseFloat(next.payments) || 0,
                    remarks: next.remarks ?? '',
                    ...weightEntryFields(next),
                };
                // The backend needs a receipt or a payment: keep the row local until one is entered.
                if (!dataToSend.receipts && !dataToSend.payments) {
                    setWeightBalanceData((prev) => prev.map((r) => (r === row ? { ...r, ...patch } : r)));
                    return;
                }
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
                // The backend needs a receipt or a payment: keep the row local until one is entered.
                if (!(dataToSend.receipts || 0) && !(dataToSend.payments || 0)) {
                    setCashBalanceData((prev) => prev.map((r) => (r === row ? { ...r, [field]: newValue } : r)));
                    return;
                }
                await addCash(selectedSmithId, dataToSend);
            }
            await refetchCashFlows(selectedSmithId);
        } catch (error) {
            console.error("Error saving cash data:", error);
            addToast({ type: 'error', title: 'Save failed', message: (error as any)?.message || 'Could not save the cash row.' });
        }
    };

    const weightEntryFields = (row: any) => ({
        tranType: row.tranType || '',
        itemId: row.itemId ?? null,
        grswt: row.grswt ?? null,
        touch: row.touch ?? null,
        purewt: row.purewt ?? null,
    });

    /**
     * Type, gross wt or touch changed: pure wt = gross wt x touch / 100 (exact, decimal.js),
     * and it goes to Receipts for R (Receipt) or Payments for P (Purchase).
     */
    const editWeightEntry = (row: any, field: "tranType" | "itemId" | "grswt" | "touch", value: any) => {
        const patch: Record<string, any> = { [field]: value === "" ? null : value };
        if (field !== "itemId") {
            const next = { ...row, ...patch };
            if (next.grswt != null && next.touch != null) {
                const purewt = pureWeight(next.grswt, next.touch);
                Object.assign(patch, { purewt }, ledgerFromPureWeight(next.tranType || "R", purewt));
            }
        }
        if (saveMode) {
            setWeightBalanceData((prev) => prev.map((r) =>
                r === row ? { ...r, ...patch, __changes: { ...(r.__changes || {}), ...patch } } : r));
            return Promise.resolve();
        }
        return handleWeightPatch(row, patch);
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
                    ...(kind === "weight" ? weightEntryFields(row) : {}),
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
        openSmith(smithId, smithName);
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
            width: "10px",
            render: (_v: any, _row: any, index: number) => <span className="font-semibold">{index + 1}</span>,
        },
        {
            key: "smithInfo",
            label: "Smith",
            headalign: "left" as const,
            align: "left" as const,
            width: "90px",
            render: (_v: any, row: any) => <span>{row.name}</span>,
        },
        {
            key: "weightBalance",
            label: "Wt Bal",
            headalign: "right" as const,
            align: "right" as const,
            width: "80px",
            render: (v: number, row: any) => (
                <span onDoubleClick={() => handleWeightDoubleClick(row)} className="cursor-pointer hover:underline">
                    {v?.toFixed(3)}
                </span>
            ),
        },
        {
            key: "cashBalance",
            label: "M.C Bal",
            headalign: "right" as const,
            align: "right" as const,
            width: "80px",
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
                    <span>{weightBalanceData.length - index}</span>
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
                <EditableCell value={value} type="date" onSave={(newVal) => onEdit("weight", row, "date", newVal)}  />
            ),
        },
        {
            key: "tranType",
            label: "Type",
            headalign: "center" as const,
            align: "center" as const,
            width: "90px",
            render: (value: any, row: any) => (
                <select value={value || ""} aria-label="Transaction type" data-cell-nav
                    onChange={(event) => editWeightEntry(row, "tranType", event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key !== "Enter") return;
                        event.preventDefault();
                        moveToNextCell(event.currentTarget);
                    }}
                    className="w-full rounded-md border border-border bg-background px-1 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    {!value && <option value="">-</option>}
                    {WEIGHT_TRAN_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
            ),
        },
        {
            key: "itemId",
            label: "Item",
            headalign: "left" as const,
            align: "left" as const,
            width: "150px",
            render: (value: any, row: any, index: number) => (
                <div className="min-w-[130px]" data-cell-nav>
                    <ComboBox id={`weight-item-${index}`} labelId="weight-item-header" value={value != null ? String(value) : ""}
                        options={itemOptions.length || value == null ? itemOptions : [{ value: String(value), label: itemNameOf(row) || `#${value}` }]}
                        placeholder={itemsQuery.isPending ? "Loading…" : "Select item"}
                        onChange={(itemId) => editWeightEntry(row, "itemId", Number(itemId))}
                        addNew={canAddItem} onAddNew={() => setAddItemFor(row)} />
                </div>
            ),
        },
        {
            key: "grswt",
            label: "Grs Wt",
            headalign: "right" as const,
            align: "right" as const,
            width: "90px",
            render: (value: any, row: any) => (
                <EditableCell value={value} type="number" decimals={3} onSave={(newVal) => editWeightEntry(row, "grswt", newVal)} />
            ),
        },
        {
            key: "touch",
            label: "Touch",
            headalign: "right" as const,
            align: "right" as const,
            width: "80px",
            render: (value: any, row: any) => (
                <EditableCell value={value} type="number" decimals={2} onSave={(newVal) => editWeightEntry(row, "touch", newVal)} />
            ),
        },
        // {
        //     key: "purewt",
        //     label: "Pure Wt",
        //     headalign: "right" as const,
        //     align: "right" as const,
        //     width: "90px",
        //     render: (value: any) => (
        //         <span className="font-medium tabular-nums" title="Grs Wt x Touch / 100">{value != null ? formatFixed(value, 3) : "-"}</span>
        //     ),
        // },
        {
            key: "receipts",
            label: "Receipts",
            headalign: "right" as const,
            align: "right" as const,
            width: "100px",
            render: (value: any, row: any, rowIndex: number) => (
                row.grswt != null
                    ? <span className="tabular-nums" title="From Pure Wt">{formatFixed(value, 3)}</span>
                    : <EditableCell value={value} type="number" allowNegative onSave={(newVal) => onEdit("weight", row, "receipts", newVal)} />
            ),
        },
        {
            key: "payments",
            label: "Payments",
            headalign: "right" as const,
            align: "right" as const,
            width: "100px",
            render: (value: any, row: any, rowIndex: number) => (
                row.grswt != null
                    ? <span className="tabular-nums" title="From Pure Wt">{formatFixed(value, 3)}</span>
                    : <EditableCell value={value} type="number" allowNegative onSave={(newVal) => onEdit("weight", row, "payments", newVal)} />
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
    ], [selectedSmithId, responsive.isMobile, showDelete, saveMode, savingRow, weightBalanceData, itemOptions, itemsQuery.isPending, canAddItem]);

    const weightBalancePrintColumns = useMemo(() => [
        {
            key: "sno",
            label: "S.No",
            headalign: "left" as const,
            align: "left" as const,
            width: "50px",
            render: (_v: any, row: any, index: number) => (
                <div className="flex items-center justify-between">
                    <span>{weightBalanceData.length - index}</span>
                    

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
        { key: "tranType", label: "Type", headalign: "center" as const, align: "center" as const, width: "70px",
            render: (value: any) => <span>{weightTranTypeLabel(value) || "-"}</span> },
        { key: "itemId", label: "Item", headalign: "left" as const, align: "left" as const, width: "110px",
            render: (_v: any, row: any) => <span>{itemNameOf(row) || "-"}</span> },
        { key: "grswt", label: "Grs Wt", headalign: "right" as const, align: "right" as const, width: "80px",
            render: (value: any) => <span>{value != null ? formatFixed(value, 3) : "-"}</span> },
        { key: "touch", label: "Touch", headalign: "right" as const, align: "right" as const, width: "70px",
            render: (value: any) => <span>{value != null ? formatFixed(value, 2) : "-"}</span> },
        // { key: "purewt", label: "Pure Wt", headalign: "right" as const, align: "right" as const, width: "80px",
        //     render: (value: any) => <span>{value != null ? formatFixed(value, 3) : "-"}</span> },
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
    ], [selectedSmithId, responsive.isMobile, showDelete, itemOptions, weightBalanceData.length]);

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
                    <span>{cashBalanceData.length - index}</span>
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
                    <span>{cashBalanceData.length - index}</span>
                

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
    ], [selectedSmithId, responsive.isMobile, showDelete, cashBalanceData.length]);




    const cardHeader = "flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3";
    const actionButton = "inline-flex items-center gap-1.5 rounded-lg px-1 py-1 text-[8px] font-semibold text-white shadow-sm transition hover:opacity-90";

    return (
        <div className="min-h-screen w-full bg-background text-foreground">
            <div className="w-full space-y-4 px-2 py-2 sm:px-3 lg:px-4">
                {/* <h1 className="text-2xl font-bold tracking-tight">Smith Transactions</h1> */}

                {/* Ledger workspace */}
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                    <section className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm xl:col-span-3">
                        <div className={cardHeader}>
                            <h2 className="flex items-center gap-2 text-sm font-semibold">
                                <Wallet size={18} className="text-primary-text" />
                                Smith
                                <PrintTable
                                    title="Smith Transactions"
                                    columns={mainTableColumns}
                                    data={summaryRows}
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
                                    className={`${actionButton} -ml-16 bg-primary disabled:opacity-50`}
                                >
                                    <Plus size={14} />
                                    Create
                                </button>
                                {/* <button
                                    type="button"
                                    onClick={() => setSmithModalOpen(true)}
                                    title="Create a smith with full details"
                                    aria-label="Create a smith with full details"
                                    className={`${actionButton} text-sm border border-border bg-card !text-foreground hover:bg-muted`}
                                >
                                    <UserPlus size={14} />
                                    <span className="hidden sm:inline">Full details</span>
                                </button> */}
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2" data-enter-nav>
                            <span id="summary-metal-label" className="sr-only">Metal</span>
                            <div className="w-40">
                                <ComboBox id="summary-metal" labelId="summary-metal-label" value={metalId}
                                    options={metalOptions}
                                    placeholder={metalsQuery.isPending ? "Loading metals…" : "All metals"}
                                    onChange={setMetalId} />
                            </div>
                            <input type="search" value={smithSearch} onChange={(e) => setSmithSearch(e.target.value)}
                                placeholder="Search smith" aria-label="Search smith"
                                className="min-w-0 flex-1 rounded-lg border border-border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                        </div>
                        <Table
                            columns={mainTableColumns}
                            loading={flags.showLoading && transactionsLoading}
                            data={summaryRows}
                            striped
                            hoverable
                            compact="auto"
                            className="w-full rounded-none border-0 shadow-none"
                            bodyClassName="border-0"
                            fixedHeight={responsive.isMobile ? "400px" : "640px"}
                            showRows={15}
                            renderFooter={() => (
                                <tfoot className="sticky bottom-0 z-10 bg-muted text-sm font-semibold">
                                    <tr>
                                        <td colSpan={2} className="border-r border-border pr-2 text-right">Total</td>
                                        <td className="border-r border-border pr-1 text-right  text-primary-text">
                                            {transactionTotals.weight.toFixed(3)}
                                        </td>
                                        <td className="pr-1 text-right text-primary-text">{formatCurrency(transactionTotals.cash)}</td>
                                    </tr>
                                </tfoot>
                            )}
                        />
                    </section>

                    <div className="flex min-w-0 flex-col gap-4 xl:col-span-9">
                        {/* Weight */}
                        <section ref={weightSectionRef} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
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
                                        <button onClick={handleAddWeightRow} disabled={hasNewWeightRow}
                                            title={hasNewWeightRow ? "Save the current weight row before adding another" : "Add a weight transaction"}
                                            className={`${actionButton} bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50`}>
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
                                    <tfoot className="sticky bottom-0 bg-emerald-50 text-sm  font-semibold text-foreground dark:bg-emerald-500/10">
                                        <tr>
                                            <td colSpan={4} className="border-r border-border pr-4 text-right">Total</td>
                                            <td className="border-r border-border text-right px-2 py-1">{formatFixed(weightTotals.grswt, 3)}</td>
                                            <td className="border-r border-border px-2"></td>
                                            {/* <td className="border-r border-border text-right px-2">{formatFixed(weightTotals.purewt, 3)}</td> */}
                                            <td className="border-r border-border text-right px-2">{weightTotals.receipts.toFixed(3)}</td>
                                            <td className="border-r border-border text-right px-2">{weightTotals.payments.toFixed(3)}</td>
                                            <td className="border-r border-border text-right px-2">{weightTotals.balance.toFixed(3)}</td>
                                            <td></td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                ) : undefined}
                            />
                        </section>

                        {/* Cash */}
                        <section ref={cashSectionRef} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
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
                                        <button onClick={handleAddCashRow} disabled={hasNewCashRow}
                                            title={hasNewCashRow ? "Save the current cash row before adding another" : "Add a cash transaction"}
                                            className={`${actionButton} bg-primary disabled:cursor-not-allowed disabled:opacity-50`}>
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
                                    <tfoot className="sticky bottom-0 bg-accent-soft text-xs font-semibold text-foreground">
                                        <tr>
                                            <td colSpan={2} className="border-r border-border pr-4 text-right">Total</td>
                                            <td className="border-r border-border text-right px-2 py-1">{formatCurrency(cashTotals.receipts)}</td>
                                            <td className="border-r border-border text-right px-2">{formatCurrency(cashTotals.payments)}</td>
                                            <td className="border-r border-border text-right px-2">{formatCurrency(cashTotals.balance)}</td>
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

            </div>

            {canAddItem && (
                <Dialog open={!!addItemFor}  onClose={() => setAddItemFor(null)} aria-labelledby="add-item-title" 
                    fullWidth maxWidth="xs" slotProps={{ paper: { sx: { backgroundColor: "var(--card)", color: "var(--foreground)" ,zIndex : 0 } } }}>
                    <DialogTitle id="add-item-title">Add item</DialogTitle>
                    {addItemFor && <ItemForm onCancel={() => setAddItemFor(null)}
                        onSaved={(item) => {
                            const row = addItemFor;
                            setAddItemFor(null);
                            editWeightEntry(row, "itemId", item.itemId);
                        }} />
                    }
                </Dialog>
            )}
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
            <SmithFormModal
                open={smithModalOpen}
                initialName={newSmithName}
                onClose={() => setSmithModalOpen(false)}
                onSaved={(saved) => {
                    setNewSmithName("");
                    if (saved.smithId) openSmith(saved.smithId, saved.pname || "");
                }}
            />
        </div>
    );
}
