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
    { menuId: "dashboard", label: "Dashboard", group: "Smith", path: "/", description: "Totals and recent transactions" },
    { menuId: "transactions", label: "Transactions", group: "Smith", path: "/smiths/transactions", description: "Cash and weight ledger" },
    { menuId: "orders", label: "Orders", group: "Smith", path: "/smiths/order", description: "Smith orders" },
    { menuId: "smiths", label: "Smith details", group: "Smith", description: "Create and edit smiths (transactions)" },
    { menuId: "gift-voucher", label: "Gift voucher", group: "Gift Voucher", path: "/gift-voucher", description: "Issue, return and report" },
    { menuId: "users", label: "Users", group: "Administration", description: "User accounts" },
    { menuId: "metals", label: "Metal Master", group: "Administration", path: "/metal-master", description: "Maintain metal records" },
    { menuId: "items", label: "Item Master", group: "Administration", path: "/item-master", description: "Maintain item records" },
    { menuId: "roles", label: "Roles", group: "Administration", path: "/roles", description: "Role master" },
    { menuId: "role-permissions", label: "Role permissions", group: "Administration", path: "/roles", description: "Per-menu access" },
    { menuId: "user-roles", label: "User roles", group: "Administration", path: "/roles", description: "Assign roles to users" },
    { menuId: "soft-controls", label: "Soft controls", group: "Administration", path: "/soft-controls", description: "Per-client settings (CTLID / CTLTEXT)" },
];

export const MENU_GROUPS = ["Smith", "Gift Voucher", "Administration"] as const;
