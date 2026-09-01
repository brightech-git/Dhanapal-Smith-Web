"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { IntroducerService } from "@/service/introducerService";
import { Introducer } from "@/types/giftVoucher";

interface IntroducerContextType {
    introducers: Introducer[];
    activeIntroducers: Introducer[];
    loading: boolean;
    fetchAll: () => Promise<void>;
    fetchActive: () => Promise<void>;
    createIntroducer: (introducer: Partial<Introducer>) => Promise<Introducer>;
    updateIntroducer: (introducerId: number, introducer: Partial<Introducer>) => Promise<Introducer>;
    deleteIntroducer: (introducerId: number) => Promise<boolean>;
}

const IntroducerContext = createContext<IntroducerContextType | undefined>(undefined);

export const IntroducerProvider = ({ children }: { children: ReactNode }) => {
    const [introducers, setIntroducers] = useState<Introducer[]>([]);
    const [activeIntroducers, setActiveIntroducers] = useState<Introducer[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const data = await IntroducerService.getAll();
            setIntroducers(data);
        } catch (error) {
            throw new Error("Failed to fetch Introducers");
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchActive = useCallback(async () => {
        try {
            const data = await IntroducerService.getActive();
            setActiveIntroducers(data);
        } catch (error) {
            throw new Error("Failed to fetch active Introducers");
        }
    }, []);

    const createIntroducer = useCallback(async (introducer: Partial<Introducer>) => {
        setLoading(true);
        try {
            const created = await IntroducerService.create(introducer);
            setIntroducers((prev) => [...prev, created]);
            if (created.isActive) {
                setActiveIntroducers((prev) => [...prev, created]);
            }
            return created;
        } catch (error) {
            throw new Error("Failed to create Introducer");
        } finally {
            setLoading(false);
        }
    }, []);

    const updateIntroducer = useCallback(
        async (introducerId: number, introducer: Partial<Introducer>) => {
            setLoading(true);
            try {
                const updated = await IntroducerService.update(introducerId, introducer);
                setIntroducers((prev) =>
                    prev.map((i) => (i.introducerId === updated.introducerId ? updated : i))
                );
                setActiveIntroducers((prev) => {
                    const withoutUpdated = prev.filter((i) => i.introducerId !== updated.introducerId);
                    return updated.isActive ? [...withoutUpdated, updated] : withoutUpdated;
                });
                return updated;
            } catch (error) {
                throw new Error("Failed to update Introducer");
            } finally {
                setLoading(false);
            }
        },
        []
    );

    const deleteIntroducer = useCallback(async (introducerId: number) => {
        setLoading(true);
        try {
            const success = await IntroducerService.delete(introducerId);
            if (success) {
                setIntroducers((prev) => prev.filter((i) => i.introducerId !== introducerId));
                setActiveIntroducers((prev) => prev.filter((i) => i.introducerId !== introducerId));
            }
            return success;
        } catch (error) {
            throw new Error("Failed to delete Introducer");
        } finally {
            setLoading(false);
        }
    }, []);

    return (
        <IntroducerContext.Provider
            value={{
                introducers,
                activeIntroducers,
                loading,
                fetchAll,
                fetchActive,
                createIntroducer,
                updateIntroducer,
                deleteIntroducer,
            }}
        >
            {children}
        </IntroducerContext.Provider>
    );
};

export const useIntroducers = () => {
    const context = useContext(IntroducerContext);
    if (!context) {
        throw new Error("useIntroducers must be used within an IntroducerProvider");
    }
    return context;
};
