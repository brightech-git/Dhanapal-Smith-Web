"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Pencil, Plus, Search, SlidersHorizontal, Trash2 } from "lucide-react";
import { getApiErrorMessage } from "@/lib/api/envelope";
import { useAuth } from "@/src/features/auth/lib/auth-context";
import { canMenuAction } from "@/src/features/auth/lib/access";
import { useToast } from "@/src/providers/toast-provider";
import ConfirmDialog from "@/src/components/ui/confirm-dialog";
import { useSoftControls } from "@/src/module/smith/context/soft-control-context";
import {
    createSoftControl, deleteSoftControl, updateSoftControl, type SoftControl,
} from "@/src/module/smith/api/soft-control.api";

/** Controls the app reads, with what their value does. */
const KNOWN: Record<string, string> = {
    GRANDTOTAL: "Y shows totals on ledgers and prints",
    SAVEBUTTON: "Y makes cash/weight edits wait for the row's Save button",
    DASHBOARD: "Y shows the dashboard",
    DASHBOARDPOSITION: "A shows the dashboard on top, B below",
    LOADING: "Y shows loading indicators",
    GIFT_PREFIX: "Prefix for gift voucher tag numbers (e.g. GV)",
    GIFT_NO: "Next gift voucher tag number",
};

const empty = { CTLID: "", CTLNAME: "", CTLTEXT: "" };
const row = "grid grid-cols-[110px_minmax(0,1fr)] items-center gap-2 text-sm font-medium";
const field = "w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default function SoftControlPage() {
    const { addToast } = useToast();
    const { allDetails } = useAuth();
    const canAdd = canMenuAction(allDetails, "soft-controls", "add");
    const canEdit = canMenuAction(allDetails, "soft-controls", "edit");
    const canDelete = canMenuAction(allDetails, "soft-controls", "del");
    const { softControls, loading, error, refreshSoftControls } = useSoftControls();

    const [editing, setEditing] = useState<SoftControl | null>(null);
    const [form, setForm] = useState(empty);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState("");
    const [toDelete, setToDelete] = useState<SoftControl | null>(null);
    const [deleting, setDeleting] = useState(false);

    const rows = useMemo(() => {
        const q = search.trim().toLowerCase();
        return [...softControls]
            .sort((a, b) => (a.CTLID ?? "").localeCompare(b.CTLID ?? ""))
            .filter((c) => !q || [c.CTLID, c.CTLNAME, c.CTLTEXT].some((v) => (v ?? "").toLowerCase().includes(q)));
    }, [softControls, search]);

    const reset = () => {
        setEditing(null);
        setForm(empty);
    };

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (saving || !(editing ? canEdit : canAdd)) return;
        const values = {
            CTLID: form.CTLID.trim().toUpperCase(),
            CTLNAME: form.CTLNAME.trim(),
            CTLTEXT: form.CTLTEXT.trim() || null,
        };
        if (softControls.some((c) => c.id !== editing?.id && (c.CTLID ?? "").toUpperCase() === values.CTLID)) {
            addToast({ type: "error", title: "Duplicate control ID", message: `${values.CTLID} already exists.` });
            return;
        }
        setSaving(true);
        try {
            if (editing) await updateSoftControl(editing.id, values);
            else await createSoftControl(values);
            addToast({ type: "success", title: "Saved", message: `${values.CTLID} saved.` });
            reset();
            await refreshSoftControls();
        } catch (err) {
            addToast({ type: "error", title: "Could not save", message: getApiErrorMessage(err) });
        } finally {
            setSaving(false);
        }
    }

    async function confirmDelete() {
        if (!toDelete) return;
        setDeleting(true);
        try {
            await deleteSoftControl(toDelete.id);
            if (editing?.id === toDelete.id) reset();
            addToast({ type: "success", title: "Deleted", message: `${toDelete.CTLID} deleted.` });
            setToDelete(null);
            await refreshSoftControls();
        } catch (err) {
            addToast({ type: "error", title: "Could not delete", message: getApiErrorMessage(err) });
        } finally {
            setDeleting(false);
        }
    }

    const showForm = canAdd || (canEdit && editing);

    return (
        <div className="mx-auto grid w-full items-start gap-4 p-3 sm:p-5 xl:grid-cols-[minmax(20rem,24rem)_minmax(0,1fr)]">
            {showForm && (
                <form onSubmit={submit} className="space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5">
                    <h2 className="flex items-center gap-2 font-semibold">
                        <SlidersHorizontal size={18} className="text-primary-text" aria-hidden />
                        {editing ? "Edit soft control" : "Add soft control"}
                    </h2>
                    <fieldset disabled={saving} className="grid min-w-0 gap-3">
                        <label className={row}>
                            <span>Control ID</span>
                            <input className={`${field} max-w-[220px] uppercase`} value={form.CTLID} maxLength={255} required autoFocus
                                placeholder="e.g. GRANDTOTAL"
                                onChange={(e) => setForm({ ...form, CTLID: e.target.value.toUpperCase() })} />
                        </label>
                        <label className={row}>
                            <span>Name</span>
                            <input className={`${field} max-w-[260px]`} value={form.CTLNAME} maxLength={255} required
                                placeholder="What it controls"
                                onChange={(e) => setForm({ ...form, CTLNAME: e.target.value })} />
                        </label>
                        <label className={row}>
                            <span>Value</span>
                            <input className={`${field} max-w-[260px]`} value={form.CTLTEXT} maxLength={255}
                                placeholder="e.g. Y or N"
                                onChange={(e) => setForm({ ...form, CTLTEXT: e.target.value })} />
                        </label>
                        {KNOWN[form.CTLID.trim()] && (
                            <p className="rounded-lg bg-accent-soft px-3 py-2 text-xs font-normal text-primary-text">
                                {KNOWN[form.CTLID.trim()]}
                            </p>
                        )}
                    </fieldset>
                    <div className="flex flex-wrap gap-2">
                        <button type="submit" data-enter-submit disabled={saving}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
                            {!editing && <Plus size={15} aria-hidden />}
                            {saving ? "Saving…" : editing ? "Save changes" : "Add control"}
                        </button>
                        {editing && <button type="button" disabled={saving} onClick={reset}
                            className="rounded-lg border border-border px-4 py-2 text-sm">Cancel</button>}
                    </div>
                </form>
            )}

            <div className={`min-w-0 overflow-hidden rounded-xl border border-border bg-card ${showForm ? "" : "xl:col-span-2"}`}>
                <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
                    <h2 className="flex-1 font-semibold">Soft controls</h2>
                    <label className="relative w-full sm:w-64">
                        <Search size={14} aria-hidden className="pointer-events-none absolute start-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search controls"
                            aria-label="Search controls" className={`${field} ps-8`} data-enter-nav="off" />
                    </label>
                </div>
                {loading && softControls.length === 0 && <p role="status" className="p-4 text-sm text-muted-foreground">Loading soft controls…</p>}
                {error && <p role="alert" className="p-4 text-sm text-red-600">{error}</p>}
                {!loading && !error && rows.length === 0 && (
                    <p className="p-4 text-sm text-muted-foreground">{search ? "No controls match your search." : "No soft controls have been added."}</p>
                )}
                {rows.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted text-muted-foreground">
                                <tr>
                                    <th scope="col" className="px-4 py-3">Control ID</th>
                                    <th scope="col" className="px-4 py-3">Name</th>
                                    <th scope="col" className="px-4 py-3">Value</th>
                                    {(canEdit || canDelete) && <th scope="col" className="px-4 py-3 text-right">Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((c) => {
                                    const id = c.CTLID ?? "";
                                    return (
                                        <tr key={c.id} className={`border-t border-border ${editing?.id === c.id ? "bg-accent-soft" : "hover:bg-muted/50"}`}>
                                            <td className="px-4 py-3">
                                                <span className="font-mono text-xs font-semibold">{id}</span>
                                                {KNOWN[id] && <span className="mt-0.5 block text-[11px] text-muted-foreground">{KNOWN[id]}</span>}
                                            </td>
                                            <td className="px-4 py-3">{c.CTLNAME}</td>
                                            <td className="px-4 py-3">
                                                {c.CTLTEXT
                                                    ? <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs">{c.CTLTEXT}</span>
                                                    : <span className="text-muted-foreground">-</span>}
                                            </td>
                                            {(canEdit || canDelete) && (
                                                <td className="px-4 py-3">
                                                    <div className="flex justify-end gap-1">
                                                        {canEdit && <button type="button" aria-label={`Edit ${id}`} title="Edit"
                                                            onClick={() => { setEditing(c); setForm({ CTLID: id, CTLNAME: c.CTLNAME ?? "", CTLTEXT: c.CTLTEXT ?? "" }); }}
                                                            className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
                                                            <Pencil size={15} />
                                                        </button>}
                                                        {canDelete && <button type="button" aria-label={`Delete ${id}`} title="Delete"
                                                            onClick={() => setToDelete(c)}
                                                            className="grid size-8 place-items-center rounded-lg text-red-600 hover:bg-red-500/10 dark:text-red-400">
                                                            <Trash2 size={15} />
                                                        </button>}
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <ConfirmDialog
                open={!!toDelete}
                title="Delete soft control?"
                message={toDelete ? `${toDelete.CTLID} will be removed. Screens that read it will treat it as off.` : undefined}
                confirmLabel="Delete"
                busy={deleting}
                onConfirm={confirmDelete}
                onCancel={() => setToDelete(null)}
            />
        </div>
    );
}
