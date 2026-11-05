import axios, { AxiosInstance } from "axios";

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
            headers: {
                "Content-Type": "application/json",
            },
        });

        // console.log("🔗 Axios initialized with baseURL:", BASEURL);
    }
    return axiosInstance;
};

export const resetAxiosInstance = () => {
    axiosInstance = null;
    currentBaseUrl = null;
};
