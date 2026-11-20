"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import { Check, Loader2, Save } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/src/theme/theme-context";
import { useToast } from "@/src/providers/toast-provider";
import { useAuth } from "@/src/features/auth/lib/auth-context";
import { canMenuAction, canViewMenu } from "@/src/features/auth/lib/access";
import { api, getApiErrorMessage, toApiDate } from "@/lib/api/envelope";
import { activateCell } from "@/src/components/ui/cell-navigation";
import { metalQueryKey, type Metal } from "@/src/module/metal/metal-form";
import { fetchItems, type Item, itemQueryKey } from "@/src/module/item/item-form";
import { useSmithTransactionsContext } from "@/src/module/smith/context/smith-transactions-context";
import { useSmithDetails } from "@/src/module/smith/context/smith-details-context";
import { useSoftControlFlags } from "@/src/module/smith/context/soft-control-context";
import type { FlowFilter } from "@/src/module/smith/api/smith-transactions.api";
import type { FlowKind } from "@/src/module/smith/type/smith-dashboard.types";
import { validateTransactionValues } from "../../lib/transaction-validation";
import { ledgerFromPureWeight, pureWeight, sumWeights } from "../../lib/weight-calc";
import { todayLedgerFilter, type LedgerFilter } from "./ledger-utils";

/**
 * State and actions of the smith transactions screen: the smith list, the open
 * smith's weight and cash rows, ledger filters, saving, cancelling and export target.
 * The panels read everything from the object this returns.
 */
export function useSmithLedger() {
    const { allDetails } = useAuth();
    const { responsive } = useTheme();
    const { addToast } = useToast();
    const { createSmith, smiths: allSmiths } = useSmithDetails();
    const flags = useSoftControlFlags();
    const showTotal = flags.grandTotal;
    const showDelete = canViewMenu(allDetails, "transactions") && canMenuAction(allDetails, "transactions", "del");

    const saveMode = flags.saveButton;
    const [attachTarget, setAttachTarget] = useState<{ kind: FlowKind; row: any } | null>(null);
    const canAddItem = canMenuAction(allDetails, "items", "add");
    // The weight row waiting for an item from the "Add new" item dialog.
    const [addItemFor, setAddItemFor] = useState<any>(null);
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
        cancelFlow,
        addTransaction,
        metalId,
        setMetalId,
    } = useSmithTransactionsContext();

    // Active items of the metal chosen in the summary header (all metals when none).
    // The key starts with itemQueryKey, so saving an item refreshes this list too.
    const itemsQuery = useQuery({
        queryKey: [...itemQueryKey, { active: "Y", metalId }],
        queryFn: () => fetchItems({ active: "Y", metalId: metalId || undefined }),
        enabled: flags.weightItems, // items are only used when WEIGHTITEM = Y
    });

    const itemOptions = useMemo(
        () => (itemsQuery.data?.items ?? []).map((item: Item) => ({ value: String(item.itemId), label: item.itemName })),
        [itemsQuery.data]
    );
    // Soft control WEIGHTITEM = Y shows Type, Item, Grs Wt and Touch on weight rows.
    // Otherwise the weight table works like the cash one (receipts and payments typed in).
    const noItems = !flags.weightItems;
    const ITEM_COLUMNS = ["tranType", "itemId", "grswt", "touch"];
    const withoutItemColumns = <T extends { key: string }>(columns: T[]) =>
        noItems ? columns.filter((column) => !ITEM_COLUMNS.includes(column.key)) : columns;
    const itemNameOf = (row: any) =>
        row?.itemName || itemOptions?.find((option:{value: string; label: string }) => option.value === String(row?.itemId ?? ""))?.label || "";

    // Summary header: metal for the weight balance, and a smith name search.
    const metalsQuery = useQuery({ queryKey: metalQueryKey, queryFn: () => api.get<Metal[]>("metal") });
    const metalOptions = useMemo(
      //  () => [{ value: "", label: "ALL METALS" }, ...(metalsQuery.data ?? []).map((m) => ({ value: m.metalId, label: `${m.metalId} · ${m.metalName}` }))],
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
    const [ledgerDraft, setLedgerDraft] = useState<LedgerFilter>(todayLedgerFilter);
    const [ledgerApplied, setLedgerApplied] = useState<LedgerFilter>(todayLedgerFilter);
    // The refetch helpers read the applied filter from here, so they never see a stale one.
    const ledgerFilter = useRef<LedgerFilter>(todayLedgerFilter());
    // "Add new" buttons, so Esc on a new row can hand focus back to them.
    const weightAddRef = useRef<HTMLButtonElement>(null);
    const cashAddRef = useRef<HTMLButtonElement>(null);
    const [exportTarget, setExportTarget] = useState<"" | "smiths" | "weight" | "cash">("");
    const flowFilter = (): FlowFilter => {
        const f = ledgerFilter.current;
        return { fromDate: f.fromDate || undefined, toDate: f.toDate || undefined, itemId: f.itemId || undefined, search: f.search.trim() || undefined };
    };
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
        // Cancelled rows are shown but never counted.
        const live = weightBalanceData.filter((row) => !row.cancelled);
        const receipts = sumWeights(live.map((row) => row.receipts || 0));
        const payments = sumWeights(live.map((row) => row.payments || 0));
        const balance = sumWeights([receipts, -payments]);
        const grswt = sumWeights(live.map((row) => row.grswt || 0));
        const purewt = sumWeights(live.map((row) => row.purewt || 0));
        return { receipts, payments, balance, grswt, purewt };
    }, [weightBalanceData]);

    // Totals for cash table
    const cashTotals = useMemo(() => {
        const live = cashBalanceData.filter((row) => !row.cancelled);
        const receipts = live.reduce((sum, row) => sum + (row.receipts || 0), 0);
        const payments = live.reduce((sum, row) => sum + (row.payments || 0), 0);
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

    const refetchWeightFlows = async (smithId: string, continueEntry = false) => {
        try {
            const data = await getWeightFlows(smithId, flowFilter());
            console.log(data ,"weightflow")
            if (shownSmith.current && shownSmith.current !== smithId) return;
            // Oldest first, like a bank statement (the API already sorts by date). The type filter is applied here.
            const types = ledgerFilter.current.types;
            const rows = (data || []).filter((row: any) => !types.length || types.includes(row.tranType));
            setWeightBalanceData(continueEntry ? [...rows, newEntry("weight", smithId)] : rows);
            if (continueEntry) focusNewRow(weightSectionRef, rows.length);
        } catch (error) {
            addToast({
                type: 'error',
                title: 'Error',
                message: 'Failed to fetch weight data'
            });
        }
    };

    const refetchCashFlows = async (smithId: string, continueEntry = false) => {
        try {
            const data = await getCashFlows(smithId, flowFilter());
            if (shownSmith.current && shownSmith.current !== smithId) return;
            const rows = [...(data || [])];
            setCashBalanceData(continueEntry ? [...rows, newEntry("cash", smithId)] : rows);
            if (continueEntry) focusNewRow(cashSectionRef, rows.length);
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

    /** Applies the ledger filters to the open smith's weight and cash rows. */
    const applyLedgerFilter = (next: LedgerFilter) => {
        if (next.fromDate && next.toDate && next.fromDate > next.toDate) {
            addToast({ type: "warning", title: "Check the dates", message: "From date must be on or before the to date." });
            return;
        }
        ledgerFilter.current = next;
        setLedgerApplied(next);
        if (selectedSmithId) {
            refetchWeightFlows(selectedSmithId);
            refetchCashFlows(selectedSmithId);
        }
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

    const newEntry = (kind: FlowKind, smithId: string) => ({
        id: null,
        smithId,
        date: toApiDate(new Date()),
        receipts: 0,
        payments: 0,
        balance: 0,
        isNew: true,
        ...(kind === "weight" ? {
            weightDifference: 0,
            tranType: "R",
            itemId: null,
            grswt: null,
            touch: null,
            purewt: null,
        } : {}),
    });

    /** Scrolls to the new row (always the last one) and opens its Date cell. */
    // Opens the Date cell of the new row. The section also holds a
    // hidden print table, so look for the tbody that has editable cells, and
    // retry a few times until the new row has rendered.
    const focusNewRow = (section: React.RefObject<HTMLElement | null>, row: number, cell = 0, tries = 10) =>
        setTimeout(() => {
            // The print table (hidden) uses the same cells, so only take visible ones.
            const shown = (el: Element) => (el as HTMLElement).offsetWidth > 0 || (el as HTMLElement).offsetHeight > 0;
            const body = Array.from(section.current?.querySelectorAll("tbody") ?? [])
                .find((tbody) => Array.from(tbody.querySelectorAll("[data-cell-nav]")).some(shown));
            const target = body?.children[row];
            if (!body || !target || Array.from(target.querySelectorAll("[data-cell-nav]")).filter(shown).length <= cell) {
                if (tries > 0) focusNewRow(section, row, cell, tries - 1);
                return;
            }
            const table = body.closest("table");
            const scroller = table?.parentElement;
            if (scroller) {
                const footerHeight = table?.querySelector("tfoot")?.getBoundingClientRect().height ?? 0;
                scroller.style.scrollPaddingBottom = `${footerHeight + 12}px`;
            }
            const revealRow = () => {
                if (target.isConnected) target.scrollIntoView({ block: "end", inline: "nearest" });
            };
            revealRow();
            activateCell({ body, row, cell });
            requestAnimationFrame(revealRow);
        }, 50);

    const handleAddWeightRow = () => {
        if (hasNewWeightRow) {
            focusNewRow(weightSectionRef, weightBalanceData.findIndex((row) => row.isNew));
            return;
        }
        if (!selectedSmithId) {
            addToast({
                type: 'warning',
                title: 'Selection Required',
                message: 'Please select a Smith first.'
            });
            return;
        }

        const newRow = newEntry("weight", selectedSmithId);

        setWeightBalanceData(prev => prev.some((row) => row.isNew) ? prev : [...prev, newRow]);
        focusNewRow(weightSectionRef, weightBalanceData.length);
        addToast({
            type: 'info',
            title: 'New Row Added',
            message: 'New weight row added. Fill in the details and save.'
        });
    };

    const handleAddCashRow = () => {
        if (hasNewCashRow) {
            focusNewRow(cashSectionRef, cashBalanceData.findIndex((row) => row.isNew));
            return;
        }
        if (!selectedSmithId) {
            addToast({
                type: 'warning',
                title: 'Selection Required',
                message: 'Please select a Smith first.'
            });
            return;
        }

        const newRow = newEntry("cash", selectedSmithId);

        setCashBalanceData(prev => prev.some((row) => row.isNew) ? prev : [...prev, newRow]);
        focusNewRow(cashSectionRef, cashBalanceData.length);
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
            await refetchWeightFlows(selectedSmithId, !row.id);
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
            await refetchCashFlows(selectedSmithId, !row.id);
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
        if (row?.cancelled) {
            addToast({ type: 'warning', title: 'Cancelled', message: 'A cancelled transaction cannot be changed.' });
            return;
        }
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
                if (kind === "weight") await refetchWeightFlows(selectedSmithId, !row.id);
                else await refetchCashFlows(selectedSmithId, !row.id);
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
        label: "SAVE",
        headalign: "center" as const,
        align: "center" as const,
        width: "60px",
        render: (_v: any, row: any) => {
            const dirty = isDirty(row);
            const busy = savingRow === row;
            return (
                <button
                    type="button"
                    data-cell-nav
                    data-shortcut="save"
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



    /** Esc inside a table: drop its unsaved new row and focus that table's "Add new" button. */
    const handleLedgerEscape = (kind: "weight" | "cash") => (e: React.KeyboardEvent<HTMLElement>) => {
        // The date cell's calendar marks Esc as handled, so defaultPrevented is not checked here.
        // An open combobox list or dialog stops Esc before it reaches the table.
        if (e.key !== "Escape") return;
        // Ignore keys from dialogs rendered in a portal (they bubble through React, not the DOM).
        if (!e.currentTarget.contains(e.target as Node)) return;
        const rows = kind === "weight" ? weightBalanceData : cashBalanceData;
        if (!rows.some((row) => row.isNew)) return;
        e.preventDefault();
        e.stopPropagation();
        (kind === "weight" ? setWeightBalanceData : setCashBalanceData)((prev) => prev.filter((row) => !row.isNew));
        const button = kind === "weight" ? weightAddRef : cashAddRef;
        requestAnimationFrame(() => button.current?.focus());
    };

    const handleDeleteCashRow = async (target: any) => {
        // A row that was never saved only lives here: drop it without calling the API.
        if (target?.isNew || target?.id == null) {
            setCashBalanceData(prev => prev.filter(row => row !== target && !(row.isNew && target?.isNew)));
            return;
        }
        const rowId: number = target.id;
        if (!showDelete || !selectedSmithId || target.cancelled) return;
        // Saved rows are cancelled, not deleted: they stay in the list (red) and stop counting.
        if (!window.confirm("Cancel this transaction? It stays in the list but is left out of the balance.")) return;
        try {
            await cancelFlow(rowId);
            await refetchCashFlows(selectedSmithId);
            addToast({ type: 'success', title: 'Cancelled', message: 'The transaction is cancelled and no longer counted.' });
        } catch (error) {
            addToast({ type: 'error', title: 'Cancel failed', message: getApiErrorMessage(error, 'Could not cancel the transaction.') });
        }
    };


    const handleDeleteWeightRow = async (target: any) => {
        // A row that was never saved only lives here: drop it without calling the API.
        if (target?.isNew || target?.id == null) {
            setWeightBalanceData(prev => prev.filter(row => row !== target && !(row.isNew && target?.isNew)));
            return;
        }
        const rowId: number = target.id;
        if (!showDelete || !selectedSmithId || target.cancelled) return;
        // Saved rows are cancelled, not deleted: they stay in the list (red) and stop counting.
        if (!window.confirm("Cancel this transaction? It stays in the list but is left out of the balance.")) return;
        try {
            await cancelFlow(rowId);
            await refetchWeightFlows(selectedSmithId);
            addToast({ type: 'success', title: 'Cancelled', message: 'The transaction is cancelled and no longer counted.' });
        } catch (error) {
            addToast({ type: 'error', title: 'Cancel failed', message: getApiErrorMessage(error, 'Could not cancel the transaction.') });
        }
    };

    return {
        allDetails, responsive, addToast, flags, showTotal, showDelete, saveMode,
        attachTarget, setAttachTarget, canAddItem, addItemFor, setAddItemFor,
        weightSectionRef, cashSectionRef, weightAddRef, cashAddRef, handleLedgerEscape,
        transactions, transactionsLoading, metalId, setMetalId,
        itemsQuery, itemOptions, noItems, withoutItemColumns, itemNameOf,
        metalsQuery, metalOptions, smithSearch, setSmithSearch, summaryRows,
        weightBalanceData, setWeightBalanceData, cashBalanceData, setCashBalanceData,
        selectedSmithId, selectedSmithName,
        ledgerDraft, setLedgerDraft, ledgerApplied, applyLedgerFilter, exportTarget, setExportTarget,
        isCreatingSmith, smithModalOpen, setSmithModalOpen, newSmithName, setNewSmithName, handleCreateSmith,
        transactionTotals, weightTotals, cashTotals,
        openSmith, refetchWeightFlows, refetchCashFlows,
        hasNewWeightRow, hasNewCashRow, handleAddWeightRow, handleAddCashRow,
        handleWeightDoubleClick, handleCashDoubleClick, handleSmithSelect,
        editWeightEntry, onEdit, savingRow, saveColumn, commitAll, weightDirtyCount, cashDirtyCount,
        handleDeleteCashRow, handleDeleteWeightRow,
    };
}

export type SmithLedger = ReturnType<typeof useSmithLedger>;
