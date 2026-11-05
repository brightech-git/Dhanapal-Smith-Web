"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, ClipboardList, Gift, LayoutDashboard, LogOut, Menu, Moon, Sun, Users, X } from "lucide-react";
import { useTheme } from "@/src/theme/theme-context";
import { ThemeStudioDock } from "@/src/theme/theme-studio-dock";
import { useNavigation } from "@/src/providers/navigation-provider";
import { useAuth } from "@/src/features/auth/lib/auth-context";

const LOGO_SRC = "/logo/com-logo.jpg";

const SMITH_NAV = [
    { label: "Dashboard", path: "/", icon: LayoutDashboard },
    { label: "Orders", path: "/smiths/order", icon: ClipboardList },
    { label: "Users", path: "/smiths/create", icon: Users },
];
const GV_NAV = [{ label: "Gift Voucher", path: "/gift-voucher", icon: Gift }];

const iconButton =
    "flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const isActivePath = (pathname: string, path: string) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path);

const AppHeader: React.FC = () => {
    const { mode, toggleMode } = useTheme();
    const { navigateWithAnimation } = useNavigation();
    const { allDetails, logout } = useAuth();
    const pathname = usePathname() || "/";
    const router = useRouter();
    const reduceMotion = useReducedMotion();

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    const isGV = allDetails?.projectName === "GV";
    const navItems = isGV ? GV_NAV : SMITH_NAV;
    const moduleName = isGV ? "Gift Voucher" : "Smith Dashboard";
    const userName: string = allDetails?.userName || allDetails?.USERNAME || "Admin";
    const role = allDetails?.admin === false ? "User" : "Administrator";
    const initials = userName.slice(0, 2).toUpperCase();

    // Close the user menu on outside click or Escape.
    useEffect(() => {
        if (!userMenuOpen) return;
        const onClick = (e: MouseEvent) => {
            if (!userMenuRef.current?.contains(e.target as Node)) setUserMenuOpen(false);
        };
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && setUserMenuOpen(false);
        document.addEventListener("mousedown", onClick);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onClick);
            document.removeEventListener("keydown", onKey);
        };
    }, [userMenuOpen]);

    useEffect(() => setDrawerOpen(false), [pathname]);

    const go = (path: string) => {
        setDrawerOpen(false);
        if (!isActivePath(pathname, path)) navigateWithAnimation(path, { direction: "forward" });
    };

    const handleLogout = () => {
        setDrawerOpen(false);
        setUserMenuOpen(false);
        logout();
        router.push("/login");
    };

    return (
        <>
            <motion.header
                initial={reduceMotion ? false : { y: -24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="sticky top-0 z-[1100] border-b border-border bg-card/80 backdrop-blur-xl"
            >
                {/* Thin brand gradient along the top edge */}
                <div className="h-0.5 w-full bg-gradient-to-r from-primary via-secondary to-primary" />

                <div className="flex h-16 w-full items-center gap-3 px-3 sm:px-5">
                    <button
                        type="button"
                        onClick={() => setDrawerOpen(true)}
                        className={`${iconButton} lg:hidden`}
                        aria-label="Open menu"
                    >
                        <Menu className="h-5 w-5" />
                    </button>

                    <button type="button" onClick={() => go(navItems[0].path)} className="flex items-center gap-2.5 text-left">
                        <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-white p-1 shadow-sm ring-1 ring-border">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={LOGO_SRC} alt="Brightech logo" className="h-full w-full object-contain" />
                        </span>
                        <span className="hidden sm:block">
                            <span className="block text-sm font-bold uppercase leading-tight tracking-[0.14em] text-foreground">
                                Brightech
                            </span>
                            <span className="block text-[11px] font-medium leading-tight text-muted-foreground">{moduleName}</span>
                        </span>
                    </button>

                    {/* Desktop navigation */}
                    <nav className="ml-4 hidden items-center gap-1 lg:flex" aria-label="Main">
                        {navItems.map(({ label, path, icon: Icon }) => {
                            const active = isActivePath(pathname, path);
                            return (
                                <button
                                    key={path}
                                    type="button"
                                    onClick={() => go(path)}
                                    aria-current={active ? "page" : undefined}
                                    className={`relative flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors ${
                                        active ? "text-primary-text" : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    {active && (
                                        <motion.span
                                            layoutId="nav-active"
                                            className="absolute inset-0 rounded-xl bg-accent-soft"
                                            transition={{ type: "spring", stiffness: 450, damping: 35 }}
                                        />
                                    )}
                                    <Icon className="relative h-4 w-4" />
                                    <span className="relative">{label}</span>
                                </button>
                            );
                        })}
                    </nav>

                    <div className="ml-auto flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={toggleMode}
                            className={iconButton}
                            aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                            title={mode === "dark" ? "Light mode" : "Dark mode"}
                        >
                            <AnimatePresence mode="wait" initial={false}>
                                <motion.span
                                    key={mode}
                                    initial={reduceMotion ? false : { rotate: -90, opacity: 0, scale: 0.6 }}
                                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                                    exit={reduceMotion ? undefined : { rotate: 90, opacity: 0, scale: 0.6 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {mode === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
                                </motion.span>
                            </AnimatePresence>
                        </button>

                        <ThemeStudioDock triggerClassName={iconButton} />

                        <span className="mx-1.5 hidden h-6 w-px bg-border sm:block" />

                        {/* User menu */}
                        <div className="relative" ref={userMenuRef}>
                            <button
                                type="button"
                                onClick={() => setUserMenuOpen((o) => !o)}
                                aria-haspopup="menu"
                                aria-expanded={userMenuOpen}
                                className="flex items-center gap-2.5 rounded-xl py-1 pl-1 pr-2 transition-colors hover:bg-muted"
                            >
                                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary text-xs font-bold text-white shadow-sm">
                                    {initials}
                                </span>
                                <span className="hidden text-left md:block">
                                    <span className="block max-w-[140px] truncate text-sm font-semibold leading-tight">{userName}</span>
                                    <span className="block text-[11px] leading-tight text-muted-foreground">{role}</span>
                                </span>
                                <ChevronDown
                                    className={`hidden h-4 w-4 text-muted-foreground transition-transform md:block ${userMenuOpen ? "rotate-180" : ""}`}
                                />
                            </button>

                            <AnimatePresence>
                                {userMenuOpen && (
                                    <motion.div
                                        role="menu"
                                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute right-0 mt-2 w-56 origin-top-right overflow-hidden rounded-2xl border border-border bg-card p-1.5 shadow-xl"
                                    >
                                        <div className="px-3 py-2.5">
                                            <p className="truncate text-sm font-semibold">{userName}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {role} · {moduleName}
                                            </p>
                                        </div>
                                        <div className="my-1 h-px bg-border" />
                                        <button
                                            type="button"
                                            role="menuitem"
                                            onClick={handleLogout}
                                            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            Log out
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </motion.header>

            {/* Mobile drawer */}
            <AnimatePresence>
                {drawerOpen && (
                    <>
                        <motion.div
                            className="fixed inset-0 z-[1200] bg-slate-900/40 backdrop-blur-[2px] lg:hidden"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setDrawerOpen(false)}
                        />
                        <motion.aside
                            className="fixed inset-y-0 left-0 z-[1201] flex w-72 flex-col border-r border-border bg-card shadow-2xl lg:hidden"
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", stiffness: 380, damping: 38 }}
                            aria-label="Menu"
                        >
                            <div className="flex items-center justify-between border-b border-border px-4 py-4">
                                <div className="flex items-center gap-2.5">
                                    <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-white p-1 ring-1 ring-border">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={LOGO_SRC} alt="" className="h-full w-full object-contain" />
                                    </span>
                                    <span>
                                        <span className="block text-sm font-bold uppercase tracking-[0.14em]">Brightech</span>
                                        <span className="block text-[11px] text-muted-foreground">{moduleName}</span>
                                    </span>
                                </div>
                                <button type="button" onClick={() => setDrawerOpen(false)} className={iconButton} aria-label="Close menu">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <nav className="flex-1 space-y-1 p-3" aria-label="Main">
                                {navItems.map(({ label, path, icon: Icon }, i) => {
                                    const active = isActivePath(pathname, path);
                                    return (
                                        <motion.button
                                            key={path}
                                            type="button"
                                            onClick={() => go(path)}
                                            initial={{ opacity: 0, x: -12 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.05 + i * 0.04 }}
                                            className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                                                active ? "bg-accent-soft text-primary-text" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                            }`}
                                        >
                                            <Icon className="h-[18px] w-[18px]" />
                                            {label}
                                        </motion.button>
                                    );
                                })}
                            </nav>

                            <div className="border-t border-border p-3">
                                <div className="mb-2 flex items-center gap-3 px-2 py-1.5">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary text-xs font-bold text-white">
                                        {initials}
                                    </span>
                                    <span>
                                        <span className="block text-sm font-semibold">{userName}</span>
                                        <span className="block text-xs text-muted-foreground">{role}</span>
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                                >
                                    <LogOut className="h-[18px] w-[18px]" />
                                    Log out
                                </button>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default AppHeader;
