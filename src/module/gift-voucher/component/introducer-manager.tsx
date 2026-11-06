"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Inbox, Loader2, Pencil, Plus, RotateCcw, Save, Search, Trash2, Users } from "lucide-react";
import { useToast } from "@/src/providers/toast-provider";
import ConfirmDialog from "@/src/components/ui/confirm-dialog";
import { CardHeader, Field, StatusBadge, card, ghostButton, iconButton, inputClass, primaryButton } from "@/src/module/role/component/ui";
import { getApiErrorMessage } from "../api/gift.api";
import { useDeleteIntroducer, useIntroducers, useSaveIntroducer } from "../hook/use-gift";
import type { Introducer, IntroducerInput } from "../type/gift-voucher.types";

const EMPTY: IntroducerInput = {
    introducerName: "", initial: "", active: "Y", mobile: "", email: "", doorno: "", street: "", area: "",
    city: "", state: "", pincode: "", dob: "", pan: "", gstno: "",
};

const fromRow = (i: Introducer): IntroducerInput => ({
    introducerName: i.introducerName ?? "", initial: i.initial ?? "", active: i.active === "N" ? "N" : "Y",
    mobile: i.mobile ?? "", email: i.email ?? "", doorno: i.doorno ?? "", street: i.street ?? "", area: i.area ?? "",
    city: i.city ?? "", state: i.state ?? "", pincode: i.pincode ?? "", dob: i.dob ?? "", pan: i.pan ?? "", gstno: i.gstno ?? "",
});

/** Same checks as the backend, so most mistakes show before saving. */
const validate = (v: IntroducerInput): Partial<Record<keyof IntroducerInput, string>> => {
    const e: Partial<Record<keyof IntroducerInput, string>> = {};
    const t = (s: string | null) => (s ?? "").trim();
    if (!t(v.introducerName)) e.introducerName = "Name is required";
    if (t(v.mobile) && !/^\+?[0-9]{7,15}$/.test(t(v.mobile))) e.mobile = "7 to 15 digits";
    if (t(v.email) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t(v.email))) e.email = "Invalid email";
    if (t(v.pincode) && !/^[1-9][0-9]{5}$/.test(t(v.pincode))) e.pincode = "6 digits, not starting with 0";
    if (t(v.pan) && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(t(v.pan).toUpperCase())) e.pan = "Format ABCDE1234F";
    if (t(v.gstno) && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(t(v.gstno).toUpperCase())) e.gstno = "15-character GST number";
    return e;
};

const FIELDS: { key: keyof IntroducerInput; label: string; type?: string; upper?: boolean; wide?: boolean; max?: number }[] = [
    { key: "introducerName", label: "Introducer name", upper: true, wide: true, max: 150 },
    { key: "initial", label: "Initial", upper: true, max: 20 },
    { key: "mobile", label: "Mobile", type: "tel", max: 16 },
    { key: "email", label: "Email", type: "email", max: 254 },
    { key: "doorno", label: "Door no", max: 50 },
    { key: "street", label: "Street", max: 150 },
    { key: "area", label: "Area", max: 100 },
    { key: "city", label: "City", max: 100 },
    { key: "state", label: "State", max: 100 },
    { key: "pincode", label: "Pincode", max: 6 },
    { key: "dob", label: "Date of birth", type: "date" },
    { key: "pan", label: "PAN", upper: true, max: 10 },
    { key: "gstno", label: "GST no", upper: true, max: 15 },
];

/** Introducer master: entry form beside the list. */
export default function IntroducerManager() {
    const { addToast } = useToast();
    const query = useIntroducers();
    const save = useSaveIntroducer();
    const remove = useDeleteIntroducer();

    const [editing, setEditing] = useState<Introducer | null>(null);
    const [values, setValues] = useState<IntroducerInput>(EMPTY);
    const [errors, setErrors] = useState<Partial<Record<keyof IntroducerInput, string>>>({});
    const [search, setSearch] = useState("");
    const [toDelete, setToDelete] = useState<Introducer | null>(null);
    const nameRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setValues(editing ? fromRow(editing) : EMPTY);
        setErrors({});
        nameRef.current?.focus();
    }, [editing]);

    const rows = useMemo(() => {
        const q = search.trim().toLowerCase();
        const list = query.data ?? [];
        return q
            ? list.filter((i) => [i.introducerName, i.mobile, i.city, String(i.id)].some((s) => (s ?? "").toLowerCase().includes(q)))
            : list;
    }, [query.data, search]);

    const reset = () => {
        setEditing(null);
        setValues(EMPTY);
        setErrors({});
        nameRef.current?.focus();
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        const found = validate(values);
        setErrors(found);
        if (Object.keys(found).length) {
            document.getElementById(`intro-${Object.keys(found)[0]}`)?.focus();
            return;
        }
        try {
            await save.mutateAsync({ id: editing?.id, input: values });
            addToast({ type: "success", title: editing ? "Introducer updated" : "Introducer created", message: values.introducerName.trim() });
            reset();
        } catch (err) {
            addToast({ type: "error", title: "Couldn't save introducer", message: getApiErrorMessage(err) });
        }
    };

    const confirmDelete = async () => {
        if (!toDelete) return;
        try {
            await remove.mutateAsync(toDelete.id);
            addToast({ type: "success", title: "Introducer deleted", message: toDelete.introducerName });
            if (editing?.id === toDelete.id) reset();
        } catch (err) {
            addToast({ type: "error", title: "Couldn't delete introducer", message: getApiErrorMessage(err) });
        } finally {
            setToDelete(null);
        }
    };

    return (
        <div className="grid min-w-0 grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
            <section className={card}>
                <CardHeader
                    icon={editing ? Pencil : Plus}
                    title={editing ? "Edit introducer" : "New introducer"}
                    subtitle={editing ? `Introducer ID ${editing.id}` : "Press Enter to move to the next field"}
                />
                <form onSubmit={submit} className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2" noValidate>
                    {FIELDS.map((f) => (
                        <div key={f.key} className={f.wide ? "sm:col-span-2" : ""}>
                            <Field label={f.label} htmlFor={`intro-${f.key}`}>
                                <input
                                    id={`intro-${f.key}`}
                                    ref={f.key === "introducerName" ? nameRef : undefined}
                                    type={f.type ?? "text"}
                                    maxLength={f.max}
                                    autoComplete="off"
                                    className={`${inputClass} ${errors[f.key] ? "border-red-500 focus:border-red-500" : ""}`}
                                    value={(values[f.key] as string) ?? ""}
                                    onChange={(e) => {
                                        const v = f.upper ? e.target.value.toUpperCase() : e.target.value;
                                        setValues((p) => ({ ...p, [f.key]: v }));
                                        if (errors[f.key]) setErrors((p) => ({ ...p, [f.key]: undefined }));
                                    }}
                                />
                                {errors[f.key] && <p className="text-xs font-medium text-red-600 dark:text-red-400">{errors[f.key]}</p>}
                            </Field>
                        </div>
                    ))}
                    <Field label="Status" htmlFor="intro-active">
                        <select
                            id="intro-active"
                            className={inputClass}
                            value={values.active}
                            onChange={(e) => setValues((p) => ({ ...p, active: e.target.value }))}
                        >
                            <option value="Y">Active</option>
                            <option value="N">Inactive</option>
                        </select>
                    </Field>
                    <div className="flex flex-wrap items-end gap-2 sm:col-span-2">
                        <button type="submit" data-enter-submit className={primaryButton} disabled={save.isPending}>
                            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {editing ? "Update introducer" : "Save introducer"}
                        </button>
                        <button type="button" className={ghostButton} onClick={reset}>
                            <RotateCcw className="h-4 w-4" />
                            {editing ? "Cancel" : "Clear"}
                        </button>
                    </div>
                </form>
            </section>

            <section className={`${card} overflow-hidden`}>
                <CardHeader
                    icon={Users}
                    title="Introducers"
                    subtitle={`${query.data?.length ?? 0} introducers`}
                    actions={
                        <div className="relative w-full sm:w-64" data-enter-nav="off">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                className={`${inputClass} h-9 pl-9`}
                                placeholder="Search name, mobile, city..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                aria-label="Search introducers"
                            />
                        </div>
                    }
                />
                <div className="relative overflow-x-auto">
                    <table className="w-full min-w-[600px] text-sm">
                        <thead>
                            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                                <th className="px-5 py-2.5 font-medium">ID</th>
                                <th className="px-3 py-2.5 font-medium">Name</th>
                                <th className="px-3 py-2.5 font-medium">Mobile</th>
                                <th className="px-3 py-2.5 font-medium">City</th>
                                <th className="px-3 py-2.5 font-medium">Status</th>
                                <th className="px-5 py-2.5 text-right font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {query.isLoading &&
                                Array.from({ length: 4 }).map((_, i) => (
                                    <tr key={i}>
                                        <td colSpan={6} className="px-5 py-3">
                                            <div className="h-4 w-full animate-pulse rounded bg-muted" />
                                        </td>
                                    </tr>
                                ))}
                            {query.isError && (
                                <tr>
                                    <td colSpan={6} className="px-5 py-10 text-center text-sm text-red-600 dark:text-red-400">
                                        Couldn&apos;t load introducers. {getApiErrorMessage(query.error)}
                                    </td>
                                </tr>
                            )}
                            {rows.map((i) => (
                                <tr key={i.id} className={`transition-colors hover:bg-muted/60 ${editing?.id === i.id ? "bg-accent-soft" : ""}`}>
                                    <td className="px-5 py-3 font-medium text-muted-foreground">{i.id}</td>
                                    <td className="px-3 py-3">
                                        <p className="font-semibold">
                                            {i.introducerName}
                                            {i.initial ? ` ${i.initial}` : ""}
                                        </p>
                                        {i.email && <p className="text-xs text-muted-foreground">{i.email}</p>}
                                    </td>
                                    <td className="px-3 py-3">{i.mobile || "—"}</td>
                                    <td className="px-3 py-3">{i.city || "—"}</td>
                                    <td className="px-3 py-3">
                                        <StatusBadge active={i.active !== "N"} />
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="flex justify-end gap-1">
                                            <button className={iconButton} title="Edit" aria-label={`Edit ${i.introducerName}`} onClick={() => setEditing(i)}>
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button
                                                className={`${iconButton} hover:bg-red-500/10 hover:text-red-600`}
                                                title="Delete"
                                                aria-label={`Delete ${i.introducerName}`}
                                                onClick={() => setToDelete(i)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!query.isLoading && !query.isError && rows.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-5 py-10 text-center text-sm text-muted-foreground">
                                        <Inbox className="mx-auto mb-2 h-6 w-6" />
                                        {search ? "No introducers match your search" : "No introducers yet. Add one on the left."}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <ConfirmDialog
                open={!!toDelete}
                title={`Delete introducer "${toDelete?.introducerName}"?`}
                message="An introducer with gift entries can't be deleted."
                confirmLabel="Delete"
                busy={remove.isPending}
                onConfirm={confirmDelete}
                onCancel={() => setToDelete(null)}
            />
        </div>
    );
}
