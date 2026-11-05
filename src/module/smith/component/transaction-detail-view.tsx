"use client";

import React, { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
    ArrowDownLeft,
    ArrowUpRight,
    Camera,
    ChevronLeft,
    ChevronRight,
    Download,
    ExternalLink,
    FileText,
    ImageIcon,
    Paperclip,
    Scale,
    Wallet,
    X,
} from "lucide-react";
import type { FlowKind, RecentTransaction } from "../type/smith-dashboard.types";
import { attachmentCount } from "../api/smith-attachments.api";

interface TransactionDetailViewProps {
    open: boolean;
    kind: FlowKind;
    rows: RecentTransaction[];
    index: number;
    format: (v: number) => string;
    onIndexChange: (index: number) => void;
    onClose: () => void;
    /** Opens the attachment dialog for this row. Hidden when the row has no id. */
    onAttach?: (row: RecentTransaction) => void;
}

const displayDate = (d?: string) => (d ? d.split("-").reverse().join("-") : "");

/**
 * Single view of one recent transaction: amounts, remark and its media
 * (image, camera photo, PDF). A side sheet on wide screens and a bottom
 * sheet on phones. Arrow keys step through the list, Esc closes.
 */
export default function TransactionDetailView({
    open,
    kind,
    rows,
    index,
    format,
    onIndexChange,
    onClose,
    onAttach,
}: TransactionDetailViewProps) {
    const [mounted, setMounted] = useState(false);
    const [lightbox, setLightbox] = useState<{ src: string; label: string } | null>(null);
    const row = rows[index];
    const hasPrev = index > 0;
    const hasNext = index < rows.length - 1;

    useEffect(() => setMounted(true), []);
    useEffect(() => setLightbox(null), [index, open]);

    const step = useCallback(
        (delta: number) => {
            const next = index + delta;
            if (next >= 0 && next < rows.length) onIndexChange(next);
        },
        [index, rows.length, onIndexChange]
    );

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            // Leave keys alone while another dialog (attachments) is on top.
            if (document.querySelector("[data-flow-attachments-dialog]")) return;
            if (e.key === "Escape") {
                if (lightbox) setLightbox(null);
                else onClose();
            } else if (!lightbox && e.key === "ArrowLeft") step(-1);
            else if (!lightbox && e.key === "ArrowRight") step(1);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, lightbox, onClose, step]);

    if (!mounted) return null;

    const images = row
        ? ([
              row.imageFile && { src: row.imageFile, label: "Image", icon: ImageIcon },
              row.cameraImage && { src: row.cameraImage, label: "Camera photo", icon: Camera },
          ].filter(Boolean) as { src: string; label: string; icon: React.ElementType }[])
        : [];
    const count = attachmentCount(row);
    const KindIcon = kind === "cash" ? Wallet : Scale;

    return createPortal(
        <AnimatePresence>
            {open && row && (
                <motion.div
                    key="txn-detail"
                    className="fixed inset-0 z-[1300] flex items-end justify-end sm:items-stretch"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose} />

                    <motion.aside
                        role="dialog"
                        aria-modal="true"
                        aria-label={`${kind === "cash" ? "Cash" : "Weight"} transaction ${row.sno}`}
                        className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-border bg-card text-foreground shadow-2xl sm:max-h-none sm:w-[460px] sm:rounded-none sm:rounded-l-3xl lg:w-[520px]"
                        initial={{ x: 0, y: 40, opacity: 0 }}
                        animate={{ x: 0, y: 0, opacity: 1 }}
                        exit={{ y: 40, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    >
                        {/* Header */}
                        <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
                            <div className="flex min-w-0 items-center gap-3">
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-500 text-primary-foreground shadow-sm">
                                    <KindIcon className="h-5 w-5" />
                                </span>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary-text">
                                            {kind === "cash" ? "Cash" : "Weight"} · #{row.sno}
                                        </span>
                                        {row.id !== undefined && <span className="text-[11px] text-muted-foreground">ID {row.id}</span>}
                                    </div>
                                    <h2 className="mt-1 truncate text-lg font-semibold">{row.smithName || "Transaction"}</h2>
                                    {row.date && <p className="text-xs text-muted-foreground">{displayDate(row.date)}</p>}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                aria-label="Close"
                                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </header>

                        <AnimatePresence mode="wait" initial={false}>
                            <motion.div
                                key={`${row.id ?? row.sno}-${index}`}
                                className="flex-1 space-y-5 overflow-y-auto px-5 py-5"
                                initial={{ opacity: 0, x: 12 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -12 }}
                                transition={{ duration: 0.2 }}
                            >
                                {/* Amounts */}
                                <div className="grid grid-cols-3 gap-2.5">
                                    <Stat label="Receipt" value={row.receipt ? format(row.receipt) : "—"} tone="in" />
                                    <Stat label="Issue" value={row.issue ? format(row.issue) : "—"} tone="out" />
                                    <Stat label="Balance" value={format(row.balance)} tone="balance" />
                                </div>

                                {/* Remark */}
                                <div className="rounded-xl border border-border bg-muted/50 px-4 py-3">
                                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Remark</p>
                                    <p className="mt-1 text-sm">{row.remark || <span className="text-muted-foreground">No remark</span>}</p>
                                </div>

                                {/* Media */}
                                <div>
                                    <div className="mb-2.5 flex items-center justify-between">
                                        <p className="flex items-center gap-1.5 text-sm font-semibold">
                                            <Paperclip className="h-4 w-4 text-primary-text" />
                                            Attachments
                                            <span className="rounded-full bg-muted px-1.5 text-xs font-medium text-muted-foreground">{count}</span>
                                        </p>
                                        {onAttach && row.id !== undefined && (
                                            <button
                                                type="button"
                                                onClick={() => onAttach(row)}
                                                className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-primary-text transition-colors hover:bg-accent-soft"
                                            >
                                                {count ? "Add / replace" : "Add files"}
                                            </button>
                                        )}
                                    </div>

                                    {count === 0 && (
                                        <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                                            <Paperclip className="mx-auto mb-2 h-6 w-6" />
                                            No attachments on this transaction
                                        </div>
                                    )}

                                    {images.length > 0 && (
                                        <div className={`grid gap-2.5 ${images.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                                            {images.map((img) => (
                                                <button
                                                    key={img.label}
                                                    type="button"
                                                    onClick={() => setLightbox({ src: img.src, label: img.label })}
                                                    className="group relative overflow-hidden rounded-xl border border-border bg-muted text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                    aria-label={`View ${img.label}`}
                                                >
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={img.src}
                                                        alt={img.label}
                                                        className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                    />
                                                    <span className="absolute inset-x-0 bottom-0 flex items-center gap-1.5 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-6 text-xs font-medium text-white">
                                                        <img.icon className="h-3.5 w-3.5" />
                                                        {img.label}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {row.pdfFile && (
                                        <div className="mt-2.5 overflow-hidden rounded-xl border border-border">
                                            <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/50 px-3 py-2">
                                                <span className="flex items-center gap-1.5 text-xs font-medium">
                                                    <FileText className="h-4 w-4 text-red-500" />
                                                    PDF document
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    <a
                                                        href={row.pdfFile}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary-text hover:bg-accent-soft"
                                                    >
                                                        <ExternalLink className="h-3.5 w-3.5" /> Open
                                                    </a>
                                                    <a
                                                        href={row.pdfFile}
                                                        download={`${kind}-${row.id ?? row.sno}.pdf`}
                                                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary-text hover:bg-accent-soft"
                                                    >
                                                        <Download className="h-3.5 w-3.5" /> Download
                                                    </a>
                                                </div>
                                            </div>
                                            <iframe src={row.pdfFile} title="PDF preview" className="h-72 w-full bg-white" />
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        {/* Footer: step through the list */}
                        <footer className="flex items-center justify-between gap-3 border-t border-border px-5 py-3">
                            <button
                                type="button"
                                onClick={() => step(-1)}
                                disabled={!hasPrev}
                                className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
                            >
                                <ChevronLeft className="h-4 w-4" /> Previous
                            </button>
                            <span className="text-xs text-muted-foreground">
                                {index + 1} of {rows.length}
                            </span>
                            <button
                                type="button"
                                onClick={() => step(1)}
                                disabled={!hasNext}
                                className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
                            >
                                Next <ChevronRight className="h-4 w-4" />
                            </button>
                        </footer>
                    </motion.aside>

                    {/* Full-size image */}
                    <AnimatePresence>
                        {lightbox && (
                            <motion.div
                                key="lightbox"
                                className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/85 p-4"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setLightbox(null)}
                            >
                                <div className="absolute right-4 top-4 flex items-center gap-2">
                                    <a
                                        href={lightbox.src}
                                        target="_blank"
                                        rel="noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="rounded-lg bg-white/10 p-2 text-white hover:bg-white/20"
                                        aria-label="Open in new tab"
                                    >
                                        <ExternalLink className="h-5 w-5" />
                                    </a>
                                    <button
                                        type="button"
                                        onClick={() => setLightbox(null)}
                                        className="rounded-lg bg-white/10 p-2 text-white hover:bg-white/20"
                                        aria-label="Close image"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                                <motion.img
                                    src={lightbox.src}
                                    alt={lightbox.label}
                                    onClick={(e) => e.stopPropagation()}
                                    className="max-h-[82vh] max-w-full rounded-xl object-contain shadow-2xl"
                                    initial={{ scale: 0.94 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0.94 }}
                                />
                                <p className="mt-3 text-sm text-white/80">{lightbox.label}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: "in" | "out" | "balance" }) {
    const styles = {
        in: "text-emerald-600 dark:text-emerald-400",
        out: "text-red-600 dark:text-red-400",
        balance: "text-foreground",
    }[tone];
    const Icon = tone === "in" ? ArrowDownLeft : tone === "out" ? ArrowUpRight : null;
    return (
        <div className={`rounded-xl border border-border px-3 py-2.5 ${tone === "balance" ? "bg-accent-soft" : "bg-card"}`}>
            <p className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {Icon && <Icon className={`h-3 w-3 ${styles}`} />}
                {label}
            </p>
            <p className={`mt-1 truncate text-sm font-bold ${styles}`} title={value}>
                {value}
            </p>
        </div>
    );
}
