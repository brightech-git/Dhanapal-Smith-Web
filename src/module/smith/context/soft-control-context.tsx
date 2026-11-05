"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { fetchSoftControls, SoftControl } from "@/src/module/smith/api/soft-control.api";
import { readSoftControlSettings, type DashboardPosition } from "../lib/soft-control-settings";
import { useAuth } from "@/src/features/auth/lib/auth-context";

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
            // Keep the failure visible and clear stale controls.
            setSoftControls([]);
            console.warn("Soft controls unavailable:", err?.message);
            setError(err.message || "Failed to load soft controls");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            loadSoftControls();
        } else {
            setSoftControls([]);
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

export type { DashboardPosition } from "../lib/soft-control-settings";

export interface SoftControlFlags {
    /** GRANDTOTAL = Y: show ledger footers and printed totals. */
    grandTotal: boolean;
    /** SaveButton = Y: cash/weight edits are kept until the row's Save button is pressed. */
    saveButton: boolean;
    /** Dashboard = Y: show the dashboard (totals and recent transactions). */
    showDashboard: boolean;
    /** DashboardPosition = A (above) or B (below). Above is the default. */
    dashboardPosition: DashboardPosition;
    /** LOADING = Y: show loading indicators while data is fetched. */
    showLoading: boolean;
    /** Whether the SoftControl request is pending. */
    loading: boolean;
}

/** Reads the soft controls the Smith screens depend on. */
export const useSoftControlFlags = (): SoftControlFlags => {
    const { softControls, loading, error } = useSoftControls();
    return React.useMemo(() => ({
        ...readSoftControlSettings(!error && Array.isArray(softControls) ? softControls : []),
        loading,
    }), [softControls, loading, error]);
};
