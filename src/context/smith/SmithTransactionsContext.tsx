// src/context/smith/SmithTransactionContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
    SmithTransaction,
    SmithTransactionDetail,
    CashFlow,
    WeightFlow,
    fetchSmithTransactions,
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
} from "@/service/smithTransactionsService";

interface SmithTransactionContextType {
    transactions: SmithTransaction[];
    loading: boolean;
    error: string | null;
    refetch: () => void;
    getDetail: (id: number) => Promise<SmithTransactionDetail>;
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
    const [transactions, setTransactions] = useState<SmithTransaction[]>([]);
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
    const loadTransactions = async () => {
        setLoading(true);
        try {
            const data = await fetchSmithTransactions();
            setTransactions(data);
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
        return await fetchWeightFlows(smithId);
    };
    const addCash = async (smithId: string, data: Partial<any>) => {
        await addCashFlow(smithId, data);
        await loadTransactions();
    };

    const updateCash = async (id: number, data: Partial<CashFlow>) => {
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

    const updateWeight = async (id: number, data: Partial<WeightFlow>) => {
        console.time("Update Transaction");
        await patchWeightFlow(id, data);
        console.timeEnd("Update Transaction");
        console.time("Refetch Transactions");
        await loadTransactions();
        console.timeEnd("Refetch Transactions");
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
        loadTransactions();
    }, []);

    return (
        <SmithTransactionContext.Provider value={{
            transactions,
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
