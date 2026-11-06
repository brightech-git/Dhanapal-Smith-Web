"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import authService from "@/src/features/auth/api/auth.api";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/envelope";
import { getAxiosInstance, resetAxiosInstance } from "@/lib/api/client";


interface AuthContextType {
    isAuthenticated: boolean;
    allDetails: any;
    isLoading: boolean;
    login: (userName: string, password: string, projectName?: string) => Promise<any>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const queryClient = useQueryClient();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [allDetails, setAllDetails] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Restore the saved login on refresh. There is no expiry: the session lasts until
    // logout or until the browser tab is closed (sessionStorage).
    useEffect(() => {
        let cancelled = false;
        try {
            const saved = sessionStorage.getItem("authSession");
            const details = saved ? JSON.parse(saved)?.allDetails : null;
            if (details) {
                const baseUrl = window?.appConfig?.MAIN_URL;
                if (baseUrl) getAxiosInstance(baseUrl);
                setAllDetails(details);
                setIsAuthenticated(true);
                // Pick up permission changes made since login; on any error keep the saved ones.
                if (!details.isadmin && details.sno && baseUrl) {
                    api.get<any[]>(`user-roles/${details.sno}/permissions`)
                        .then((roleTran) => {
                            if (cancelled || !Array.isArray(roleTran)) return;
                            const next = { ...details, roleTran };
                            setAllDetails(next);
                            sessionStorage.setItem("authSession", JSON.stringify({ allDetails: next }));
                        })
                        .catch(() => undefined);
                }
            }
        } catch {
            sessionStorage.removeItem("authSession");
        } finally {
            setIsLoading(false);
        }
        return () => { cancelled = true; };
    }, []);

    const login = async (userName: string, password: string, projectName?: string) => {
        const response = await authService.login({ userName, password, projectName });

        // The backend decides the user's project (SMITH or GV). A caller can
        // still pass one as a fallback when the response has none.
        const details = { ...response, projectName: response?.projectName ?? projectName };

        const session = { allDetails: details };

        queryClient.clear();
        setAllDetails(details);
        setIsAuthenticated(true);

        // ✅ Initialize axios dynamically (use config base URL)
        const baseUrl = window?.appConfig?.MAIN_URL;
        if (baseUrl) getAxiosInstance(baseUrl);

        sessionStorage.setItem("authSession", JSON.stringify(session));
        return details;
    };

    const logout = () => {
        queryClient.clear();
        resetAxiosInstance();
        setIsAuthenticated(false);
        setAllDetails(null);
        sessionStorage.clear();
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, allDetails, isLoading, login, logout }}>
            {!isLoading && <React.Fragment key={allDetails?.sno ?? "anonymous"}>{children}</React.Fragment>}
        </AuthContext.Provider>
    );
};
