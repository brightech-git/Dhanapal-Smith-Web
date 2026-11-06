"use client";

import React, { useMemo, useState } from "react";
import { Check, Inbox, Loader2, Save, Search, UserCog, UserRound } from "lucide-react";
import { useToast } from "@/src/providers/toast-provider";
import ConfirmDialog from "@/src/components/ui/confirm-dialog";
import { getApiErrorMessage } from "../api/role.api";
import { useAssignUserRole, useRoles, useUserRoles, useUsers } from "../hook/use-roles";
import { CardHeader, StatusBadge, card, inputClass } from "./ui";

const yes = (v?: string | null) => (v ?? "").toUpperCase() === "Y";

/** One role per user: pick a role and save; "No role" removes it. */
export default function UserRolePanel() {
    const { addToast } = useToast();
    const usersQuery = useUsers();
    const rolesQuery = useRoles();
    const userRolesQuery = useUserRoles();
    const assign = useAssignUserRole();

    const [pending, setPending] = useState<Record<number, number | null>>({});
    const [savingUser, setSavingUser] = useState<number | null>(null);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<"all" | "assigned" | "unassigned">("all");
    const [toRemove, setToRemove] = useState<{ userId: number; name: string } | null>(null);

    const assigned = useMemo(() => {
        const map: Record<number, number | null> = {};
        (userRolesQuery.data ?? []).forEach((ur) => (map[ur.userId] = ur.roleId));
        return map;
    }, [userRolesQuery.data]);

    const roleName = (id: number | null | undefined) => rolesQuery.data?.find((r) => r.roleId === id)?.roleName;

    const users = useMemo(() => {
        const q = search.trim().toLowerCase();
        return (usersQuery.data ?? []).filter((u) => {
            if (q && !u.userName?.toLowerCase().includes(q) && !String(u.sno).includes(q)) return false;
            if (filter === "assigned") return assigned[u.sno] != null;
            if (filter === "unassigned") return assigned[u.sno] == null;
            return true;
        });
    }, [usersQuery.data, search, filter, assigned]);

    const assignedCount = (usersQuery.data ?? []).filter((u) => assigned[u.sno] != null).length;

    const save = async (userId: number, name: string, roleId: number | null) => {
        setSavingUser(userId);
        try {
            await assign.mutateAsync({ userId, roleId, hasRole: assigned[userId] != null });
            setPending((p) => {
                const next = { ...p };
                delete next[userId];
                return next;
            });
            addToast({
                type: "success",
                title: roleId == null ? "Role removed" : "Role assigned",
                message: roleId == null ? `${name} has no role now` : `${name} → ${roleName(roleId)}`,
            });
        } catch (err) {
            addToast({ type: "error", title: "Couldn't save the user's role", message: getApiErrorMessage(err) });
        } finally {
            setSavingUser(null);
        }
    };

    const onSave = (userId: number, name: string) => {
        const roleId = pending[userId] ?? null;
        if (roleId == null) setToRemove({ userId, name });
        else save(userId, name, roleId);
    };

    const loading = usersQuery.isLoading || rolesQuery.isLoading || userRolesQuery.isLoading;
    const failed = usersQuery.isError || rolesQuery.isError;

    return (
        <section className={`${card} overflow-hidden`}>
            <CardHeader
                icon={UserCog}
                title="User roles"
                subtitle={`${assignedCount} of ${usersQuery.data?.length ?? 0} users have a role`}
                actions={
                    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto" data-enter-nav="off">
                        <div className="relative min-w-0 flex-1 sm:w-56 sm:flex-none">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                className={`${inputClass} h-9 pl-9`}
                                placeholder="Search users..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                aria-label="Search users"
                            />
                        </div>
                        <div className="flex rounded-xl border border-border p-0.5 text-xs font-medium">
                            {(["all", "assigned", "unassigned"] as const).map((f) => (
                                <button
                                    key={f}
                                    type="button"
                                    onClick={() => setFilter(f)}
                                    className={`rounded-lg px-2.5 py-1.5 capitalize transition ${
                                        filter === f ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>
                }
            />
            <div className="relative overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                    <thead>
                        <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                            <th className="px-5 py-2.5 font-medium">User</th>
                            <th className="px-3 py-2.5 font-medium">Status</th>
                            <th className="px-3 py-2.5 font-medium">Current role</th>
                            <th className="px-3 py-2.5 font-medium">Assign role</th>
                            <th className="px-5 py-2.5 text-right font-medium">Save</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {loading &&
                            Array.from({ length: 4 }).map((_, i) => (
                                <tr key={i}>
                                    <td colSpan={5} className="px-5 py-3">
                                        <div className="h-4 w-full animate-pulse rounded bg-muted" />
                                    </td>
                                </tr>
                            ))}
                        {!loading && failed && (
                            <tr>
                                <td colSpan={5} className="px-5 py-10 text-center text-sm text-red-600 dark:text-red-400">
                                    Couldn&apos;t load users or roles. {getApiErrorMessage(usersQuery.error || rolesQuery.error)}
                                </td>
                            </tr>
                        )}
                        {!loading &&
                            !failed &&
                            users.map((user) => {
                                const current = assigned[user.sno] ?? null;
                                const selected = user.sno in pending ? pending[user.sno] : current;
                                const changed = selected !== current;
                                const busy = savingUser === user.sno;
                                return (
                                    <tr key={user.sno} className={`transition-colors hover:bg-muted/50 ${changed ? "bg-amber-500/5" : ""}`}>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-2.5">
                                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-primary-text">
                                                    {(user.userName || "?").slice(0, 2).toUpperCase()}
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="truncate font-semibold">{user.userName}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        ID {user.sno}
                                                        {user.admin ? " · Admin user" : ""}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3">
                                            <StatusBadge active={user.active == null || yes(user.active)} />
                                        </td>
                                        <td className="px-3 py-3">
                                            {current != null ? (
                                                <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold text-primary-text">
                                                    {roleName(current) ?? `Role ${current}`}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">No role</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-3">
                                            <select
                                                aria-label={`Role for ${user.userName}`}
                                                className={`${inputClass} h-9 min-w-[180px]`}
                                                value={selected ?? ""}
                                                disabled={busy}
                                                onChange={(e) =>
                                                    setPending((p) => ({ ...p, [user.sno]: e.target.value ? Number(e.target.value) : null }))
                                                }
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" && changed) {
                                                        e.preventDefault();
                                                        onSave(user.sno, user.userName);
                                                    }
                                                }}
                                            >
                                                <option value="">No role</option>
                                                {(rolesQuery.data ?? [])
                                                    .filter((r) => yes(r.active) || r.roleId === current)
                                                    .map((r) => (
                                                        <option key={r.roleId} value={r.roleId}>
                                                            {r.roleName}
                                                            {yes(r.adminAccess) ? " (admin)" : ""}
                                                        </option>
                                                    ))}
                                            </select>
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <button
                                                type="button"
                                                disabled={!changed || busy}
                                                onClick={() => onSave(user.sno, user.userName)}
                                                className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition ${
                                                    changed ? "bg-primary text-primary-foreground shadow-sm hover:opacity-90" : "text-emerald-600 dark:text-emerald-400"
                                                }`}
                                            >
                                                {busy ? (
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                ) : changed ? (
                                                    <Save className="h-3.5 w-3.5" />
                                                ) : (
                                                    <Check className="h-3.5 w-3.5" />
                                                )}
                                                {changed ? "Save" : "Saved"}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        {!loading && !failed && users.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-5 py-10 text-center text-sm text-muted-foreground">
                                    {search || filter !== "all" ? <Inbox className="mx-auto mb-2 h-6 w-6" /> : <UserRound className="mx-auto mb-2 h-6 w-6" />}
                                    {search || filter !== "all" ? "No users match" : "No users yet"}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <ConfirmDialog
                open={!!toRemove}
                title={`Remove ${toRemove?.name}'s role?`}
                message="The user will lose the menus that come from this role."
                confirmLabel="Remove role"
                busy={assign.isPending}
                onConfirm={() => {
                    if (toRemove) save(toRemove.userId, toRemove.name, null);
                    setToRemove(null);
                }}
                onCancel={() => setToRemove(null)}
            />
        </section>
    );
}
