"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Inbox, Loader2, Pencil, Printer, RotateCcw, Search, TicketPlus, Ticket, Trash2, X } from "lucide-react";
import { useToast } from "@/src/providers/toast-provider";
import ConfirmDialog from "@/src/components/ui/confirm-dialog";
import { CardHeader, Field, card, ghostButton, iconButton, inputClass, primaryButton } from "@/src/module/role/component/ui";
import VoucherPrinterSetup from "./voucher-printer-setup";
import { isPrinterConfigured, printVoucherTagsViaProtocol } from "../api/printer-protocol";
import { getApiErrorMessage } from "../api/gift.api";
import { useDeleteGift, useGifts, useIntroducers, useIssueGifts, useRemaining, useUpdateGift } from "../hook/use-gift";
import { formatAmount, formatDateTime, parseAmount, parsePiece } from "../lib/format";
import type { GiftTran } from "../type/gift-voucher.types";

type Values = { introducerId: string; amount: string; piece: string };
const EMPTY: Values = { introducerId: "", amount: "", piece: "1" };
const MAX_PCS = 1000;

const validateAmount = (amount: string) => {
    const a = parseAmount(amount);
    if (isNaN(a) || a < 0) return "Amount can't be negative";
    if (!/^\d*(\.\d{0,4})?$/.test(amount.trim())) return "Up to 4 decimals";
    return undefined;
};

/** Issue gifts: introducer, amount per piece and pcs. The server creates one tag per piece. */
export default function VoucherGenerateForm() {
    const { addToast } = useToast();
    const introducers = useIntroducers();
    const issue = useIssueGifts();
    const update = useUpdateGift();
    const remove = useDeleteGift();

    const [values, setValues] = useState<Values>(EMPTY);
    const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>({});
    const [editing, setEditing] = useState<GiftTran | null>(null);
    const [batch, setBatch] = useState<GiftTran[]>([]);
    const [search, setSearch] = useState("");
    const [toDelete, setToDelete] = useState<GiftTran | null>(null);
    const firstRef = useRef<HTMLSelectElement>(null);

    const issues = useGifts({ type: "I" });
    const outstanding = useRemaining({});
    const pendingTags = useMemo(() => new Set((outstanding.data ?? []).map((r) => r.tagno.toLowerCase())), [outstanding.data]);
    const busy = issue.isPending || update.isPending;

    const active = (introducers.data ?? []).filter((i) => i.active !== "N" || String(i.id) === values.introducerId);

    useEffect(() => firstRef.current?.focus(), []);

    const rows = useMemo(() => {
        const q = search.trim().toLowerCase();
        const list = issues.data ?? [];
        return q ? list.filter((g) => g.tagno.toLowerCase().includes(q) || g.introducerName?.toLowerCase().includes(q)) : list;
    }, [issues.data, search]);

    const pcs = parsePiece(values.piece);
    const perPiece = parseAmount(values.amount);
    const total = !editing && pcs > 0 && !isNaN(perPiece) ? perPiece * pcs : null;

    const set = (k: keyof Values, v: string) => {
        setValues((p) => ({ ...p, [k]: v }));
        if (errors[k]) setErrors((p) => ({ ...p, [k]: undefined }));
    };

    const notifyPrinter = (message: string) => addToast({ type: "warning", title: "Printer not set up", message });
    const printTags = (tags: string[]) => {
        if (!tags.length) return;
        if (!isPrinterConfigured()) return notifyPrinter("Finish the tag printer setup above to print tags.");
        printVoucherTagsViaProtocol(tags.map((voucherCode) => ({ voucherCode })), 1);
    };

    const reset = () => {
        setEditing(null);
        setValues(EMPTY);
        setErrors({});
        firstRef.current?.focus();
    };

    const startEdit = (g: GiftTran) => {
        if (!pendingTags.has(g.tagno.toLowerCase())) {
            addToast({ type: "info", title: "Already received", message: `Tag ${g.tagno} was received, so it can't be changed.` });
            return;
        }
        setEditing(g);
        setValues({ introducerId: String(g.introducerId), amount: g.amount ? String(g.amount) : "", piece: "1" });
        setErrors({});
        firstRef.current?.focus();
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        const found: Partial<Record<keyof Values, string>> = {};
        if (!values.introducerId) found.introducerId = "Choose an introducer";
        const amountError = validateAmount(values.amount);
        if (amountError) found.amount = amountError;
        if (!editing && (!Number.isInteger(pcs) || pcs < 1 || pcs > MAX_PCS)) found.piece = `Pcs must be 1 to ${MAX_PCS}`;
        setErrors(found);
        if (Object.keys(found).length) {
            document.getElementById(`issue-${Object.keys(found)[0]}`)?.focus();
            return;
        }
        const amount = parseAmount(values.amount) || 0;
        try {
            if (editing) {
                const saved = await update.mutateAsync({
                    id: editing.id,
                    input: { introducerId: Number(values.introducerId), tagno: editing.tagno, amount, piece: 1, issRec: "I" },
                });
                addToast({ type: "success", title: "Issue updated", message: saved.tagno });
            } else {
                const saved = await issue.mutateAsync({ introducerId: Number(values.introducerId), amount, piece: pcs });
                setBatch(saved);
                const tags = saved.map((g) => g.tagno);
                addToast({
                    type: "success",
                    title: saved.length === 1 ? "Gift issued" : `${saved.length} gifts issued`,
                    message: saved.length === 1 ? `Tag ${tags[0]}` : `Tags ${tags[0]} to ${tags[tags.length - 1]}`,
                });
                printTags(tags);
            }
            reset();
        } catch (err) {
            addToast({ type: "error", title: editing ? "Couldn't update the issue" : "Couldn't issue the gifts", message: getApiErrorMessage(err) });
        }
    };

    const confirmDelete = async () => {
        if (!toDelete) return;
        try {
            await remove.mutateAsync(toDelete.id);
            addToast({ type: "success", title: "Issue deleted", message: toDelete.tagno });
            if (editing?.id === toDelete.id) reset();
            setBatch((b) => b.filter((g) => g.id !== toDelete.id));
        } catch (err) {
            addToast({ type: "error", title: "Couldn't delete the issue", message: getApiErrorMessage(err) });
        } finally {
            setToDelete(null);
        }
    };

    const fieldError = (k: keyof Values) =>
        errors[k] && <p className="text-xs font-medium text-red-600 dark:text-red-400">{errors[k]}</p>;

    const batchTotal = batch.reduce((s, g) => s + g.amount, 0);

    return (
        <div className="space-y-4">
            <VoucherPrinterSetup />

            <div className="grid min-w-0 grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                <div className="min-w-0 space-y-4">
                    <section className={card}>
                        <CardHeader
                            icon={editing ? Pencil : TicketPlus}
                            title={editing ? `Edit issue ${editing.tagno}` : "Issue gifts"}
                            subtitle={editing ? "The tag number stays the same" : "One tag is printed for each piece"}
                        />
                        <form onSubmit={submit} className="space-y-4 p-5" noValidate>
                            <Field label="Introducer" htmlFor="issue-introducerId">
                                <select
                                    id="issue-introducerId"
                                    ref={firstRef}
                                    className={`${inputClass} ${errors.introducerId ? "border-red-500" : ""}`}
                                    value={values.introducerId}
                                    onChange={(e) => set("introducerId", e.target.value)}
                                >
                                    <option value="">{introducers.isLoading ? "Loading…" : "Select an introducer…"}</option>
                                    {active.map((i) => (
                                        <option key={i.id} value={i.id}>
                                            {i.introducerName}
                                            {i.mobile ? ` · ${i.mobile}` : ""}
                                        </option>
                                    ))}
                                </select>
                                {fieldError("introducerId")}
                            </Field>
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Amount per piece" htmlFor="issue-amount">
                                    <input
                                        id="issue-amount"
                                        inputMode="decimal"
                                        autoComplete="off"
                                        placeholder="0.00"
                                        className={`${inputClass} text-right ${errors.amount ? "border-red-500" : ""}`}
                                        value={values.amount}
                                        onChange={(e) => set("amount", e.target.value.replace(/[^\d.]/g, ""))}
                                    />
                                    {fieldError("amount")}
                                </Field>
                                <Field label="Pcs" htmlFor="issue-piece">
                                    <input
                                        id="issue-piece"
                                        inputMode="numeric"
                                        autoComplete="off"
                                        placeholder="1"
                                        disabled={!!editing}
                                        className={`${inputClass} text-right disabled:opacity-60 ${errors.piece ? "border-red-500" : ""}`}
                                        value={values.piece}
                                        onChange={(e) => set("piece", e.target.value.replace(/\D/g, "").slice(0, 4))}
                                    />
                                    {fieldError("piece")}
                                </Field>
                            </div>
                            {editing ? (
                                <p className="text-xs text-muted-foreground">Each tag is one piece. Received tags can&apos;t be changed.</p>
                            ) : (
                                <div className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2 text-sm">
                                    <span className="text-muted-foreground">
                                        {pcs > 0 ? `${pcs} ${pcs === 1 ? "tag" : "tags"}` : "Tags"} · Total
                                    </span>
                                    <span className="font-semibold tabular-nums">₹{formatAmount(total ?? 0)}</span>
                                </div>
                            )}
                            <div className="flex flex-wrap gap-2">
                                <button type="submit" data-enter-submit className={primaryButton} disabled={busy}>
                                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <TicketPlus className="h-4 w-4" />}
                                    {editing ? "Update issue" : "Issue"}
                                </button>
                                <button type="button" className={ghostButton} onClick={reset}>
                                    <RotateCcw className="h-4 w-4" />
                                    {editing ? "Cancel" : "Clear"}
                                </button>
                            </div>
                        </form>
                    </section>

                    {batch.length > 0 && (
                        <section className={card}>
                            <CardHeader
                                icon={Ticket}
                                title={batch.length === 1 ? "Last issued tag" : `Last issued ${batch.length} tags`}
                                subtitle={`${batch[0].introducerName} · ₹${formatAmount(batchTotal)}`}
                                actions={
                                    <div className="flex gap-1">
                                        <button type="button" className={ghostButton} onClick={() => printTags(batch.map((g) => g.tagno))}>
                                            <Printer className="h-4 w-4" /> Print all
                                        </button>
                                        <button type="button" className={iconButton} title="Hide" aria-label="Hide last issued tags" onClick={() => setBatch([])}>
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                }
                            />
                            <div className="flex max-h-48 flex-wrap gap-1.5 overflow-auto p-4">
                                {batch.map((g) => (
                                    <span key={g.id} className="rounded-lg bg-accent-soft px-2.5 py-1 text-sm font-semibold tracking-wide text-primary-text">
                                        {g.tagno}
                                    </span>
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                <section className={`${card} min-w-0 overflow-hidden`}>
                    <CardHeader
                        icon={Ticket}
                        title="Issued gifts"
                        subtitle={`${issues.data?.length ?? 0} tags`}
                        actions={
                            <div className="relative w-full sm:w-64" data-enter-nav="off">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    className={`${inputClass} h-9 pl-9`}
                                    placeholder="Search tag or introducer..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    aria-label="Search issued gifts"
                                />
                            </div>
                        }
                    />
                    <div className="relative max-h-[560px] overflow-auto">
                        <table className="w-full min-w-[640px] text-sm">
                            <thead className="sticky top-0 bg-card">
                                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                                    <th className="px-5 py-2.5 font-medium">Tag no</th>
                                    <th className="px-3 py-2.5 font-medium">Batch</th>
                                    <th className="px-3 py-2.5 font-medium">Introducer</th>
                                    <th className="px-3 py-2.5 text-right font-medium">Amount</th>
                                    <th className="px-3 py-2.5 text-right font-medium">Status</th>
                                    <th className="px-5 py-2.5 text-right font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {issues.isLoading && (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-3">
                                            <div className="h-4 w-full animate-pulse rounded bg-muted" />
                                        </td>
                                    </tr>
                                )}
                                {issues.isError && (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-10 text-center text-sm text-red-600 dark:text-red-400">
                                            Couldn&apos;t load issues. {getApiErrorMessage(issues.error)}
                                        </td>
                                    </tr>
                                )}
                                {rows.map((g) => {
                                    const pending = pendingTags.has(g.tagno.toLowerCase());
                                    return (
                                        <tr key={g.id} className={`transition-colors hover:bg-muted/60 ${editing?.id === g.id ? "bg-accent-soft" : ""}`}>
                                            <td className="px-5 py-3">
                                                <p className="font-semibold tracking-wide">{g.tagno}</p>
                                                <p className="text-xs text-muted-foreground">{formatDateTime(g.createdAt)}</p>
                                            </td>
                                            <td className="px-3 py-3 tabular-nums text-muted-foreground">#{g.tranId}</td>
                                            <td className="px-3 py-3">{g.introducerName}</td>
                                            <td className="px-3 py-3 text-right tabular-nums">₹{formatAmount(g.amount)}</td>
                                            <td className="px-3 py-3 text-right text-xs">
                                                {pending ? (
                                                    <span className="rounded-full bg-amber-500/10 px-2 py-0.5 font-semibold text-amber-700 dark:text-amber-400">
                                                        Not received
                                                    </span>
                                                ) : (
                                                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-semibold text-emerald-700 dark:text-emerald-400">
                                                        Received
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="flex justify-end gap-1">
                                                    <button className={iconButton} title="Print tag" aria-label={`Print tag ${g.tagno}`} onClick={() => printTags([g.tagno])}>
                                                        <Printer className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        className={`${iconButton} disabled:opacity-40`}
                                                        title={pending ? "Edit" : "Received tags can't be edited"}
                                                        aria-label={`Edit ${g.tagno}`}
                                                        disabled={!pending}
                                                        onClick={() => startEdit(g)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        className={`${iconButton} hover:bg-red-500/10 hover:text-red-600`}
                                                        title="Delete"
                                                        aria-label={`Delete ${g.tagno}`}
                                                        onClick={() => setToDelete(g)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {!issues.isLoading && !issues.isError && rows.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-10 text-center text-sm text-muted-foreground">
                                            <Inbox className="mx-auto mb-2 h-6 w-6" />
                                            {search ? "No issues match your search" : "No gifts issued yet"}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

            <ConfirmDialog
                open={!!toDelete}
                title={`Delete issue ${toDelete?.tagno}?`}
                message="A received tag can't be deleted; delete its receipt first."
                confirmLabel="Delete"
                busy={remove.isPending}
                onConfirm={confirmDelete}
                onCancel={() => setToDelete(null)}
            />
        </div>
    );
}
