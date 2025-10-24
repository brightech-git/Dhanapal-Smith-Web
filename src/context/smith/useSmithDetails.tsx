"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { SmithDetailsService } from "@/service/smithDetailsService";
import { SmithDetails } from "@/types/smithDetails";

interface SmithDetailsContextType {
    smiths: SmithDetails[];
    loading: boolean;
    fetchAll: () => Promise<void>;
    fetchSmithById: (id: number) => Promise<SmithDetails>;
    createSmith: (details: Partial<SmithDetails>) => Promise<SmithDetails>;
    updateSmith: (details: SmithDetails) => Promise<SmithDetails>;
    deleteSmith: (id: number) => Promise<boolean>;
}

const SmithDetailsContext = createContext<SmithDetailsContextType | undefined>(undefined);

export const SmithDetailsProvider = ({ children }: { children: ReactNode }) => {
    const [smiths, setSmiths] = useState<SmithDetails[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const data = await SmithDetailsService.getAll();
            setSmiths(data);
        } catch (error) {
            throw new Error("Failed to fetch Smiths");
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchSmithById = useCallback(async (id: number) => {
        setLoading(true);
        try {
            const data = await SmithDetailsService.getById(id);
            return data;
        } catch (error) {
            throw new Error("Failed to fetch Smith");
        } finally {
            setLoading(false);
        }
    }, []);

    const createSmith = useCallback(async (details: Partial<SmithDetails>) => {
        setLoading(true);
        try {
            const created = await SmithDetailsService.create(details);
            setSmiths((prev) => [...prev, created]);
            return created;
        } catch (error) {
            throw new Error("Failed to create Smith");
        } finally {
            setLoading(false);
        }
    }, []);

    const updateSmith = useCallback(async (details: SmithDetails) => {
        setLoading(true);
        try {
            const updated = await SmithDetailsService.update(details);
            setSmiths((prev) =>
                prev.map((s) => (s.smithId === updated.smithId ? updated : s))
            );
            return updated;
        } catch (error) {
            throw new Error("Failed to update Smith");
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteSmith = useCallback(async (id: number) => {
        setLoading(true);
        try {
            const success = await SmithDetailsService.delete(id);
            if (success) {
                setSmiths((prev) => prev.filter((s) => s.smithId !== id));
            }
            return success;
        } catch (error) {
            throw new Error("Failed to delete Smith");
        } finally {
            setLoading(false);
        }
    }, []);

    return (
        <SmithDetailsContext.Provider
            value={{ smiths, loading, fetchAll, fetchSmithById, createSmith, updateSmith, deleteSmith }}
        >
            {children}
        </SmithDetailsContext.Provider>
    );
};

export const useSmithDetails = () => {
    const context = useContext(SmithDetailsContext);
    if (!context) {
        throw new Error("useSmithDetails must be used within a SmithDetailsProvider");
    }
    return context;
};
