"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { KeyRound, Loader2, Pencil, Plus, RotateCcw, Save, Search, ShieldCheck, Trash2, Inbox } from "lucide-react";
import { useToast } from "@/src/providers/toast-provider";
import ConfirmDialog from "@/src/components/ui/confirm-dialog";
import { getApiErrorMessage } from "../api/role.api";
import { useDeleteRole, useRoles, useSaveRole } from "../hook/use-roles";
import type { RoleMaster, RoleMasterInput } from "../type/role.types";
import { CardHeader, Field, StatusBadge, Switch, card, ghostButton, iconButton, inputClass, primaryButton } from "./ui";

const EMPTY: RoleMasterInput = { roleName: "", active: "Y", adminAccess: "N" };
const isY = (v?: string | null) => (v ?? "").toUpperCase() === "Y";

/** Role master: entry form beside the list, like the savings scheme. */
export default function RoleMasterPanel({ onManagePermissions }: { onManagePermissions?: (role: RoleMaster) => void }) {
    const { addToast } = useToast();
    const rolesQuery = useRoles();
    const saveRole = useSaveRole();
    const deleteRole = useDeleteRole();

    const [editing, setEditing] = useState<RoleMaster | null>(null);
    const [values, setValues] = useState<RoleMasterInput>(EMPTY);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [toDelete, setToDelete] = useState<RoleMaster | null>(null);
    const nameRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setValues(
            editing
                ? { roleName: editing.roleName ?? "", active: isY(editing.active) ? "Y" : "N", adminAccess: isY(editing.adminAccess) ? "Y" : "N" }
                : EMPTY
        );
        setError(null);
        nameRef.current?.focus();
    }, [editing]);

    const roles = useMemo(() => {
        const q = search.trim().toLowerCase();
        const list = rolesQuery.data ?? [];
        return q ? list.filter((r) => r.roleName?.toLowerCase().includes(q) || String(r.roleId).includes(q)) : list;
    }, [rolesQuery.data, search]);

    const reset = () => {
        setEditing(null);
        setValues(EMPTY);
        setError(null);
        nameRef.current?.focus();
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        const roleName = values.roleName.trim();
        if (!roleName) {
            setError("Role name is required");
            nameRef.current?.focus();
            return;
        }
        const clash = (rolesQuery.data ?? []).find(
            (r) => r.roleName?.trim().toLowerCase() === roleName.toLowerCase() && r.roleId !== editing?.roleId
        );
        if (clash) {
            setError("Role name already exists");
            nameRef.current?.focus();
            return;
        }
        try {
            await saveRole.mutateAsync({ roleId: editing?.roleId, input: { ...values, roleName } });
            addToast({ type: "success", title: editing ? "Role updated" : "Role created", message: roleName });
            reset();
        } catch (err) {
            setError(getApiErrorMessage(err));
            addToast({ type: "error", title: "Couldn't save role", message: getApiErrorMessage(err) });
        }
    };

    const confirmDelete = async () => {
        if (!toDelete) return;
        try {
            await deleteRole.mutateAsync(toDelete.roleId);
            addToast({ type: "success", title: "Role deleted", message: toDelete.roleName });
            if (editing?.roleId === toDelete.roleId) reset();
        } catch (err) {
            addToast({ type: "error", title: "Couldn't delete role", message: getApiErrorMessage(err) });
        } finally {
            setToDelete(null);
        }
    };

    return (
        <div className="grid min-w-0 grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            {/* Entry form */}
            <section className={card}>
                <CardHeader
                    icon={editing ? Pencil : Plus}
                    title={editing ? "Edit role" : "New role"}
                    subtitle={editing ? `Role ID ${editing.roleId}` : "Press Enter to move to the next field"}
                />
                <form onSubmit={submit} className="space-y-4 p-5" noValidate>
                    <Field label="Role name" htmlFor="role-name">
                        <input
                            id="role-name"
                            ref={nameRef}
                            className={`${inputClass} ${error ? "border-red-500 focus:border-red-500" : ""}`}
                            placeholder="e.g. Counter staff"
                            maxLength={100}
                            autoComplete="off"
                            value={values.roleName}
                            onChange={(e) => {
                                setValues((v) => ({ ...v, roleName: e.target.value.toUpperCase() }));
                                setError(null);
                            }}
                        />
                        {error && <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>}
                    </Field>
                    <Field label="Status" htmlFor="role-active" hint="Only active roles can be assigned to users">
                        <select
                            id="role-active"
                            className={inputClass}
                            value={values.active}
                            onChange={(e) => setValues((v) => ({ ...v, active: e.target.value as "Y" | "N" }))}
                        >
                            <option value="Y">Active</option>
                            <option value="N">Inactive</option>
                        </select>
                    </Field>
                    <div className="rounded-xl border border-border bg-muted/40 p-3">
                        <Switch
                            id="role-admin"
                            label="Admin access"
                            checked={values.adminAccess === "Y"}
                            onChange={(on) => setValues((v) => ({ ...v, adminAccess: on ? "Y" : "N" }))}
                        />
                        <p className="mt-1.5 pl-14 text-xs text-muted-foreground">Full access; skips the per-menu permissions.</p>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                        <button type="submit" data-enter-submit className={primaryButton} disabled={saveRole.isPending}>
                            {saveRole.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {editing ? "Update role" : "Create role"}
                        </button>
                        <button type="button" className={ghostButton} onClick={reset}>
                            <RotateCcw className="h-4 w-4" />
                            {editing ? "Cancel" : "Clear"}
                        </button>
                    </div>
                </form>
            </section>

            {/* List */}
            <section className={`${card} overflow-hidden`}>
                <CardHeader
                    icon={ShieldCheck}
                    title="Roles"
                    subtitle={`${rolesQuery.data?.length ?? 0} roles`}
                    actions={
                        <div className="relative w-full sm:w-64" data-enter-nav="off">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                className={`${inputClass} h-9 pl-9`}
                                placeholder="Search roles..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                aria-label="Search roles"
                            />
                        </div>
                    }
                />
                <div className="relative overflow-x-auto">
                    <table className="w-full min-w-[520px] text-sm">
                        <thead>
                            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                                <th className="px-5 py-2.5 font-medium">ID</th>
                                <th className="px-3 py-2.5 font-medium">Role name</th>
                                <th className="px-3 py-2.5 font-medium">Access</th>
                                <th className="px-3 py-2.5 font-medium">Status</th>
                                <th className="px-5 py-2.5 text-right font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {rolesQuery.isLoading &&
                                Array.from({ length: 4 }).map((_, i) => (
                                    <tr key={i}>
                                        <td colSpan={5} className="px-5 py-3">
                                            <div className="h-4 w-full animate-pulse rounded bg-muted" />
                                        </td>
                                    </tr>
                                ))}
                            {rolesQuery.isError && (
                                <tr>
                                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-red-600 dark:text-red-400">
                                        Couldn&apos;t load roles. {getApiErrorMessage(rolesQuery.error)}
                                        <button className="ml-2 font-semibold underline" onClick={() => rolesQuery.refetch()}>
                                            Retry
                                        </button>
                                    </td>
                                </tr>
                            )}
                            <AnimatePresence initial={false}>
                                {roles.map((role) => (
                                    <motion.tr
                                        key={role.roleId}
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className={`transition-colors hover:bg-muted/60 ${editing?.roleId === role.roleId ? "bg-accent-soft" : ""}`}
                                    >
                                        <td className="px-5 py-3 font-medium text-muted-foreground">{role.roleId}</td>
                                        <td className="px-3 py-3 font-semibold">{role.roleName || "—"}</td>
                                        <td className="px-3 py-3">
                                            {isY(role.adminAccess) ? (
                                                <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">Admin</span>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">By permissions</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-3">
                                            <StatusBadge active={isY(role.active)} />
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="flex justify-end gap-1">
                                                {onManagePermissions && (
                                                    <button
                                                        className={iconButton}
                                                        title="Permissions"
                                                        aria-label={`Permissions for ${role.roleName}`}
                                                        onClick={() => onManagePermissions(role)}
                                                    >
                                                        <KeyRound className="h-4 w-4" />
                                                    </button>
                                                )}
                                                <button className={iconButton} title="Edit" aria-label={`Edit ${role.roleName}`} onClick={() => setEditing(role)}>
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    className={`${iconButton} hover:bg-red-500/10 hover:text-red-600`}
                                                    title="Delete"
                                                    aria-label={`Delete ${role.roleName}`}
                                                    onClick={() => setToDelete(role)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                            {!rolesQuery.isLoading && !rolesQuery.isError && roles.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-muted-foreground">
                                        <Inbox className="mx-auto mb-2 h-6 w-6" />
                                        {search ? "No roles match your search" : "No roles yet. Create one on the left."}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <ConfirmDialog
                open={!!toDelete}
                title={`Delete role "${toDelete?.roleName}"?`}
                message="Its permissions are deleted too. A role that is assigned to users can't be deleted."
                confirmLabel="Delete"
                busy={deleteRole.isPending}
                onConfirm={confirmDelete}
                onCancel={() => setToDelete(null)}
            />
        </div>
    );
}
