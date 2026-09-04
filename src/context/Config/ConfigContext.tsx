"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import LoadingAnimation from '@/assets/json/Loading.json';
import Lottie from "lottie-react";

interface ConfigType {
    MAIN_URL: string;
    COMPANY_NAME?: string;
    LOGO_URL?: string;
    COMPANYNAME?: string;
    LOGO?: string;
    LOGOBASEURL?: string;
}

declare global {
    interface Window {
        appConfig: ConfigType;
    }
}

const ConfigContext = createContext<ConfigType | null>(null);

export const useConfig = () => {
    const context = useContext(ConfigContext);
    if (!context) throw new Error("useConfig must be used within a ConfigProvider");
    return context;
};

export const ConfigProvider = ({ children }: { children: ReactNode }) => {
    const [config, setConfig] = useState<ConfigType | null>(null);

    useEffect(() => {
        const loadConfig = async () => {
            try {
                const res = await fetch(`/config.json?_=${Date.now()}`);
                const data = await res.json();
                setConfig(data);
                window.appConfig = data; // 👈 add this line
            } catch (err) {
                console.error("Failed to load config.json", err);
            }
        };
        loadConfig();
    }, []);


    if (!config) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="flex items-center justify-center h-screen">
                    <Lottie animationData={LoadingAnimation} loop={true} className="w-32 h-32" />
                </div>
            </div>
        );
    }


    return <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>;
};
