// Sidebar menu tree: section > parent > child > grandchild.
// A leaf has an href (a route, optionally with a #tab) and the menuId that
// role permissions are checked against (see menu-registry.ts). A parent has
// children and is shown only when at least one child is allowed.

import type { LucideIcon } from "lucide-react";
import {
    BarChart3, ClipboardList, Database, Gift, Hammer, KeyRound, Layers, LayoutDashboard,
    Package, ShieldCheck, SlidersHorizontal, Ticket, Users, Wallet,
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
        label: "Overview",
        items: [
            { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/", menuId: "dashboard" },
        ],
    },
    {
        id: "modules",
        label: "Modules",
        items: [
            {
                id: "smith", label: "Smith", icon: Hammer, children: [
                    { id: "transactions", label: "Transactions", icon: Wallet, href: "/smiths/transactions", menuId: "transactions" },
                    { id: "orders", label: "Orders", icon: ClipboardList, href: "/smiths/order", menuId: "orders" },
                ],
            },
            {
                id: "gift-voucher", label: "Gift Voucher", icon: Gift, children: [
                    {
                        id: "gv-vouchers", label: "Vouchers", icon: Ticket, children: [
                            { id: "gv-issue", label: "Issue", href: "/gift-voucher#issue", menuId: "gift-voucher", isDefault: true },
                            { id: "gv-receipt", label: "Receipt", href: "/gift-voucher#receipt", menuId: "gift-voucher" },
                        ],
                    },
                    { id: "gv-introducers", label: "Introducers", icon: Users, href: "/gift-voucher#introducers", menuId: "gift-voucher" },
                    { id: "gv-report", label: "Report", icon: BarChart3, href: "/gift-voucher#report", menuId: "gift-voucher" },
                ],
            },
        ],
    },
    {
        id: "settings",
        label: "Settings",
        items: [
            {
                id: "masters", label: "Masters", icon: Database, children: [
                    { id: "metal-master", label: "Metal Master", icon: Layers, href: "/metal-master", menuId: "metals" },
                    { id: "item-master", label: "Item Master", icon: Package, href: "/item-master", menuId: "items" },
                ],
            },
            {
                id: "administration", label: "Administration", icon: ShieldCheck, children: [
                    {
                        id: "access-control", label: "Access control", icon: KeyRound, children: [
                            { id: "roles", label: "Roles", href: "/roles#roles", menuId: "roles", isDefault: true },
                            { id: "role-permissions", label: "Permissions", href: "/roles#permissions", menuId: "role-permissions" },
                            { id: "user-roles", label: "User roles", href: "/roles#user-roles", menuId: "user-roles" },
                        ],
                    },
                    { id: "soft-controls", label: "Soft Controls", icon: SlidersHorizontal, href: "/soft-controls", menuId: "soft-controls" },
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
