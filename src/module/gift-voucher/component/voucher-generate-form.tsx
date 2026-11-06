"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Inbox, Loader2, Pencil, Printer, RotateCcw, Search, TicketPlus, Ticket, Trash2 } from "lucide-react";
import { useToast } from "@/src/providers/toast-provider";
import ConfirmDialog from "@/src/components/ui/confirm-dialog";
import { CardHeader, Field, card, ghostButton, iconButton, inputClass, primaryButton } from "@/src/module/role/component/ui";
import VoucherPrinterSetup from "./voucher-printer-setup";
import { isPrinterConfigured, printVoucherTagsViaProtocol } from "../api/printer-protocol";
import { getApiErrorMessage } from "../api/gift.api";
import { useDeleteGift, useGifts, useIntroducers, useRemaining, useSaveGift } from "../hook/use-gift";
import { formatAmount, formatDateTime, parseAmount, parsePiece } from "../lib/format";
import type { GiftTran } from "../type/gift-voucher.types";

type Values = { introducerId: string; amount: string; piece: string };
const EMPTY: Values = { introducerId: "", amount: "", piece: "" };

export const validateAmountPiece = (amount: string, piece: string) => {
    const e: Partial<Record<"amount" | "piece", string>> = {};
    const a = parseAmount(amount);
    const p = parsePiece(piece);
    if (isNaN(a) || a < 0) e.amount = "Amount can't be negative";
    else if (!/^\d*(\.\d{0,4})?$/.test(amount.trim())) e.amount = "Up to 4 decimals";
    if (isNaN(p) || p < 0 || !Number.isInteger(p)) e.piece = "Pcs must be a whole number";
    if (!e.amount && !e.piece && a === 0 && p === 0) e.amount = "Enter an amount or pcs";
    return e;
};

const printTag = (tagno: string, notify: (msg: string) => void) => {
    if (!isPrinterConfigured()) {
        notify("Finish the tag printer setup above to print tags.");
        return;
    }
    printVoucherTagsViaProtocol([{ voucherCode: tagno }], 1);
};

/** Issue a gift tag: introducer, amount and pcs. The server assigns the tag number. */
export default function VoucherGenerateForm() {
    const { addToast } = useToast();
    const introducers = useIntroducers();
    const save = useSaveGift();
    const remove = useDeleteGift();

    const [values, setValues] = useState<Values>(EMPTY);
    const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>({});
    const [editing, setEditing] = useState<GiftTran | null>(null);
    const [lastIssued, setLastIssued] = useState<GiftTran | null>(null);
    const [search, setSearch] = useState("");
    const [toDelete, setToDelete] = useState<GiftTran | null>(null);
    const firstRef = useRef<HTMLSelectElement>(null);

    const issues = useGifts({ type: "I" });
    const outstanding = useRemaining({});
    const remainingByTag = useMemo(() => new Map((outstanding.data ?? []).map((r) => [r.tagno.toLowerCase(), r])), [outstanding.data]);

    const active = (introducers.data ?? []).filter((i) => i.active !== "N" || String(i.id) === values.introducerId);

    useEffect(() => firstRef.current?.focus(), []);

    const rows = useMemo(() => {
        const q = search.trim().toLowerCase();
        const list = issues.data ?? [];
        return q ? list.filter((g) => g.tagno.toLowerCase().includes(q) || g.introducerName?.toLowerCase().includes(q)) : list;
    }, [issues.data, search]);

    const set = (k: keyof Values, v: string) => {
        setValues((p) => ({ ...p, [k]: v }));
        if (errors[k]) setErrors((p) => ({ ...p, [k]: undefined }));
    };

    const reset = () => {
        setEditing(null);
        setValues(EMPTY);
        setErrors({});
        firstRef.current?.focus();
    };

    const startEdit = (g: GiftTran) => {
        setEditing(g);
        setValues({ introducerId: String(g.introducerId), amount: g.amount ? String(g.amount) : "", piece: g.piece ? String(g.piece) : "" });
        setErrors({});
        firstRef.current?.focus();
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        const found: Partial<Record<keyof Values, string>> = { ...validateAmountPiece(values.amount, values.piece) };
        if (!values.introducerId) found.introducerId = "Choose an introducer";
        setErrors(found);
        if (Object.keys(found).length) {
            document.getElementById(`issue-${Object.keys(found)[0]}`)?.focus();
            return;
        }
        try {
            const saved = await save.mutateAsync({
                id: editing?.id,
                input: { introducerId: Number(values.introducerId), amount: parseAmount(values.amount), piece: parsePiece(values.piece), issRec: "I" },
            });
            if (editing) {
                addToast({ type: "success", title: "Issue updated", message: saved.tagno });
            } else {
                setLastIssued(saved);
                addToast({ type: "success", title: "Gift issued", message: `Tag ${saved.tagno}` });
                printTag(saved.tagno, (message) => addToast({ type: "warning", title: "Printer not set up", message }));
            }
            reset();
        } catch (err) {
            addToast({ type: "error", title: editing ? "Couldn't update the issue" : "Couldn't issue the gift", message: getApiErrorMessage(err) });
        }
    };

    const confirmDelete = async () => {
        if (!toDelete) return;
        try {
            await remove.mutateAsync(toDelete.id);
            addToast({ type: "success", title: "Issue deleted", message: toDelete.tagno });
            if (editing?.id === toDelete.id) reset();
            if (lastIssued?.id === toDelete.id) setLastIssued(null);
        } catch (err) {
            addToast({ type: "error", title: "Couldn't delete the issue", message: getApiErrorMessage(err) });
        } finally {
            setToDelete(null);
        }
    };

    const fieldError = (k: keyof Values) =>
        errors[k] && <p className="text-xs font-medium text-red-600 dark:text-red-400">{errors[k]}</p>;

    return (
        <div className="space-y-4">
            <VoucherPrinterSetup />

            <div className="grid min-w-0 grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                <div className="space-y-4">
                    <section className={card}>
                        <CardHeader
                            icon={editing ? Pencil : TicketPlus}
                            title={editing ? `Edit issue ${editing.tagno}` : "Issue a gift"}
                            subtitle={editing ? "The tag number stays the same" : "Press Enter to move to the next field"}
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
                                <Field label="Amount" htmlFor="issue-amount">
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
                                        placeholder="0"
                                        className={`${inputClass} text-right ${errors.piece ? "border-red-500" : ""}`}
                                        value={values.piece}
                                        onChange={(e) => set("piece", e.target.value.replace(/\D/g, ""))}
                                    />
                                    {fieldError("piece")}
                                </Field>
                            </div>
                            <p className="text-xs text-muted-foreground">Enter an amount, pcs, or both.</p>
                            <div className="flex flex-wrap gap-2">
                                <button type="submit" data-enter-submit className={primaryButton} disabled={save.isPending}>
                                    {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <TicketPlus className="h-4 w-4" />}
                                    {editing ? "Update issue" : "Issue"}
                                </button>
                                <button type="button" className={ghostButton} onClick={reset}>
                                    <RotateCcw className="h-4 w-4" />
                                    {editing ? "Cancel" : "Clear"}
                                </button>
                            </div>
                        </form>
                    </section>

                    {lastIssued && (
                        <section className={`${card} flex items-center gap-4 p-5`}>
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-primary-text">
                                <Ticket className="h-6 w-6" />
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs text-muted-foreground">Last issued tag</p>
                                <p className="truncate text-xl font-bold tracking-wide">{lastIssued.tagno}</p>
                                <p className="text-xs text-muted-foreground">
                                    {lastIssued.introducerName} · ₹{formatAmount(lastIssued.amount)} · {lastIssued.piece} pcs
                                </p>
                            </div>
                            <button
                                type="button"
                                className={ghostButton}
                                onClick={() => printTag(lastIssued.tagno, (message) => addToast({ type: "warning", title: "Printer not set up", message }))}
                            >
                                <Printer className="h-4 w-4" /> Print
                            </button>
                        </section>
                    )}
                </div>

                <section className={`${card} overflow-hidden`}>
                    <CardHeader
                        icon={Ticket}
                        title="Issued gifts"
                        subtitle={`${issues.data?.length ?? 0} issues`}
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
                        <table className="w-full min-w-[680px] text-sm">
                            <thead className="sticky top-0 bg-card">
                                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                                    <th className="px-5 py-2.5 font-medium">Tag no</th>
                                    <th className="px-3 py-2.5 font-medium">Introducer</th>
                                    <th className="px-3 py-2.5 text-right font-medium">Amount</th>
                                    <th className="px-3 py-2.5 text-right font-medium">Pcs</th>
                                    <th className="px-3 py-2.5 text-right font-medium">Pending</th>
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
                                    const pending = remainingByTag.get(g.tagno.toLowerCase());
                                    return (
                                        <tr key={g.id} className={`transition-colors hover:bg-muted/60 ${editing?.id === g.id ? "bg-accent-soft" : ""}`}>
                                            <td className="px-5 py-3">
                                                <p className="font-semibold tracking-wide">{g.tagno}</p>
                                                <p className="text-xs text-muted-foreground">{formatDateTime(g.createdAt)}</p>
                                            </td>
                                            <td className="px-3 py-3">{g.introducerName}</td>
                                            <td className="px-3 py-3 text-right tabular-nums">₹{formatAmount(g.amount)}</td>
                                            <td className="px-3 py-3 text-right tabular-nums">{g.piece}</td>
                                            <td className="px-3 py-3 text-right text-xs">
                                                {pending ? (
                                                    <span className="rounded-full bg-amber-500/10 px-2 py-0.5 font-semibold text-amber-700 dark:text-amber-400">
                                                        ₹{formatAmount(pending.remainingAmount)} · {pending.remainingPiece} pcs
                                                    </span>
                                                ) : (
                                                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-semibold text-emerald-700 dark:text-emerald-400">
                                                        Received
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="flex justify-end gap-1">
                                                    <button
                                                        className={iconButton}
                                                        title="Print tag"
                                                        aria-label={`Print tag ${g.tagno}`}
                                                        onClick={() => printTag(g.tagno, (message) => addToast({ type: "warning", title: "Printer not set up", message }))}
                                                    >
                                                        <Printer className="h-4 w-4" />
                                                    </button>
                                                    <button className={iconButton} title="Edit" aria-label={`Edit ${g.tagno}`} onClick={() => startEdit(g)}>
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
                message="A tag that has receipts can't be deleted; delete its receipts first."
                confirmLabel="Delete"
                busy={remove.isPending}
                onConfirm={confirmDelete}
                onCancel={() => setToDelete(null)}
            />
        </div>
    );
}
