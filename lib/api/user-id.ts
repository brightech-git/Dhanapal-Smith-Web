// Every write request (POST, PUT, DELETE) carries the logged-in user's id in the
// userId request header, so the backend can record who made the change.

import type { AxiosInstance, InternalAxiosRequestConfig } from "axios";

const WRITE_METHODS = new Set(["post", "put", "patch", "delete"]);

/** The logged-in user's id (USERS.sno) from the saved login, or null. */
export const getCurrentUserId = (): number | null => {
    try {
        const details = JSON.parse(sessionStorage.getItem("authSession") ?? "null")?.allDetails;
        const id = details?.sno ?? details?.userId;
        return id == null || id === "" ? null : Number(id);
    } catch {
        return null;
    }
};

export function attachUserId(client: AxiosInstance) {
    client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
        if (!WRITE_METHODS.has((config.method ?? "get").toLowerCase())) return config;
        const userId = getCurrentUserId();
        if (userId != null && !Number.isNaN(userId) && !config.headers.has("userId")) {
            config.headers.set("userId", String(userId));
        }
        return config;
    });
}
