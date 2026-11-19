import { APP_MENUS } from "@/src/config/menu-registry";
import { SHORTCUTS_PATH } from "@/src/config/keyboard-shortcuts";
import type { LoginPermission } from "@/src/features/auth/api/auth.api";

export interface AccessProfile {
    admin?: boolean;
    isadmin?: boolean;
    projectName?: string;
    roleTran?: LoginPermission[];
}

export type MenuAction = "view" | "add" | "edit" | "del" | "excel" | "print" | "authorize";

export const canMenuAction = (profile: AccessProfile | null, menuId: string, action: MenuAction) =>
{
    console.log(profile, action, menuId ,"checking");
      return !!profile && (profile.admin === true || profile.isadmin === true ||
        !!profile.roleTran?.some((row) => row.roleTranId.menuId === menuId && row[action] === "Y"));
}
   

export const canViewMenu = (profile: AccessProfile | null, menuId: string) =>
    canMenuAction(profile, menuId, "view");

export const canAccessPath = (profile: AccessProfile | null, path: string) => {
    const pathname = path.split(/[?#]/)[0].replace(/\/$/, "") || "/";
    // Every signed-in user may see and change their own keyboard shortcuts.
    if (pathname === SHORTCUTS_PATH) return !!profile;
    const menus = APP_MENUS.filter((menu) => menu.path === pathname);
    return menus.length > 0 && menus.some((menu) => canViewMenu(profile, menu.menuId));
};

export const firstAllowedPath = (profile: AccessProfile | null) =>
    APP_MENUS.find((menu) => menu.path &&
        canViewMenu(profile, menu.menuId))?.path;
