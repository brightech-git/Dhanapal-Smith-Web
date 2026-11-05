import { getAxiosInstance } from "@/lib/api/client";
import type { AppUser, RoleMaster, RoleMasterInput, RoleTran, UserRole } from "../type/role.types";

/** The role endpoints wrap results as { success, message, data }. */
interface ApiEnvelope<T> {
    success: boolean;
    message: string;
    data: T;
}

const unwrap = <T,>(body: ApiEnvelope<T>): T => {
    if (body && body.success === false) throw new Error(body.message || "Request failed");
    return body?.data;
};

/** Reads the backend's message from a failed request. */
export const getApiErrorMessage = (error: unknown, fallback = "Something went wrong") => {
    const e = error as { response?: { data?: { message?: string } | string }; message?: string };
    const data = e?.response?.data;
    if (typeof data === "string" && data) return data;
    if (data && typeof data === "object" && data.message) return data.message;
    return e?.message || fallback;
};

const api = () => getAxiosInstance();

// ---- Role master: /rolemaster
export const fetchRoles = async (): Promise<RoleMaster[]> =>
    unwrap((await api().get<ApiEnvelope<RoleMaster[]>>("rolemaster")).data) ?? [];

export const createRole = async (input: RoleMasterInput): Promise<RoleMaster> =>
    unwrap((await api().post<ApiEnvelope<RoleMaster>>("rolemaster", input)).data);

export const updateRole = async (roleId: number, input: RoleMasterInput): Promise<RoleMaster> =>
    unwrap((await api().put<ApiEnvelope<RoleMaster>>(`rolemaster/${roleId}`, input)).data);

export const deleteRole = async (roleId: number): Promise<void> => {
    unwrap((await api().delete<ApiEnvelope<null>>(`rolemaster/${roleId}`)).data);
};

// ---- Role permissions: /roletran
export const fetchRoleTran = async (roleId: number): Promise<RoleTran[]> =>
    unwrap((await api().get<ApiEnvelope<RoleTran[]>>(`roletran/${roleId}`)).data) ?? [];

/** Replaces every permission row of the role with the given list. */
export const saveRoleTran = async (roleId: number, rows: RoleTran[]): Promise<RoleTran[]> =>
    unwrap((await api().put<ApiEnvelope<RoleTran[]>>(`roletran/${roleId}`, rows)).data) ?? [];

export const deleteRoleTran = async (roleId: number): Promise<void> => {
    unwrap((await api().delete<ApiEnvelope<null>>(`roletran/${roleId}`)).data);
};

// ---- User roles: /userrole
export const fetchUserRoles = async (): Promise<UserRole[]> =>
    unwrap((await api().get<ApiEnvelope<UserRole[]>>("userrole")).data) ?? [];

export const createUserRole = async (userId: number, roleId: number): Promise<UserRole> =>
    unwrap((await api().post<ApiEnvelope<UserRole>>("userrole", { userId, roleId })).data);

export const updateUserRole = async (userId: number, roleId: number): Promise<UserRole> =>
    unwrap((await api().put<ApiEnvelope<UserRole>>(`userrole/${roleId}/${userId}`)).data);

export const deleteUserRole = async (userId: number): Promise<void> => {
    unwrap((await api().delete<ApiEnvelope<null>>(`userrole/${userId}`)).data);
};

/** Menu permissions of the user's role (used to gate menus). */
export const fetchUserPermissions = async (userId: number): Promise<RoleTran[]> =>
    unwrap((await api().get<ApiEnvelope<RoleTran[]>>(`userrole/paths/${userId}`)).data) ?? [];

// ---- Users: /users/all
export const fetchUsers = async (): Promise<AppUser[]> => (await api().get<AppUser[]>("users/all")).data ?? [];
