"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock, ClipboardList, Gift, Moon, Sun, Sunrise, Sunset, Wallet, type LucideIcon } from "lucide-react";
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
    { menuId: "transactions", label: "TRANSACTIONS", href: "/smiths/transactions", icon: Wallet },
    { menuId: "orders", label: "ORDERS", href: "/smiths/order", icon: ClipboardList },
    { menuId: "gift-voucher", label: "GIFT VOUCHER", href: "/gift-voucher#issue", icon: Gift },
];

/** Subtle dot texture laid over the banner gradient. */
const DOTS = {
    backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
    backgroundSize: "18px 18px",
    maskImage: "linear-gradient(115deg, transparent 35%, black 75%)",
    WebkitMaskImage: "linear-gradient(115deg, transparent 35%, black 75%)",
} as const;

/** Dashboard welcome banner: time-of-day greeting, today's date and quick links. */
export default function DashboardGreeting({ showSummary = true }: { showSummary?: boolean }) {
    const { allDetails } = useAuth();
    // Time is read after mount, so the static export and the browser agree.
    const [now, setNow] = useState<Date | null>(null);

    useEffect(() => {
        setNow(new Date());
        const timer = window.setInterval(() => setNow(new Date()), 30_000);
        return () => window.clearInterval(timer);
    }, []);

    const rawName = allDetails?.userName || allDetails?.username || allDetails?.USERNAME;
    const name = rawName ? titleCase(String(rawName)) : "";
    const greeting = now ? greetingFor(now.getHours()) : null;
    const Icon = greeting?.icon ?? Sun;
    const shortcuts = SHORTCUTS.filter((s) => canViewMenu(allDetails, s.menuId));

    return (
        <section
            aria-labelledby="dashboard-welcome"
            className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-primary-800 via-primary to-primary-700 p-5 text-primary-foreground shadow-[0_20px_50px_-24px_color-mix(in_srgb,var(--primary)_70%,transparent)] ring-1 ring-black/5 sm:p-7 dark:ring-white/10"
        >
            {/* texture, glows and gold hairline */}
            <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 text-primary-foreground/[0.12]" style={DOTS} />
            <div aria-hidden className="pointer-events-none absolute -end-20 -top-24 -z-10 size-72 rounded-full bg-secondary/25 blur-3xl" />
            <div aria-hidden className="pointer-events-none absolute -bottom-28 start-1/4 -z-10 size-64 rounded-full bg-primary-foreground/10 blur-3xl" />
            <div aria-hidden className="pointer-events-none absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-secondary to-transparent opacity-80" />

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                    <span className="hidden size-14 shrink-0 place-items-center rounded-2xl bg-primary-foreground/10 shadow-inner ring-1 ring-primary-foreground/20 backdrop-blur-sm sm:grid">
                        <Icon size={26} aria-hidden className="text-secondary" />
                    </span>
                    <div className="min-w-0 space-y-2">
                        {now && (
                            <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/10 px-2.5 py-1 ring-1 ring-primary-foreground/15">
                                    <CalendarDays size={13} aria-hidden />
                                    {weekday.format(now)}, {pad(now.getDate())}-{pad(now.getMonth() + 1)}-{now.getFullYear()}
                                </span>
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/10 px-2.5 py-1 tabular-nums ring-1 ring-primary-foreground/15">
                                    <Clock size={13} aria-hidden />
                                    {pad(now.getHours())}:{pad(now.getMinutes())}
                                </span>
                            </div>
                        )}
                        <h1 id="dashboard-welcome" className="break-words text-2xl font-semibold tracking-tight sm:text-[32px] sm:leading-tight">
                            {greeting?.text ?? "Welcome"}
                            {name && (
                                <>
                                    , <span className="font-bold">{name}</span>
                                </>
                            )}
                        </h1>
                        <p className="max-w-xl text-sm leading-relaxed text-primary-foreground/75">
                            {showSummary ? greeting?.note ?? "Here is where things stand." : "Pick a module from the menu or a quick link to get started."}
                        </p>
                    </div>
                </div>

                {shortcuts.length > 0 && (
                    <nav aria-label="Quick links" className="flex flex-wrap gap-2">
                        {shortcuts.map(({ label, href, icon: ShortcutIcon }, index) => (
                            <Link
                                key={href}
                                href={href}
                                className={`group inline-flex min-h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-primary ${
                                    index === 0
                                        ? "bg-primary-foreground text-primary shadow-lg shadow-black/10 hover:-translate-y-0.5 hover:shadow-xl"
                                        : "bg-primary-foreground/10 text-primary-foreground ring-1 ring-primary-foreground/20 backdrop-blur-sm hover:bg-primary-foreground/20"
                                }`}
                            >
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
