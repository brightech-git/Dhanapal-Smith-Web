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

    // Validate the server session and refresh assignments by the authenticated user ID.
    useEffect(() => {
        let cancelled = false;
        const restore = async () => {
            try {
                const saved = sessionStorage.getItem("authSession");
                if (!saved) return;
                const parsed = JSON.parse(saved);
                if (Date.now() >= parsed.expiry) throw new Error("Session expired");
                const profile = await api.get<any>("users/me");
                if (cancelled) return;
                const details = { ...profile, userName: profile.username, admin: !!profile.isadmin,
                    projectName: parsed.allDetails?.projectName ?? "SMITH" };
                setAllDetails(details);
                setIsAuthenticated(true);
            } catch {
                sessionStorage.removeItem("authSession");
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };
        void restore();
        return () => { cancelled = true; };
    }, []);

    const login = async (userName: string, password: string, projectName?: string) => {
        const response = await authService.login({ userName, password, projectName });

        // The backend decides the user's project (SMITH or GV). A caller can
        // still pass one as a fallback when the response has none.
        const details = { ...response, projectName: response?.projectName ?? projectName };

        const session = {
            expiry: Date.now() + 30 * 60 * 1000, // 30 min
            allDetails: details,
        };

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
        void api.post("users/logout").catch(() => undefined);
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
