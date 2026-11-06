"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { History, Inbox, Loader2, RotateCcw, ScanLine, Search, Trash2, Undo2, X } from "lucide-react";
import { useToast } from "@/src/providers/toast-provider";
import ConfirmDialog from "@/src/components/ui/confirm-dialog";
import { CardHeader, Field, card, ghostButton, iconButton, inputClass, primaryButton } from "@/src/module/role/component/ui";
import { fetchGifts, fetchRemaining, getApiErrorMessage } from "../api/gift.api";
import { useDeleteGift, useGifts, useReceiveGifts } from "../hook/use-gift";
import { formatAmount, formatDateTime } from "../lib/format";
import type { GiftTran } from "../type/gift-voucher.types";

type Scanned = { tagno: string; introducerName: string; amount: number };

/** Receive gifts back: scan each tag (Enter adds it to the list), then receipt them all at once. */
export default function VoucherReturnForm() {
    const { addToast } = useToast();
    const receive = useReceiveGifts();
    const remove = useDeleteGift();

    const [tagInput, setTagInput] = useState("");
    const [looking, setLooking] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [list, setList] = useState<Scanned[]>([]);
    const [search, setSearch] = useState("");
    const [toDelete, setToDelete] = useState<GiftTran | null>(null);
    const tagRef = useRef<HTMLInputElement>(null);

    const receipts = useGifts({ type: "R" });

    useEffect(() => tagRef.current?.focus(), []);

    const recent = useMemo(() => {
        const q = search.trim().toLowerCase();
        const rows = [...(receipts.data ?? [])].sort((a, b) => b.id - a.id);
        return q ? rows.filter((g) => g.tagno.toLowerCase().includes(q) || g.introducerName?.toLowerCase().includes(q)) : rows;
    }, [receipts.data, search]);

    const total = list.reduce((s, t) => s + t.amount, 0);

    const addTag = async () => {
        const value = tagInput.trim();
        if (!value) {
            if (list.length) return save();
            setError("Type or scan a tag number, then press Enter.");
            return;
        }
        if (list.some((t) => t.tagno.toLowerCase() === value.toLowerCase())) {
            setError(`${value} is already in the list.`);
            tagRef.current?.select();
            return;
        }
        setLooking(true);
        try {
            const rem = (await fetchRemaining({ tagno: value })).find((r) => r.tagno.toLowerCase() === value.toLowerCase());
            if (rem) {
                setList((l) => [{ tagno: rem.tagno, introducerName: rem.introducerName, amount: rem.remainingAmount || rem.issuedAmount }, ...l]);
                setTagInput("");
                setError(null);
            } else {
                const issued = (await fetchGifts({ type: "I", tagno: value })).find((g) => g.tagno.toLowerCase() === value.toLowerCase());
                setError(issued ? `${issued.tagno} was already received.` : `No gift was issued with tag ${value}.`);
                tagRef.current?.select();
            }
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setLooking(false);
            tagRef.current?.focus();
        }
    };

    const clear = () => {
        setList([]);
        setTagInput("");
        setError(null);
        tagRef.current?.focus();
    };

    const save = async () => {
        if (!list.length || receive.isPending) return;
        try {
            const saved = await receive.mutateAsync(list.map((t) => t.tagno).reverse());
            addToast({
                type: "success",
                title: saved.length === 1 ? "Gift received" : `${saved.length} gifts received`,
                message: `₹${formatAmount(saved.reduce((s, g) => s + g.amount, 0))}`,
            });
            clear();
        } catch (err) {
            addToast({ type: "error", title: "Couldn't save the receipt", message: getApiErrorMessage(err) });
            tagRef.current?.focus();
        }
    };

    const confirmDelete = async () => {
        if (!toDelete) return;
        try {
            await remove.mutateAsync(toDelete.id);
            addToast({ type: "success", title: "Receipt deleted", message: `${toDelete.tagno} is back to not received.` });
        } catch (err) {
            addToast({ type: "error", title: "Couldn't delete the receipt", message: getApiErrorMessage(err) });
        } finally {
            setToDelete(null);
        }
    };

    return (
        <div className="grid min-w-0 grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
            <section className={`${card} min-w-0`}>
                <CardHeader icon={Undo2} title="Receive gifts" subtitle="Scan each tag and press Enter to add it" />
                <div className="space-y-4 p-5">
                    <Field label="Tag no" htmlFor="receipt-tag">
                        <div className="relative" data-enter-nav="off">
                            <ScanLine className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                id="receipt-tag"
                                ref={tagRef}
                                autoComplete="off"
                                placeholder="e.g. GV12"
                                className={`${inputClass} pl-9 font-semibold tracking-wide ${error ? "border-red-500" : ""}`}
                                value={tagInput}
                                onChange={(e) => {
                                    setTagInput(e.target.value.toUpperCase());
                                    setError(null);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (!looking) addTag();
                                    }
                                }}
                            />
                            {looking && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
                        </div>
                        {error ? (
                            <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>
                        ) : (
                            <p className="text-xs text-muted-foreground">Press Enter on an empty box to save the receipt.</p>
                        )}
                    </Field>

                    <div className="rounded-xl border border-border">
                        <div className="flex items-center justify-between border-b border-border px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            <span>
                                {list.length} {list.length === 1 ? "tag" : "tags"}
                            </span>
                            <span className="tabular-nums text-foreground">₹{formatAmount(total)}</span>
                        </div>
                        {list.length === 0 ? (
                            <p className="px-3 py-6 text-center text-sm text-muted-foreground">Scanned tags show here</p>
                        ) : (
                            <ul className="max-h-72 divide-y divide-border overflow-auto">
                                {list.map((t) => (
                                    <li key={t.tagno} className="flex items-center gap-3 px-3 py-2 text-sm">
                                        <span className="w-20 shrink-0 font-semibold tracking-wide">{t.tagno}</span>
                                        <span className="min-w-0 flex-1 truncate text-muted-foreground">{t.introducerName}</span>
                                        <span className="tabular-nums">₹{formatAmount(t.amount)}</span>
                                        <button
                                            type="button"
                                            className={iconButton}
                                            title="Remove"
                                            aria-label={`Remove ${t.tagno}`}
                                            onClick={() => {
                                                setList((l) => l.filter((x) => x.tagno !== t.tagno));
                                                tagRef.current?.focus();
                                            }}
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button type="button" className={primaryButton} disabled={!list.length || receive.isPending} onClick={save}>
                            {receive.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Undo2 className="h-4 w-4" />}
                            Receipt{list.length > 1 ? ` ${list.length} tags` : ""}
                        </button>
                        <button type="button" className={ghostButton} onClick={clear}>
                            <RotateCcw className="h-4 w-4" /> Clear
                        </button>
                    </div>
                </div>
            </section>

            <section className={`${card} min-w-0 overflow-hidden`}>
                <CardHeader
                    icon={History}
                    title="Receipts"
                    subtitle={`${receipts.data?.length ?? 0} received tags`}
                    actions={
                        <div className="relative w-full sm:w-60" data-enter-nav="off">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                className={`${inputClass} h-9 pl-9`}
                                placeholder="Search tag or introducer..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                aria-label="Search receipts"
                            />
                        </div>
                    }
                />
                <div className="relative max-h-[560px] overflow-auto">
                    <table className="w-full min-w-[520px] text-sm">
                        <thead className="sticky top-0 bg-card">
                            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                                <th className="px-5 py-2.5 font-medium">Tag no</th>
                                <th className="px-3 py-2.5 font-medium">Introducer</th>
                                <th className="px-3 py-2.5 text-right font-medium">Amount</th>
                                <th className="px-5 py-2.5 text-right font-medium">Delete</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {receipts.isLoading && (
                                <tr>
                                    <td colSpan={4} className="px-5 py-3">
                                        <div className="h-4 w-full animate-pulse rounded bg-muted" />
                                    </td>
                                </tr>
                            )}
                            {recent.map((r) => (
                                <tr key={r.id} className="transition-colors hover:bg-muted/60">
                                    <td className="px-5 py-3">
                                        <p className="font-semibold tracking-wide">{r.tagno}</p>
                                        <p className="text-xs text-muted-foreground">{formatDateTime(r.createdAt)}</p>
                                    </td>
                                    <td className="px-3 py-3">{r.introducerName}</td>
                                    <td className="px-3 py-3 text-right tabular-nums">₹{formatAmount(r.amount)}</td>
                                    <td className="px-5 py-3 text-right">
                                        <button
                                            className={`${iconButton} hover:bg-red-500/10 hover:text-red-600`}
                                            title="Delete receipt"
                                            aria-label={`Delete receipt of ${r.tagno}`}
                                            onClick={() => setToDelete(r)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {!receipts.isLoading && recent.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-5 py-10 text-center text-sm text-muted-foreground">
                                        <Inbox className="mx-auto mb-2 h-6 w-6" />
                                        {receipts.isError ? getApiErrorMessage(receipts.error) : search ? "No receipts match" : "No receipts yet"}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <ConfirmDialog
                open={!!toDelete}
                title={`Delete the receipt of ${toDelete?.tagno}?`}
                message="The tag goes back to not received."
                confirmLabel="Delete"
                busy={remove.isPending}
                onConfirm={confirmDelete}
                onCancel={() => setToDelete(null)}
            />
        </div>
    );
}
