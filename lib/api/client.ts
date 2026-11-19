import axios, { AxiosInstance } from "axios";
import { attachTranDb } from "./tran-db";

let axiosInstance: AxiosInstance | null = null;
let currentBaseUrl: string | null = null;

export const getAxiosInstance = (baseUrl?: string): AxiosInstance => {
    if (!axiosInstance || (baseUrl && baseUrl !== currentBaseUrl)) {
        // ✅ Use config.json’s MAIN_URL by default
        const configBase = window?.appConfig?.MAIN_URL;
        currentBaseUrl = baseUrl || configBase || "https://default-api.example.com/api/v1";

        const BASEURL = currentBaseUrl.trim().replace(/\/+$/, "");
        axiosInstance = axios.create({
            baseURL: BASEURL,
            withCredentials: true,
            headers: {
                "Content-Type": "application/json",
            },
        });
        // Transaction, dashboard and report requests carry the tranDb request header.
        attachTranDb(axiosInstance);

        // console.log("🔗 Axios initialized with baseURL:", BASEURL);
    }
    return axiosInstance;
};

export const resetAxiosInstance = () => {
    axiosInstance = null;
    currentBaseUrl = null;
};
