import { getAxiosInstance } from "@/lib/api/client";

/** Every /api/v1 response is { success, message, data }. */
export interface ApiEnvelope<T> {
    success: boolean;
    message: string;
    data: T;
}

export const unwrap = <T,>(body: ApiEnvelope<T>): T => {
    if (body && body.success === false) throw new Error(body.message || "Request failed");
    return body?.data;
};

/** Reads the backend's message from a failed request. */
export const getApiErrorMessage = (error: unknown, fallback = "Something went wrong") => {
    const e = error as { response?: { data?: { message?: string } | string }; message?: string };
    const data = e?.response?.data;
    if (typeof data === "string" && data && !data.startsWith("<")) return data;
    if (data && typeof data === "object" && data.message) return data.message;
    return e?.message || fallback;
};

/** Thin typed wrappers that unwrap the envelope. */
export const api = {
    get: async <T,>(url: string, params?: Record<string, unknown>) =>
        unwrap((await getAxiosInstance().get<ApiEnvelope<T>>(url, { params })).data),
    post: async <T,>(url: string, body?: unknown) => unwrap((await getAxiosInstance().post<ApiEnvelope<T>>(url, body)).data),
    put: async <T,>(url: string, body?: unknown) => unwrap((await getAxiosInstance().put<ApiEnvelope<T>>(url, body)).data),
    delete: async (url: string) => {
        unwrap((await getAxiosInstance().delete<ApiEnvelope<null>>(url)).data);
    },
};

/**
 * Media URLs come back as "/uploads/<file>", served from the server root
 * (not under /api/v1), so resolve them against the API origin.
 */
export const resolveMediaUrl = (url: string | null | undefined) => {
    if (!url) return "";
    if (/^(https?:|data:|blob:)/i.test(url)) return url;
    try {
        const base = getAxiosInstance().defaults.baseURL || window.location.origin;
        return new URL(url, new URL(base, window.location.origin).origin).toString();
    } catch {
        return url;
    }
};

/** "YYYY-MM-DD" from a Date, "DD-MM-YYYY", "DD/MM/YYYY" or ISO string. */
export const toApiDate = (value: string | Date | null | undefined): string => {
    if (!value) return "";
    if (value instanceof Date) {
        const y = value.getFullYear(), m = String(value.getMonth() + 1).padStart(2, "0"), d = String(value.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    }
    const s = value.trim();
    const dmy = s.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
    if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
    const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
    const d = new Date(s);
    return isNaN(d.getTime()) ? s : toApiDate(d);
};
