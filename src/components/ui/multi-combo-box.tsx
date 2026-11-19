"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { moveToNextField } from "@/src/hooks/use-enter-navigation";
import type { ComboBoxOption } from "./combo-box";

type MultiComboBoxProps = {
    id: string;
    labelId: string;
    /** Selected option values. Empty means "all" / nothing picked. */
    value: string[];
    options: ComboBoxOption[];
    /** Shown when nothing is picked, e.g. "All smiths". */
    placeholder: string;
    disabled?: boolean;
    onChange: (value: string[]) => void;
    className?: string;
};

const SELECT_ALL = -1;

/**
 * Searchable multi-select: type to filter, Up/Down to move, Enter or Space to
 * tick / untick, Esc to close. With the list closed, Enter goes to the next
 * field. The list floats above the page, like ComboBox.
 */
export default function MultiComboBox({
    id, labelId, value, options, placeholder, disabled, onChange, className = "",
}: MultiComboBoxProps) {
    const listId = useId();
    const input = useRef<HTMLInputElement>(null);
    const list = useRef<HTMLUListElement>(null);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [highlight, setHighlight] = useState(0);
    const [rect, setRect] = useState<{ top: number; left: number; width: number; above: boolean } | null>(null);

    const selected = useMemo(() => new Set(value), [value]);
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return q ? options.filter((o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q)) : options;
    }, [options, query]);
    const allShownPicked = filtered.length > 0 && filtered.every((o) => selected.has(o.value));

    const summary = value.length === 0
        ? ""
        : value.length <= 2
            ? value.map((v) => options.find((o) => o.value === v)?.label ?? v).join(", ")
            : `${value.length} selected`;

    // Keep the list next to the input while it is open.
    useEffect(() => {
        if (!open) return;
        const place = () => {
            const box = input.current?.getBoundingClientRect();
            if (!box) return;
            const above = box.bottom + 300 > window.innerHeight && box.top > 300;
            setRect({ top: above ? box.top - 4 : box.bottom + 4, left: box.left, width: Math.max(box.width, 220), above });
        };
        place();
        window.addEventListener("resize", place);
        window.addEventListener("scroll", place, true);
        return () => {
            window.removeEventListener("resize", place);
            window.removeEventListener("scroll", place, true);
        };
    }, [open]);

    useEffect(() => {
        list.current?.querySelector<HTMLElement>("[data-active=true]")?.scrollIntoView({ block: "nearest" });
    }, [highlight, open]);

    const openList = () => {
        if (disabled) return;
        setHighlight(0);
        setOpen(true);
    };
    const close = () => {
        setOpen(false);
        setQuery("");
    };

    const toggle = (option: ComboBoxOption) =>
        onChange(selected.has(option.value) ? value.filter((v) => v !== option.value) : [...value, option.value]);

    /** Ticks every shown option, or unticks them when all are already ticked. */
    const toggleAllShown = () => {
        const shown = new Set(filtered.map((o) => o.value));
        onChange(allShownPicked
            ? value.filter((v) => !shown.has(v))
            : [...value, ...filtered.map((o) => o.value).filter((v) => !selected.has(v))]);
    };

    const pickHighlighted = () => {
        if (highlight === SELECT_ALL) toggleAllShown();
        else if (filtered[highlight]) toggle(filtered[highlight]);
    };

    const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        switch (event.key) {
            case "ArrowDown":
                event.preventDefault();
                if (!open) openList();
                else setHighlight((h) => (h >= filtered.length - 1 ? SELECT_ALL : h + 1));
                break;
            case "ArrowUp":
                event.preventDefault();
                if (!open) openList();
                else setHighlight((h) => (h <= SELECT_ALL ? filtered.length - 1 : h - 1));
                break;
            case "Enter":
                // Handled here, so the app-wide Enter handler does not move as well.
                event.preventDefault();
                if (!open) moveToNextField(event.currentTarget);
                else pickHighlighted();
                break;
            case " ":
                // Space ticks when the search box is empty; otherwise it is part of the search.
                if (open && !query) {
                    event.preventDefault();
                    pickHighlighted();
                }
                break;
            case "Escape":
                if (open) {
                    event.preventDefault();
                    event.stopPropagation();
                    close();
                }
                break;
            case "Backspace":
                // Backspace in an empty search box removes the last pick.
                if (!query && value.length) onChange(value.slice(0, -1));
                break;
            case "Tab":
                close();
                break;
        }
    };

    const activeId = open
        ? highlight === SELECT_ALL ? `${listId}-all` : highlight < filtered.length ? `${listId}-${highlight}` : undefined
        : undefined;

    return (
        <div className={`relative w-full ${className}`}>
            <Search size={14} aria-hidden className="pointer-events-none absolute start-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
                ref={input}
                id={id}
                type="text"
                role="combobox"
                aria-labelledby={labelId}
                aria-autocomplete="list"
                aria-expanded={open}
                aria-controls={listId}
                aria-activedescendant={activeId}
                autoComplete="off"
                spellCheck={false}
                disabled={disabled}
                placeholder={summary || placeholder}
                value={open ? query : summary}
                onFocus={() => setQuery("")}
                onClick={() => (open ? undefined : openList())}
                onChange={(event) => {
                    setQuery(event.target.value);
                    setHighlight(0);
                    setOpen(true);
                }}
                onKeyDown={onKeyDown}
                onBlur={close}
                className={`w-full rounded-lg border border-border bg-background py-1.5 ps-8 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60 ${value.length ? "pe-12" : "pe-7"}`}
            />
            {value.length > 0 && !disabled && (
                <button type="button" tabIndex={-1} aria-label="Clear selection" title="Clear"
                    onMouseDown={(event) => { event.preventDefault(); onChange([]); }}
                    className="absolute end-7 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded text-muted-foreground hover:text-foreground">
                    <X size={13} />
                </button>
            )}
            <button type="button" tabIndex={-1} aria-hidden disabled={disabled}
                onMouseDown={(event) => {
                    event.preventDefault();
                    if (open) close();
                    else {
                        input.current?.focus();
                        openList();
                    }
                }}
                className="absolute end-1 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded text-muted-foreground">
                <ChevronDown size={15} className={`motion-safe:transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            {open && rect && createPortal(
                <ul ref={list} id={listId} role="listbox" aria-multiselectable aria-labelledby={labelId}
                    style={{ top: rect.top, left: rect.left, width: rect.width, zIndex: 1500, transform: rect.above ? "translateY(-100%)" : undefined }}
                    className="fixed max-h-72 overflow-y-auto rounded-lg border border-border bg-card py-1 text-sm text-foreground shadow-xl">
                    {filtered.length === 0 && (
                        <li className="px-3 py-2 text-muted-foreground">{options.length ? "No matches" : "No options"}</li>
                    )}
                    {filtered.map((option, index) => {
                        const isSelected = selected.has(option.value);
                        const active = index === highlight;
                        return (
                            <li key={option.value} id={`${listId}-${index}`} role="option" aria-selected={isSelected} data-active={active}
                                onMouseDown={(event) => event.preventDefault()}
                                onMouseEnter={() => setHighlight(index)}
                                onClick={() => toggle(option)}
                                className={`flex cursor-pointer items-center gap-2 px-3 py-1.5 ${active ? "bg-accent-soft text-primary-text" : ""}`}>
                                <span aria-hidden className={`grid size-4 shrink-0 place-items-center rounded border ${isSelected ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
                                    {isSelected && <Check size={12} />}
                                </span>
                                <span className="flex-1 truncate">{option.label}</span>
                            </li>
                        );
                    })}
                    {filtered.length > 1 && (
                        <li id={`${listId}-all`} role="option" aria-selected={allShownPicked} data-active={highlight === SELECT_ALL}
                            onMouseDown={(event) => event.preventDefault()}
                            onMouseEnter={() => setHighlight(SELECT_ALL)}
                            onClick={toggleAllShown}
                            className={`sticky bottom-0 mt-1 flex cursor-pointer items-center gap-2 border-t border-border bg-card px-3 py-2 font-semibold text-primary-text ${highlight === SELECT_ALL ? "bg-accent-soft" : ""}`}>
                            {allShownPicked ? "Clear all shown" : "Select all shown"}
                        </li>
                    )}
                </ul>,
                document.body
            )}
        </div>
    );
}
