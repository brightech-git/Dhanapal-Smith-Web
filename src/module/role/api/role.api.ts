import { api } from "@/lib/api/envelope";
import type { AppUser, RoleMaster, RoleMasterInput, RoleTran, UserRole } from "../type/role.types";

export { getApiErrorMessage } from "@/lib/api/envelope";

// ---- Roles: /roles (the server assigns roleId on create)
export const fetchRoles = async (): Promise<RoleMaster[]> => (await api.get<RoleMaster[]>("roles")) ?? [];

export const createRole = async (input: RoleMasterInput): Promise<RoleMaster> =>
    api.post<RoleMaster>("roles", { roleName: input.roleName, active: input.active, adminAccess: input.adminAccess });

export const updateRole = async (roleId: number, input: RoleMasterInput): Promise<RoleMaster> =>
    api.put<RoleMaster>(`roles/${roleId}`, { roleName: input.roleName, active: input.active, adminAccess: input.adminAccess });

export const deleteRole = async (roleId: number): Promise<void> => api.delete(`roles/${roleId}`);

// ---- Role permissions: /role-permissions (one row per role + menu)
export const fetchRoleTran = async (roleId: number): Promise<RoleTran[]> =>
    (await api.get<RoleTran[]>("role-permissions", { roleId })) ?? [];

const FLAGS = ["add", "edit", "view", "del", "excel", "print", "authorize"] as const;

// Only fields the server accepts (updateTime is generated there).
const permissionBody = (row: RoleTran) => ({
    roleTranId: { roleId: row.roleTranId.roleId, menuId: row.roleTranId.menuId },
    ...Object.fromEntries(FLAGS.map((f) => [f, (row[f] ?? "N") === "Y" ? "Y" : "N"])),
    systemId: row.systemId ?? null,
    userId: row.userId ?? null,
    viewDays: row.viewDays ?? null,
});

const hasAny = (row: RoleTran) => FLAGS.some((f) => row[f] === "Y");

/**
 * Brings the role's permissions in line with `rows`: new menus are created,
 * changed ones updated, and menus with nothing granted are deleted.
 */
export const saveRoleTran = async (roleId: number, rows: RoleTran[]): Promise<RoleTran[]> => {
    const existing = await fetchRoleTran(roleId);
    const byMenu = new Map(existing.map((r) => [r.roleTranId.menuId, r]));
    const wanted = new Map(rows.filter(hasAny).map((r) => [r.roleTranId.menuId, r]));

    for (const [menuId, row] of wanted) {
        const before = byMenu.get(menuId);
        if (!before) await api.post("role-permissions", permissionBody(row));
        else if (FLAGS.some((f) => (before[f] ?? "N") !== (row[f] ?? "N")))
            await api.put(`role-permissions/${roleId}/${encodeURIComponent(menuId)}`, permissionBody({ ...before, ...row }));
    }
    for (const menuId of byMenu.keys()) {
        if (!wanted.has(menuId)) await api.delete(`role-permissions/${roleId}/${encodeURIComponent(menuId)}`);
    }
    return fetchRoleTran(roleId);
};

// ---- User roles: /user-roles (one role per user)
export const fetchUserRoles = async (): Promise<UserRole[]> => (await api.get<UserRole[]>("user-roles")) ?? [];

export const createUserRole = async (userId: number, roleId: number): Promise<UserRole> =>
    api.post<UserRole>("user-roles", { userId, roleId });

export const updateUserRole = async (userId: number, roleId: number): Promise<UserRole> =>
    api.put<UserRole>(`user-roles/${userId}`, { userId, roleId });

export const deleteUserRole = async (userId: number): Promise<void> => api.delete(`user-roles/${userId}`);

/** Permissions a user gets through their role. */
export const fetchUserPermissions = async (userId: number): Promise<RoleTran[]> =>
    (await api.get<RoleTran[]>(`user-roles/${userId}/permissions`)) ?? [];

// ---- Users: /users
export const fetchUsers = async (): Promise<AppUser[]> =>
    ((await api.get<{ sno: number; username: string; active: string; isadmin: boolean; parentuserid: number | null }[]>("users")) ?? []).map(
        (u) => ({ sno: u.sno, userName: u.username, active: u.active, admin: !!u.isadmin, parentUserId: u.parentuserid })
    );
