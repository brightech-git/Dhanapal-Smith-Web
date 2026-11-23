"use client";

import { Dialog, DialogTitle } from "@mui/material";
import ComboBox from "@/src/components/ui/combo-box";
import MetalForm, { metalQueryKey, metalSaveKey, type Metal } from "@/src/module/metal/metal-form";
import { fetchItems, itemQueryKey, type Item } from "@/src/module/item/item-form";
import { useState, type FormEvent } from "react";
import { useIsMutating, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, getApiErrorMessage } from "@/lib/api/envelope";
import ProtectedRoute from "@/src/components/app-shell/protected-route";
import { useAuth } from "@/src/features/auth/lib/auth-context";
import { canMenuAction } from "@/src/features/auth/lib/access";

import { useToast } from "@/src/providers/toast-provider";
import { useFormFocus } from "@/src/hooks/use-form-focus";
import TextInput from "@/src/components/ui/text-input";
import NativeSelect, { YES_NO_OPTIONS } from "@/src/components/ui/native-select";

const empty = { metalId: "", itemName: "", active: "Y" };
const row = "grid grid-cols-[100px_minmax(0,1fr)] items-center gap-2 text-xs font-medium";
const field = "w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function ItemMaster() {
    const { addToast } = useToast();
    const { allDetails } = useAuth();
    const canAdd = canMenuAction(allDetails, "items", "add");
    const canEdit = canMenuAction(allDetails, "items", "edit");
    const canAddMetal = canMenuAction(allDetails, "metals", "add");
    const savingMetal = useIsMutating({ mutationKey: metalSaveKey }) > 0;
    const [addMetalOpen, setAddMetalOpen] = useState(false);
    const [editing, setEditing] = useState<number | null>(null);
    const [form, setForm] = useState(empty);
    const client = useQueryClient();
    const list = useQuery({ queryKey: itemQueryKey, queryFn: () => fetchItems() });

    const metals = useQuery({ queryKey: metalQueryKey, queryFn: () => api.get<Metal[]>("metal") });
    const save = useMutation({
        mutationFn: (values: Omit<Item, "itemId">) => editing !== null
            ? api.put<Item>(`item/${editing}`, values)
            : api.post<Item>("item", values),
        onError: (error) => {
            addToast({ type: "error", title: "Could not save item", message: getApiErrorMessage(error) });
        },
        onSuccess: () => {
            setEditing(null);
            setForm(empty);
            focusFirstField();
            return client.invalidateQueries({ queryKey: itemQueryKey });
        },
    });

    const { formRef, focusFirstField } = useFormFocus(save.isPending);

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (save.isPending || !(editing ? canEdit : canAdd)) return;
        if (!form.metalId) {
            addToast({ type: "error", title: "Metal required", message: "Select a Metal ID before saving." });
            return;
        }
        save.mutate({ ...form, itemName: form.itemName.trim() });
    }

    return (
        <div className="mx-auto grid w-full  items-start gap-4 p-3 sm:p-5 xl:grid-cols-[minmax(20rem,24rem)_minmax(0,1fr)]">
            {/* <h1 className="text-2xl font-semibold tracking-tight xl:col-span-2">Item Master</h1> */}
            {(canAdd || (canEdit && editing)) && (
                <form ref={formRef} onSubmit={submit} onReset={(event) => {
                    event.preventDefault();
                    if (save.isPending) return;
                    setEditing(null);
                    setForm(empty);
                    save.reset();
                    focusFirstField();
                }} className="space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5">
                    {/* <h2 className="font-semibold">{editing ? "Edit item" : "Add item"}</h2> */}
                    <fieldset disabled={save.isPending} className="grid min-w-0 gap-3">

                        <label className={row}>
                            <span>ITEM ID</span>
                            <TextInput className="max-w-[100px]" value={editing ?? list.data?.nextId ?? ""} onChange={() => undefined} placeholder="Auto" disabled />
                        </label>
                        <div className={row}>
                            <span id="item-metal-label">METAL NAME</span>
                            <div className="min-w-0 max-w-[200px]">
                                <ComboBox id="item-metal" labelId="item-metal-label" required value={form.metalId}
                                    disabled={save.isPending}
                                    placeholder={metals.isPending ? "Loading metals…" : "Select metal"}
                                    options={(metals.data ?? []).map((metal) => ({
                                        value: metal.metalId,
                                        label: `${metal.metalId} · ${metal.metalName}`,
                                    }))}
                                    onChange={(metalId) => setForm((current) => ({ ...current, metalId }))}
                                    addNew={canAddMetal} onAddNew={() => setAddMetalOpen(true)} />
                            </div>
                        </div>
                       
                        <label className={row}>
                            <span>ITEM NAME</span>
                            <TextInput className="max-w-[200px]" value={form.itemName} maxLength={100} required
                                onChange={(itemName) => setForm({ ...form, itemName })} />
                        </label>
                        {/* <label className={row}>
                            <span>DISPLAY ORDER</span>
                            <input className={`${field} max-w-[100px]`} type="number" step="1" min={-2147483648} max={2147483647} required value={form.displayOrder}
                                onChange={(event) => setForm({ ...form, displayOrder: event.target.value })} />
                        </label> */}
                        <label className={row}>
                            <span>ACTIVE</span>
                            <NativeSelect className={field} wrapperClassName="max-w-[100px]" value={form.active} options={YES_NO_OPTIONS}
                                onChange={(active) => setForm({ ...form, active })} />
                        </label>
                    </fieldset>
                    {metals.isError && <p role="alert" className="text-sm text-red-600">{getApiErrorMessage(metals.error)}</p>}
                    {metals.isSuccess && metals.data.length === 0 && !canAddMetal && <p className="text-sm text-muted-foreground">Add a metal in Metal Master before creating an item.</p>}
                    <div className="flex flex-wrap gap-2">
                        <button type="submit" disabled={save.isPending} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
                            {save.isPending ? "Saving…" : editing ? "Save changes" : "Add item"}
                        </button>
                        <button type="reset" disabled={save.isPending} className="rounded-lg border border-border px-4 py-2 text-sm">Reset</button>
                {editing && <button type="button" disabled={save.isPending} className="rounded-lg border border-border px-4 py-2 text-sm"
                            onClick={() => { setEditing(null); setForm(empty); save.reset(); focusFirstField(); }}>Cancel</button>}
                    </div>
                    {save.isError && <p role="alert" className="text-sm text-red-600">{getApiErrorMessage(save.error)}</p>}
                </form>
            )}
            <div className={`min-w-0 overflow-hidden rounded-xl border border-border bg-card ${canAdd || (canEdit && editing) ? "" : "xl:col-span-2"}`}>
                <h2 className="border-b border-border px-4 py-3 font-semibold">ITEM LIST</h2>
                {list.isPending && <p role="status" className="p-4 text-sm text-muted-foreground">Loading items…</p>}
                {list.isError && <p role="alert" className="p-4 text-sm text-red-600">{getApiErrorMessage(list.error)}</p>}
                {list.isSuccess && (list.data.items.length ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted text-muted-foreground">
                                <tr>
                                    <th scope="col" className="px-4 py-3">METAL ID</th>
                                    <th scope="col" className="px-4 py-3">ITEM ID</th>
                                    <th scope="col" className="px-4 py-3">ITEM NAME</th>
                                    <th scope="col" className="px-4 py-3">ACTIVE</th>
                                    {canEdit && <th scope="col" className="px-4 py-3">ACTIONS</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {list.data?.items.map((item) => (
                                    <tr key={item.itemId} className={`border-t border-border ${editing === item.itemId ? "bg-accent-soft" : "hover:bg-muted/50"}`}>
                                        <td className="px-4 py-3 font-medium">{item.metalId}</td>
                                        <td className="px-4 py-3 tabular-nums">{item.itemId}</td>
                                        <td className="px-4 py-3">{item.itemName}</td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-md px-2 py-1 text-xs font-medium ${item.active === "Y" ? "bg-accent-soft text-primary-text" : "bg-muted text-muted-foreground"}`}>
                                                {item.active === "Y" ? "Yes" : "No"}
                                            </span>
                                        </td>
                                        {canEdit && <td className="px-4 py-3"><button type="button" disabled={save.isPending}
                                            aria-label={`Edit ${item.itemName}`} className="font-medium text-primary-text hover:underline"
                                            onClick={() => {
                                                save.reset();
                                                setEditing(item.itemId);
                                                setForm({ metalId: item.metalId, itemName: item.itemName, active: item.active });
                                            }}>Edit</button></td>}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : <p className="p-4 text-sm text-muted-foreground">No items have been added.</p>)}
            </div>
            {canAddMetal && (
                <Dialog open={addMetalOpen} onClose={() => { if (!savingMetal) setAddMetalOpen(false); }} aria-labelledby="add-metal-title"
                    fullWidth maxWidth="xs" slotProps={{ paper: { sx: { backgroundColor: "var(--card)", color: "var(--foreground)" } } }}>
                    <DialogTitle id="add-metal-title">Add metal</DialogTitle>
                    {addMetalOpen && <MetalForm showHeading={false} onCancel={() => setAddMetalOpen(false)}
                        onSaved={(metal) => {
                            setForm((current) => ({ ...current, metalId: metal.metalId }));
                            setAddMetalOpen(false);
                        }} />}
                </Dialog>
            )}
        </div>
    );
}

export default function ItemMasterRoute() {
    return <ProtectedRoute><ItemMaster /></ProtectedRoute>;
}

