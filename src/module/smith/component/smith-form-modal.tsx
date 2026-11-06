"use client";

import React, { useEffect, useRef, useState } from "react";
import { Loader2, Pencil, Save, UserPlus } from "lucide-react";
import Modal from "@/src/components/ui/modal";
import DateInput from "@/src/components/ui/date-input";
import { Field, ghostButton, inputClass, primaryButton } from "@/src/module/role/component/ui";
import { INDIAN_STATES, partyFieldError } from "@/src/lib/party-validation";
import { useSmithDetails } from "@/src/module/smith/context/smith-details-context";
import { useSmithTransactionsContext } from "@/src/module/smith/context/smith-transactions-context";
import { useToast } from "@/src/providers/toast-provider";
import type { SmithDetails } from "@/src/module/smith/type/smith-details.types";

type Key = Exclude<keyof SmithDetails, "smithId" | "active" | "createdAt" | "updatedAt">;

const FIELDS: { key: Key; label: string; type?: string; upper?: boolean; wide?: boolean; max?: number }[] = [
    { key: "pname", label: "Smith name", upper: true, wide: true, max: 150 },
    { key: "initial", label: "Initial", upper: true, max: 20 },
    { key: "mobile", label: "Mobile", type: "tel", max: 16 },
    { key: "email", label: "Email", type: "email", max: 254 },
    { key: "dob", label: "Date of birth", type: "date" },
    { key: "doorno", label: "Door no", max: 50 },
    { key: "address1", label: "Street", max: 150 },
    { key: "area", label: "Area", max: 100 },
    { key: "city", label: "City", max: 100 },
    { key: "state", label: "State" },
    { key: "pincode", label: "Pincode", max: 6 },
    { key: "pan", label: "PAN", upper: true, max: 10 },
    { key: "gstno", label: "GST no", upper: true, max: 15 },
];

export interface SmithFormModalProps {
    open: boolean;
    /** The smith to edit; null or undefined creates a new one. */
    smith?: SmithDetails | null;
    /** Prefills the name when creating (e.g. from the quick-create box). */
    initialName?: string;
    onClose: () => void;
    onSaved?: (smith: SmithDetails) => void;
}

/** Create or edit a smith with all details, in a modal. */
export default function SmithFormModal({ open, smith, initialName, onClose, onSaved }: SmithFormModalProps) {
    const { createSmith, updateSmith } = useSmithDetails();
    const { refetch } = useSmithTransactionsContext();
    const { addToast } = useToast();
    const [values, setValues] = useState<SmithDetails>({ active: "Y" });
    const [errors, setErrors] = useState<Partial<Record<Key, string>>>({});
    const [saving, setSaving] = useState(false);
    const nameRef = useRef<HTMLInputElement>(null);
    const editing = !!smith?.smithId;

    useEffect(() => {
        if (!open) return;
        setValues(smith ? { ...smith } : { active: "Y", pname: (initialName ?? "").toUpperCase() });
        setErrors({});
        setTimeout(() => nameRef.current?.focus(), 60);
    }, [open, smith, initialName]);

    const set = (k: Key | "active", v: string) => {
        setValues((p) => ({ ...p, [k]: v }));
        if (errors[k as Key]) setErrors((p) => ({ ...p, [k]: undefined }));
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        const found: Partial<Record<Key, string>> = {};
        if (!(values.pname ?? "").trim()) found.pname = "Smith name is required";
        FIELDS.forEach((f) => {
            const err = partyFieldError(f.key, values[f.key] as string);
            if (err) found[f.key] = err;
        });
        setErrors(found);
        if (Object.keys(found).length) {
            document.getElementById(`smith-${Object.keys(found)[0]}`)?.focus();
            return;
        }
        setSaving(true);
        try {
            const saved = editing ? await updateSmith(values) : await createSmith(values);
            addToast({ type: "success", title: editing ? "Smith updated" : "Smith created", message: saved.pname ?? values.pname ?? "" });
            refetch(); // balances list shows smiths by name
            onSaved?.(saved);
            onClose();
        } catch (err) {
            addToast({ type: "error", title: "Couldn't save smith", message: (err as Error)?.message });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            open={open}
            busy={saving}
            onClose={onClose}
            icon={editing ? Pencil : UserPlus}
            title={editing ? `Edit ${smith?.pname ?? "smith"}` : "New smith"}
            subtitle="Only the name is required. Press Enter to move to the next field."
        >
            <form id="smith-form" onSubmit={submit} className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2" noValidate>
                {FIELDS.map((f) => (
                    <div key={f.key} className={f.wide ? "sm:col-span-2" : ""}>
                        <Field label={f.label} htmlFor={`smith-${f.key}`}>
                            {f.type === "date" ? (
                                <DateInput
                                    id={`smith-${f.key}`}
                                    className={`${inputClass} ${errors[f.key] ? "border-red-500" : ""}`}
                                    value={(values[f.key] as string) ?? ""}
                                    maxDate={new Date()}
                                    onChange={(v) => set(f.key, v)}
                                />
                            ) : f.key === "state" ? (
                                <select id="smith-state" className={inputClass} value={values.state ?? ""} onChange={(e) => set("state", e.target.value)}>
                                    <option value="">Select state…</option>
                                    {INDIAN_STATES.map((s) => (
                                        <option key={s} value={s}>
                                            {s}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    id={`smith-${f.key}`}
                                    ref={f.key === "pname" ? nameRef : undefined}
                                    type={f.type ?? "text"}
                                    maxLength={f.max}
                                    autoComplete="off"
                                    className={`${inputClass} ${errors[f.key] ? "border-red-500 focus:border-red-500" : ""}`}
                                    value={(values[f.key] as string) ?? ""}
                                    onChange={(e) => set(f.key, f.upper ? e.target.value.toUpperCase() : e.target.value)}
                                />
                            )}
                            {errors[f.key] && <p className="text-xs font-medium text-red-600 dark:text-red-400">{errors[f.key]}</p>}
                        </Field>
                    </div>
                ))}
                <Field label="Status" htmlFor="smith-active">
                    <select id="smith-active" className={inputClass} value={values.active} onChange={(e) => set("active", e.target.value)}>
                        <option value="Y">Active</option>
                        <option value="N">Inactive</option>
                    </select>
                </Field>
                <div className="flex flex-wrap items-end justify-end gap-2 sm:col-span-2">
                    <button type="button" className={ghostButton} onClick={onClose} disabled={saving}>
                        Cancel
                    </button>
                    <button type="submit" data-enter-submit className={primaryButton} disabled={saving}>
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {editing ? "Update smith" : "Create smith"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
