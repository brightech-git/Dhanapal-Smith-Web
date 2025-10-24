"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
    isAuthenticated: boolean;
    user: string | null;
    login: (username: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [user, setUser] = useState<string | null>(null);

    useEffect(() => {
        // Check session storage on mount
        if (typeof window !== 'undefined') {
            const authToken = sessionStorage.getItem('authToken');
            const sessionExpiry = sessionStorage.getItem('sessionExpiry');
            const storedUser = sessionStorage.getItem('user');

            if (authToken && sessionExpiry) {
                const expiryTime = parseInt(sessionExpiry);
                if (Date.now() < expiryTime) {
                    setIsAuthenticated(true);
                    setUser(storedUser);
                } else {
                    // Session expired
                    sessionStorage.removeItem('authToken');
                    sessionStorage.removeItem('sessionExpiry');
                    sessionStorage.removeItem('user');
                }
            }
        }
    }, []);

    const login = (username: string) => {
        setIsAuthenticated(true);
        setUser(username);

        // Set session storage
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('authToken', 'authenticated');
            sessionStorage.setItem('user', username);
            sessionStorage.setItem('sessionExpiry', (Date.now() + 30 * 60 * 1000).toString()); // 30 minutes
        }
    };

    const logout = () => {
        setIsAuthenticated(false);
        setUser(null);

        // Clear session storage
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem('authToken');
            sessionStorage.removeItem('user');
            sessionStorage.removeItem('sessionExpiry');
        }
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};