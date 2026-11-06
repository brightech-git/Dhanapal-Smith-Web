/** Backend: com.example.smith.Master.RoleMaster (table ROLEMASTER). */
export interface RoleMaster {
    roleId: number;
    roleName: string;
    /** "Y" / "N" */
    active: string;
    /** "Y" / "N": full access, skips per-menu checks. */
    adminAccess: string;
}

export interface RoleMasterInput {
    roleName: string;
    active: "Y" | "N";
    adminAccess: "Y" | "N";
}

/** Backend: com.example.smith.Master.RoleTran (table ROLETRAN). One row per role per menu. */
export interface RoleTran {
    roleTranId: { roleId: number; menuId: string };
    add?: string | null;
    edit?: string | null;
    view?: string | null;
    del?: string | null;
    excel?: string | null;
    print?: string | null;
    authorize?: string | null;
    systemId?: string | null;
    userId?: number | null;
    viewDays?: number | null;
    updateTime?: string | null;
}

export const PERMISSION_FLAGS = [
    { key: "view", label: "View" },
    { key: "add", label: "Add" },
    { key: "edit", label: "Edit" },
    { key: "del", label: "Delete" },
    { key: "print", label: "Print" },
    { key: "excel", label: "Excel" },
    { key: "authorize", label: "Authorize" },
] as const;

export type PermissionFlag = (typeof PERMISSION_FLAGS)[number]["key"];
export type PermissionRow = { menuId: string } & Record<PermissionFlag, boolean>;

/** Backend: com.example.smith.Master.UserRole (table USERROLE). One role per user. */
export interface UserRole {
    userId: number;
    roleId: number | null;
    username?: string | null;
    roleName?: string | null;
}

/** GET users/all (user_master). */
export interface AppUser {
    sno: number;
    userName: string;
    active?: string;
    admin?: boolean;
    parentUserId?: number | null;
}
