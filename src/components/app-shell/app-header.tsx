"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronDown, ChevronRight, Clock, LogOut, Menu, Moon, PanelLeftClose, PanelLeftOpen, Sun } from "lucide-react";
import { useTheme } from "@/src/theme/theme-context";
import { ThemeStudioDock } from "@/src/theme/theme-studio-dock";
import type { NavItem } from "@/src/config/nav-menu";
import TranDbPicker from "./tran-db-picker";

const focus = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const iconButton = `flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground ${focus}`;

const pad = (n: number) => String(n).padStart(2, "0");
const formatDate = (d: Date) => `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
const timeFormat = new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });

export default function AppHeader({ trail, fallbackTitle, drawerOpen, onOpen, collapsed, onToggle, userName, role, onLogout }: {
    trail: NavItem[];
    fallbackTitle: string;
    collapsed: boolean;
    onToggle: () => void;
    drawerOpen: boolean;
    onOpen: () => void;
    userName: string;
    role: string;
    onLogout: () => void;
}) {
    const { mode, toggleMode } = useTheme();
    const [now, setNow] = useState<Date | null>(null);

    useEffect(() => {
        const updateClock = () => setNow(new Date());
        updateClock();
        const timer = window.setInterval(updateClock, 1000);
        return () => window.clearInterval(timer);
    }, []);

    const title = trail.at(-1)?.label ?? fallbackTitle;
    const crumbs = trail.slice(0, -1);

    return (
        <header className="sticky top-0 z-[1100] flex h-16 shrink-0 items-center gap-2 border-b border-border bg-card/85 px-3 backdrop-blur-xl sm:gap-3 sm:px-5">
            <button type="button" className={`${iconButton} lg:hidden`} onClick={onOpen}
                aria-label="Open navigation" aria-haspopup="dialog" aria-expanded={drawerOpen}>
                <Menu size={20} />
            </button>
            <button type="button" className={`${iconButton} hidden lg:flex`} onClick={onToggle}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                aria-controls="desktop-sidebar" aria-expanded={!collapsed}>
                {collapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}
            </button>
            <span aria-hidden className="hidden h-6 w-px bg-border sm:block" />

            <div className="min-w-0 flex-1">
                {crumbs.length > 0 && (
                    <nav aria-label="Breadcrumb" className="hidden sm:block">
                        <ol className="flex min-w-0 items-center gap-1 text-[11px] font-medium text-muted-foreground">
                            {crumbs.map((item) => (
                                <li key={item.id} className="flex min-w-0 items-center gap-1">
                                    <span className="truncate">{item.label}</span>
                                    <ChevronRight size={12} aria-hidden className="shrink-0" />
                                </li>
                            ))}
                        </ol>
                    </nav>
                )}
                <p className="truncate text-sm font-semibold leading-tight tracking-tight">{title}</p>
            </div>

            <TranDbPicker />
            {now && (
                <div className="hidden shrink-0 items-center gap-3 rounded-lg border border-border bg-background/60 px-3 py-1.5 text-xs tabular-nums md:flex">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                        <CalendarDays size={14} aria-hidden />
                        <time dateTime={now.toISOString().slice(0, 10)}>{formatDate(now)}</time>
                    </span>
                    <span aria-hidden className="h-3.5 w-px bg-border" />
                    <span className="flex items-center gap-1.5 font-medium">
                        <Clock size={14} aria-hidden className="text-muted-foreground" />
                        {timeFormat.format(now)}
                    </span>
                </div>
            )}

            <div className="flex shrink-0 items-center gap-0.5">
                <button type="button" className={iconButton} onClick={toggleMode}
                    aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                    title={mode === "dark" ? "Light mode" : "Dark mode"}>
                    {mode === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <ThemeStudioDock triggerClassName={iconButton} />
            </div>
            <span aria-hidden className="hidden h-6 w-px bg-border sm:block" />
            <UserMenu userName={userName} role={role} onLogout={onLogout} />
        </header>
    );
}

function UserMenu({ userName, role, onLogout }: { userName: string; role: string; onLogout: () => void }) {
    const [open, setOpen] = useState(false);
    const box = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const onPointer = (event: PointerEvent) => {
            if (!box.current?.contains(event.target as Node)) setOpen(false);
        };
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") setOpen(false);
        };
        document.addEventListener("pointerdown", onPointer);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("pointerdown", onPointer);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    const initials = userName.slice(0, 2).toUpperCase();

    return (
        <div ref={box} className="relative shrink-0">
            <button type="button" onClick={() => setOpen((value) => !value)} aria-haspopup="menu" aria-expanded={open}
                aria-label={`Account: ${userName}`}
                className={`flex items-center gap-2 rounded-xl p-1 transition-colors hover:bg-muted md:pe-2 ${focus}`}>
                <span className="grid size-8 place-items-center rounded-lg bg-primary text-xs font-semibold text-primary-foreground">{initials}</span>
                <span className="hidden min-w-0 text-start leading-tight md:block">
                    <span className="block max-w-[9rem] truncate text-sm font-semibold">{userName}</span>
                    <span className="block text-[11px] text-muted-foreground">{role}</span>
                </span>
                <ChevronDown size={14} aria-hidden className={`hidden text-muted-foreground motion-safe:transition-transform md:block ${open ? "rotate-180" : ""}`} />
            </button>
            {open && (
                <div role="menu" className="absolute end-0 top-full mt-2 w-60 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
                    <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent-soft text-xs font-semibold text-primary-text">{initials}</span>
                        <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold">{userName}</span>
                            <span className="block text-xs text-muted-foreground">{role}</span>
                        </span>
                    </div>
                    <div className="p-1.5">
                        <button type="button" role="menuitem" onClick={() => { setOpen(false); onLogout(); }}
                            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-muted dark:text-red-400 ${focus}`}>
                            <LogOut size={16} aria-hidden />
                            Log out
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
