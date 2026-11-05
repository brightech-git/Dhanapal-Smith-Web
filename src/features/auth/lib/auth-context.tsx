"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import authService from "@/src/features/auth/api/auth.api";
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
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [allDetails, setAllDetails] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Restore session
    useEffect(() => {
        const savedSession = sessionStorage.getItem("authSession");
        if (savedSession) {
            const parsed = JSON.parse(savedSession);
            if (Date.now() < parsed.expiry) {
                setIsAuthenticated(true);
                setAllDetails(parsed.allDetails);

                // ✅ Initialize axios using base URL from config.json
                const baseUrl = window?.appConfig?.MAIN_URL;
                if (baseUrl) getAxiosInstance(baseUrl);
            } else {
                sessionStorage.clear();
            }
        }
        setIsLoading(false);
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

        setAllDetails(details);
        setIsAuthenticated(true);

        // ✅ Initialize axios dynamically (use config base URL)
        const baseUrl = window?.appConfig?.MAIN_URL;
        if (baseUrl) getAxiosInstance(baseUrl);

        sessionStorage.setItem("authSession", JSON.stringify(session));
        return details;
    };

    const logout = () => {
        resetAxiosInstance();
        setIsAuthenticated(false);
        setAllDetails(null);
        sessionStorage.clear();
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, allDetails, isLoading, login, logout }}>
            {!isLoading && children}
        </AuthContext.Provider>
    );
};
