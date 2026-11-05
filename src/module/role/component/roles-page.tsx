"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { KeyRound, ShieldCheck, UserCog } from "lucide-react";
import RoleMasterPanel from "./role-master-panel";
import RolePermissionMatrix from "./role-permission-matrix";
import UserRolePanel from "./user-role-panel";

import { useAuth } from "@/src/features/auth/lib/auth-context";
import { canViewMenu } from "@/src/features/auth/lib/access";

const TABS = [
    { id: "roles", label: "Roles", icon: ShieldCheck, hint: "Create, edit and delete roles" },
    { id: "permissions", label: "Permissions", icon: KeyRound, hint: "Per-menu access for a role" },
    { id: "user-roles", label: "User roles", icon: UserCog, hint: "Give each user a role" },
] as const;
type TabId = (typeof TABS)[number]["id"];

const readHash = (): { tab: TabId; roleId: number | null } => {
    if (typeof window === "undefined") return { tab: "roles", roleId: null };
    const [tab, role] = window.location.hash.replace("#", "").split("/");
    const valid = TABS.some((t) => t.id === tab) ? (tab as TabId) : "roles";
    return { tab: valid, roleId: role && !isNaN(Number(role)) ? Number(role) : null };
};

/** Roles & access: role master, role permissions and user roles in one place. */
export default function RolesPage() {
    const [tab, setTab] = useState<TabId>("roles");
    const [roleId, setRoleId] = useState<number | null>(null);

    const { allDetails } = useAuth();
    const availableTabs = TABS.filter((t) => canViewMenu(allDetails, t.id === "permissions" ? "role-permissions" : t.id));
    const activeTab = availableTabs.some((t) => t.id === tab) ? tab : availableTabs[0]?.id;

    // The tab (and selected role) live in the URL hash, so reload and back keep them.
    useEffect(() => {
        const sync = () => {
            const h = readHash();
            setTab(h.tab);
            if (h.roleId != null) setRoleId(h.roleId);
        };
        sync();
        window.addEventListener("hashchange", sync);
        return () => window.removeEventListener("hashchange", sync);
    }, []);

    const go = (next: TabId, nextRole: number | null = roleId) => {
        setTab(next);
        setRoleId(nextRole);
        const hash = next === "permissions" && nextRole != null ? `#permissions/${nextRole}` : `#${next}`;
        if (window.location.hash !== hash) window.history.replaceState(null, "", hash);
    };

    return (
        <div className="w-full space-y-5 px-3 py-4 sm:px-5 lg:px-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Roles &amp; access</h1>
                <p className="mt-0.5 text-sm text-muted-foreground">Set up roles, what each role can do, and which users have them.</p>
            </div>

            <div role="tablist" aria-label="Roles and access" className="flex gap-1 overflow-x-auto rounded-2xl border border-border bg-card p-1 shadow-sm sm:inline-flex">
                {availableTabs.map((t) => {
                    const active = activeTab === t.id;
                    return (
                        <button
                            key={t.id}
                            role="tab"
                            aria-selected={active}
                            title={t.hint}
                            onClick={() => go(t.id)}
                            className={`relative flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                                active ? "text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            }`}
                        >
                            {active && (
                                <motion.span
                                    layoutId="roles-tab"
                                    className="absolute inset-0 rounded-xl bg-primary shadow-sm"
                                    transition={{ type: "spring", stiffness: 400, damping: 34 }}
                                />
                            )}
                            <t.icon className="relative h-4 w-4" />
                            <span className="relative">{t.label}</span>
                        </button>
                    );
                })}
            </div>

            <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                {activeTab === "roles" && <RoleMasterPanel onManagePermissions={(role) => go("permissions", role.roleId)} />}
                {activeTab === "permissions" && <RolePermissionMatrix roleId={roleId} onRoleChange={(id) => go("permissions", id)} />}
                {activeTab === "user-roles" && <UserRolePanel />}
            </motion.div>
        </div>
    );
}
