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
    { menuId: "dashboard", label: "DASHBOARD", group: "Smith", path: "/", description: "Totals and recent transactions" },
    { menuId: "transactions", label: "TRANSACTIONS", group: "Smith", path: "/smiths/transactions", description: "Cash and weight ledger" },
    { menuId: "orders", label: "ORDERS", group: "Smith", path: "/smiths/order", description: "Smith orders" },
    { menuId: "report-weight", label: "WEIGHT REPORT", group: "Smith", path: "/reports/weight", description: "Weight transactions by date, item and type" },
    { menuId: "report-amount", label: "AMOUNT REPORT", group: "Smith", path: "/reports/amount", description: "Amount transactions per smith or per date" },
    { menuId: "report-smith", label: "SMITH SUMMARY REPORT", group: "Smith", path: "/reports/smith", description: "Weight and amount balance per smith" },
    { menuId: "smiths", label: "SMITH DETAILS", group: "Smith", description: "Create and edit smiths (transactions)" },
    { menuId: "gift-voucher", label: "GIFT VOUCHER", group: "Gift Voucher", path: "/gift-voucher", description: "Issue, return and report" },
    { menuId: "users", label: "USERS", group: "Administration", description: "User accounts" },
    { menuId: "metals", label: "METAL MASTER", group: "Administration", path: "/metal-master", description: "Maintain metal records" },
    { menuId: "items", label: "ITEM MASTER", group: "Administration", path: "/item-master", description: "Maintain item records" },
    { menuId: "roles", label: "ROLES", group: "Administration", path: "/roles", description: "Role master" },
    { menuId: "role-permissions", label: "ROLE PERMISSIONS", group: "Administration", path: "/roles", description: "Per-menu access" },
    { menuId: "user-roles", label: "USER ROLES", group: "Administration", path: "/roles", description: "Assign roles to users" },
    { menuId: "soft-controls", label: "SOFT CONTROLS", group: "Administration", path: "/soft-controls", description: "Per-client settings (CTLID / CTLTEXT)" },
];

export const MENU_GROUPS = ["Smith", "Gift Voucher", "Administration"] as const;
