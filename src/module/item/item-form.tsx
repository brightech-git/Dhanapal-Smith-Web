"use client";

import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, getApiErrorMessage } from "@/lib/api/envelope";
import ComboBox from "@/src/components/ui/combo-box";
import { metalQueryKey, type Metal } from "@/src/module/metal/metal-form";
import { useToast } from "@/src/providers/toast-provider";

// GET /item returns { nextId, items }; active is "Y" or "N". Same query key and
// shape as Item Master, so both screens share one cache entry.
export type Item = { itemId: number; metalId: string; itemName: string; active: string; metalName?: string | null };
export type ItemList = { nextId: number; items: Item[] };
export const itemQueryKey = ["items"];
export const fetchItems = () => api.get<ItemList>("item");
export const activeItems = (list?: ItemList | null) => (list?.items ?? []).filter((item) => item.active !== "N");

const empty = { metalId: "", itemName: "", active: "Y" };
const row = "grid grid-cols-[100px_minmax(0,1fr)] items-center gap-2 text-sm font-medium";
const field = "w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** Add-item form, used in the "Add new" item dialog. Same fields as Item Master. */
export default function ItemForm({ onSaved, onCancel }: { onSaved: (item: Item) => void; onCancel?: () => void }) {
    const { addToast } = useToast();
    const client = useQueryClient();
    const [form, setForm] = useState(empty);
    const items = useQuery({ queryKey: itemQueryKey, queryFn: fetchItems });
    const metals = useQuery({ queryKey: metalQueryKey, queryFn: () => api.get<Metal[]>("metal") });
    const save = useMutation({
        mutationFn: (values: Omit<Item, "itemId">) => api.post<Item>("item", values),
        onError: (error) => addToast({ type: "error", title: "Could not save item", message: getApiErrorMessage(error) }),
        onSuccess: (saved) => {
            if (saved?.itemId != null) {
                client.setQueryData<ItemList>(itemQueryKey, (previous) => previous && {
                    ...previous,
                    items: [...previous.items.filter((i) => i.itemId !== saved.itemId), saved],
                });
            }
            onSaved(saved);
            return client.invalidateQueries({ queryKey: itemQueryKey });
        },
    });

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (save.isPending) return;
        if (!form.metalId) {
            addToast({ type: "error", title: "Metal required", message: "Select a Metal ID before saving." });
            return;
        }
        save.mutate({ ...form, itemName: form.itemName.trim() });
    }

    return (
        <form onSubmit={submit} className="space-y-4 p-4 sm:p-5">
            <fieldset disabled={save.isPending} className="grid min-w-0 gap-3">
                <div className={row}>
                    <span id="new-item-metal-label">Metal ID</span>
                    <div className="min-w-0 max-w-[220px]">
                        <ComboBox id="new-item-metal" labelId="new-item-metal-label" required value={form.metalId}
                            disabled={save.isPending}
                            placeholder={metals.isPending ? "Loading metals…" : "Select metal"}
                            options={(metals.data ?? []).map((metal) => ({ value: metal.metalId, label: `${metal.metalId} · ${metal.metalName}` }))}
                            onChange={(metalId) => setForm((current) => ({ ...current, metalId }))} />
                    </div>
                </div>
                <label className={row}>
                    <span>Item ID</span>
                    <input className={`${field} max-w-[100px] disabled:opacity-60`} value={items.data?.nextId ?? ""} placeholder="Auto" disabled />
                </label>
                <label className={row}>
                    <span>Item name</span>
                    <input className={`${field} max-w-[220px]`} value={form.itemName} maxLength={100} required autoFocus
                        onChange={(event) => setForm({ ...form, itemName: event.target.value })} />
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
            {metals.isError && <p role="alert" className="text-sm text-red-600">{getApiErrorMessage(metals.error)}</p>}
            <div className="flex flex-wrap gap-2">
                <button type="submit" data-enter-submit disabled={save.isPending} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
                    {save.isPending ? "Saving…" : "Add item"}
                </button>
                {onCancel && <button type="button" disabled={save.isPending} className="rounded-lg border border-border px-4 py-2 text-sm" onClick={onCancel}>Cancel</button>}
            </div>
        </form>
    );
}
