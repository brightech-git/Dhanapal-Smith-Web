// src/context/SmithTransactionContext.tsx
"use client"
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { SmithTransaction } from "@/types/smithcreate";
import { SmithTransactionService } from "@/service/smithTransactionService";

interface SmithTransactionContextProps {
    transactions: SmithTransaction[];
    loading: boolean;
    refreshTransactions: () => void;
    createTransaction: (transaction: SmithTransaction) => Promise<SmithTransaction>;
    updateTransaction: (id: number, transaction: SmithTransaction) => Promise<SmithTransaction | null>;
    deleteTransaction: (id: number) => Promise<boolean>;
}

const SmithTransactionContext = createContext<SmithTransactionContextProps | undefined>(undefined);

export const SmithTransactionProvider = ({ children }: { children: ReactNode }) => {
    const [transactions, setTransactions] = useState<SmithTransaction[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const data = await SmithTransactionService.getAll();
            setTransactions(data);
        } finally {
            setLoading(false);
        }
    };

    const createTransaction = async (transaction: SmithTransaction) => {
        const created = await SmithTransactionService.create(transaction);
        setTransactions((prev) => [...prev, created]);
        return created;
    };

    const updateTransaction = async (id: number, transaction: SmithTransaction) => {
        const updated = await SmithTransactionService.update(id, transaction);
        if (updated) {
            setTransactions((prev) =>
                prev.map((t) => (t.smithId === id ? updated : t))
            );
        }
        return updated;
    };

    const deleteTransaction = async (id: number) => {
        const deleted = await SmithTransactionService.delete(id);
        if (deleted) {
            setTransactions((prev) => prev.filter((t) => t.smithId !== id));
        }
        return deleted;
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    return (
        <SmithTransactionContext.Provider
            value={{
                transactions,
                loading,
                refreshTransactions: fetchTransactions,
                createTransaction,
                updateTransaction,
                deleteTransaction,
            }}
        >
            {children}
        </SmithTransactionContext.Provider>
    );
};

export const useSmithTransactions = () => {
    const context = useContext(SmithTransactionContext);
    if (!context) {
        throw new Error("useSmithTransactions must be used within a SmithTransactionProvider");
    }
    return context;
};
