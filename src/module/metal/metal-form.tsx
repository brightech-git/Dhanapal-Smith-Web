"use client";

import { isAxiosError } from "axios";
import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getApiErrorMessage } from "@/lib/api/envelope";
import { useAuth } from "@/src/features/auth/lib/auth-context";
import { canMenuAction } from "@/src/features/auth/lib/access";

import { useToast } from "@/src/providers/toast-provider";

export type ListMetal = {sno:number, metalId: string; metalName: string; displayOrder: number; active: string };
export type Metal = {metalId: string; metalName: string; displayOrder: number; active: string };
export const metalQueryKey = ["metals"];
export const metalSaveKey = ["save-metal"];
const empty = { metalId: "", metalName: "", displayOrder: "", active: "Y" };
const row = "grid grid-cols-[100px_minmax(0,1fr)] items-center gap-2 text-sm font-medium";
const field = "w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default function MetalForm({ metal, onSaved, onCancel, showHeading = true }: {
    metal?: ListMetal;
    onSaved: (metal: Metal) => void;
    onCancel?: () => void;
    showHeading?: boolean;
}) {
    const { addToast } = useToast();
    const { allDetails } = useAuth();
    const canAdd = canMenuAction(allDetails, "metals", "add");
    const canEdit = canMenuAction(allDetails, "metals", "edit");
    const editing = metal?.metalId ?? null;
    const [form, setForm] = useState(metal ? { ...metal, displayOrder: String(metal.displayOrder) } : empty);
    const client = useQueryClient();
    const save = useMutation({
        mutationKey: metalSaveKey,
        mutationFn: ({ metalId, ...values }: Metal) => editing
            ? api.put<Metal>(`metal/${metal?.sno}`, { metalId, ...values })
            : api.post<Metal>("metal", { metalId, ...values }),
        onError: (error) => {
            const duplicate = isAxiosError(error) && error.response?.status === 409;
            addToast({
                type: "error",
                title: duplicate ? "Duplicate Metal ID" : "Could not save metal",
                message: duplicate ? "Metal ID already exists" : getApiErrorMessage(error),
            });
        },
        onSuccess: (saved) => {
            setForm(empty);
            client.setQueryData<Metal[]>(metalQueryKey, (previous = []) =>
                [...previous.filter((entry) => entry.metalId !== editing && entry.metalId !== saved.metalId), saved]
                    .sort((a, b) => a.displayOrder - b.displayOrder || a.metalId.localeCompare(b.metalId)));
            onSaved(saved);
            return client.invalidateQueries({ queryKey: metalQueryKey });
        },
    });

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (save.isPending || !(editing ? canEdit : canAdd)) return;
        const metalId = form.metalId.toUpperCase();
        if (client.getQueryData<Metal[]>(metalQueryKey)?.some((metal) => metal.metalId !== editing && metal.metalId.toUpperCase() === metalId)) {
            addToast({ type: "error", title: "Duplicate Metal ID", message: "Metal ID already exists" });
            return;
        }
        save.mutate({ ...form, metalId, metalName: form.metalName.trim(), displayOrder: Number(form.displayOrder) });
    }

    if (!(editing ? canEdit : canAdd)) return null;

    return (
        <form onSubmit={submit} className="space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5">
            {showHeading && <h2 className="font-semibold">{editing ? "Edit metal" : "Add metal"}</h2>}
            <fieldset disabled={save.isPending} className="grid min-w-0 gap-3">
                <label className={row}>
                    <span>Metal ID</span>
                    <input className={`${field} max-w-[100px]`} value={form.metalId} maxLength={1} pattern="[A-Za-z]" title="Enter one letter (A-Z)" required
                        onChange={(event) => setForm({ ...form, metalId: event.target.value.replace(/[^A-Za-z]/g, "").toUpperCase() })} />
                </label>
                <label className={row}>
                    <span>Metal name</span>
                    <input className={`${field} max-w-[200px]`} value={form.metalName} maxLength={100} required
                        onChange={(event) => setForm({ ...form, metalName: event.target.value })} />
                </label>
                <label className={row}>
                    <span>Display order</span>
                    <input className={`${field} max-w-[100px]`} type="number" step="1" min={-2147483648} max={2147483647} required value={form.displayOrder}
                        onChange={(event) => setForm({ ...form, displayOrder: event.target.value })} />
                </label>
                <label className={row}>
                    <span>Active</span>
                    <select className={`${field} max-w-[100px]`} value={form.active}
                        onChange={(event) => setForm({ ...form, active: event.target.value })}>
                        <option value="Y">Yes</option>
                        <option value="N">No</option>
                    </select>
                </label>
            </fieldset>
            <div className="flex flex-wrap gap-2">
                <button type="submit" disabled={save.isPending} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
                    {save.isPending ? "Saving…" : editing ? "Save changes" : "Add metal"}
                </button>
                {onCancel && <button type="button" disabled={save.isPending} className="rounded-lg border border-border px-4 py-2 text-sm"
                    onClick={onCancel}>Cancel</button>}
            </div>
            {save.isError && <p role="alert" className="text-sm text-red-600">{getApiErrorMessage(save.error)}</p>}
        </form>
    );
}
