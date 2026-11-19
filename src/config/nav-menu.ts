// Sidebar menu tree: section > parent > child > grandchild.
// A leaf has an href (a route, optionally with a #tab) and the menuId that
// role permissions are checked against (see menu-registry.ts). A parent has
// children and is shown only when at least one child is allowed.

import type { LucideIcon } from "lucide-react";
import {
    BarChart3, ClipboardList, Database, FileBarChart, Gift, Hammer, IndianRupee, KeyRound, Layers, LayoutDashboard,
    Package, Scale, ShieldCheck, SlidersHorizontal, Ticket, Users, Wallet,
} from "lucide-react";

export interface NavItem {
    id: string;
    label: string;
    icon?: LucideIcon;
    href?: string;
    menuId?: string;
    /** For a #tab leaf: the tab a page shows when the URL has no hash. */
    isDefault?: boolean;
    children?: NavItem[];
}

export interface NavSection {
    id: string;
    label: string;
    items: NavItem[];
}

export const NAV_MENU: NavSection[] = [
    {
        id: "overview",
        label: "OVERVIEW",
        items: [
          
            { id: "dashboard", label: "DASHBOARD", icon: LayoutDashboard, href: "/", menuId: "dashboard" },
        ],
    },
    {
        id: "modules",
        label: "MODULES",
        items: [
            {
                id: "masters", label: "MASTERS", icon: Database, children: [
                    { id: "metal-master", label: "METAL MASTER", icon: Layers, href: "/metal-master", menuId: "metals" },
                    { id: "item-master", label: "ITEM MASTER", icon: Package, href: "/item-master", menuId: "items" },
                ],
            },
            {
                id: "smith", label: "SMITH", icon: Hammer, children: [
                    { id: "transactions", label: "TRANSACTIONS", icon: Wallet, href: "/smiths/transactions", menuId: "transactions" },
                    { id: "orders", label: "ORDERS", icon: ClipboardList, href: "/smiths/order", menuId: "orders" },
                    {
                        id: "smith-reports", label: "REPORTS", icon: FileBarChart, children: [
                            { id: "report-weight", label: "WEIGHT REPORT", icon: Scale, href: "/reports/weight", menuId: "report-weight" },
                            { id: "report-amount", label: "AMOUNT REPORT", icon: IndianRupee, href: "/reports/amount", menuId: "report-amount" },
                            { id: "report-smith", label: "SMITH SUMMARY", icon: Users, href: "/reports/smith", menuId: "report-smith" },
                        ],
                    },
                ],
            },
            {
                id: "gift-voucher", label: "GIFT VOUCHER", icon: Gift, children: [
                    {
                        id: "gv-vouchers", label: "VOUCHERS", icon: Ticket, children: [
                            { id: "gv-issue", label: "ISSUE", href: "/gift-voucher#issue", menuId: "gift-voucher", isDefault: true },
                            { id: "gv-receipt", label: "RECEIPT", href: "/gift-voucher#receipt", menuId: "gift-voucher" },
                        ],
                    },
                    { id: "gv-introducers", label: "INTRODUCERS", icon: Users, href: "/gift-voucher#introducers", menuId: "gift-voucher" },
                    { id: "gv-report", label: "REPORT", icon: BarChart3, href: "/gift-voucher#report", menuId: "gift-voucher" },
                ],
            },
        ],
    },
    {
        id: "settings",
        label: "SETTINGS",
        items: [
           
            {
                id: "administration", label: "ADMINISTRATION", icon: ShieldCheck, children: [
                    {
                        id: "access-control", label: "ACCESS CONTROL", icon: KeyRound, children: [
                            { id: "roles", label: "ROLES", href: "/roles#roles", menuId: "roles", isDefault: true },
                            { id: "role-permissions", label: "PERMISSIONS", href: "/roles#permissions", menuId: "role-permissions" },
                            { id: "user-roles", label: "USER ROLES", href: "/roles#user-roles", menuId: "user-roles" },
                        ],
                    },
                    { id: "soft-controls", label: "SOFT CONTROLS", icon: SlidersHorizontal, href: "/soft-controls", menuId: "soft-controls" },
                ],
            },
        ],
    },
];

export const splitHref = (href: string) => {
    const [path, hash = ""] = href.split("#");
    return { path: path || "/", hash };
};

export const isCurrentPage = (pathname: string, path: string) =>
    (pathname.replace(/\/$/, "") || "/") === path || (path !== "/" && pathname.startsWith(`${path}/`));

/** Whether a leaf is the page (and tab) the user is on. */
export const isLeafActive = (item: NavItem, pathname: string, hash: string) => {
    if (!item.href) return false;
    const target = splitHref(item.href);
    if (!isCurrentPage(pathname, target.path)) return false;
    if (!target.hash) return true;
    const current = hash.split("/")[0];
    return current ? current === target.hash : !!item.isDefault;
};

/** Drops leaves the user cannot view, then parents left with no children. */
export const filterNav = (sections: NavSection[], canView: (menuId: string) => boolean): NavSection[] => {
    const prune = (items: NavItem[]): NavItem[] => items.flatMap((item) => {
        if (!item.children) return !item.menuId || canView(item.menuId) ? [item] : [];
        const children = prune(item.children);
        return children.length ? [{ ...item, children }] : [];
    });
    return sections.map((section) => ({ ...section, items: prune(section.items) })).filter((section) => section.items.length);
};

/** The chain of items from the top level down to the active leaf, or []. */
export const findTrail = (sections: NavSection[], pathname: string, hash: string): NavItem[] => {
    const walk = (items: NavItem[]): NavItem[] => {
        for (const item of items) {
            if (item.children) {
                const below = walk(item.children);
                if (below.length) return [item, ...below];
            } else if (isLeafActive(item, pathname, hash)) {
                return [item];
            }
        }
        return [];
    };
    for (const section of sections) {
        const trail = walk(section.items);
        if (trail.length) return trail;
    }
    return [];
};
