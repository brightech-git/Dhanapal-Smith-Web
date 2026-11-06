"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Inbox, Loader2, RotateCcw, ScanLine, Search, Trash2, Undo2, Hourglass } from "lucide-react";
import { useToast } from "@/src/providers/toast-provider";
import ConfirmDialog from "@/src/components/ui/confirm-dialog";
import { CardHeader, Field, card, ghostButton, iconButton, inputClass, primaryButton } from "@/src/module/role/component/ui";
import { fetchGifts, fetchRemaining, getApiErrorMessage } from "../api/gift.api";
import { useDeleteGift, useGifts, useRemaining, useSaveGift } from "../hook/use-gift";
import { formatAmount, formatDateTime, parseAmount, parsePiece } from "../lib/format";
import { validateAmountPiece } from "./voucher-generate-form";
import type { GiftRemaining, GiftTran } from "../type/gift-voucher.types";

/** Receive a gift back against its tag: amount and pcs up to what is still pending. */
export default function VoucherReturnForm() {
    const { addToast } = useToast();
    const save = useSaveGift();
    const remove = useDeleteGift();

    const [tagInput, setTagInput] = useState("");
    const [looking, setLooking] = useState(false);
    const [tag, setTag] = useState<string | null>(null);
    const [picked, setPicked] = useState<GiftRemaining | null>(null);
    const [focusAmount, setFocusAmount] = useState(false);
    const [amount, setAmount] = useState("");
    const [piece, setPiece] = useState("");
    const [errors, setErrors] = useState<Partial<Record<"amount" | "piece", string>>>({});
    const [search, setSearch] = useState("");
    const [toDelete, setToDelete] = useState<GiftTran | null>(null);
    const tagRef = useRef<HTMLInputElement>(null);
    const amountRef = useRef<HTMLInputElement>(null);

    const outstanding = useRemaining({});
    const tagEntries = useGifts({ tagno: tag ?? undefined }, !!tag);
    const issue = tagEntries.data?.find((g) => g.issRec === "I") ?? null;
    const receipts = (tagEntries.data ?? []).filter((g) => g.issRec === "R");
    // The pending list is the live figure; the looked-up row covers the moment before it refreshes.
    const pending: GiftRemaining | null = tag
        ? outstanding.data?.find((r) => r.tagno.toLowerCase() === tag.toLowerCase()) ??
          (picked && picked.tagno.toLowerCase() === tag.toLowerCase() && !outstanding.isFetching ? null : picked)
        : null;

    useEffect(() => tagRef.current?.focus(), []);
    useEffect(() => {
        if (focusAmount && pending) {
            amountRef.current?.focus();
            amountRef.current?.select();
            setFocusAmount(false);
        }
    }, [focusAmount, pending]);

    const list = useMemo(() => {
        const q = search.trim().toLowerCase();
        const rows = outstanding.data ?? [];
        return q ? rows.filter((r) => r.tagno.toLowerCase().includes(q) || r.introducerName?.toLowerCase().includes(q)) : rows;
    }, [outstanding.data, search]);

    const pick = (r: GiftRemaining) => {
        setTag(r.tagno);
        setPicked(r);
        setFocusAmount(true);
        setTagInput(r.tagno);
        setAmount(r.remainingAmount ? String(r.remainingAmount) : "");
        setPiece(r.remainingPiece ? String(r.remainingPiece) : "");
        setErrors({});
    };

    const lookUp = async () => {
        const value = tagInput.trim();
        if (!value) {
            addToast({ type: "info", title: "Tag number needed", message: "Type or scan a tag number, then press Enter." });
            return;
        }
        setLooking(true);
        try {
            const [rem] = await fetchRemaining({ tagno: value });
            if (rem) return pick(rem);
            const [issued] = await fetchGifts({ type: "I", tagno: value });
            setTag(issued ? issued.tagno : null);
            addToast(
                issued
                    ? { type: "info", title: "Already received", message: `Tag ${issued.tagno} has nothing pending.` }
                    : { type: "warning", title: "Tag not found", message: `No gift was issued with tag ${value}.` }
            );
            tagRef.current?.select();
        } catch (err) {
            addToast({ type: "error", title: "Couldn't look up the tag", message: getApiErrorMessage(err) });
        } finally {
            setLooking(false);
        }
    };

    const reset = () => {
        setTag(null);
        setPicked(null);
        setTagInput("");
        setAmount("");
        setPiece("");
        setErrors({});
        tagRef.current?.focus();
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pending) return;
        const found = validateAmountPiece(amount, piece);
        const a = parseAmount(amount);
        const p = parsePiece(piece);
        if (!found.amount && a > pending.remainingAmount) found.amount = `Only ₹${formatAmount(pending.remainingAmount)} pending`;
        if (!found.piece && p > pending.remainingPiece) found.piece = `Only ${pending.remainingPiece} pcs pending`;
        setErrors(found);
        if (Object.keys(found).length) {
            document.getElementById(`receipt-${Object.keys(found)[0]}`)?.focus();
            return;
        }
        try {
            await save.mutateAsync({ input: { introducerId: pending.introducerId, tagno: pending.tagno, amount: a, piece: p, issRec: "R" } });
            addToast({ type: "success", title: "Receipt saved", message: `${pending.tagno}: ₹${formatAmount(a)} · ${p} pcs` });
            reset();
        } catch (err) {
            addToast({ type: "error", title: "Couldn't save the receipt", message: getApiErrorMessage(err) });
        }
    };

    const confirmDelete = async () => {
        if (!toDelete) return;
        try {
            await remove.mutateAsync(toDelete.id);
            addToast({ type: "success", title: "Receipt deleted", message: toDelete.tagno });
        } catch (err) {
            addToast({ type: "error", title: "Couldn't delete the receipt", message: getApiErrorMessage(err) });
        } finally {
            setToDelete(null);
        }
    };

    const stat = (label: string, amt: number, pcs: number, tone = "") => (
        <div className="rounded-xl border border-border px-3 py-2">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-sm font-semibold tabular-nums ${tone}`}>₹{formatAmount(amt)}</p>
            <p className={`text-xs tabular-nums ${tone || "text-muted-foreground"}`}>{pcs} pcs</p>
        </div>
    );

    return (
        <div className="grid min-w-0 grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
            <section className={card}>
                <CardHeader icon={Undo2} title="Receive a gift" subtitle="Scan or type the tag number and press Enter" />
                <div className="space-y-4 p-5">
                    <Field label="Tag no" htmlFor="receipt-tag">
                        <div className="relative">
                            <ScanLine className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                id="receipt-tag"
                                ref={tagRef}
                                autoComplete="off"
                                placeholder="e.g. GV12"
                                className={`${inputClass} pl-9 font-semibold tracking-wide`}
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value.toUpperCase())}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        lookUp();
                                    }
                                }}
                            />
                            {looking && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
                        </div>
                    </Field>

                    {tag && issue && (
                        <div className="space-y-3 rounded-xl bg-muted/40 p-3">
                            <div className="flex items-baseline justify-between gap-2">
                                <p className="text-lg font-bold tracking-wide">{issue.tagno}</p>
                                <p className="truncate text-sm text-muted-foreground">{issue.introducerName}</p>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {stat("Issued", issue.amount, issue.piece)}
                                {stat("Received", pending?.receivedAmount ?? issue.amount, pending?.receivedPiece ?? issue.piece)}
                                {stat("Pending", pending?.remainingAmount ?? 0, pending?.remainingPiece ?? 0, "text-amber-700 dark:text-amber-400")}
                            </div>
                        </div>
                    )}

                    {pending && (
                        <form onSubmit={submit} className="space-y-4" noValidate>
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Amount" htmlFor="receipt-amount">
                                    <input
                                        id="receipt-amount"
                                        ref={amountRef}
                                        inputMode="decimal"
                                        autoComplete="off"
                                        className={`${inputClass} text-right ${errors.amount ? "border-red-500" : ""}`}
                                        value={amount}
                                        onChange={(e) => {
                                            setAmount(e.target.value.replace(/[^\d.]/g, ""));
                                            setErrors((p) => ({ ...p, amount: undefined }));
                                        }}
                                    />
                                    {errors.amount && <p className="text-xs font-medium text-red-600 dark:text-red-400">{errors.amount}</p>}
                                </Field>
                                <Field label="Pcs" htmlFor="receipt-piece">
                                    <input
                                        id="receipt-piece"
                                        inputMode="numeric"
                                        autoComplete="off"
                                        className={`${inputClass} text-right ${errors.piece ? "border-red-500" : ""}`}
                                        value={piece}
                                        onChange={(e) => {
                                            setPiece(e.target.value.replace(/\D/g, ""));
                                            setErrors((p) => ({ ...p, piece: undefined }));
                                        }}
                                    />
                                    {errors.piece && <p className="text-xs font-medium text-red-600 dark:text-red-400">{errors.piece}</p>}
                                </Field>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button type="submit" data-enter-submit className={primaryButton} disabled={save.isPending}>
                                    {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Undo2 className="h-4 w-4" />}
                                    Receipt
                                </button>
                                <button type="button" className={ghostButton} onClick={reset}>
                                    <RotateCcw className="h-4 w-4" /> Clear
                                </button>
                            </div>
                        </form>
                    )}

                    {tag && receipts.length > 0 && (
                        <div>
                            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Receipts on this tag</p>
                            <ul className="divide-y divide-border rounded-xl border border-border">
                                {receipts.map((r) => (
                                    <li key={r.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                                        <span className="flex-1 text-xs text-muted-foreground">{formatDateTime(r.createdAt)}</span>
                                        <span className="tabular-nums">₹{formatAmount(r.amount)}</span>
                                        <span className="w-14 text-right tabular-nums">{r.piece} pcs</span>
                                        <button
                                            className={`${iconButton} hover:bg-red-500/10 hover:text-red-600`}
                                            title="Delete receipt"
                                            aria-label={`Delete receipt of ${r.tagno}`}
                                            onClick={() => setToDelete(r)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </section>

            <section className={`${card} overflow-hidden`}>
                <CardHeader
                    icon={Hourglass}
                    title="Pending tags"
                    subtitle="Click a tag to receive it"
                    actions={
                        <div className="relative w-full sm:w-60" data-enter-nav="off">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                className={`${inputClass} h-9 pl-9`}
                                placeholder="Search tag or introducer..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                aria-label="Search pending tags"
                            />
                        </div>
                    }
                />
                <div className="relative max-h-[560px] overflow-auto">
                    <table className="w-full min-w-[560px] text-sm">
                        <thead className="sticky top-0 bg-card">
                            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                                <th className="px-5 py-2.5 font-medium">Tag no</th>
                                <th className="px-3 py-2.5 font-medium">Introducer</th>
                                <th className="px-3 py-2.5 text-right font-medium">Pending amount</th>
                                <th className="px-5 py-2.5 text-right font-medium">Pending pcs</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {list.map((r) => (
                                <tr
                                    key={r.issueId}
                                    onClick={() => pick(r)}
                                    className={`cursor-pointer transition-colors hover:bg-muted/60 ${tag?.toLowerCase() === r.tagno.toLowerCase() ? "bg-accent-soft" : ""}`}
                                >
                                    <td className="px-5 py-3">
                                        <p className="font-semibold tracking-wide">{r.tagno}</p>
                                        <p className="text-xs text-muted-foreground">{formatDateTime(r.createdAt)}</p>
                                    </td>
                                    <td className="px-3 py-3">{r.introducerName}</td>
                                    <td className="px-3 py-3 text-right tabular-nums">
                                        ₹{formatAmount(r.remainingAmount)}
                                        <span className="block text-xs text-muted-foreground">of ₹{formatAmount(r.issuedAmount)}</span>
                                    </td>
                                    <td className="px-5 py-3 text-right tabular-nums">
                                        {r.remainingPiece}
                                        <span className="block text-xs text-muted-foreground">of {r.issuedPiece}</span>
                                    </td>
                                </tr>
                            ))}
                            {outstanding.isLoading && (
                                <tr>
                                    <td colSpan={4} className="px-5 py-3">
                                        <div className="h-4 w-full animate-pulse rounded bg-muted" />
                                    </td>
                                </tr>
                            )}
                            {!outstanding.isLoading && list.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-5 py-10 text-center text-sm text-muted-foreground">
                                        <Inbox className="mx-auto mb-2 h-6 w-6" />
                                        {outstanding.isError ? getApiErrorMessage(outstanding.error) : search ? "No pending tags match" : "Nothing pending"}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <ConfirmDialog
                open={!!toDelete}
                title={`Delete this receipt of ${toDelete?.tagno}?`}
                message="The amount and pcs go back to pending."
                confirmLabel="Delete"
                busy={remove.isPending}
                onConfirm={confirmDelete}
                onCancel={() => setToDelete(null)}
            />
        </div>
    );
}
