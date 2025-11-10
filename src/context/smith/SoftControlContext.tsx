"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { fetchSoftControls, SoftControl } from "@/service/softControlService";
import { useAuth } from "../auth/AuthContext";

interface SoftControlContextProps {
    softControls: SoftControl[];
    loading: boolean;
    error: string | null;
    refreshSoftControls: () => Promise<void>;
}

const SoftControlContext = createContext<SoftControlContextProps | undefined>(undefined);

export const useSoftControls = () => {
    const context = useContext(SoftControlContext);
    if (!context) {
        throw new Error("useSoftControls must be used within a SoftControlProvider");
    }
    return context;
};

interface SoftControlProviderProps {
    children: ReactNode;
}

export const SoftControlProvider: React.FC<SoftControlProviderProps> = ({  children }) => {
    const { isAuthenticated ,isLoading: authLoading} = useAuth();
    const [softControls, setSoftControls] = useState<SoftControl[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const loadSoftControls = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchSoftControls();
            setSoftControls(data);
        } catch (err: any) {
            console.error("Error fetching soft controls:", err);
            setError(err.message || "Failed to load soft controls");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            loadSoftControls();
        }
    }, [isAuthenticated, authLoading]);

    return (
        <SoftControlContext.Provider
            value={{
                softControls,
                loading,
                error,
                refreshSoftControls: loadSoftControls,
            }}
        >
            {children}
        </SoftControlContext.Provider>
    );
};
