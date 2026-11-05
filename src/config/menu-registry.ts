// Menus that roles can be granted. menuId is what is stored in ROLETRAN.MENUID,
// so keep ids stable once permissions have been saved against them.

export interface AppMenu {
    menuId: string;
    label: string;
    group: "Smith" | "Gift Voucher" | "Administration";
    path?: string;
    description?: string;
}

export const APP_MENUS: AppMenu[] = [
    { menuId: "DASHBOARD", label: "Dashboard", group: "Smith", path: "/", description: "Totals and recent transactions" },
    { menuId: "TRANSACTION", label: "Smith transactions", group: "Smith", path: "/", description: "Cash and weight ledger" },
    { menuId: "ORDER", label: "Orders", group: "Smith", path: "/smiths/order", description: "Smith orders" },
    { menuId: "SMITH", label: "Smith details", group: "Smith", path: "/smiths/create", description: "Create and edit smiths" },
    { menuId: "GIFT_VOUCHER", label: "Gift voucher", group: "Gift Voucher", path: "/gift-voucher", description: "Issue, return and report" },
    { menuId: "USER", label: "Users", group: "Administration", description: "User accounts" },
    { menuId: "ROLE", label: "Roles", group: "Administration", path: "/roles", description: "Role master" },
    { menuId: "ROLE_TRAN", label: "Role permissions", group: "Administration", path: "/roles", description: "Per-menu access" },
    { menuId: "USER_ROLE", label: "User roles", group: "Administration", path: "/roles", description: "Assign roles to users" },
];

export const MENU_GROUPS = ["Smith", "Gift Voucher", "Administration"] as const;
