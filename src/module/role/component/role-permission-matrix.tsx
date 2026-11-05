"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ChevronRight, KeyRound, Loader2, RotateCcw, Save, ShieldAlert } from "lucide-react";
import { useToast } from "@/src/providers/toast-provider";
import { useAuth } from "@/src/features/auth/lib/auth-context";
import { APP_MENUS, MENU_GROUPS } from "@/src/config/menu-registry";
import { getApiErrorMessage } from "../api/role.api";
import { useRoleTran, useRoles, useSaveRoleTran } from "../hook/use-roles";
import { PERMISSION_FLAGS, type PermissionFlag, type PermissionRow, type RoleTran } from "../type/role.types";
import { CardHeader, Checkbox, card, ghostButton, inputClass, primaryButton } from "./ui";

const FLAG_KEYS = PERMISSION_FLAGS.map((f) => f.key);
const yes = (v?: string | null) => (v ?? "").toUpperCase() === "Y";

const emptyRow = (menuId: string): PermissionRow =>
    ({ menuId, ...Object.fromEntries(FLAG_KEYS.map((k) => [k, false])) }) as PermissionRow;

const toRows = (trans: RoleTran[]): Record<string, PermissionRow> => {
    const rows: Record<string, PermissionRow> = {};
    APP_MENUS.forEach((m) => (rows[m.menuId] = emptyRow(m.menuId)));
    trans.forEach((t) => {
        const id = t.roleTranId?.menuId;
        if (!id) return;
        rows[id] = { menuId: id, ...Object.fromEntries(FLAG_KEYS.map((k) => [k, yes(t[k])])) } as PermissionRow;
    });
    return rows;
};

/** Per-menu permission grid for one role (ROLETRAN). */
export default function RolePermissionMatrix({ roleId, onRoleChange }: { roleId: number | null; onRoleChange: (id: number | null) => void }) {
    const { addToast } = useToast();
    const { allDetails } = useAuth();
    const rolesQuery = useRoles();
    const tranQuery = useRoleTran(roleId);
    const save = useSaveRoleTran();

    const [rows, setRows] = useState<Record<string, PermissionRow>>({});
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

    const role = rolesQuery.data?.find((r) => r.roleId === roleId);
    const original = useMemo(() => toRows(tranQuery.data ?? []), [tranQuery.data]);
    useEffect(() => setRows(original), [original]);

    // Menus saved earlier that are not in the registry still show, under "Other".
    const otherMenus = Object.keys(rows).filter((id) => !APP_MENUS.some((m) => m.menuId === id));
    const groups = [
        ...MENU_GROUPS.map((g) => ({ name: g as string, menus: APP_MENUS.filter((m) => m.group === g).map((m) => ({ id: m.menuId, label: m.label, description: m.description })) })),
        ...(otherMenus.length ? [{ name: "Other", menus: otherMenus.map((id) => ({ id, label: id, description: "Saved earlier" })) }] : []),
    ];

    const dirty = JSON.stringify(rows) !== JSON.stringify(original);
    const all = Object.values(rows);
    const countOn = all.reduce((n, r) => n + FLAG_KEYS.filter((k) => r[k]).length, 0);
    const total = all.length * FLAG_KEYS.length;

    const setCells = (menuIds: string[], flags: PermissionFlag[], on: boolean) =>
        setRows((prev) => {
            const next = { ...prev };
            menuIds.forEach((id) => {
                const row = { ...(next[id] ?? emptyRow(id)) };
                flags.forEach((f) => (row[f] = on));
                // Any permission needs View; clearing View clears the rest.
                if (on && flags.some((f) => f !== "view")) row.view = true;
                if (!on && flags.includes("view")) FLAG_KEYS.forEach((f) => (row[f] = false));
                next[id] = row;
            });
            return next;
        });

    const state = (menuIds: string[], flags: PermissionFlag[]) => {
        const cells = menuIds.flatMap((id) => flags.map((f) => !!rows[id]?.[f]));
        const on = cells.filter(Boolean).length;
        return { checked: cells.length > 0 && on === cells.length, indeterminate: on > 0 && on < cells.length };
    };

    const handleSave = async () => {
        if (roleId == null) return;
        const payload: RoleTran[] = Object.values(rows)
            .filter((r) => FLAG_KEYS.some((k) => r[k]))
            .map((r) => ({
                roleTranId: { roleId, menuId: r.menuId },
                ...(Object.fromEntries(FLAG_KEYS.map((k) => [k, r[k] ? "Y" : "N"])) as Record<PermissionFlag, string>),
                userId: allDetails?.sno ?? null,
            }));
        try {
            await save.mutateAsync({ roleId, rows: payload });
            addToast({ type: "success", title: "Permissions saved", message: `${role?.roleName ?? "Role"}: ${payload.length} menus` });
        } catch (err) {
            addToast({ type: "error", title: "Couldn't save permissions", message: getApiErrorMessage(err) });
        }
    };

    const allMenuIds = Object.keys(rows);
    const globalState = state(allMenuIds, FLAG_KEYS);

    return (
        <section className={`${card} overflow-hidden`}>
            <CardHeader
                icon={KeyRound}
                title="Role permissions"
                subtitle="Choose what each role can do in every menu"
                actions={
                    <div className="flex w-full items-center gap-2 sm:w-auto" data-enter-nav>
                        <label htmlFor="perm-role" className="shrink-0 text-sm font-medium">
                            Role
                        </label>
                        <select
                            id="perm-role"
                            className={`${inputClass} h-9 sm:w-60`}
                            value={roleId ?? ""}
                            onChange={(e) => {
                                if (dirty && !window.confirm("Discard unsaved permission changes?")) return;
                                onRoleChange(e.target.value ? Number(e.target.value) : null);
                            }}
                        >
                            <option value="">Select a role…</option>
                            {(rolesQuery.data ?? []).map((r) => (
                                <option key={r.roleId} value={r.roleId}>
                                    {r.roleName}
                                    {yes(r.active) ? "" : " (inactive)"}
                                </option>
                            ))}
                        </select>
                    </div>
                }
            />

            {roleId == null ? (
                <div className="px-5 py-16 text-center text-sm text-muted-foreground">
                    <KeyRound className="mx-auto mb-2 h-7 w-7" />
                    Select a role to manage its permissions.
                </div>
            ) : tranQuery.isLoading ? (
                <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading permissions…
                </div>
            ) : (
                <div className="space-y-4 p-4 sm:p-5">
                    {role && yes(role.adminAccess) && (
                        <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-800 dark:text-amber-300">
                            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                            This role has admin access, so it can use every menu whatever is ticked here.
                        </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-gradient-to-br from-accent-soft via-card to-accent-soft px-4 py-3">
                        <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
                            <Checkbox
                                label="Select all menus and permissions"
                                checked={globalState.checked}
                                indeterminate={globalState.indeterminate}
                                onChange={(on) => setCells(allMenuIds, FLAG_KEYS, on)}
                            />
                            Select all menus &amp; permissions
                        </label>
                        <span className="text-xs text-muted-foreground">
                            {countOn} of {total} permissions granted
                        </span>
                    </div>

                    {groups.map((group) => {
                        const ids = group.menus.map((m) => m.id);
                        const gState = state(ids, FLAG_KEYS);
                        const open = !collapsed[group.name];
                        return (
                            <div key={group.name} className="overflow-hidden rounded-xl border border-border">
                                <div className="flex items-center gap-3 bg-muted/50 px-4 py-2.5">
                                    <Checkbox
                                        label={`Select all permissions in ${group.name}`}
                                        checked={gState.checked}
                                        indeterminate={gState.indeterminate}
                                        onChange={(on) => setCells(ids, FLAG_KEYS, on)}
                                    />
                                    <button
                                        type="button"
                                        className="flex flex-1 items-center gap-2 text-left text-sm font-semibold"
                                        onClick={() => setCollapsed((c) => ({ ...c, [group.name]: open }))}
                                        aria-expanded={open}
                                    >
                                        {group.name}
                                        <span className="font-normal text-muted-foreground">({group.menus.length})</span>
                                        <ChevronRight className={`ml-auto h-4 w-4 transition-transform ${open ? "rotate-90" : ""}`} />
                                    </button>
                                </div>
                                {open && (
                                    <div className="relative overflow-x-auto">
                                        <table className="w-full min-w-[720px] text-sm">
                                            <thead>
                                                <tr className="border-y border-border text-xs uppercase tracking-wide text-muted-foreground">
                                                    <th className="px-4 py-2 text-left font-medium">Menu</th>
                                                    {PERMISSION_FLAGS.map((f) => {
                                                        const cState = state(ids, [f.key]);
                                                        return (
                                                            <th key={f.key} className="px-2 py-2 text-center font-medium">
                                                                <div className="flex flex-col items-center gap-1">
                                                                    {f.label}
                                                                    <Checkbox
                                                                        label={`${f.label} for every menu in ${group.name}`}
                                                                        checked={cState.checked}
                                                                        indeterminate={cState.indeterminate}
                                                                        onChange={(on) => setCells(ids, [f.key], on)}
                                                                    />
                                                                </div>
                                                            </th>
                                                        );
                                                    })}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {group.menus.map((menu) => {
                                                    const rState = state([menu.id], FLAG_KEYS);
                                                    return (
                                                        <tr key={menu.id} className="transition-colors hover:bg-muted/40">
                                                            <td className="px-4 py-2.5">
                                                                <label className="flex cursor-pointer items-center gap-2.5">
                                                                    <Checkbox
                                                                        label={`All permissions for ${menu.label}`}
                                                                        checked={rState.checked}
                                                                        indeterminate={rState.indeterminate}
                                                                        onChange={(on) => setCells([menu.id], FLAG_KEYS, on)}
                                                                    />
                                                                    <span>
                                                                        <span className="block font-medium">{menu.label}</span>
                                                                        {menu.description && (
                                                                            <span className="block text-xs text-muted-foreground">{menu.description}</span>
                                                                        )}
                                                                    </span>
                                                                </label>
                                                            </td>
                                                            {PERMISSION_FLAGS.map((f) => (
                                                                <td key={f.key} className="px-2 py-2.5 text-center">
                                                                    <Checkbox
                                                                        label={`${f.label} ${menu.label}`}
                                                                        checked={!!rows[menu.id]?.[f.key]}
                                                                        onChange={(on) => setCells([menu.id], [f.key], on)}
                                                                    />
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-border bg-card/95 px-4 py-3 backdrop-blur sm:-mx-5 sm:px-5">
                        <p className="text-sm text-muted-foreground">
                            {dirty ? <span className="font-medium text-amber-600 dark:text-amber-400">Unsaved changes</span> : "All changes saved"}
                        </p>
                        <div className="flex gap-2">
                            <button type="button" className={ghostButton} disabled={!dirty || save.isPending} onClick={() => setRows(original)}>
                                <RotateCcw className="h-4 w-4" /> Reset
                            </button>
                            <button type="button" className={primaryButton} disabled={!dirty || save.isPending} onClick={handleSave}>
                                {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Save permissions
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
