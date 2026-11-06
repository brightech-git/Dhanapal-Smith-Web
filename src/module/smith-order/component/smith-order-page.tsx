"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, CalendarRange, ClipboardList, Inbox, Loader2, Pencil, Plus, Printer, RotateCcw, Save, Search, Sun, Trash2 } from "lucide-react";
import { useToast } from "@/src/providers/toast-provider";
import ConfirmDialog from "@/src/components/ui/confirm-dialog";
import DateInput from "@/src/components/ui/date-input";
import { getApiErrorMessage, toApiDate } from "@/lib/api/envelope";
import { CardHeader, Field, card, ghostButton, iconButton, inputClass, primaryButton } from "@/src/module/role/component/ui";
import { useDeleteOrder, useOrders, useSaveOrder } from "../hook/use-orders";
import type { Order } from "../api/order.api";
import { formatDateForShow } from "@/src/utils/format/formatDateForAPI";

const today = () => toApiDate(new Date());
const parse = (d: string) => new Date(`${d}T00:00:00`);
const longDate = (d: string) => parse(d).toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
const dayLabel = (d: string) => {
    const diff = Math.round((parse(today()).getTime() - parse(d).getTime()) / 86400000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff === -1) return "Tomorrow";
    return longDate(d);
};

type Range = "all" | "today" | "week" | "month";

/** Smith orders: quick entry form beside a searchable list grouped by date. */
export default function SmithOrderPage() {
    const { addToast } = useToast();
    const orders = useOrders();
    const save = useSaveOrder();
    const remove = useDeleteOrder();

    const [editing, setEditing] = useState<Order | null>(null);
    const [date, setDate] = useState(today());
    const [items, setItems] = useState("");
    const [errors, setErrors] = useState<{ date?: string; items?: string }>({});
    const [search, setSearch] = useState("");
    const [range, setRange] = useState<Range>("all");
    const [toDelete, setToDelete] = useState<Order | null>(null);
    // Keeps the dialog's text while it fades out after toDelete is cleared.
    const lastDelete = useRef<Order | null>(null);
    if (toDelete) lastDelete.current = toDelete;
    const shownDelete = toDelete ?? lastDelete.current;
    const itemsRef = useRef<HTMLTextAreaElement>(null);
    const dateRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setDate(editing?.orderDate || today());
        setItems(editing?.orderItems ?? "");
        setErrors({});
        (editing ? itemsRef : dateRef).current?.focus();
    }, [editing]);

    const all = orders.data ?? [];
    const counts = useMemo(() => {
        const t = today();
        const month = t.slice(0, 7);
        return { total: all.length, today: all.filter((o) => o.orderDate === t).length, month: all.filter((o) => o.orderDate?.startsWith(month)).length };
    }, [all]);

    const groups = useMemo(() => {
        const q = search.trim().toLowerCase();
        const t = parse(today()).getTime();
        const inRange = (d: string) => {
            if (range === "all") return true;
            const diff = (t - parse(d).getTime()) / 86400000;
            if (range === "today") return diff === 0;
            if (range === "week") return diff >= 0 && diff < 7;
            return d.slice(0, 7) === today().slice(0, 7);
        };
        const list = all
            .filter((o) => inRange(o.orderDate) && (!q || o.orderItems.toLowerCase().includes(q) || longDate(o.orderDate).toLowerCase().includes(q)))
            .sort((a, b) => b.orderDate.localeCompare(a.orderDate) || (b.id ?? 0) - (a.id ?? 0));
        const map = new Map<string, Order[]>();
        list.forEach((o) => map.set(o.orderDate, [...(map.get(o.orderDate) ?? []), o]));
        return Array.from(map.entries());
    }, [all, search, range]);
    const shown = groups.reduce((n, [, l]) => n + l.length, 0);

    const reset = () => {
        setEditing(null);
        setDate(today());
        setItems("");
        setErrors({});
        dateRef.current?.focus();
    };

    const submit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const found: typeof errors = {};
        if (!date) found.date = "Choose a date";
        if (!items.trim()) found.items = "Describe the order";
        setErrors(found);
        if (found.date) return dateRef.current?.focus();
        if (found.items) return itemsRef.current?.focus();
        try {
            await save.mutateAsync({ id: editing?.id, order: { orderDate: date, orderItems: items } });
            addToast({ type: "success", title: editing ? "Order updated" : "Order added", message: `${dayLabel(date)} · ${items.trim().slice(0, 60)}` });
            if (editing) reset();
            else {
                setItems("");
                itemsRef.current?.focus(); // keep the date for the next order of the same day
            }
        } catch (err) {
            addToast({ type: "error", title: "Couldn't save the order", message: getApiErrorMessage(err) });
        }
    };

    const confirmDelete = async () => {
        if (!toDelete?.id) return;
        try {
            await remove.mutateAsync(toDelete.id);
            addToast({ type: "success", title: "Order deleted", message: longDate(toDelete.orderDate) });
            if (editing?.id === toDelete.id) reset();
        } catch (err) {
            addToast({ type: "error", title: "Couldn't delete the order", message: getApiErrorMessage(err) });
        } finally {
            setToDelete(null);
        }
    };

    const stat = (Icon: React.ElementType, label: string, value: number, tone: string) => (
        <div className={`${card} flex items-center gap-3 p-4`}>
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
                <Icon className="h-5 w-5" />
            </span>
            <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-xl font-bold tabular-nums">{orders.isLoading ? "–" : value}</p>
            </div>
        </div>
    );

    return (
        <div className="mx-auto w-full max-w-[1600px] space-y-4 p-3 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
                    <p className="text-sm text-muted-foreground">Note each smith order with its date and details.</p>
                </div>
                <button type="button" className={`${ghostButton} print:hidden`} onClick={() => window.print()} disabled={!shown}>
                    <Printer className="h-4 w-4" /> Print list
                </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 print:hidden">
                {stat(ClipboardList, "All orders", counts.total, "bg-accent-soft text-primary-text")}
                {stat(Sun, "Today", counts.today, "bg-amber-500/10 text-amber-600 dark:text-amber-400")}
                {stat(CalendarRange, "This month", counts.month, "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400")}
            </div>

            <div className="grid min-w-0 grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.8fr)]">
                <section className={`${card} lg:sticky lg:top-20 print:hidden`}>
                    <CardHeader
                        icon={editing ? Pencil : Plus}
                        title={editing ? "Edit order" : "New order"}
                        subtitle={editing ? `Order #${editing.id}` : "Enter moves on; Enter in details saves (Shift+Enter for a new line)"}
                    />
                    <form onSubmit={submit} className="space-y-4 p-5" noValidate>
                        <Field label="Order date" htmlFor="order-date">
                            <div className="flex gap-2">
                                <div className="min-w-0 flex-1">
                                    <DateInput
                                        id="order-date"
                                        inputRef={dateRef}
                                        className={`${inputClass} ${errors.date ? "border-red-500" : ""}`}
                                        value={date}
                                        onChange={(v) => {
                                            setDate(v);
                                            setErrors((p) => ({ ...p, date: undefined }));
                                        }}
                                    />
                                </div>
                                <button type="button" tabIndex={-1} className={`${ghostButton} shrink-0 px-3`} onClick={() => setDate(today())}>
                                    Today
                                </button>
                            </div>
                            {errors.date && <p className="text-xs font-medium text-red-600 dark:text-red-400">{errors.date}</p>}
                        </Field>
                        <Field label="Order details" htmlFor="order-items">
                            <textarea
                                id="order-items"
                                ref={itemsRef}
                                rows={5}
                                placeholder="e.g. 2 bangles 22K, 18 g each — deliver by Friday"
                                className={`${inputClass} h-auto resize-y py-2.5 leading-relaxed ${errors.items ? "border-red-500" : ""}`}
                                value={items}
                                onChange={(e) => {
                                    setItems(e.target.value);
                                    setErrors((p) => ({ ...p, items: undefined }));
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                                        e.preventDefault();
                                        submit();
                                    }
                                }}
                            />
                            <div className="flex justify-between text-xs">
                                <span className="font-medium text-red-600 dark:text-red-400">{errors.items}</span>
                                <span className="text-muted-foreground">{items.trim().length} characters</span>
                            </div>
                        </Field>
                        <div className="flex flex-wrap gap-2">
                            <button type="submit" className={primaryButton} disabled={save.isPending}>
                                {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                {editing ? "Update order" : "Add order"}
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
                        icon={CalendarDays}
                        title="Order book"
                        subtitle={`${shown} of ${all.length} orders`}
                        actions={
                            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto print:hidden" data-enter-nav="off">
                                <div className="flex rounded-xl border border-border p-0.5 text-xs font-medium">
                                    {(["all", "today", "week", "month"] as const).map((r) => (
                                        <button
                                            key={r}
                                            type="button"
                                            onClick={() => setRange(r)}
                                            className={`rounded-lg px-2.5 py-1.5 transition ${
                                                range === r ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                            }`}
                                        >
                                            {{ all: "All", today: "Today", week: "7 days", month: "Month" }[r]}
                                        </button>
                                    ))}
                                </div>
                                <div className="relative min-w-0 flex-1 sm:w-56 sm:flex-none">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        className={`${inputClass} h-9 pl-9`}
                                        placeholder="Search orders..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        aria-label="Search orders"
                                    />
                                </div>
                            </div>
                        }
                    />
                    <div className="max-h-[calc(100vh-320px)] min-h-[240px] overflow-y-auto print:max-h-none">
                        {orders.isLoading && (
                            <div className="space-y-3 p-5">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />
                                ))}
                            </div>
                        )}
                        {orders.isError && (
                            <div className="px-5 py-12 text-center text-sm text-red-600 dark:text-red-400">
                                Couldn&apos;t load orders. {getApiErrorMessage(orders.error)}
                                <button className="ml-2 font-semibold underline" onClick={() => orders.refetch()}>
                                    Retry
                                </button>
                            </div>
                        )}
                        {!orders.isLoading && !orders.isError && shown === 0 && (
                            <div className="px-5 py-14 text-center text-sm text-muted-foreground">
                                <Inbox className="mx-auto mb-2 h-7 w-7" />
                                {search || range !== "all" ? "No orders match" : "No orders yet. Add the first one on the left."}
                            </div>
                        )}
                        {groups.map(([day, list]) => (
                            <div key={day}>
                                <div className="sticky top-0 z-10 flex items-center justify-between border-y border-border bg-muted/70 px-5 py-1.5 text-xs font-semibold backdrop-blur">
                                    <span>{dayLabel(day)}</span>
                                    <span className="font-normal text-muted-foreground">
                                        {dayLabel(day) !== longDate(day) ? `${longDate(day)} · ` : ""}
                                        {list.length} order{list.length > 1 ? "s" : ""}
                                    </span>
                                </div>
                                <ul className="divide-y divide-border">
                                        {list.map((o) => (
                                            <li
                                                key={o.id}
                                                className={`group flex items-start gap-3 px-5 py-3 transition-colors hover:bg-muted/50 ${editing?.id === o.id ? "bg-accent-soft" : ""}`}
                                            >
                                                <span className="mt-0.5 rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground">{o.id}</span>
                                                <span className="mt-0.5 rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground">{formatDateForShow(day)}</span>
                                                <p className="min-w-0 flex-1 whitespace-pre-wrap break-words text-sm">{o.orderItems || "—"}</p>
                                                
                                                <div className="flex shrink-0 gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 print:hidden">
                                                    <button className={iconButton} title="Edit" aria-label={`Edit order ${o.id}`} onClick={() => setEditing(o)}>
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        className={`${iconButton} hover:bg-red-500/10 hover:text-red-600`}
                                                        title="Delete"
                                                        aria-label={`Delete order ${o.id}`}
                                                        onClick={() => setToDelete(o)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            <ConfirmDialog
                open={!!toDelete}
                title={`Delete order #${shownDelete?.id ?? ""}?`}
                message={shownDelete ? `${longDate(shownDelete.orderDate)} · ${shownDelete.orderItems.slice(0, 80)}` : undefined}
                confirmLabel="Delete"
                busy={remove.isPending}
                onConfirm={confirmDelete}
                onCancel={() => setToDelete(null)}
            />
        </div>
    );
}
