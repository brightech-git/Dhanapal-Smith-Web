"use client";

import React, { useMemo, useState } from "react";
import { BarChart3, Inbox, Loader2, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import DateInput from "@/src/components/ui/date-input";
import { CardHeader, Field, card, ghostButton, inputClass, primaryButton } from "@/src/module/role/component/ui";
import { fetchGifts, getApiErrorMessage } from "../api/gift.api";
import { useIntroducers } from "../hook/use-gift";
import { formatAmount, formatDateTime } from "../lib/format";
import type { GiftTran } from "../type/gift-voucher.types";

type View = "summary" | "pending" | "I" | "R";
type Filters = { view: View; introducerId: string; tagno: string; search: string; from: string; to: string };
const EMPTY: Filters = { view: "summary", introducerId: "", tagno: "", search: "", from: "", to: "" };

type TagRow = {
    tagno: string;
    introducerName: string;
    createdAt: string;
    issuedAmount: number;
    issuedPiece: number;
    receivedAmount: number;
    receivedPiece: number;
};

const localDate = (v: string) => {
    const d = new Date(/[zZ]$/.test(v) ? v : `${v}Z`);
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

/** One row per tag: what was issued, what came back and what is pending. */
const summarise = (rows: GiftTran[]): TagRow[] => {
    const tags = new Map<string, TagRow>();
    rows.filter((g) => g.issRec === "I").forEach((g) =>
        tags.set(g.tagno.toLowerCase(), {
            tagno: g.tagno, introducerName: g.introducerName, createdAt: g.createdAt,
            issuedAmount: g.amount, issuedPiece: g.piece, receivedAmount: 0, receivedPiece: 0,
        })
    );
    rows.filter((g) => g.issRec === "R").forEach((g) => {
        const t = tags.get(g.tagno.toLowerCase());
        if (t) {
            t.receivedAmount += g.amount;
            t.receivedPiece += g.piece;
        }
    });
    return Array.from(tags.values());
};

/** Gift report: per-tag balances, pending tags, or the issue / receipt entries. */
export default function VoucherReport() {
    const introducers = useIntroducers();
    const [draft, setDraft] = useState<Filters>(EMPTY);
    const [applied, setApplied] = useState<Filters>(EMPTY);

    const serverFilter = {
        introducerId: applied.introducerId ? Number(applied.introducerId) : undefined,
        tagno: applied.tagno.trim() || undefined,
        search: applied.search.trim() || undefined,
    };
    const query = useQuery({
        queryKey: ["gift", "report", serverFilter],
        // The per-tag views need both issues and receipts, so fetch everything matching and split here.
        queryFn: () => fetchGifts({ type: "A", ...serverFilter }),
    });

    const inRange = (createdAt: string) => {
        const d = localDate(createdAt);
        return (!applied.from || d >= applied.from) && (!applied.to || d <= applied.to);
    };

    const entries = useMemo(
        () => (query.data ?? []).filter((g) => (applied.view === "I" || applied.view === "R" ? g.issRec === applied.view : true) && inRange(g.createdAt)),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [query.data, applied]
    );
    const tags = useMemo(() => {
        const all = summarise(query.data ?? []).filter((t) => inRange(t.createdAt));
        return applied.view === "pending"
            ? all.filter((t) => t.issuedAmount > t.receivedAmount || t.issuedPiece > t.receivedPiece)
            : all;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query.data, applied]);

    const byTag = applied.view === "summary" || applied.view === "pending";
    const total = (key: keyof TagRow) => tags.reduce((n, t) => n + Number(t[key]), 0);
    const entryTotal = (key: "amount" | "piece") => entries.reduce((n, g) => n + g[key], 0);
    const set = (k: keyof Filters, v: string) => setDraft((p) => ({ ...p, [k]: v }));
    const th = "px-3 py-2.5 font-medium";
    const num = "px-3 py-2.5 text-right tabular-nums";

    return (
        <div className="space-y-4">
            <section className={card}>
                <CardHeader icon={BarChart3} title="Gift report" subtitle="Press Enter to move to the next filter; Enter on the last one searches" />
                <form
                    className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 lg:grid-cols-6"
                    onSubmit={(e) => {
                        e.preventDefault();
                        setApplied(draft);
                    }}
                >
                    <Field label="View" htmlFor="rep-view">
                        <select id="rep-view" className={inputClass} value={draft.view} onChange={(e) => set("view", e.target.value)}>
                            <option value="summary">By tag (all)</option>
                            <option value="pending">By tag (pending only)</option>
                            <option value="I">Issue entries</option>
                            <option value="R">Receipt entries</option>
                        </select>
                    </Field>
                    <Field label="Introducer" htmlFor="rep-introducer">
                        <select id="rep-introducer" className={inputClass} value={draft.introducerId} onChange={(e) => set("introducerId", e.target.value)}>
                            <option value="">All introducers</option>
                            {(introducers.data ?? []).map((i) => (
                                <option key={i.id} value={i.id}>
                                    {i.introducerName}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Tag no" htmlFor="rep-tag">
                        <input id="rep-tag" className={inputClass} autoComplete="off" value={draft.tagno} onChange={(e) => set("tagno", e.target.value.toUpperCase())} />
                    </Field>
                    <Field label="Name / mobile" htmlFor="rep-search">
                        <input id="rep-search" className={inputClass} autoComplete="off" value={draft.search} onChange={(e) => set("search", e.target.value)} />
                    </Field>
                    <Field label="From date" htmlFor="rep-from">
                        <DateInput id="rep-from" className={inputClass} value={draft.from} onChange={(v) => set("from", v)} />
                    </Field>
                    <Field label="To date" htmlFor="rep-to">
                        <DateInput id="rep-to" className={inputClass} value={draft.to} onChange={(v) => set("to", v)} />
                    </Field>
                    <div className="flex gap-2 sm:col-span-2 lg:col-span-6 lg:justify-end">
                        <button type="button" className={ghostButton} onClick={() => { setDraft(EMPTY); setApplied(EMPTY); }}>
                            Reset
                        </button>
                        <button type="submit" data-enter-submit className={primaryButton} disabled={query.isFetching}>
                            {query.isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            Search
                        </button>
                    </div>
                </form>
            </section>

            <section className={`${card} overflow-hidden`}>
                <div className="relative max-h-[600px] overflow-auto">
                    {byTag ? (
                        <table className="w-full min-w-[820px] text-sm">
                            <thead className="sticky top-0 bg-card">
                                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                                    <th className={`${th} pl-5`}>S.No</th>
                                    <th className={th}>Tag no</th>
                                    <th className={th}>Introducer</th>
                                    <th className={`${th} text-right`}>Issued ₹</th>
                                    <th className={`${th} text-right`}>Issued pcs</th>
                                    <th className={`${th} text-right`}>Received ₹</th>
                                    <th className={`${th} text-right`}>Received pcs</th>
                                    <th className={`${th} text-right`}>Pending ₹</th>
                                    <th className={`${th} pr-5 text-right`}>Pending pcs</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {tags.map((t, i) => (
                                    <tr key={t.tagno} className="hover:bg-muted/50">
                                        <td className="px-3 py-2.5 pl-5 text-muted-foreground">{i + 1}</td>
                                        <td className="px-3 py-2.5">
                                            <p className="font-semibold tracking-wide">{t.tagno}</p>
                                            <p className="text-xs text-muted-foreground">{formatDateTime(t.createdAt)}</p>
                                        </td>
                                        <td className="px-3 py-2.5">{t.introducerName}</td>
                                        <td className={num}>{formatAmount(t.issuedAmount)}</td>
                                        <td className={num}>{t.issuedPiece}</td>
                                        <td className={num}>{formatAmount(t.receivedAmount)}</td>
                                        <td className={num}>{t.receivedPiece}</td>
                                        <td className={`${num} font-semibold`}>{formatAmount(t.issuedAmount - t.receivedAmount)}</td>
                                        <td className={`${num} pr-5 font-semibold`}>{t.issuedPiece - t.receivedPiece}</td>
                                    </tr>
                                ))}
                            </tbody>
                            {tags.length > 0 && (
                                <tfoot className="sticky bottom-0 bg-accent-soft font-semibold">
                                    <tr>
                                        <td colSpan={3} className="px-3 py-2.5 pl-5 text-right">Total ({tags.length} tags)</td>
                                        <td className={num}>{formatAmount(total("issuedAmount"))}</td>
                                        <td className={num}>{total("issuedPiece")}</td>
                                        <td className={num}>{formatAmount(total("receivedAmount"))}</td>
                                        <td className={num}>{total("receivedPiece")}</td>
                                        <td className={num}>{formatAmount(total("issuedAmount") - total("receivedAmount"))}</td>
                                        <td className={`${num} pr-5`}>{total("issuedPiece") - total("receivedPiece")}</td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    ) : (
                        <table className="w-full min-w-[640px] text-sm">
                            <thead className="sticky top-0 bg-card">
                                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                                    <th className={`${th} pl-5`}>S.No</th>
                                    <th className={th}>Date</th>
                                    <th className={th}>Tag no</th>
                                    <th className={th}>Introducer</th>
                                    <th className={`${th} text-right`}>Amount</th>
                                    <th className={`${th} pr-5 text-right`}>Pcs</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {entries.map((g, i) => (
                                    <tr key={g.id} className="hover:bg-muted/50">
                                        <td className="px-3 py-2.5 pl-5 text-muted-foreground">{i + 1}</td>
                                        <td className="px-3 py-2.5">{formatDateTime(g.createdAt)}</td>
                                        <td className="px-3 py-2.5 font-semibold tracking-wide">{g.tagno}</td>
                                        <td className="px-3 py-2.5">{g.introducerName}</td>
                                        <td className={num}>{formatAmount(g.amount)}</td>
                                        <td className={`${num} pr-5`}>{g.piece}</td>
                                    </tr>
                                ))}
                            </tbody>
                            {entries.length > 0 && (
                                <tfoot className="sticky bottom-0 bg-accent-soft font-semibold">
                                    <tr>
                                        <td colSpan={4} className="px-3 py-2.5 pl-5 text-right">Total ({entries.length} entries)</td>
                                        <td className={num}>{formatAmount(entryTotal("amount"))}</td>
                                        <td className={`${num} pr-5`}>{entryTotal("piece")}</td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    )}
                    {!query.isLoading && (byTag ? tags.length : entries.length) === 0 && (
                        <div className="px-5 py-12 text-center text-sm text-muted-foreground">
                            <Inbox className="mx-auto mb-2 h-6 w-6" />
                            {query.isError ? `Couldn't load the report. ${getApiErrorMessage(query.error)}` : "Nothing matches these filters"}
                        </div>
                    )}
                    {query.isLoading && (
                        <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
