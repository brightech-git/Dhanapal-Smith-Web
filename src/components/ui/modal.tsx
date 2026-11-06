"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

export interface ModalProps {
    open: boolean;
    title: string;
    subtitle?: string;
    icon?: React.ElementType;
    /** Blocks closing (Escape, backdrop, X) while something is saving. */
    busy?: boolean;
    size?: "md" | "lg";
    onClose: () => void;
    children: React.ReactNode;
    footer?: React.ReactNode;
}

/** Themed modal dialog. Enter navigation works inside it (role=dialog). */
export default function Modal({ open, title, subtitle, icon: Icon, busy, size = "lg", onClose, children, footer }: ModalProps) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && onClose();
        window.addEventListener("keydown", onKey);
        const overflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            window.removeEventListener("keydown", onKey);
            document.body.style.overflow = overflow;
        };
    }, [open, busy, onClose]);
    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {open && (
                <motion.div className="fixed inset-0 z-[1300] flex items-end justify-center sm:items-center sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={() => !busy && onClose()} />
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-label={title}
                        className={`relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-border bg-card text-foreground shadow-2xl sm:rounded-2xl ${size === "lg" ? "sm:max-w-2xl" : "sm:max-w-md"}`}
                        initial={{ y: 24, opacity: 0.6 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 24, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    >
                        <header className="flex items-center gap-3 border-b border-border px-5 py-4">
                            {Icon && (
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-primary-text">
                                    <Icon className="h-[18px] w-[18px]" />
                                </span>
                            )}
                            <div className="min-w-0 flex-1">
                                <h2 className="font-semibold">{title}</h2>
                                {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
                            </div>
                            <button
                                type="button"
                                aria-label="Close"
                                disabled={busy}
                                onClick={onClose}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-40"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </header>
                        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
                        {footer && <footer className="flex flex-wrap justify-end gap-2 border-t border-border px-5 py-3">{footer}</footer>}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}
