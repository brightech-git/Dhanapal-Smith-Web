"use client";

import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, getApiErrorMessage } from "@/lib/api/envelope";
import ComboBox from "@/src/components/ui/combo-box";
import { metalQueryKey, type Metal } from "@/src/module/metal/metal-form";
import { useToast } from "@/src/providers/toast-provider";
import { useFormFocus } from "@/src/hooks/use-form-focus";
import TextInput from "@/src/components/ui/text-input";
import NativeSelect, { YES_NO_OPTIONS } from "@/src/components/ui/native-select";

// GET /item returns { nextId, items }; active is "Y" or "N". Same query key and
// shape as Item Master, so both screens share one cache entry.
export type Item = { itemId: number; metalId: string; itemName: string; active: string; metalName?: string | null };
export type ItemFilters = {
    active?: "Y" | "N";
    metalId?: string;
}
export type ItemList = { nextId: number; items: Item[] };
export const itemQueryKey = ["items"];
/** GET /item, optionally filtered. The backend's query params are ACTIVE and METALID. */
export const fetchItems = (filter: ItemFilters = {}) => {
    const params: Record<string, string> = {};
    if (filter.active) params.ACTIVE = filter.active;
    if (filter.metalId) params.METALID = filter.metalId;
    // api.get already sends its second argument as the query string.
    return api.get<ItemList>("item", params);
};

const empty = { metalId: "", itemName: "", active: "Y" };
const row = "grid grid-cols-[100px_minmax(0,1fr)] items-center gap-2 text-xs font-medium";
const field = "w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** Add-item form, used in the "Add new" item dialog. Same fields as Item Master. */
export default function ItemForm({ onSaved, onCancel, defaultMetalId = "" , metalDisable = false}: {
    onSaved: (item: Item) => void;
    onCancel?: () => void;
    /** Pre-selects this metal (e.g. the metal chosen on the transactions page). */
    defaultMetalId?: string;
    metalDisable ? :boolean
}) {
    const { addToast } = useToast();
    const client = useQueryClient();
    const [form, setForm] = useState({ ...empty, metalId: defaultMetalId });
    const items = useQuery({ queryKey: itemQueryKey, queryFn: () => fetchItems() });
    const metals = useQuery({ queryKey: metalQueryKey, queryFn: () => api.get<Metal[]>("metal") });
    const save = useMutation({
        mutationFn: (values: Omit<Item, "itemId">) => api.post<Item>("item", values),
        onError: (error) => addToast({ type: "error", title: "Could not save item", message: getApiErrorMessage(error) }),
        onSuccess: (saved) => {
            setForm({ ...empty, metalId: defaultMetalId });
            focusFirstField();
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

    const { formRef, focusFirstField } = useFormFocus(save.isPending);

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
        <form ref={formRef} onSubmit={submit} onReset={(event) => {
                event.preventDefault();
                if (save.isPending) return;
                setForm({ ...empty, metalId: defaultMetalId });
                save.reset();
                focusFirstField();
            }} className="space-y-4 p-4 sm:p-5">
            <fieldset disabled={save.isPending} className="grid min-w-0 gap-3">
                <div className={row}>
                    <span id="new-item-metal-label">METAL NAME</span>
                    <div className="min-w-0 max-w-[220px]">
                        <ComboBox id="new-item-metal" labelId="new-item-metal-label" required value={form.metalId}
                            placeholder={metals.isPending ? "Loading metals…" : "Select metal"}
                            options={(metals.data ?? []).map((metal) => ({ value: metal.metalId, label: `${metal.metalId} · ${metal.metalName}` }))}
                            onChange={(metalId) => setForm((current) => ({ ...current, metalId }))}
                            disabled = {metalDisable}
                            />
                    </div>
                </div>
                <label className={row}>
                    <span>ITEM ID</span>
                    <TextInput className="max-w-[100px]" value={items.data?.nextId ?? ""} onChange={() => undefined} placeholder="Auto" disabled />
                </label>
                <label className={row}>
                    <span>ITEM NAME</span>
                    <TextInput className="max-w-[220px]" value={form.itemName} maxLength={100} required
                        onChange={(itemName) => setForm({ ...form, itemName })} />
                </label>
                <label className={row}>
                    <span>ACTIVE</span>
                    <NativeSelect className={field} wrapperClassName="max-w-[100px]" value={form.active} options={YES_NO_OPTIONS}
                        onChange={(active) => setForm({ ...form, active })} />
                </label>
            </fieldset>
            {metals.isError && <p role="alert" className="text-sm text-red-600">{getApiErrorMessage(metals.error)}</p>}
            <div className="flex flex-wrap gap-2">
                <button type="submit" data-enter-submit disabled={save.isPending} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
                    {save.isPending ? "Saving…" : "Add item"}
                </button>
                <button type="reset" disabled={save.isPending} className="rounded-lg border border-border px-4 py-2 text-sm">Reset</button>
                {onCancel && <button type="button" disabled={save.isPending} className="rounded-lg border border-border px-4 py-2 text-sm" onClick={onCancel}>Cancel</button>}
            </div>
        </form>
    );
}
