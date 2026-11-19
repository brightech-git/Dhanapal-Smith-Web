"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { ChevronRight, Gem, X } from "lucide-react";
import { isCurrentPage, isLeafActive, splitHref, type NavItem, type NavSection } from "@/src/config/nav-menu";

export { isCurrentPage };

const focus = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

interface NodeContext {
    pathname: string;
    hash: string;
    trailIds: string[];
    open: Record<string, boolean>;
    toggle: (id: string) => void;
    onLeaf: (event: MouseEvent<HTMLAnchorElement>, item: NavItem) => void;
}

// Row styles per level: parent, child, grandchild.
const rowSize = ["min-h-10 gap-3 px-3 text-xs font-medium", "min-h-9 gap-2.5 px-2.5 text-xs", "min-h-8 gap-2 px-2.5 text-xs"];
const iconSize = [18, 16, 14];

function NavNode({ item, depth, ctx }: { item: NavItem; depth: number; ctx: NodeContext }) {
    const level = Math.min(depth, 2);
    const Icon = item.icon;
    const inTrail = ctx.trailIds.includes(item.id);
    const marker = level === 2 && (
        <span aria-hidden className={`size-1.5 shrink-0 rounded-full ${inTrail ? "bg-primary" : "bg-muted-foreground/40"}`} />
    );
    const icon = Icon && level < 2 && (
        <Icon size={iconSize[level]} aria-hidden className={`shrink-0 ${inTrail ? "text-primary-text" : ""}`} />
    );

    if (!item.children) {
        const active = isLeafActive(item, ctx.pathname, ctx.hash);
        return (
            <li className="relative">
                {active && depth > 0 && <span aria-hidden className="absolute -start-[9px] inset-y-1.5 w-0.5 rounded-full bg-primary" />}
                <Link href={item.href ?? "/"} onClick={(event) => ctx.onLeaf(event, item)} aria-current={active ? "page" : undefined}
                    className={`flex w-full items-center rounded-lg transition-colors ${rowSize[level]} ${focus} ${
                        active ? "bg-accent-soft font-semibold text-primary-text"
                            : "font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}>
                    {icon}{marker}
                    <span className="truncate">{item.label}</span>
                </Link>
            </li>
        );
    }

    const open = !!ctx.open[item.id];
    const panelId = `nav-${item.id}`;
    return (
        <li>
            <button type="button" onClick={() => ctx.toggle(item.id)} aria-expanded={open} aria-controls={panelId}
                className={`flex w-full items-center rounded-lg text-start transition-colors ${rowSize[level]} ${focus} ${
                    inTrail ? "font-semibold text-foreground" : "font-medium text-muted-foreground"
                } hover:bg-muted hover:text-foreground`}>
                {icon}{marker}
                <span className="flex-1 truncate">{item.label}</span>
                <ChevronRight size={15} aria-hidden className={`shrink-0 text-muted-foreground motion-safe:transition-transform ${open ? "rotate-90" : ""}`} />
            </button>
            <div id={panelId} inert={!open}
                className={`grid motion-safe:transition-[grid-template-rows] motion-safe:duration-200 ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                <ul className={`min-h-0 space-y-0.5 overflow-hidden border-s border-border ps-2 ${level === 0 ? "ms-5" : "ms-4"} ${open ? "mt-0.5" : ""}`}>
                    {item.children.map((child) => <NavNode key={child.id} item={child} depth={depth + 1} ctx={ctx} />)}
                </ul>
            </div>
        </li>
    );
}

export default function AppSidebar({ sections, pathname, hash, trail, onClose, onSelect, collapsed = false }: {
    sections: NavSection[];
    pathname: string;
    hash: string;
    trail: NavItem[];
    collapsed?: boolean;
    onSelect: () => void;
    onClose?: () => void;
}) {
    const trailIds = trail.map((item) => item.id);
    const trailKey = trailIds.join("/");
    const [open, setOpen] = useState<Record<string, boolean>>({});

    // Keep the branch of the current page open.
    useEffect(() => {
        if (!trailKey) return;
        setOpen((prev) => {
            const next = { ...prev };
            trailKey.split("/").forEach((id) => { next[id] = true; });
            return next;
        });
    }, [trailKey]);

    const ctx: NodeContext = {
        pathname,
        hash,
        trailIds,
        open,
        toggle: (id) => setOpen((prev) => ({ ...prev, [id]: !prev[id] })),
        onLeaf: (event, item) => {
            // Same page, other tab: switch the hash so the page shows that tab.
            const target = splitHref(item.href ?? "/");
            if (target.hash && isCurrentPage(pathname, target.path)) {
                event.preventDefault();
                if (window.location.hash !== `#${target.hash}`) window.location.hash = target.hash;
            }
            onSelect();
        },
    };

    return (
        <div className="flex h-full min-h-0 flex-col bg-card text-foreground">
            <div className={`flex h-16 shrink-0 items-center gap-3 border-b border-border ${collapsed ? "justify-center" : "px-4"}`}>
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                    <Gem size={18} aria-hidden />
                </span>
                {!collapsed && (
                    <span className="min-w-0 flex-1 leading-tight">
                        <span className="block truncate text-sm font-semibold">Smith Management</span>
                        <span className="block text-[11px] text-muted-foreground">Back office</span>
                    </span>
                )}
                {onClose && (
                    <button type="button" onClick={onClose} aria-label="Close navigation"
                        className={`grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted ${focus}`}>
                        <X size={19} />
                    </button>
                )}
            </div>

            <nav aria-label="Main navigation" className="flex-1 overflow-y-auto overscroll-contain px-3 py-4">
                {sections.map((section, index) => (
                    <div key={section.id} className={index ? "mt-4" : ""}>
                        {collapsed
                            ? index > 0 && <div aria-hidden className="mx-2 mb-4 border-t border-border" />
                            : <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">{section.label}</p>}
                        <ul className="space-y-0.5">
                            {collapsed
                                ? section.items.map((item) => <CollapsedItem key={item.id} item={item} ctx={ctx} />)
                                : section.items.map((item) => <NavNode key={item.id} item={item} depth={0} ctx={ctx} />)}
                        </ul>
                    </div>
                ))}
            </nav>
        </div>
    );
}

/**
 * Icon-only top-level row for the narrow desktop sidebar. A parent icon opens
 * a pop-up menu with its children beside the sidebar; the sidebar stays narrow.
 */
function CollapsedItem({ item, ctx }: { item: NavItem; ctx: NodeContext }) {
    const Icon = item.icon;
    const active = ctx.trailIds.includes(item.id);
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const button = useRef<HTMLButtonElement>(null);
    const panel = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const onPointer = (event: PointerEvent) => {
            const target = event.target as Node;
            if (!panel.current?.contains(target) && !button.current?.contains(target)) setOpen(false);
        };
        const onKey = (event: KeyboardEvent) => {
            if (event.key !== "Escape") return;
            setOpen(false);
            button.current?.focus();
        };
        const close = () => setOpen(false);
        document.addEventListener("pointerdown", onPointer);
        document.addEventListener("keydown", onKey);
        window.addEventListener("resize", close);
        return () => {
            document.removeEventListener("pointerdown", onPointer);
            document.removeEventListener("keydown", onKey);
            window.removeEventListener("resize", close);
        };
    }, [open]);

    const toggle = () => {
        const rect = button.current?.getBoundingClientRect();
        if (rect) setPosition({ top: Math.max(8, Math.min(rect.top - 8, window.innerHeight - 360)), left: rect.right + 10 });
        setOpen((value) => !value);
    };

    const className = `flex size-10 mx-auto items-center justify-center rounded-lg transition-colors ${focus} ${
        active || open ? "bg-accent-soft text-primary-text" : "text-muted-foreground hover:bg-muted hover:text-foreground"
    }`;
    const content = Icon ? <Icon size={18} aria-hidden /> : <span className="text-xs font-semibold">{item.label.slice(0, 2)}</span>;

    if (!item.children) {
        return (
            <li>
                <Link href={item.href ?? "/"} onClick={(event) => ctx.onLeaf(event, item)} title={item.label} aria-label={item.label}
                    aria-current={active ? "page" : undefined} className={className}>{content}</Link>
            </li>
        );
    }

    const panelId = `nav-popup-${item.id}`;
    return (
        <li>
            <button ref={button} type="button" onClick={toggle} title={item.label} aria-label={item.label}
                aria-haspopup="true" aria-expanded={open} aria-controls={open ? panelId : undefined} className={className}>
                {content}
            </button>
            {/* Rendered on <body> so sticky table headers and totals can't cover it. */}
            {open && createPortal(
                <div ref={panel} id={panelId} style={{ top: position.top, left: position.left }}
                    className="fixed z-[1400] max-h-[min(70vh,340px)] w-64 overflow-y-auto rounded-xl border border-border bg-card p-2 text-foreground shadow-2xl">
                    <p className="flex items-center gap-2 px-3 pb-2 pt-1 text-sm font-semibold">
                        {Icon && <Icon size={16} aria-hidden className="text-primary-text" />}
                        {item.label}
                    </p>
                    <ul className="space-y-0.5 border-t border-border pt-2">
                        {item.children.map((child) => (
                            <NavNode key={child.id} item={child} depth={1} ctx={{
                                ...ctx,
                                onLeaf: (event, leaf) => {
                                    setOpen(false);
                                    ctx.onLeaf(event, leaf);
                                },
                            }} />
                        ))}
                    </ul>
                </div>,
                document.body
            )}
        </li>
    );
}
