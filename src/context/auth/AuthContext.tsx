"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import authService from "@/service/authService";

interface AuthContextType {
    isAuthenticated: boolean;
    user: string | null;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // ✅ Check session storage when app loads
    useEffect(() => {
        if (typeof window !== "undefined") {
            const token = sessionStorage.getItem("authToken");
            const expiry = sessionStorage.getItem("sessionExpiry");
            const storedUser = sessionStorage.getItem("user");

            if (token && expiry && Date.now() < parseInt(expiry)) {
                setIsAuthenticated(true);
                setUser(storedUser);
            } else {
                sessionStorage.clear();
            }
        }
        setIsLoading(false);
    }, []);

    // ✅ Login with backend
    const login = async (username: string, password: string) => {
        try {
            const response = await authService.login({ userName: username, password });

            // If backend sends token, save it
            const token = "authenticated"; // replace with response.token if your API returns one

            setIsAuthenticated(true);
            setUser(response.userName);

            // Save session info
            sessionStorage.setItem("authToken", token);
            sessionStorage.setItem("user", response.userName);
            sessionStorage.setItem("sessionExpiry", (Date.now() + 30 * 60 * 1000).toString());
        } catch (error: any) {
            throw new Error(error.message || "Login failed");
        }
    };

    // ✅ Logout clears everything
    const logout = () => {
        setIsAuthenticated(false);
        setUser(null);
        sessionStorage.clear();
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
