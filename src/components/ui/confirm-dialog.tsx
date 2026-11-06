"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Loader2 } from "lucide-react";

export interface ConfirmDialogProps {
    open: boolean;
    title: string;
    message?: React.ReactNode;
    confirmLabel?: string;
    tone?: "danger" | "primary";
    busy?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

/** Small themed confirm dialog (replaces window.confirm). */
export default function ConfirmDialog({
    open,
    title,
    message,
    confirmLabel = "Confirm",
    tone = "danger",
    busy,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    const [mounted, setMounted] = useState(false);
    // Callers often clear the item as they close, so keep the last open text for the fade-out.
    const last = useRef({ title, message, confirmLabel });
    if (open) last.current = { title, message, confirmLabel };
    ({ title, message, confirmLabel } = last.current);
    useEffect(() => setMounted(true), []);
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && onCancel();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, busy, onCancel]);
    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-[1380] flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    data-enter-nav="off"
                >
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={() => !busy && onCancel()} />
                    <motion.div
                        role="alertdialog"
                        aria-modal="true"
                        aria-label={title}
                        className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-5 text-foreground shadow-2xl"
                        initial={{ scale: 0.95, y: 8 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: 8 }}
                    >
                        <div className="flex gap-3">
                            <span
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                    tone === "danger" ? "bg-red-500/10 text-red-600 dark:text-red-400" : "bg-accent-soft text-primary-text"
                                }`}
                            >
                                <AlertTriangle className="h-5 w-5" />
                            </span>
                            <div className="min-w-0">
                                <h2 className="font-semibold">{title}</h2>
                                {message && <div className="mt-1 text-sm text-muted-foreground">{message}</div>}
                            </div>
                        </div>
                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={onCancel}
                                disabled={busy}
                                className="rounded-xl px-4 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                autoFocus
                                onClick={onConfirm}
                                disabled={busy}
                                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60 ${
                                    tone === "danger" ? "bg-red-600" : "bg-primary"
                                }`}
                            >
                                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                                {confirmLabel}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}
