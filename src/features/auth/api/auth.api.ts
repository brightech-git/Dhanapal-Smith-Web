import axios from "axios";
import type { ApiEnvelope } from "@/lib/api/envelope";
import { getApiErrorMessage } from "@/lib/api/envelope";

export interface AuthRequest {
    userName: string;
    password: string;
    projectName?: string;
}

/** A role permission row (ROLETRAN) as returned with the login profile. */
export interface LoginPermission {
    roleTranId: { roleId: number; menuId: string };
    add?: string; edit?: string; view?: string; del?: string;
    excel?: string; print?: string; authorize?: string;
    systemId?: string | null; userId?: number | null; viewDays?: number | null; updateTime?: string | null;
}

/** POST /users/login → data (password-free profile plus role permissions). */
export interface LoginResponse {
    sno: number;
    active: string;
    isadmin: boolean;
    parentuserid: number | null;
    updateddate: string;
    username: string;
    roleId: number | null;
    roleTran: LoginPermission[];
}

const authService = {
    login: async ({ userName, password, projectName }: AuthRequest) => {
        const MAIN_URL = window?.appConfig?.MAIN_URL;
        if (!MAIN_URL) throw new Error("MAIN_URL not loaded from config.json");
        try {
            const { data } = await axios.post<ApiEnvelope<LoginResponse>>(`${MAIN_URL.replace(/\/$/, "")}/users/login`, {
                username: userName,
                password,
            }, { withCredentials: true });
            if (!data?.success) throw new Error(data?.message || "Login failed");
            const p = data.data;
            // Keep the field names the rest of the app already reads (userName, admin, projectName).
            return {
                ...p,
                userName: p.username,
                admin: !!p.isadmin,
                projectName: projectName ?? "SMITH",
            };
        } catch (error) {
            throw new Error(getApiErrorMessage(error, "Login failed"));
        }
    },
};

export default authService;
