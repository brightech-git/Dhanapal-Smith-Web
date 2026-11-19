"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import AppHeader from "./app-header";
import AppSidebar from "./app-sidebar";
import { useAuth } from "@/src/features/auth/lib/auth-context";
import { canViewMenu } from "@/src/features/auth/lib/access";
import { NAV_MENU, filterNav, findTrail, isCurrentPage } from "@/src/config/nav-menu";
import { useEnterNavigation } from "@/src/hooks/use-enter-navigation";
import { useLocationHash } from "@/src/hooks/use-location-hash";
import { ShortcutProvider } from "@/src/providers/shortcut-provider";

export default function AppShell({ children }: { children: ReactNode }) {
    useEnterNavigation();
    const pathname = usePathname() || "/";
    const hash = useLocationHash(pathname);
    const router = useRouter();
    const { isAuthenticated, allDetails, logout } = useAuth();
    const drawer = useRef<HTMLDialogElement>(null);
    const [collapsed, setCollapsed] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);

    useEffect(() => {
        const dialog = drawer.current;
        dialog?.close();
        const desktop = window.matchMedia("(min-width: 1024px)");
        const closeOnDesktop = () => {
            if (desktop.matches) dialog?.close();
        };
        desktop.addEventListener("change", closeOnDesktop);
        return () => desktop.removeEventListener("change", closeOnDesktop);
    }, [pathname, isAuthenticated]);

    const showNavigation = isAuthenticated && !isCurrentPage(pathname, "/login");
    const sections = useMemo(() => filterNav(NAV_MENU, (menuId) => canViewMenu(allDetails, menuId)), [allDetails]);
    const trail = findTrail(sections, pathname, hash);
    const closeDrawer = () => drawer.current?.close();
    const sidebarProps = { sections, pathname, hash, trail };

    return (
        <ShortcutProvider>
        <div className="flex min-h-screen bg-background text-foreground">
            {showNavigation && (
                <aside id="desktop-sidebar" className={`sticky top-0 hidden h-dvh shrink-0 border-r border-border motion-safe:transition-[width] lg:block ${collapsed ? "w-16" : "w-64"}`}>
                    <AppSidebar {...sidebarProps} collapsed={collapsed} onSelect={() => setCollapsed(true)} />
                </aside>
            )}
            <div className="flex min-w-0 flex-1 flex-col">
                {showNavigation && (
                    <AppHeader trail={trail} fallbackTitle="Smith Management System" collapsed={collapsed}
                        onToggle={() => setCollapsed((value) => !value)} drawerOpen={drawerOpen}
                        onOpen={() => {
                            drawer.current?.showModal();
                            setDrawerOpen(true);
                        }}
                        userName={allDetails?.userName || allDetails?.USERNAME || "User"}
                        role={allDetails?.admin ? "Administrator" : "User"}
                        onLogout={() => {
                            closeDrawer();
                            logout();
                            router.replace("/login");
                        }} />
                )}
                <main className="flex-1">{children}</main>
            </div>
            {showNavigation && (
                <dialog ref={drawer} aria-label="Navigation" onClose={() => setDrawerOpen(false)}
                    onClick={(event) => { if (event.target === event.currentTarget) closeDrawer(); }}
                    className="fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-72 max-w-[85vw] bg-transparent p-0 shadow-2xl backdrop:bg-black/50">
                    <AppSidebar {...sidebarProps} onClose={closeDrawer} onSelect={closeDrawer} />
                </dialog>
            )}
        </div>
        </ShortcutProvider>
    );
}
