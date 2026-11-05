"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { fetchSoftControls, SoftControl } from "@/src/module/smith/api/soft-control.api";
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

/** Normalises a soft control description so "Save Button", "save_button" and "SaveButton" match. */
const normalise = (s: string | undefined | null) => (s ?? "").toLowerCase().replace(/[\s_-]+/g, "");

export type DashboardPosition = "above" | "below";

export interface SoftControlFlags {
    /** GrandTotal = Y: show totals on printed tables. */
    grandTotal: boolean;
    /** Delete = Y: show the delete button on cash/weight rows. */
    rowDelete: boolean;
    /** SaveButton = Y: cash/weight edits are kept until the row's Save button is pressed. */
    saveButton: boolean;
    /** Dashboard = Y: show the dashboard (totals and recent transactions). */
    showDashboard: boolean;
    /** DashboardPosition = A (above) or B (below). Above is the default. */
    dashboardPosition: DashboardPosition;
    loading: boolean;
}

/** Reads the soft controls the Smith screens depend on. */
export const useSoftControlFlags = (): SoftControlFlags => {
    const { softControls, loading } = useSoftControls();
    return React.useMemo(() => {
        const list = Array.isArray(softControls) ? softControls : [];
        const value = (...names: string[]) => {
            const wanted = names.map(normalise);
            const hit = list.find((sc) => wanted.includes(normalise(sc.description)));
            return (hit?.ctlid ?? "").toString().trim().toUpperCase();
        };
        const position = value("DashboardPosition", "DashboardPlace");
        return {
            grandTotal: value("GrandTotal") === "Y",
            rowDelete: value("Delete") === "Y",
            saveButton: value("SaveButton", "Save") === "Y",
            showDashboard: value("Dashboard", "ShowDashboard") === "Y",
            dashboardPosition: position === "B" || position === "BELOW" ? "below" : "above",
            loading,
        };
    }, [softControls, loading]);
};
