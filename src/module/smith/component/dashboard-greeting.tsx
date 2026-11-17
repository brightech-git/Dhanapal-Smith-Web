"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, ClipboardList, Gift, Moon, Sun, Sunrise, Sunset, Wallet, type LucideIcon } from "lucide-react";
import { useAuth } from "@/src/features/auth/lib/auth-context";
import { canViewMenu } from "@/src/features/auth/lib/access";

const pad = (n: number) => String(n).padStart(2, "0");
const weekday = new Intl.DateTimeFormat("en-IN", { weekday: "long" });

const greetingFor = (hour: number): { text: string; icon: LucideIcon; note: string } => {
    if (hour < 5) return { text: "Good evening", icon: Moon, note: "Working late. Here is where things stand." };
    if (hour < 12) return { text: "Good morning", icon: Sunrise, note: "Here is where things stand to start the day." };
    if (hour < 17) return { text: "Good afternoon", icon: Sun, note: "Here is how the day is going so far." };
    if (hour < 21) return { text: "Good evening", icon: Sunset, note: "Here is a summary of today's work." };
    return { text: "Good evening", icon: Moon, note: "Working late. Here is where things stand." };
};

const titleCase = (name: string) => name.trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

const SHORTCUTS = [
    { menuId: "transactions", label: "Transactions", href: "/smiths/transactions", icon: Wallet },
    { menuId: "orders", label: "Orders", href: "/smiths/order", icon: ClipboardList },
    { menuId: "gift-voucher", label: "Gift voucher", href: "/gift-voucher#issue", icon: Gift },
];

/** Dashboard welcome banner: time-of-day greeting, today's date and quick links. */
export default function DashboardGreeting({ showSummary = true }: { showSummary?: boolean }) {
    const { allDetails } = useAuth();
    // Time is read after mount, so the static export and the browser agree.
    const [now, setNow] = useState<Date | null>(null);

    useEffect(() => {
        setNow(new Date());
        const timer = window.setInterval(() => setNow(new Date()), 60_000);
        return () => window.clearInterval(timer);
    }, []);

    const rawName = allDetails?.userName || allDetails?.username || allDetails?.USERNAME;
    const name = rawName ? titleCase(String(rawName)) : "";
    const greeting = now ? greetingFor(now.getHours()) : null;
    const Icon = greeting?.icon ?? Sun;
    const shortcuts = SHORTCUTS.filter((s) => canViewMenu(allDetails, s.menuId));

    return (
        <section aria-labelledby="dashboard-welcome"
            className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-accent-soft via-card to-card p-4 shadow-sm sm:p-6">
            <div aria-hidden className="pointer-events-none absolute -end-16 -top-20 size-64 rounded-full bg-primary/10 blur-3xl" />
            <div aria-hidden className="pointer-events-none absolute -bottom-24 end-40 size-48 rounded-full bg-secondary/10 blur-3xl" />

            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                    <span className="hidden size-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-md sm:grid">
                        <Icon size={24} aria-hidden />
                    </span>
                    <div className="min-w-0 space-y-1.5">
                        {now && (
                            <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                <CalendarDays size={14} aria-hidden />
                                {weekday.format(now)}, {pad(now.getDate())}-{pad(now.getMonth() + 1)}-{now.getFullYear()}
                            </p>
                        )}
                        <h1 id="dashboard-welcome" className="break-words text-2xl font-semibold tracking-tight sm:text-3xl">
                            {greeting?.text ?? "Welcome"}{name && <>, <span className="text-primary-text">{name}</span></>}
                        </h1>
                        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                            {showSummary ? greeting?.note ?? "Here is where things stand." : "Pick a module from the menu or a quick link to get started."}
                        </p>
                    </div>
                </div>

                {shortcuts.length > 0 && (
                    <nav aria-label="Quick links" className="flex flex-wrap gap-2">
                        {shortcuts.map(({ label, href, icon: ShortcutIcon }, index) => (
                            <Link key={href} href={href}
                                className={`group inline-flex min-h-10 items-center gap-2 rounded-xl px-4 text-sm font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                                    index === 0
                                        ? "bg-primary text-primary-foreground hover:opacity-90"
                                        : "border border-border bg-card text-foreground hover:bg-muted"
                                }`}>
                                <ShortcutIcon size={16} aria-hidden />
                                {label}
                                {index === 0 && <ArrowRight size={15} aria-hidden className="motion-safe:transition-transform group-hover:translate-x-0.5" />}
                            </Link>
                        ))}
                    </nav>
                )}
            </div>
        </section>
    );
}
