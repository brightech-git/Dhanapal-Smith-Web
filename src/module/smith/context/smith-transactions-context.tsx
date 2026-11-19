// src/context/smith/SmithTransactionContext.tsx
"use client";

import React, { createContext, useContext, useMemo, useState, useEffect, ReactNode } from "react";
import { useSoftControlFlags } from "./soft-control-context";
import {
    SmithTransaction,
    SmithTransactionDetail,
    CashFlow,
    WeightFlow,
    fetchTransactionSummary,
    summarizeSmiths,
    type TransactionSummaryRow,
    fetchSmithTransactionDetail,
    addCashFlow,
    deleteCashFlow,
    addWeightFlow,
    deleteWeightFlow,
    fetchCashFlows,
    fetchWeightFlows,
    patchCashFlow,
    patchWeightFlow,
    addTransaction,
    NewSmithTransaction,
    deleteSmithTransaction
} from "@/src/module/smith/api/smith-transactions.api";
import { useAuth } from "@/src/features/auth/lib/auth-context";
import { useQueryClient } from "@tanstack/react-query";
import { smithDashboardKeys } from "@/src/module/smith/hook/use-smith-dashboard";


interface SmithTransactionContextType {
    transactions: SmithTransaction[];
    /** Metal the summary weight is shown for ("" = all metals). */
    metalId: string;
    setMetalId: (metalId: string) => void;
    loading: boolean;
    error: string | null;
    refetch: () => void;
    /** Balances and all transactions of one smith (by smith id). */
    getDetail: (smithId: number) => Promise<SmithTransactionDetail>;
    addCash: (smithId: string, data: Partial<any>) => Promise<void>;
    updateCash: (id: number, data: Partial<any>) => Promise<void>;
    deleteCash: (id: number) => Promise<void>;
    addWeight: (smithId: string, data: Partial<any>) => Promise<void>;
    updateWeight: (id: number, data: Partial<any>) => Promise<void>;
    deleteWeight: (id: number) => Promise<void>;
    getCashFlows: (smithId: string) => Promise<CashFlow[]>;
    getWeightFlows: (smithId: string) => Promise<WeightFlow[]>;
    addTransaction: (data: NewSmithTransaction) => Promise<void>;
    deleteTransaction: (id: number) => Promise<void>;
}

const SmithTransactionContext = createContext<SmithTransactionContextType | undefined>(undefined);

export const SmithTransactionProvider = ({ children }: { children: ReactNode }) => {

    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const [summary, setSummary] = useState<TransactionSummaryRow[]>([]);
    const softControls = useSoftControlFlags();
    const [chosenMetalId, setMetalId] = useState("G");
    // WEIGHTITEM = N: weight rows have no item, so no metal either: show every row.
    const metalId = softControls.weightItems ? chosenMetalId : "";
    const transactions = useMemo(() => summarizeSmiths(summary, metalId), [summary, metalId]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const addTransactionContext = async (data: NewSmithTransaction) => {
        try {
            await addTransaction(data); // call service
            await loadTransactions(); // refresh list after POST
        } catch (err: any) {
            console.error(err);
            throw err;
        }
    };
    const queryClient = useQueryClient();

    const loadTransactions = async () => {
        // Totals and recent transactions on the dashboard follow every change.
        queryClient.invalidateQueries({ queryKey: smithDashboardKeys.all });
        setLoading(true);
        try {
            setSummary(await fetchTransactionSummary({metalId}));
            setError(null);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to fetch transactions");
        } finally {
            setLoading(false);
        }
    };

    // Always refetch after edits
    const getDetail = async (id: number) => {
        return await fetchSmithTransactionDetail(id);
    };
    const getCashFlows = async (smithId: string) => {
        return await fetchCashFlows(smithId);
    };

    const getWeightFlows = async (smithId: string) => {
        // With a metal chosen, the weight ledger shows that metal's rows only.
        return await fetchWeightFlows(smithId, metalId);
    };
    const addCash = async (smithId: string, data: Partial<any>) => {
        await addCashFlow(smithId, data);
        await loadTransactions();
    };

    const updateCash = async (id: number, data: Record<string, unknown>) => {
        // Only send the changed fields
        await patchCashFlow(id, data);
        await loadTransactions(); // Refetch after update
    };

    const deleteCash = async (id: number) => {
        await deleteCashFlow(id);
         await loadTransactions();
    };

    const addWeight = async (smithId: string, data: Partial<any>) => {
        await addWeightFlow(smithId, data);
        await loadTransactions();
    };

    const updateWeight = async (id: number, data: Record<string, unknown>) => {
       
        await patchWeightFlow(id, data);
       
        await loadTransactions();
       
    };

    const deleteWeight = async (id: number) => {
        await deleteWeightFlow(id);
        await loadTransactions();
    };

    const deleteTransaction =async(id:number)=>{
        await deleteSmithTransaction(id);
        await loadTransactions();
    }


    useEffect(() => {
        // ✅ Only run after login is complete and authenticated
        // Wait for the soft controls too: they decide whether a metal filter applies.
        if (!authLoading && isAuthenticated && !softControls.loading) {
            loadTransactions();
        }
        // Reload the summary whenever the metal changes.
    }, [isAuthenticated, authLoading, metalId, softControls.loading]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <SmithTransactionContext.Provider value={{
            transactions,
            metalId,
            setMetalId,
            loading,
            error,
            refetch: loadTransactions,
            getDetail,
            addCash,
            updateCash,
            deleteCash,
            addWeight,
            updateWeight,
            deleteWeight,
            getCashFlows,
            getWeightFlows,
            addTransaction: addTransactionContext, // ← add here
            deleteTransaction
        }}>
            {children}
        </SmithTransactionContext.Provider>
    );
};

export const useSmithTransactionsContext = () => {
    const context = useContext(SmithTransactionContext);
    if (!context) {
        throw new Error("useSmithTransactionsContext must be used within SmithTransactionProvider");
    }
    return context;
};
