import { CreateUser } from "@/src/module/user/type/create-user.types";
import { api } from "@/lib/api/envelope";

/** Backend USERMASTER record (password is never returned). */
interface UserApi {
    sno: number;
    username: string;
    active: string;
    isadmin: boolean;
    parentuserid: number | null;
    updateddate?: string;
}

/** Shape the user screens use. */
export interface AppUserRow {
    sno: number;
    userName: string;
    password: string;
    active: "Y" | "N";
    admin: boolean;
    parentUserId: number | null;
}

const fromApi = (u: UserApi): AppUserRow => ({
    sno: u.sno,
    userName: u.username,
    password: "",
    active: u.active === "N" ? "N" : "Y",
    admin: !!u.isadmin,
    parentUserId: u.parentuserid ?? null,
});

export const CreateUserService = async (user: CreateUser) =>
    fromApi(
        await api.post<UserApi>("users", {
            username: user.username.trim(),
            password: user.password,
            active: "Y",
            isadmin: false,
            parentuserid: user.parentUserId ?? null,
        })
    );

export const getAllUsers = async (): Promise<AppUserRow[]> => ((await api.get<UserApi[]>("users")) ?? []).map(fromApi);

export const getUserById = async (id: number): Promise<AppUserRow> => fromApi(await api.get<UserApi>(`users/${id}`));

/**
 * PUT replaces the record, so the current admin flag and parent are sent
 * back unchanged. An empty password keeps the existing one.
 */
export const updateUser = async (sno: number, username: string, password: string, active: number | string) => {
    const current = await api.get<UserApi>(`users/${sno}`);
    return fromApi(
        await api.put<UserApi>(`users/${sno}`, {
            username: (username || current.username).trim(),
            ...(password ? { password } : {}),
            active: active === "N" ? "N" : "Y",
            isadmin: !!current.isadmin,
            parentuserid: current.parentuserid ?? null,
        })
    );
};

export const deleteUser = async (id: number) => api.delete(`users/${id}`);
